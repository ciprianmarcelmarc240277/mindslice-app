import type { CanonEngineResult } from "@/lib/mindslice/concept-canon-engine-system";

export type AuthorValueConcept = {
  id?: string;
  concept_id?: string;
  score?: {
    total?: number;
  };
  confidence?: {
    overall?: number;
  };
  [key: string]: unknown;
};

export type AuthorValueScoreProfile = {
  total?: number;
  impact?: number;
  reusability?: number;
  expansion?: number;
};

export type AuthorHistoricalDataPoint = {
  rank?: string;
  total?: number;
  score?: number;
  average_score?: number;
  canonical?: boolean;
  canon_status?: string;
  journal_score?: number;
  structure_score?: number;
  slice_score?: number;
  coordination_score?: number;
  decision_score?: number;
  reuse_by_others?: number;
  reused_by_others?: number;
  influence?: number;
  created_at?: string;
  timestamp?: string;
  score_over_time?: number[];
  [key: string]: unknown;
};

export type AuthorValueProfile = {
  author_id: string;
  contribution: number;
  consistency: number;
  canon: number;
  influence: number;
  growth: number;
  total_value: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function contributionFromConcept(concept: AuthorValueConcept | null | undefined) {
  if (!concept) {
    return null;
  }

  return (
    toNumber(concept.score?.total) ??
    toNumber(concept.confidence?.overall) ??
    null
  );
}

function contributionFromScoreProfile(scoreProfile: AuthorValueScoreProfile | null | undefined) {
  if (!scoreProfile) {
    return null;
  }

  return toNumber(scoreProfile.total);
}

function averageScore(authorHistory: AuthorHistoricalDataPoint[]) {
  const values = authorHistory
    .map((entry) => toNumber(entry.total) ?? toNumber(entry.score) ?? toNumber(entry.average_score))
    .filter((value): value is number => typeof value === "number");

  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countCanonical(authorHistory: AuthorHistoricalDataPoint[]) {
  return authorHistory.filter(
    (entry) => entry.canonical === true || entry.canon_status === "CANONICAL",
  ).length;
}

function countReuseByOthers(authorHistory: AuthorHistoricalDataPoint[]) {
  return authorHistory.reduce((sum, entry) => {
    return (
      sum +
      (toNumber(entry.reuse_by_others) ??
        toNumber(entry.reused_by_others) ??
        toNumber(entry.influence) ??
        0)
    );
  }, 0);
}

function extractScoreTimeline(authorHistory: AuthorHistoricalDataPoint[]) {
  const embeddedTimeline = authorHistory.flatMap((entry) =>
    Array.isArray(entry.score_over_time)
      ? entry.score_over_time.filter((value): value is number => typeof value === "number")
      : [],
  );

  if (embeddedTimeline.length >= 2) {
    return embeddedTimeline;
  }

  return authorHistory
    .map((entry) => toNumber(entry.total) ?? toNumber(entry.score) ?? toNumber(entry.average_score))
    .filter((value): value is number => typeof value === "number");
}

function trend(scoreOverTime: number[]) {
  if (scoreOverTime.length < 2) {
    return 0;
  }

  const first = scoreOverTime[0];
  const last = scoreOverTime[scoreOverTime.length - 1];
  return last - first;
}

export function measureContribution(
  concept: AuthorValueConcept | null | undefined,
  scoreProfile?: AuthorValueScoreProfile | null,
) {
  return clamp(
    contributionFromScoreProfile(scoreProfile) ?? contributionFromConcept(concept) ?? 0,
    0,
    100,
  );
}

export function measureConsistency(authorHistory: AuthorHistoricalDataPoint[]) {
  return clamp(averageScore(authorHistory), 0, 100);
}

export function measureCanon(
  authorHistory: AuthorHistoricalDataPoint[],
  canonResult?: CanonEngineResult | null,
) {
  const historicalCanon = countCanonical(authorHistory) * 2;
  const liveCanonBoost =
    canonResult && !("status" in canonResult)
      ? canonResult.canon_status === "CANONICAL"
        ? 2
        : canonResult.canon_status === "PRE_CANON"
          ? 1
          : 0
      : 0;

  return clamp(historicalCanon + liveCanonBoost, 0, 100);
}

export function measureInfluence(authorHistory: AuthorHistoricalDataPoint[]) {
  return clamp(countReuseByOthers(authorHistory), 0, 100);
}

export function measureGrowth(authorHistory: AuthorHistoricalDataPoint[]) {
  const growth = trend(extractScoreTimeline(authorHistory));
  return clamp(growth, -100, 100);
}

export function computeAuthorValue(profile: Omit<AuthorValueProfile, "author_id" | "total_value">) {
  return profile.contribution + profile.consistency + profile.canon + profile.influence + profile.growth;
}

export function runAuthorValueSystemV1(
  authorId: string,
  concept: AuthorValueConcept | null,
  scoreProfile: AuthorValueScoreProfile,
  canonResult: CanonEngineResult | null,
  historicalAuthorData: AuthorHistoricalDataPoint[] = [],
): AuthorValueProfile {
  const contribution_score = measureContribution(concept, scoreProfile);
  const consistency_score = measureConsistency(historicalAuthorData);
  const canon_score = measureCanon(historicalAuthorData, canonResult);
  const influence_score = measureInfluence(historicalAuthorData);
  const growth_score = measureGrowth(historicalAuthorData);

  const profileBase = {
    contribution: contribution_score,
    consistency: consistency_score,
    canon: canon_score,
    influence: influence_score,
    growth: growth_score,
  };

  return {
    author_id: authorId,
    ...profileBase,
    total_value: computeAuthorValue(profileBase),
  };
}
