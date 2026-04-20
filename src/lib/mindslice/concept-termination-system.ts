import type {
  ConceptTerminationReason,
  ConceptValidationResult,
} from "@/lib/mindslice/mindslice-types";

type EvaluateTerminationInput = {
  iterationCount: number;
  validation: ConceptValidationResult;
  contaminationAccepted: boolean;
  persistenceAcrossCycles: number;
};

export function evaluateTerminationCondition(
  input: EvaluateTerminationInput,
): ConceptTerminationReason {
  const {
    iterationCount,
    validation,
    contaminationAccepted,
    persistenceAcrossCycles,
  } = input;

  const structureGap = validation.thresholds.structure - validation.axes.structure;
  const senseGap = validation.thresholds.sense - validation.axes.sense;
  const attentionGap = validation.thresholds.attention - validation.axes.attention;
  const coherenceGap = validation.thresholds.coherence - validation.axes.coherence;

  if (
    iterationCount >= 4 &&
    contaminationAccepted &&
    validation.scores.contaminationResolution < 0.38
  ) {
    return "contamination_collapse";
  }

  if (iterationCount >= 4 && structureGap > 0.18 && coherenceGap > 0.16) {
    return "insufficient_structure";
  }

  if (iterationCount >= 5 && attentionGap > 0.14 && senseGap > 0.1) {
    return "attention_dissipation";
  }

  if (iterationCount >= 6 && persistenceAcrossCycles < 0.42 && coherenceGap > 0.08) {
    return "stagnation";
  }

  return "none";
}
