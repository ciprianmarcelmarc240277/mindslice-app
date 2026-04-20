import {
  deriveDynamicConceptThresholds,
  validConcept,
} from "@/lib/mindslice/concept-threshold-system";
import type {
  ConceptCandidate,
  ConceptResolutionStatus,
  ConceptValidationResult,
} from "@/lib/mindslice/mindslice-types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function deriveResolutionStatus(
  isValidConcept: boolean,
  semanticStability: number,
  contaminationResolution: number,
  authorDilemmaResolution: number,
): ConceptResolutionStatus {
  if (isValidConcept) {
    return "resolved";
  }

  if (contaminationResolution < 0.45) {
    return "contested";
  }

  if (semanticStability >= 0.68 || authorDilemmaResolution >= 0.66) {
    return "partially_resolved";
  }

  return "unresolved";
}

export function validateConceptCandidate(
  candidate: ConceptCandidate,
): ConceptValidationResult {
  const thresholds = deriveDynamicConceptThresholds(candidate);
  const axes = candidate.evaluationAxes;

  const semanticStability = clamp(
    axes.sense * 0.62 +
      candidate.coherenceSignals.semantic * 0.12 +
      candidate.conceptStateDraft.validation.persistenceAcrossCycles * 0.28,
    0,
    1,
  );

  const visualConsistency = clamp(
    axes.structure * 0.5 +
      candidate.coherenceSignals.visual * 0.34 +
      candidate.conceptStateDraft.confidence.visual * 0.16,
    0,
    1,
  );

  const crossModalAlignment = clamp(
    axes.coherence * 0.52 +
      candidate.coherenceSignals.crossModal * 0.32 +
      ((axes.sense + axes.structure) / 2) * 0.16,
    0,
    1,
  );

  const contaminationResolution = clamp(
    candidate.conceptStateDraft.contamination.resistanceScore * 0.72 +
      (candidate.conceptStateDraft.validation.survivesContamination ? 0.18 : 0) +
      (candidate.contaminationSummary.length > 1 ? 0.08 : 0),
    0,
    1,
  );

  const authorDilemmaResolution = clamp(
    axes.attention * 0.38 +
      candidate.conceptStateDraft.confidence.authorAlignment * 0.42 +
      candidate.conceptStateDraft.confidence.overall * 0.2,
    0,
    1,
  );

  const isValidConcept = validConcept(axes, thresholds);

  const resolutionStatus = deriveResolutionStatus(
    isValidConcept,
    semanticStability,
    contaminationResolution,
    authorDilemmaResolution,
  );

  const notes = [
    `dynamic thresholds: structure ≥ ${thresholds.structure.toFixed(2)} / sense ≥ ${thresholds.sense.toFixed(2)} / attention ≥ ${thresholds.attention.toFixed(2)} / coherence ≥ ${thresholds.coherence.toFixed(2)}`,
    `current axes: structure ${axes.structure.toFixed(2)} / sense ${axes.sense.toFixed(2)} / attention ${axes.attention.toFixed(2)} / coherence ${axes.coherence.toFixed(2)}`,
    semanticStability >= 0.78
      ? "semantic stability: teza începe să se repete coerent"
      : "semantic stability: teza încă fluctuează",
    visualConsistency >= 0.72
      ? "visual consistency: scena păstrează o identitate recognoscibilă"
      : "visual consistency: limbajul vizual încă nu s-a stabilizat",
    crossModalAlignment >= 0.75
      ? "cross-modal alignment: textul și grafica converg"
      : "cross-modal alignment: textul și grafica încă nu spun același lucru",
    contaminationResolution >= 0.7
      ? "contamination resolution: contaminarea este integrată fără colaps"
      : "contamination resolution: contaminarea nu este încă metabolizată suficient",
    authorDilemmaResolution >= 0.76
      ? "author dilemma resolution: Artist AI formulează un răspuns recognoscibil"
      : "author dilemma resolution: răspunsul la dilemă rămâne incomplet",
  ];

  return {
    isValidConcept,
    resolutionStatus,
    axes,
    thresholds,
    scores: {
      semanticStability,
      visualConsistency,
      crossModalAlignment,
      contaminationResolution,
      authorDilemmaResolution,
    },
    notes,
  };
}
