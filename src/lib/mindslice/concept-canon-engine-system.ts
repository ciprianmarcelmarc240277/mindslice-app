import type { ThresholdModelResult } from "@/lib/mindslice/concept-threshold-model-system";

export type CanonStatus = "CANONICAL" | "PRE_CANON" | "NON_CANON";
export type CanonAction = "ADDED_TO_CANON" | "MARKED_PRE_CANON" | "REJECTED_FROM_CANON";
export type CanonLevel = "LOW" | "MEDIUM" | "HIGH";

export type CanonConcept = {
  concept_id?: string;
  conceptId?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  patterns?: string[];
  [key: string]: unknown;
};

export type CanonScoreProfile = {
  impact?: number;
  reusability?: number;
  expansion?: number;
  total?: number;
};

export type CanonHistoricalMemory = {
  concept_id?: string;
  conceptId?: string;
  canonical?: boolean;
  reuse?: number;
  reuse_count?: number;
  stability?: number;
  stability_score?: number;
  impact?: number;
  impact_score?: number;
  keywords?: string[];
  patterns?: string[];
  subject?: string;
  title?: string;
};

export type CanonEffect = {
  weight_boost: CanonLevel;
  reuse_priority: CanonLevel;
  memory_persistence: CanonLevel;
};

export type CanonEngineFailure = {
  status: "fail";
  message: string;
};

export type CanonEngineResult =
  | {
      concept_id: string;
      canon_status: CanonStatus;
      reuse_score: number;
      impact_score: number;
      stability_score: number;
      recurrence_score: number;
      action: CanonAction;
      effect: CanonEffect;
    }
  | CanonEngineFailure;

const TAU_REUSE = 3;
const TAU_IMPACT = 0.7;
const TAU_STABILITY = 0.75;
const TAU_RECURRENCE = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fail(message: string): CanonEngineFailure {
  return {
    status: "fail",
    message,
  };
}

function conceptId(concept: CanonConcept) {
  return concept.concept_id ?? concept.conceptId ?? "anonymous_concept";
}

function normalize(value: number, min: number, max: number) {
  if (value < min) {
    return 0;
  }
  if (value > max) {
    return 1;
  }

  return (value - min) / (max - min);
}

function tokenize(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(tokenize);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .toLowerCase()
    .replace(/[^a-zăâîșț0-9 -]+/giu, " ")
    .split(/[\s-]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 3);
}

function conceptTerms(concept: CanonConcept) {
  return new Set([
    ...tokenize(concept.title),
    ...tokenize(concept.subject),
    ...tokenize(concept.keywords),
    ...tokenize(concept.patterns),
  ]);
}

function memoryTerms(memory: CanonHistoricalMemory) {
  return new Set([
    ...tokenize(memory.title),
    ...tokenize(memory.subject),
    ...tokenize(memory.keywords),
    ...tokenize(memory.patterns),
  ]);
}

function overlapScore(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) {
    return 0;
  }

  const overlap = [...left].filter((term) => right.has(term)).length;
  return overlap / Math.max(left.size, right.size);
}

export function checkPreconditions(
  concept: CanonConcept | null,
  scoreProfile: CanonScoreProfile,
  thresholdState: ThresholdModelResult,
) {
  if (!concept) {
    return fail("NO_CONCEPT");
  }

  const classification = thresholdState.threshold_state.classification;
  if (classification !== "CONCEPT" && classification !== "CANONICAL_CANDIDATE") {
    return fail("NOT_ELIGIBLE");
  }

  if (typeof scoreProfile.total !== "number") {
    return fail("NO_SCORE");
  }

  return { status: "pass" as const };
}

export function measureCanonReuse(concept: CanonConcept, historicalMemory: CanonHistoricalMemory[]) {
  const terms = conceptTerms(concept);

  return historicalMemory.filter((entry) => {
    if (entry.concept_id === conceptId(concept) || entry.conceptId === conceptId(concept)) {
      return true;
    }

    return overlapScore(terms, memoryTerms(entry)) >= 0.28;
  }).length;
}

export function measureCanonImpact(_concept: CanonConcept, scoreProfile: CanonScoreProfile) {
  return normalize(
    (scoreProfile.impact ?? 0) + (scoreProfile.reusability ?? 0) + (scoreProfile.expansion ?? 0),
    0,
    3,
  );
}

export function measureCanonStability(concept: CanonConcept, historicalMemory: CanonHistoricalMemory[]) {
  const terms = conceptTerms(concept);
  const related = historicalMemory.filter((entry) => overlapScore(terms, memoryTerms(entry)) >= 0.22);

  if (!related.length) {
    return 0;
  }

  const total = related.reduce((sum, entry) => {
    const stability = entry.stability ?? entry.stability_score ?? 0;
    return sum + (stability > 1 ? stability / 10 : stability);
  }, 0);

  return clamp(total / related.length, 0, 1);
}

export function measureCanonRecurrence(concept: CanonConcept, historicalMemory: CanonHistoricalMemory[]) {
  const terms = conceptTerms(concept);

  return historicalMemory.filter((entry) => overlapScore(terms, memoryTerms(entry)) >= 0.18).length;
}

export function classifyCanon(
  reuseScore: number,
  impactScore: number,
  stabilityScore: number,
  recurrenceScore: number,
): CanonStatus {
  if (
    reuseScore >= TAU_REUSE &&
    impactScore >= TAU_IMPACT &&
    stabilityScore >= TAU_STABILITY &&
    recurrenceScore >= TAU_RECURRENCE
  ) {
    return "CANONICAL";
  }

  if (reuseScore >= 1 && impactScore >= 0.55 && stabilityScore >= 0.6) {
    return "PRE_CANON";
  }

  return "NON_CANON";
}

export function applyCanonAction(
  concept: CanonConcept,
  canonStatus: CanonStatus,
  systemCanon: CanonConcept[],
): CanonAction {
  if (canonStatus === "CANONICAL") {
    systemCanon.push({
      ...concept,
      canon_status: "canonical",
    });
    return "ADDED_TO_CANON";
  }

  if (canonStatus === "PRE_CANON") {
    return "MARKED_PRE_CANON";
  }

  return "REJECTED_FROM_CANON";
}

export function generateCanonEffect(_concept: CanonConcept, canonStatus: CanonStatus): CanonEffect {
  if (canonStatus === "CANONICAL") {
    return {
      weight_boost: "HIGH",
      reuse_priority: "HIGH",
      memory_persistence: "HIGH",
    };
  }

  if (canonStatus === "PRE_CANON") {
    return {
      weight_boost: "MEDIUM",
      reuse_priority: "MEDIUM",
      memory_persistence: "MEDIUM",
    };
  }

  return {
    weight_boost: "LOW",
    reuse_priority: "LOW",
    memory_persistence: "LOW",
  };
}

export function runCanonEngineV1(
  concept: CanonConcept | null,
  scoreProfile: CanonScoreProfile,
  thresholdState: ThresholdModelResult,
  historicalMemory: CanonHistoricalMemory[] = [],
  systemCanon: CanonConcept[] = [],
): CanonEngineResult {
  const precheck = checkPreconditions(concept, scoreProfile, thresholdState);

  if ("status" in precheck && precheck.status === "fail") {
    return fail("CANON_PRECHECK_FAILED");
  }

  const safeConcept = concept as CanonConcept;
  const reuseScore = measureCanonReuse(safeConcept, historicalMemory);
  const impactScore = measureCanonImpact(safeConcept, scoreProfile);
  const stabilityScore = measureCanonStability(safeConcept, historicalMemory);
  const recurrenceScore = measureCanonRecurrence(safeConcept, historicalMemory);
  const canonStatus = classifyCanon(reuseScore, impactScore, stabilityScore, recurrenceScore);
  const actionResult = applyCanonAction(safeConcept, canonStatus, systemCanon);
  const canonEffect = generateCanonEffect(safeConcept, canonStatus);

  return {
    concept_id: conceptId(safeConcept),
    canon_status: canonStatus,
    reuse_score: reuseScore,
    impact_score: impactScore,
    stability_score: stabilityScore,
    recurrence_score: recurrenceScore,
    action: actionResult,
    effect: canonEffect,
  };
}
