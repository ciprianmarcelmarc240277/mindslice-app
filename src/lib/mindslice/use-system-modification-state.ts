"use client";

import { useEffect, useMemo, useState } from "react";
import { CANON_STORAGE_KEY, CANON_UPDATED_EVENT, readCanon } from "@/lib/mindslice/canon-storage";
import {
  CONCEPT_MEMORY_STORAGE_KEY,
  CONCEPT_MEMORY_UPDATED_EVENT,
  readConceptMemory,
} from "@/lib/mindslice/concept-memory-storage";
import { buildSystemModificationState } from "@/lib/mindslice/system-state-update";
import type {
  CanonEntry,
  EngineProfile,
  InfluenceMode,
  SystemModificationState,
  ThoughtState,
} from "@/lib/mindslice/mindslice-types";

type UseSystemModificationStateOptions = {
  isSignedIn: boolean;
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

export function useSystemModificationState({
  isSignedIn,
  current,
  engineMode,
  engineProfile,
  liveInfluenceMode,
}: UseSystemModificationStateOptions) {
  const [conceptMemory, setConceptMemory] = useState(() => readConceptMemory());
  const [canon, setCanon] = useState<CanonEntry[]>(() => readCanon());

  useEffect(() => {
    function syncConceptMemory() {
      setConceptMemory(readConceptMemory());
    }

    function syncCanon() {
      setCanon(readCanon());
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key &&
        event.key !== CONCEPT_MEMORY_STORAGE_KEY &&
        event.key !== CANON_STORAGE_KEY
      ) {
        return;
      }

      syncConceptMemory();
      syncCanon();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CONCEPT_MEMORY_UPDATED_EVENT, syncConceptMemory);
    window.addEventListener(CANON_UPDATED_EVENT, syncCanon);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CONCEPT_MEMORY_UPDATED_EVENT, syncConceptMemory);
      window.removeEventListener(CANON_UPDATED_EVENT, syncCanon);
    };
  }, []);

  const visibleConceptMemory = useMemo(
    () => (isSignedIn ? conceptMemory : []),
    [conceptMemory, isSignedIn],
  );
  const visibleCanon = useMemo(() => (isSignedIn ? canon : []), [canon, isSignedIn]);

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
    if (!systemState.modifiesSystem) {
      return current;
    }

    const conceptTone = systemState.sourceConceptTitle?.toLowerCase() ?? "memorie activă";
    return {
      ...current,
      thought: `${current.thought} Concept memory keeps returning through ${conceptTone}.`,
      mood: `${current.mood}, influențat de memoria de concept`,
      motion:
        effectiveInfluenceMode && effectiveInfluenceMode !== liveInfluenceMode
          ? `${current.motion} with ${effectiveInfluenceMode} recall`
          : current.motion,
      fragments: unique([
        ...current.fragments,
        ...systemState.charterAdditions.slice(0, 2),
      ]).slice(0, 6),
      keywords: unique([
        ...current.keywords,
        ...systemState.charterAdditions.map((entry) => entry.toLowerCase()),
      ]).slice(0, 8),
      triad: {
        art: {
          ...current.triad.art,
          score: clamp(
            current.triad.art.score +
              systemState.probabilities.semanticPriority * 0.18 +
              systemState.probabilityBias * 0.26,
            0,
            1,
          ),
        },
        design: {
          ...current.triad.design,
          score: clamp(
            current.triad.design.score +
              systemState.contaminationPattern.resistanceWeight * 0.16 +
              systemState.contaminationBias * 0.2,
            0,
            1,
          ),
        },
        business: {
          ...current.triad.business,
          score: clamp(
            current.triad.business.score +
              systemState.attentionDistribution.anchorWeight * 0.18 +
              systemState.attentionShift * 0.24,
            0,
            1,
          ),
        },
      },
      visual: {
        ...current.visual,
        density: clamp(
          current.visual.density +
            systemState.probabilities.conceptReuseWeight * 0.18 +
            systemState.probabilityBias * 0.1,
          0.9,
          1.95,
        ),
        wave: clamp(
          current.visual.wave +
            systemState.attentionDistribution.memoryFieldWeight * 0.16 +
            systemState.attentionShift * 0.18,
          0.35,
          1.55,
        ),
        drift: clamp(
          current.visual.drift +
            systemState.contaminationPattern.recurrenceWeight * 0.1 +
            systemState.contaminationBias * 0.08,
          0.25,
          1.2,
        ),
        convergence: clamp(
          current.visual.convergence +
            systemState.probabilities.convergenceBias * 0.16 +
            systemState.attentionDistribution.anchorWeight * 0.06,
          0.45,
          0.95,
        ),
      },
    };
  }, [current, effectiveInfluenceMode, liveInfluenceMode, systemState]);

  const adjustedEngineMode = systemState.modifiesSystem
    ? `${engineMode} / concept memory bias`
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
      ]),
    };
  }, [effectiveInfluenceMode, engineProfile, systemState]);

  return {
    systemState,
    adjustedCurrent,
    adjustedEngineMode,
    adjustedEngineProfile,
    effectiveInfluenceMode,
  };
}
