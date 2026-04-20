import type {
  CanonEntry,
  ConceptState,
  ConceptValidationResult,
  InfluenceMode,
  SystemModificationState,
} from "@/lib/mindslice/mindslice-types";

type BuildSystemStateInput = {
  concept: ConceptState;
  validation: ConceptValidationResult;
  canonEntry?: CanonEntry | null;
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

function adjustProbabilities(
  concept: ConceptState,
  validation: ConceptValidationResult,
  canonEntry: CanonEntry | null,
  relatedConceptCount: number,
) {
  const conceptReuseWeight = clamp(
    concept.confidence.overall * 0.34 +
      validation.scores.semanticStability * 0.22 +
      Math.min(relatedConceptCount, 4) * 0.04 +
      (canonEntry?.influenceWeight ?? 0) * 0.08,
    0,
    1,
  );
  const semanticPriority = clamp(
    validation.scores.semanticStability * 0.46 +
      validation.scores.crossModalAlignment * 0.2 +
      concept.validation.semanticCoherence * 0.18,
    0,
    1,
  );
  const convergenceBias = clamp(
    concept.confidence.overall * 0.28 +
      validation.scores.authorDilemmaResolution * 0.24 +
      (canonEntry?.lineage.sourceIdeaCanonCount ?? 0) * 0.03,
    0,
    1,
  );

  return {
    conceptReuseWeight,
    semanticPriority,
    convergenceBias,
  };
}

function modifyContaminationPatterns(
  concept: ConceptState,
  validation: ConceptValidationResult,
  canonEntry: CanonEntry | null,
) {
  const preferredMode =
    (concept.contamination.transformedInfluences[0] as InfluenceMode | undefined) ?? null;
  const resistanceWeight = clamp(
    validation.scores.contaminationResolution * 0.48 +
      concept.contamination.resistanceScore * 0.28 +
      (canonEntry?.influenceWeight ?? 0) * 0.08,
    0,
    1,
  );
  const recurrenceWeight = clamp(
    concept.validation.persistenceAcrossCycles * 0.42 +
      validation.scores.visualConsistency * 0.18 +
      (canonEntry?.lineage.sourceIdeaCanonCount ?? 0) * 0.05,
    0,
    1,
  );

  return {
    preferredMode,
    resistanceWeight,
    recurrenceWeight,
    acceptsExternalInterference: resistanceWeight < 0.72,
  };
}

function updateAttentionDistribution(
  concept: ConceptState,
  validation: ConceptValidationResult,
  canonEntry: CanonEntry | null,
) {
  const anchorWeight = clamp(
    validation.scores.authorDilemmaResolution * 0.42 +
      validation.scores.crossModalAlignment * 0.18 +
      (canonEntry?.influenceWeight ?? 0) * 0.06,
    0,
    1,
  );
  const peripheralWeight = clamp(
    concept.confidence.visual * 0.24 +
      validation.scores.visualConsistency * 0.18 +
      (concept.contamination.activeTensions.length > 0 ? 0.1 : 0),
    0,
    1,
  );
  const memoryFieldWeight = clamp(
    concept.validation.persistenceAcrossCycles * 0.36 +
      concept.confidence.semantic * 0.16 +
      (canonEntry?.lineage.sourceIdeaCanonCount ?? 0) * 0.06,
    0,
    1,
  );

  return {
    anchorWeight,
    peripheralWeight,
    memoryFieldWeight,
  };
}

export function buildSystemModificationState({
  concept,
  validation,
  canonEntry = null,
  relatedConceptCount = 0,
}: BuildSystemStateInput): SystemModificationState {
  const probabilities = adjustProbabilities(
    concept,
    validation,
    canonEntry,
    relatedConceptCount,
  );
  const contaminationPattern = modifyContaminationPatterns(concept, validation, canonEntry);
  const attentionDistribution = updateAttentionDistribution(concept, validation, canonEntry);

  const probabilityBias = clamp(
    probabilities.conceptReuseWeight * 0.22 +
      probabilities.semanticPriority * 0.12 +
      probabilities.convergenceBias * 0.08,
    0,
    0.42,
  );
  const contaminationBias = clamp(
    contaminationPattern.resistanceWeight * 0.24 +
      contaminationPattern.recurrenceWeight * 0.12,
    0,
    0.38,
  );
  const attentionShift = clamp(
    attentionDistribution.anchorWeight * 0.22 +
      attentionDistribution.memoryFieldWeight * 0.14,
    0,
    0.28,
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
    preferredInfluenceMode: contaminationPattern.preferredMode,
    probabilityBias,
    contaminationBias,
    attentionShift,
    probabilities,
    contaminationPattern,
    attentionDistribution,
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
      `probability lanes: reuse ${probabilities.conceptReuseWeight.toFixed(2)} / semantic ${probabilities.semanticPriority.toFixed(2)} / convergence ${probabilities.convergenceBias.toFixed(2)}`,
      `contamination lanes: resistance ${contaminationPattern.resistanceWeight.toFixed(2)} / recurrence ${contaminationPattern.recurrenceWeight.toFixed(2)}`,
      `attention lanes: anchor ${attentionDistribution.anchorWeight.toFixed(2)} / peripheral ${attentionDistribution.peripheralWeight.toFixed(2)} / memory ${attentionDistribution.memoryFieldWeight.toFixed(2)}`,
      modifiesSystem
        ? "law verdict: concept modifies the system"
        : "law verdict: concept does not yet modify the system",
    ],
  };
}
