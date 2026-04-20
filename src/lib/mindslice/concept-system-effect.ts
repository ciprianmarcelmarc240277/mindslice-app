import type {
  ConceptState,
  ConceptValidationResult,
  InfluenceMode,
  SystemModificationState,
} from "@/lib/mindslice/mindslice-types";

type EvaluateConceptSystemEffectInput = {
  concept: ConceptState;
  validation: ConceptValidationResult;
  relatedConceptCount?: number;
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

export function evaluateConceptSystemEffect(
  input: EvaluateConceptSystemEffectInput,
): SystemModificationState {
  const { concept, validation, relatedConceptCount = 0 } = input;
  const preferredInfluenceMode =
    (concept.contamination.transformedInfluences[0] as InfluenceMode | undefined) ?? null;

  const probabilityBias = clamp(
    concept.confidence.overall * 0.2 +
      validation.scores.semanticStability * 0.18 +
      Math.min(relatedConceptCount, 3) * 0.03,
    0,
    0.36,
  );
  const contaminationBias = clamp(
    validation.scores.contaminationResolution * 0.22 +
      concept.contamination.resistanceScore * 0.06,
    0,
    0.32,
  );
  const attentionShift = clamp(
    validation.scores.authorDilemmaResolution * 0.2 +
      validation.scores.crossModalAlignment * 0.08,
    0,
    0.26,
  );

  const modifiesSystem =
    validation.isValidConcept &&
    probabilityBias >= 0.16 &&
    contaminationBias >= 0.14 &&
    attentionShift >= 0.14;

  return {
    modifiesSystem,
    sourceConceptId: concept.id,
    sourceConceptTitle: concept.core.title,
    sourceStage: concept.stage,
    preferredInfluenceMode,
    probabilityBias,
    contaminationBias,
    attentionShift,
    charterAdditions: unique([
      concept.core.title,
      ...concept.core.keywords.slice(0, 2),
      ...concept.expression.dominantFragments.slice(0, 1),
    ]).slice(0, 4),
    notes: [
      `evaluated system effect for ${concept.core.title}`,
      `probability bias ${probabilityBias.toFixed(2)}`,
      `contamination bias ${contaminationBias.toFixed(2)}`,
      `attention shift ${attentionShift.toFixed(2)}`,
      modifiesSystem
        ? "law verdict: concept modifies the system"
        : "law verdict: concept does not yet modify the system",
    ],
  };
}
