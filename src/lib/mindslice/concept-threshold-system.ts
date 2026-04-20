import type {
  ConceptCandidate,
  ConceptDynamicThresholds,
  ConceptEvaluationAxes,
} from "@/lib/mindslice/mindslice-types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function deriveDynamicConceptThresholds(
  candidate: ConceptCandidate,
): ConceptDynamicThresholds {
  const contaminationPressure = clamp(
    candidate.conceptStateDraft.contamination.acceptedInfluences.length * 0.04 +
      candidate.conceptStateDraft.contamination.activeTensions.length * 0.018 +
      Math.max(0, 0.68 - candidate.conceptStateDraft.contamination.resistanceScore) * 0.16,
    0,
    0.16,
  );

  const memoryRelief = clamp(
    candidate.conceptStateDraft.validation.persistenceAcrossCycles * 0.08 +
      Math.min(candidate.dominantKeywords.length, 4) * 0.008 +
      (candidate.stage === "stabilizing" ? 0.02 : candidate.stage === "forming" ? 0.01 : 0),
    0,
    0.12,
  );

  const stagePressure = candidate.stage === "emergent" ? 0.035 : candidate.stage === "forming" ? 0.016 : -0.01;
  const confidenceRelief = clamp(
    Math.max(0, candidate.conceptStateDraft.confidence.overall - 0.58) * 0.08,
    0,
    0.04,
  );

  return {
    structure: clamp(
      0.72 +
        contaminationPressure * 0.68 +
        stagePressure -
        memoryRelief * 0.64 -
        confidenceRelief,
      0.58,
      0.88,
    ),
    sense: clamp(
      0.74 +
        contaminationPressure * 0.44 +
        stagePressure * 0.62 -
        memoryRelief * 0.5 -
        confidenceRelief,
      0.6,
      0.9,
    ),
    attention: clamp(
      0.68 +
        contaminationPressure * 0.3 +
        stagePressure * 0.42 -
        memoryRelief * 0.38,
      0.54,
      0.84,
    ),
    coherence: clamp(
      0.75 +
        contaminationPressure * 0.82 +
        stagePressure * 0.78 -
        memoryRelief * 0.56 -
        confidenceRelief,
      0.6,
      0.9,
    ),
    drivers: {
      contaminationPressure,
      memoryRelief,
      stagePressure,
      confidenceRelief,
    },
  };
}

export function validConcept(
  axes: ConceptEvaluationAxes,
  thresholds: ConceptDynamicThresholds,
) {
  return (
    axes.structure >= thresholds.structure &&
    axes.sense >= thresholds.sense &&
    axes.attention >= thresholds.attention &&
    axes.coherence >= thresholds.coherence
  );
}
