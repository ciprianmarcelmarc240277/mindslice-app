"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CONCEPT_MEMORY_STORAGE_KEY,
  CONCEPT_MEMORY_UPDATED_EVENT,
  readConceptMemory,
} from "@/lib/mindslice/concept-memory-storage";
import type {
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

  useEffect(() => {
    function syncConceptMemory() {
      setConceptMemory(readConceptMemory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== CONCEPT_MEMORY_STORAGE_KEY) {
        return;
      }

      syncConceptMemory();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CONCEPT_MEMORY_UPDATED_EVENT, syncConceptMemory);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CONCEPT_MEMORY_UPDATED_EVENT, syncConceptMemory);
    };
  }, []);

  const visibleConceptMemory = useMemo(
    () => (isSignedIn ? conceptMemory : []),
    [conceptMemory, isSignedIn],
  );

  const systemState = useMemo<SystemModificationState>(() => {
    const sourceEntry = visibleConceptMemory.find(
      (entry) => entry.concept.stage === "canonical",
    ) ?? visibleConceptMemory.find((entry) => entry.validation.isValidConcept);

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
        charterAdditions: [],
        notes: ["no resolved concept available to modify the runtime"],
      };
    }

    const preferredInfluenceMode =
      (sourceEntry.concept.contamination.transformedInfluences[0] as InfluenceMode | undefined) ??
      null;
    const probabilityBias = clamp(
      sourceEntry.concept.confidence.overall * 0.22 +
        sourceEntry.validation.scores.semanticStability * 0.18,
      0,
      0.32,
    );
    const contaminationBias = clamp(
      sourceEntry.validation.scores.contaminationResolution * 0.2,
      0,
      0.28,
    );
    const attentionShift = clamp(
      sourceEntry.validation.scores.authorDilemmaResolution * 0.16,
      0,
      0.2,
    );
    const charterAdditions = unique([
      sourceEntry.concept.core.title,
      ...sourceEntry.concept.core.keywords.slice(0, 2),
      ...sourceEntry.concept.expression.dominantFragments.slice(0, 1),
    ]).slice(0, 4);

    return {
      modifiesSystem:
        sourceEntry.validation.isValidConcept &&
        (sourceEntry.concept.stage === "canonical" ||
          sourceEntry.concept.confidence.overall >= 0.74),
      sourceConceptId: sourceEntry.concept.id,
      sourceConceptTitle: sourceEntry.concept.core.title,
      sourceStage: sourceEntry.concept.stage,
      preferredInfluenceMode,
      probabilityBias,
      contaminationBias,
      attentionShift,
      charterAdditions,
      notes: [
        `source concept: ${sourceEntry.concept.core.title}`,
        `probability bias: ${probabilityBias.toFixed(2)}`,
        `contamination bias: ${contaminationBias.toFixed(2)}`,
        `attention shift: ${attentionShift.toFixed(2)}`,
      ],
    };
  }, [visibleConceptMemory]);

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
          score: clamp(current.triad.art.score + systemState.probabilityBias * 0.4, 0, 1),
        },
        design: {
          ...current.triad.design,
          score: clamp(current.triad.design.score + systemState.contaminationBias * 0.35, 0, 1),
        },
        business: {
          ...current.triad.business,
          score: clamp(current.triad.business.score + systemState.attentionShift * 0.5, 0, 1),
        },
      },
      visual: {
        ...current.visual,
        density: clamp(current.visual.density + systemState.probabilityBias * 0.28, 0.9, 1.95),
        wave: clamp(current.visual.wave + systemState.attentionShift * 0.32, 0.35, 1.55),
        drift: clamp(
          current.visual.drift + systemState.contaminationBias * 0.18,
          0.25,
          1.2,
        ),
        convergence: clamp(
          current.visual.convergence + systemState.probabilityBias * 0.22,
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
