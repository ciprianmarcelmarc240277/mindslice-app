import type { ThresholdModelResult } from "@/lib/mindslice/concept-threshold-model-system";
import type {
  SliceEvolutionDelta,
  SliceRepetitionContext,
  SliceRepetitionResult,
  SliceStructurePattern,
} from "@/lib/mindslice/concept-slice-repetition-engine-system";

export type ScoringLegacyInput = {
  stored_concepts: string[];
  stored_insights: string[];
  stored_structure: SliceStructurePattern;
};

export type ScoringProfile = {
  clarity: number;
  impact: number;
  frequency: number;
  reusability: number;
  expansion: number;
  total: number;
};

const MAX_SCORE = 5;

function normalize(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  if (value < 0) {
    return 0;
  }

  return value;
}

function logScale(value: number) {
  return Math.log(1 + Math.max(0, value));
}

function uniqueCount(values: string[]) {
  return new Set(values.filter(Boolean)).size;
}

function evaluateStructure(structure: SliceStructurePattern) {
  switch (structure) {
    case "multi_sentence":
      return 0.9;
    case "directive":
      return 0.82;
    case "list_like":
      return 0.76;
    case "single_block":
      return 0.7;
    case "fragmented":
      return 0.5;
    default:
      return 0.6;
  }
}

function evaluateConceptCoherence(concepts: string[]) {
  const count = uniqueCount(concepts);

  if (count === 0) {
    return 0.2;
  }

  return normalize(0.3 + Math.min(count, 5) * 0.14);
}

function evaluateInsightStrength(insights: string[]) {
  const weighted = insights.reduce((total, insight) => {
    if (insight.startsWith("axis:") || insight.startsWith("content:")) {
      return total + 0.2;
    }

    if (insight.startsWith("tag:") || insight.startsWith("intent:")) {
      return total + 0.12;
    }

    return total + 0.1;
  }, 0);

  return normalize(weighted);
}

function evaluatePatternStrength(concepts: string[]) {
  const count = uniqueCount(concepts);
  const averageLength =
    count === 0
      ? 0
      : concepts.reduce((total, concept) => total + concept.length, 0) / Math.max(concepts.length, 1);

  return normalize(count * 0.12 + Math.min(averageLength / 16, 0.4));
}

function magnitude(evolution: SliceEvolutionDelta | null | undefined) {
  return normalize(evolution?.magnitude ?? 0);
}

export function measureClarity(legacy: ScoringLegacyInput) {
  const structureScore = evaluateStructure(legacy.stored_structure);
  const conceptCoherence = evaluateConceptCoherence(legacy.stored_concepts);

  return normalize((structureScore + conceptCoherence) / 2);
}

export function measureImpact(
  legacy: ScoringLegacyInput,
  threshold: ThresholdModelResult,
) {
  let base = 0.2;
  const classification = threshold.threshold_state.classification;

  if (classification === "CONCEPT") {
    base = 0.6;
  } else if (classification === "PRE_CONCEPT") {
    base = 0.4;
  } else if (classification === "CANONICAL_CANDIDATE") {
    base = 0.75;
  }

  const insightStrength = evaluateInsightStrength(legacy.stored_insights);

  return normalize(base + insightStrength);
}

export function measureFrequency(sliceContext: SliceRepetitionContext) {
  return normalize(logScale(sliceContext.total_slices) / logScale(10));
}

export function measureReusability(
  legacy: ScoringLegacyInput,
  repetition: Pick<SliceRepetitionResult, "repetition_type">,
) {
  let base = 0.3;

  if (repetition.repetition_type === "STATIC_REPETITION") {
    base = 0.2;
  } else if (repetition.repetition_type === "PROGRESSIVE_REPETITION") {
    base = 0.6;
  } else if (repetition.repetition_type === "TRANSFORMATIVE_REPETITION") {
    base = 0.9;
  }

  const patternStrength = evaluatePatternStrength(legacy.stored_concepts);

  return normalize(base + patternStrength);
}

export function measureExpansion(repetition: Pick<SliceRepetitionResult, "evolution">) {
  if (!repetition.evolution) {
    return 0.2;
  }

  return normalize(magnitude(repetition.evolution));
}

export function computeTotal(
  clarity: number,
  impact: number,
  frequency: number,
  reusability: number,
  expansion: number,
) {
  return Math.min(
    MAX_SCORE,
    clarity + impact + frequency + reusability + expansion,
  );
}

export function runScoringEngineV1(
  legacy: ScoringLegacyInput,
  repetition: Pick<SliceRepetitionResult, "repetition_type" | "evolution">,
  threshold: ThresholdModelResult,
  sliceContext: SliceRepetitionContext,
): ScoringProfile {
  const clarity = measureClarity(legacy);
  const impact = measureImpact(legacy, threshold);
  const frequency = measureFrequency(sliceContext);
  const reusability = measureReusability(legacy, repetition);
  const expansion = measureExpansion(repetition);

  return {
    clarity,
    impact,
    frequency,
    reusability,
    expansion,
    total: computeTotal(clarity, impact, frequency, reusability, expansion),
  };
}
