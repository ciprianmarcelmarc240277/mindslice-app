"use client";

import { useEffect, useMemo, useState } from "react";
import { CANON_STORAGE_KEY, CANON_UPDATED_EVENT, readCanon } from "@/lib/mindslice/canon-storage";
import {
  ART_CANON_STORAGE_KEY,
  ART_CANON_UPDATED_EVENT,
  readArtCanon,
} from "@/lib/mindslice/art-canon-storage";
import {
  ART_MEMORY_STORAGE_KEY,
  ART_MEMORY_UPDATED_EVENT,
  readArtMemory,
} from "@/lib/mindslice/art-memory-storage";
import {
  NARRATIVE_CANON_STORAGE_KEY,
  NARRATIVE_CANON_UPDATED_EVENT,
  readNarrativeCanon,
} from "@/lib/mindslice/narrative-canon-storage";
import {
  STORY_MEMORY_STORAGE_KEY,
  STORY_MEMORY_UPDATED_EVENT,
  readStoryMemory,
} from "@/lib/mindslice/story-memory-storage";
import {
  CONCEPT_MEMORY_STORAGE_KEY,
  CONCEPT_MEMORY_UPDATED_EVENT,
  readConceptMemory,
} from "@/lib/mindslice/concept-memory-storage";
import { updateArtSystemState } from "@/lib/mindslice/concept-art-composition-system";
import { updateColorSystemState } from "@/lib/mindslice/concept-color-theory-system";
import { updateNarrativeSystemState } from "@/lib/mindslice/concept-scenario-system";
import { buildSystemModificationState } from "@/lib/mindslice/system-state-update";
import type {
  ArtCanonEntry,
  ArtMemoryEntry,
  CanonEntry,
  EngineProfile,
  InfluenceMode,
  NarrativeCanonEntry,
  StoryMemoryEntry,
  SystemModificationState,
  ThoughtState,
} from "@/lib/mindslice/mindslice-types";

type UseSystemModificationStateOptions = {
  isSignedIn: boolean;
  stateLibrary: ThoughtState[];
  currentIndex: number;
  current: ThoughtState;
  engineMode: string;
  engineProfile: EngineProfile | null;
  liveInfluenceMode: InfluenceMode | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: Array<string | null | undefined>) {
  return values.filter((value, index, array): value is string => {
    if (!value?.trim()) {
      return false;
    }

    return array.findIndex((candidate) => candidate?.trim() === value.trim()) === index;
  });
}

function parseColorToken(entry: string | undefined, prefix: string) {
  if (!entry?.startsWith(`${prefix}:`)) {
    return null;
  }

  return entry.slice(prefix.length + 1) || null;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return null;
  }

  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) {
    return null;
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  const toHex = (channel: number) =>
    clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0");

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function blendHex(base: string, incoming: string, weight: number) {
  const baseRgb = hexToRgb(base);
  const incomingRgb = hexToRgb(incoming);

  if (!baseRgb || !incomingRgb) {
    return base;
  }

  return rgbToHex({
    r: baseRgb.r * (1 - weight) + incomingRgb.r * weight,
    g: baseRgb.g * (1 - weight) + incomingRgb.g * weight,
    b: baseRgb.b * (1 - weight) + incomingRgb.b * weight,
  });
}

export function useSystemModificationState({
  isSignedIn,
  stateLibrary,
  currentIndex,
  current,
  engineMode,
  engineProfile,
  liveInfluenceMode,
}: UseSystemModificationStateOptions) {
  const [conceptMemory, setConceptMemory] = useState(() => readConceptMemory());
  const [canon, setCanon] = useState<CanonEntry[]>(() => readCanon());
  const [artMemory, setArtMemory] = useState<ArtMemoryEntry[]>(() => readArtMemory());
  const [artCanon, setArtCanon] = useState<ArtCanonEntry[]>(() => readArtCanon());
  const [storyMemory, setStoryMemory] = useState<StoryMemoryEntry[]>(() => readStoryMemory());
  const [narrativeCanon, setNarrativeCanon] = useState<NarrativeCanonEntry[]>(() => readNarrativeCanon());

  useEffect(() => {
    function syncConceptMemory() {
      setConceptMemory(readConceptMemory());
    }

    function syncCanon() {
      setCanon(readCanon());
    }

    function syncArtMemory() {
      setArtMemory(readArtMemory());
    }

    function syncArtCanon() {
      setArtCanon(readArtCanon());
    }

    function syncStoryMemory() {
      setStoryMemory(readStoryMemory());
    }

    function syncNarrativeCanon() {
      setNarrativeCanon(readNarrativeCanon());
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key &&
        event.key !== CONCEPT_MEMORY_STORAGE_KEY &&
        event.key !== CANON_STORAGE_KEY &&
        event.key !== ART_MEMORY_STORAGE_KEY &&
        event.key !== ART_CANON_STORAGE_KEY &&
        event.key !== STORY_MEMORY_STORAGE_KEY &&
        event.key !== NARRATIVE_CANON_STORAGE_KEY
      ) {
        return;
      }

      syncConceptMemory();
      syncCanon();
      syncArtMemory();
      syncArtCanon();
      syncStoryMemory();
      syncNarrativeCanon();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CONCEPT_MEMORY_UPDATED_EVENT, syncConceptMemory);
    window.addEventListener(CANON_UPDATED_EVENT, syncCanon);
    window.addEventListener(ART_MEMORY_UPDATED_EVENT, syncArtMemory);
    window.addEventListener(ART_CANON_UPDATED_EVENT, syncArtCanon);
    window.addEventListener(STORY_MEMORY_UPDATED_EVENT, syncStoryMemory);
    window.addEventListener(NARRATIVE_CANON_UPDATED_EVENT, syncNarrativeCanon);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CONCEPT_MEMORY_UPDATED_EVENT, syncConceptMemory);
      window.removeEventListener(CANON_UPDATED_EVENT, syncCanon);
      window.removeEventListener(ART_MEMORY_UPDATED_EVENT, syncArtMemory);
      window.removeEventListener(ART_CANON_UPDATED_EVENT, syncArtCanon);
      window.removeEventListener(STORY_MEMORY_UPDATED_EVENT, syncStoryMemory);
      window.removeEventListener(NARRATIVE_CANON_UPDATED_EVENT, syncNarrativeCanon);
    };
  }, []);

  const visibleConceptMemory = useMemo(
    () => (isSignedIn ? conceptMemory : []),
    [conceptMemory, isSignedIn],
  );
  const visibleCanon = useMemo(() => (isSignedIn ? canon : []), [canon, isSignedIn]);
  const visibleArtMemory = useMemo(() => (isSignedIn ? artMemory : []), [artMemory, isSignedIn]);
  const visibleArtCanon = useMemo(() => (isSignedIn ? artCanon : []), [artCanon, isSignedIn]);
  const visibleStoryMemory = useMemo(() => (isSignedIn ? storyMemory : []), [storyMemory, isSignedIn]);
  const visibleNarrativeCanon = useMemo(
    () => (isSignedIn ? narrativeCanon : []),
    [isSignedIn, narrativeCanon],
  );

  const systemState = useMemo<SystemModificationState>(() => {
    const sourceCanonEntry = visibleCanon[0] ?? null;
    const sourceEntry =
      sourceCanonEntry
        ? {
            concept: sourceCanonEntry.concept,
            validation: sourceCanonEntry.validation,
          }
        : visibleConceptMemory.find((entry) => entry.validation.isValidConcept) ?? null;

    if (!sourceEntry) {
      return {
        modifiesSystem: false,
        sourceConceptId: null,
        sourceConceptTitle: null,
        sourceStage: null,
        preferredInfluenceMode: null,
        probabilityBias: 0,
        contaminationBias: 0,
        attentionShift: 0,
        probabilities: {
          conceptReuseWeight: 0,
          semanticPriority: 0,
          convergenceBias: 0,
        },
        contaminationPattern: {
          preferredMode: null,
          resistanceWeight: 0,
          recurrenceWeight: 0,
          acceptsExternalInterference: true,
        },
        attentionDistribution: {
          anchorWeight: 0,
          peripheralWeight: 0,
          memoryFieldWeight: 0,
        },
        charterAdditions: [],
        notes: ["no resolved concept available to modify the runtime"],
      };
    }

    const builtState = buildSystemModificationState({
      concept: sourceEntry.concept,
      validation: sourceEntry.validation,
      canonEntry: sourceCanonEntry,
      relatedConceptCount: sourceCanonEntry?.lineage.sourceIdeaCanonCount ?? 0,
    });

    return {
      ...builtState,
      modifiesSystem:
        builtState.modifiesSystem &&
        (sourceEntry.concept.stage === "canonical" ||
          sourceEntry.concept.confidence.overall >= 0.74),
      notes: [
        sourceCanonEntry
          ? `canon source: ${sourceCanonEntry.concept.core.title} (${sourceCanonEntry.influenceWeight.toFixed(2)} influence weight)`
          : "canon source: none, fallback to resolved concept memory",
        ...builtState.notes,
      ],
    };
  }, [visibleCanon, visibleConceptMemory]);

  const effectiveInfluenceMode =
    liveInfluenceMode ?? (systemState.modifiesSystem ? systemState.preferredInfluenceMode : null);

  const adjustedCurrent = useMemo<ThoughtState>(() => {
    const sourceArtCanonEntry = visibleArtCanon[0] ?? null;
    const sourceArtEntry =
      sourceArtCanonEntry ??
      visibleArtMemory.find((entry) => entry.stage === "resolved" || entry.stage === "canonical") ??
      null;
    const sourceNarrativeCanonEntry = visibleNarrativeCanon[0] ?? null;
    const sourceNarrativeEntry =
      sourceNarrativeCanonEntry ??
      visibleStoryMemory.find((entry) => entry.stage === "resolved" || entry.stage === "canonical") ??
      null;
    const artSystemUpdate = sourceArtEntry
      ? updateArtSystemState({
          composition: sourceArtEntry.composition,
          validation: sourceArtEntry.validation,
        })
      : null;
    const narrativeSystemUpdate = sourceNarrativeEntry
      ? updateNarrativeSystemState({
          scenario: sourceNarrativeEntry.scenario,
          validation: sourceNarrativeEntry.validation,
        })
      : null;
    const hasArtBias = Boolean(sourceArtEntry && artSystemUpdate);
    const hasNarrativeBias = Boolean(sourceNarrativeEntry && narrativeSystemUpdate);

    if (!systemState.modifiesSystem && !hasArtBias && !hasNarrativeBias) {
      return current;
    }

    const conceptTone = systemState.sourceConceptTitle?.toLowerCase() ?? "memorie activă";
    const compositionTone = sourceArtEntry?.conceptTitle?.toLowerCase() ?? "compoziție activă";
    const narrativeTone = sourceNarrativeEntry?.conceptTitle?.toLowerCase() ?? "scenariu activ";
    const sourcePalette = visibleCanon[0]?.concept.expression.palette ??
      visibleConceptMemory.find((entry) => entry.validation.isValidConcept)?.concept.expression.palette ??
      null;
    const colorSystemUpdate = sourcePalette
      ? updateColorSystemState({
          palette: sourcePalette,
          validation: sourcePalette.runtime?.scores ?? {
            hueStructure: 0,
            valueBalance: 0,
            saturationControl: 0,
            colorRelations: 0,
            attentionImpact: 0,
          },
        })
      : null;
    const paletteWeight = sourcePalette
      ? clamp(
          0.16 +
            systemState.probabilityBias * 0.18 +
            (colorSystemUpdate?.probabilities.conceptReuseWeight ?? 0) * 0.08,
          0.14,
          0.42,
        )
      : 0;
    const sourceBackground = parseColorToken(sourcePalette?.valueMap[0], "background");
    const sourceInk = parseColorToken(sourcePalette?.valueMap[1], "ink");

    return {
      ...current,
      thought: `${current.thought} Concept memory keeps returning through ${conceptTone}.${hasArtBias ? ` Compoziția revine prin ${compositionTone} și rearanjează traseul privirii.` : ""}${hasNarrativeBias ? ` Scenariul revine prin ${narrativeTone} și reaprinde conflictul ${sourceNarrativeEntry?.scenario.coreConflict}.` : ""}`,
      mood: `${current.mood}, influențat de memoria de concept${sourcePalette ? ` și de paleta ${sourcePalette.dominant}` : ""}${hasArtBias ? " și de o tensiune compozițională activă" : ""}${hasNarrativeBias ? " și de o tensiune narativă activă" : ""}`,
      motion:
        effectiveInfluenceMode && effectiveInfluenceMode !== liveInfluenceMode
          ? `${current.motion} with ${effectiveInfluenceMode} recall${hasArtBias ? " and guided eye-flow" : ""}${hasNarrativeBias ? " and escalation beats" : ""}`
          : hasArtBias
            ? `${current.motion} with guided eye-flow${hasNarrativeBias ? " and escalation beats" : ""}`
            : hasNarrativeBias
              ? `${current.motion} with escalation beats`
              : current.motion,
      fragments: unique([
        ...current.fragments,
        ...systemState.charterAdditions.slice(0, 2),
        sourceArtEntry?.composition.focusNode,
        sourceNarrativeEntry?.scenario.coreConflict,
      ]).slice(0, 6),
      keywords: unique([
        ...current.keywords,
        ...systemState.charterAdditions.map((entry) => entry.toLowerCase()),
        sourcePalette?.dominant,
        sourcePalette?.accent,
        sourceArtEntry?.composition.focusNode?.toLowerCase(),
        sourceArtEntry?.composition.outputVisual.toLowerCase(),
        sourceNarrativeEntry?.scenario.characterDrive?.toLowerCase(),
        sourceNarrativeEntry?.scenario.turningPoints[0]?.toLowerCase(),
      ]).slice(0, 8),
      palette: sourcePalette
        ? unique([
            sourcePalette.dominant,
            sourcePalette.secondary,
            sourcePalette.accent,
            ...sourcePalette.supportTones,
            ...current.palette,
          ]).slice(0, 4)
        : current.palette,
      triad: {
        art: {
          ...current.triad.art,
          score: clamp(
            current.triad.art.score +
              systemState.probabilities.semanticPriority * 0.18 +
              systemState.probabilityBias * 0.26 +
              (colorSystemUpdate?.probabilities.semanticPriority ?? 0) * 0.1 +
              (narrativeSystemUpdate?.storyProbabilities.symbolicDepth ?? 0) * 0.12,
            0,
            1,
          ),
        },
        design: {
          ...current.triad.design,
          score: clamp(
            current.triad.design.score +
              systemState.contaminationPattern.resistanceWeight * 0.16 +
              systemState.contaminationBias * 0.2 +
              (artSystemUpdate?.unityPatterns.cohesionWeight ?? 0) * 0.12 +
              (artSystemUpdate?.proportionRules.hierarchyWeight ?? 0) * 0.08 +
              (narrativeSystemUpdate?.storyProbabilities.sequenceBias ?? 0) * 0.1,
            0,
            1,
          ),
        },
        business: {
          ...current.triad.business,
          score: clamp(
            current.triad.business.score +
              systemState.attentionDistribution.anchorWeight * 0.18 +
              systemState.attentionShift * 0.24 +
              (colorSystemUpdate?.attentionBehavior.focusWeight ?? 0) * 0.1 +
              (artSystemUpdate?.attentionBehavior.focusWeight ?? 0) * 0.12 +
              (narrativeSystemUpdate?.tensionBehavior.retentionWeight ?? 0) * 0.12,
            0,
            1,
          ),
        },
      },
      visual: {
        ...current.visual,
        mode:
          hasArtBias && sourceArtEntry
            ? `${current.visual.mode} / ${sourceArtEntry.composition.focusNode}`
            : hasNarrativeBias && sourceNarrativeEntry
              ? `${current.visual.mode} / ${sourceNarrativeEntry.scenario.characterDrive}`
              : current.visual.mode,
        background:
          sourceBackground && paletteWeight > 0
            ? blendHex(current.visual.background, sourceBackground, paletteWeight)
            : current.visual.background,
        accent:
          sourcePalette && paletteWeight > 0
            ? blendHex(current.visual.accent, sourcePalette.accent, Math.min(0.48, paletteWeight + 0.08))
            : current.visual.accent,
        ink:
          sourceInk && paletteWeight > 0
            ? blendHex(current.visual.ink, sourceInk, Math.max(0.12, paletteWeight - 0.04))
            : current.visual.ink,
        density: clamp(
          current.visual.density +
            systemState.probabilities.conceptReuseWeight * 0.18 +
            systemState.probabilityBias * 0.1 +
            (colorSystemUpdate?.hierarchyRules.hierarchyBias ?? 0) * 0.08 +
            (artSystemUpdate?.proportionRules.hierarchyWeight ?? 0) * 0.12,
          0.9,
          1.95,
        ),
        wave: clamp(
          current.visual.wave +
            systemState.attentionDistribution.memoryFieldWeight * 0.16 +
            systemState.attentionShift * 0.18 +
            (colorSystemUpdate?.attentionBehavior.memoryFieldWeight ?? 0) * 0.08 +
            (artSystemUpdate?.attentionBehavior.pathWeight ?? 0) * 0.12 +
            (narrativeSystemUpdate?.tensionBehavior.suspenseWeight ?? 0) * 0.1,
          0.35,
          1.55,
        ),
        fracture: clamp(
          current.visual.fracture +
            (artSystemUpdate?.balanceLogic.redistributionWeight ?? 0) * 0.08 +
            (narrativeSystemUpdate?.conflictPatterns.escalationWeight ?? 0) * 0.1,
          0.12,
          0.92,
        ),
        drift: clamp(
          current.visual.drift +
            systemState.contaminationPattern.recurrenceWeight * 0.1 +
            systemState.contaminationBias * 0.08 +
            (artSystemUpdate?.attentionBehavior.pathWeight ?? 0) * 0.06 +
            (narrativeSystemUpdate?.storyProbabilities.sequenceBias ?? 0) * 0.08,
          0.25,
          1.2,
        ),
        convergence: clamp(
          current.visual.convergence +
            systemState.probabilities.convergenceBias * 0.16 +
            systemState.attentionDistribution.anchorWeight * 0.06 +
            (colorSystemUpdate?.probabilities.convergenceBias ?? 0) * 0.08 +
            (artSystemUpdate?.attentionBehavior.focusWeight ?? 0) * 0.1 +
            (artSystemUpdate?.unityPatterns.cohesionWeight ?? 0) * 0.08 +
            (narrativeSystemUpdate?.storyProbabilities.irreversibilityBias ?? 0) * 0.1,
          0.45,
          0.95,
        ),
      },
    };
  }, [
    current,
    effectiveInfluenceMode,
    liveInfluenceMode,
    systemState,
    visibleArtCanon,
    visibleArtMemory,
    visibleCanon,
    visibleConceptMemory,
    visibleNarrativeCanon,
    visibleStoryMemory,
  ]);

  const adjustedStateLibrary = useMemo(() => {
    if (!stateLibrary.length || currentIndex < 0 || currentIndex >= stateLibrary.length) {
      return stateLibrary;
    }

    return stateLibrary.map((entry, index) => (index === currentIndex ? adjustedCurrent : entry));
  }, [adjustedCurrent, currentIndex, stateLibrary]);

  const adjustedEngineMode = systemState.modifiesSystem
    ? `${engineMode} / concept memory bias / color memory bias / art composition bias / narrative bias`
    : visibleArtCanon.length || visibleArtMemory.length || visibleNarrativeCanon.length || visibleStoryMemory.length
      ? `${engineMode} / narrative-visual bias`
    : engineMode;

  const adjustedEngineProfile = useMemo<EngineProfile | null>(() => {
    if (!engineProfile || !systemState.modifiesSystem) {
      return engineProfile;
    }

    return {
      ...engineProfile,
      charterAxes: unique([...engineProfile.charterAxes, ...systemState.charterAdditions]),
      activeContaminationRule:
        engineProfile.activeContaminationRule ??
        (effectiveInfluenceMode
          ? `Concept memory reactivates ${effectiveInfluenceMode} as preferred contamination trace.`
          : "Concept memory shifts the runtime even without external contamination."),
      sceneConstraints: unique([
        ...engineProfile.sceneConstraints,
        systemState.contaminationPattern.acceptsExternalInterference
          ? "external interference may still fold into canon-biased runtime"
          : "canon-biased runtime resists external interference spikes",
        `attention anchor ${(systemState.attentionDistribution.anchorWeight * 100).toFixed(0)}%`,
        visibleArtCanon[0]
          ? `art canon focus ${visibleArtCanon[0].composition.focusNode}`
          : visibleArtMemory[0]
            ? `art memory focus ${visibleArtMemory[0].composition.focusNode}`
            : null,
        visibleNarrativeCanon[0]
          ? `narrative canon conflict ${visibleNarrativeCanon[0].scenario.coreConflict}`
          : visibleStoryMemory[0]
            ? `story memory conflict ${visibleStoryMemory[0].scenario.coreConflict}`
            : null,
      ]),
    };
  }, [
    effectiveInfluenceMode,
    engineProfile,
    systemState,
    visibleArtCanon,
    visibleArtMemory,
    visibleNarrativeCanon,
    visibleStoryMemory,
  ]);

  return {
    systemState,
    adjustedStateLibrary,
    adjustedCurrent,
    adjustedEngineMode,
    adjustedEngineProfile,
    effectiveInfluenceMode,
  };
}
