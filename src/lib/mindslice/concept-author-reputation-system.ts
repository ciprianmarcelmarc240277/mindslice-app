import type { AuthorValueProfile } from "@/lib/mindslice/concept-author-value-system";
import type { UserProfile } from "@/lib/mindslice/mindslice-types";

export type AuthorReputationRank =
  | "PSEUDONYM"
  | "TECHNOLOGIST"
  | "AUTHOR_ARTIST"
  | "ORCHESTRATOR"
  | "EXECUTIVE";

export type AuthorReputationHistoryEntry = {
  rank?: AuthorReputationRank | string | null;
  journal_score?: number;
  structure_score?: number;
  slice_score?: number;
  coordination_score?: number;
  decision_score?: number;
  total_value?: number;
  [key: string]: unknown;
};

export type CanonicalHistoryEntry = {
  canonical?: boolean;
  canon_status?: string;
  [key: string]: unknown;
};

export type AuthorIdentityFormat = {
  display_name: string | null;
  index_name: string | null;
  layout: "single_line" | "horizontal_index" | "vertical_index" | "executive_layout";
};

export type AuthorPermissions = {
  can_write_journal: boolean;
  can_create_slice: boolean;
  can_coordinate: boolean;
  can_decide: boolean;
  can_manage_business_logic?: boolean;
};

export type AuthorReputationScores = {
  score_total: number;
  journal_score: number;
  structure_score: number;
  slice_score: number;
  canon_score: number;
  coordination_score: number;
  decision_score: number;
};

export type AuthorPromotionEvent = {
  author_id: string;
  from_rank: AuthorReputationRank;
  to_rank: AuthorReputationRank;
  timestamp: string;
  event_type: "RANK_PROMOTION";
};

export type AuthorReputationResult = {
  author_id: string;
  current_rank: AuthorReputationRank;
  next_rank: AuthorReputationRank;
  scores: AuthorReputationScores;
  promoted: boolean;
  promotion_event: AuthorPromotionEvent | null;
  unlocked_identity: AuthorIdentityFormat;
  unlocked_permissions: AuthorPermissions;
};

const THRESHOLDS = {
  PSEUDONYM_TO_TECHNOLOGIST: {
    score_total: 20,
    journal_score: 10,
  },
  TECHNOLOGIST_TO_AUTHOR_ARTIST: {
    score_total: 45,
    journal_score: 20,
    structure_score: 15,
  },
  AUTHOR_ARTIST_TO_ORCHESTRATOR: {
    score_total: 80,
    slice_score: 20,
    canon_score: 2,
  },
  ORCHESTRATOR_TO_EXECUTIVE: {
    score_total: 120,
    coordination_score: 20,
    decision_score: 15,
  },
} as const;

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function firstLetter(text: string | null | undefined) {
  return text?.trim().charAt(0).toUpperCase() ?? "";
}

function shortenFirstName(name: string | null | undefined) {
  if (!name?.trim()) {
    return "";
  }

  return name.trim().split(/[\s-]+/u)[0] ?? name.trim();
}

function now() {
  return new Date().toISOString();
}

export function measureJournalActivity(authorHistory: AuthorReputationHistoryEntry[]) {
  const direct = authorHistory.map((entry) => toNumber(entry.journal_score)).filter((value) => value > 0);

  if (direct.length) {
    return average(direct);
  }

  return authorHistory.length * 2;
}

export function measureStructuralQuality(authorHistory: AuthorReputationHistoryEntry[]) {
  const direct = authorHistory.map((entry) => toNumber(entry.structure_score)).filter((value) => value > 0);

  if (direct.length) {
    return average(direct);
  }

  return authorHistory.filter((entry) => toNumber(entry.total_value) >= 30).length * 1.5;
}

export function measureSliceCreation(authorHistory: AuthorReputationHistoryEntry[]) {
  const direct = authorHistory.map((entry) => toNumber(entry.slice_score)).filter((value) => value > 0);

  if (direct.length) {
    return average(direct);
  }

  return authorHistory.length;
}

export function countCanonicalConcepts(canonicalHistory: CanonicalHistoryEntry[]) {
  return canonicalHistory.filter(
    (entry) => entry.canonical === true || entry.canon_status === "CANONICAL",
  ).length;
}

export function measureCoordination(authorHistory: AuthorReputationHistoryEntry[]) {
  const direct = authorHistory.map((entry) => toNumber(entry.coordination_score)).filter((value) => value > 0);

  if (direct.length) {
    return average(direct);
  }

  return authorHistory.filter((entry) => toNumber(entry.total_value) >= 60).length;
}

export function measureDecisionQuality(authorHistory: AuthorReputationHistoryEntry[]) {
  const direct = authorHistory.map((entry) => toNumber(entry.decision_score)).filter((value) => value > 0);

  if (direct.length) {
    return average(direct);
  }

  return authorHistory.filter((entry) => toNumber(entry.total_value) >= 75).length;
}

export function computeScores(
  authorHistory: AuthorReputationHistoryEntry[],
  authorValueProfile: AuthorValueProfile,
  canonicalHistory: CanonicalHistoryEntry[],
): AuthorReputationScores {
  return {
    score_total: authorValueProfile.total_value,
    journal_score: measureJournalActivity(authorHistory),
    structure_score: measureStructuralQuality(authorHistory),
    slice_score: measureSliceCreation(authorHistory),
    canon_score: countCanonicalConcepts(canonicalHistory),
    coordination_score: measureCoordination(authorHistory),
    decision_score: measureDecisionQuality(authorHistory),
  };
}

export function detectCurrentRank(authorHistory: AuthorReputationHistoryEntry[]): AuthorReputationRank {
  const explicitRank = authorHistory.find((entry) => typeof entry.rank === "string" && entry.rank.trim());

  if (
    explicitRank?.rank === "PSEUDONYM" ||
    explicitRank?.rank === "TECHNOLOGIST" ||
    explicitRank?.rank === "AUTHOR_ARTIST" ||
    explicitRank?.rank === "ORCHESTRATOR" ||
    explicitRank?.rank === "EXECUTIVE"
  ) {
    return explicitRank.rank;
  }

  return "PSEUDONYM";
}

export function canUnlockTechnologist(scores: AuthorReputationScores) {
  const rules = THRESHOLDS.PSEUDONYM_TO_TECHNOLOGIST;
  return scores.score_total >= rules.score_total && scores.journal_score >= rules.journal_score;
}

export function canUnlockAuthorArtist(scores: AuthorReputationScores) {
  const rules = THRESHOLDS.TECHNOLOGIST_TO_AUTHOR_ARTIST;
  return (
    scores.score_total >= rules.score_total &&
    scores.journal_score >= rules.journal_score &&
    scores.structure_score >= rules.structure_score
  );
}

export function canUnlockOrchestrator(scores: AuthorReputationScores) {
  const rules = THRESHOLDS.AUTHOR_ARTIST_TO_ORCHESTRATOR;
  return (
    scores.score_total >= rules.score_total &&
    scores.slice_score >= rules.slice_score &&
    scores.canon_score >= rules.canon_score
  );
}

export function canUnlockExecutive(scores: AuthorReputationScores) {
  const rules = THRESHOLDS.ORCHESTRATOR_TO_EXECUTIVE;
  return (
    scores.score_total >= rules.score_total &&
    scores.coordination_score >= rules.coordination_score &&
    scores.decision_score >= rules.decision_score
  );
}

export function determineNextRank(
  currentRank: AuthorReputationRank,
  scores: AuthorReputationScores,
): AuthorReputationRank {
  switch (currentRank) {
    case "PSEUDONYM":
      return canUnlockTechnologist(scores) ? "TECHNOLOGIST" : "PSEUDONYM";
    case "TECHNOLOGIST":
      return canUnlockAuthorArtist(scores) ? "AUTHOR_ARTIST" : "TECHNOLOGIST";
    case "AUTHOR_ARTIST":
      return canUnlockOrchestrator(scores) ? "ORCHESTRATOR" : "AUTHOR_ARTIST";
    case "ORCHESTRATOR":
      return canUnlockExecutive(scores) ? "EXECUTIVE" : "ORCHESTRATOR";
    case "EXECUTIVE":
      return "EXECUTIVE";
    default:
      return currentRank;
  }
}

export function resolveIdentityFormat(
  rank: AuthorReputationRank,
  identityData: UserProfile,
): AuthorIdentityFormat {
  const firstName = identityData.first_name?.trim() ?? "";
  const lastName = identityData.last_name?.trim() ?? "";
  const pseudonym = identityData.pseudonym?.trim() ?? null;
  const indexedName = identityData.indexed_name?.trim() ?? null;

  switch (rank) {
    case "PSEUDONYM":
      return {
        display_name: pseudonym,
        index_name: null,
        layout: "single_line",
      };
    case "TECHNOLOGIST":
      return {
        display_name: firstName ? `${firstName} ${firstLetter(lastName)}.` : pseudonym,
        index_name: firstName ? `${firstLetter(lastName)}., ${firstName}` : indexedName,
        layout: "horizontal_index",
      };
    case "AUTHOR_ARTIST":
      return {
        display_name: [firstName, lastName].filter(Boolean).join(" ") || indexedName || pseudonym,
        index_name: lastName && firstName ? `${lastName}, ${firstName}` : indexedName,
        layout: "horizontal_index",
      };
    case "ORCHESTRATOR":
      return {
        display_name:
          [shortenFirstName(firstName), firstLetter(lastName) ? `${firstLetter(lastName)}.` : "", lastName]
            .filter(Boolean)
            .join(" ") || indexedName || pseudonym,
        index_name: lastName && firstName ? `${lastName},\n${firstName}` : indexedName,
        layout: "vertical_index",
      };
    case "EXECUTIVE":
      return {
        display_name: [firstName, lastName].filter(Boolean).join(" ") || indexedName || pseudonym,
        index_name: lastName && firstName ? `${lastName},\n${firstName}` : indexedName,
        layout: "executive_layout",
      };
    default:
      return {
        display_name: pseudonym,
        index_name: null,
        layout: "single_line",
      };
  }
}

export function resolvePermissions(rank: AuthorReputationRank): AuthorPermissions {
  switch (rank) {
    case "PSEUDONYM":
    case "TECHNOLOGIST":
      return {
        can_write_journal: true,
        can_create_slice: false,
        can_coordinate: false,
        can_decide: false,
      };
    case "AUTHOR_ARTIST":
      return {
        can_write_journal: true,
        can_create_slice: true,
        can_coordinate: false,
        can_decide: false,
      };
    case "ORCHESTRATOR":
      return {
        can_write_journal: true,
        can_create_slice: true,
        can_coordinate: true,
        can_decide: true,
      };
    case "EXECUTIVE":
      return {
        can_write_journal: true,
        can_create_slice: true,
        can_coordinate: true,
        can_decide: true,
        can_manage_business_logic: true,
      };
    default:
      return {
        can_write_journal: true,
        can_create_slice: false,
        can_coordinate: false,
        can_decide: false,
      };
  }
}

export function detectPromotion(
  currentRank: AuthorReputationRank,
  nextRank: AuthorReputationRank,
) {
  return currentRank !== nextRank;
}

export function createPromotionEvent(
  authorId: string,
  currentRank: AuthorReputationRank,
  nextRank: AuthorReputationRank,
): AuthorPromotionEvent {
  return {
    author_id: authorId,
    from_rank: currentRank,
    to_rank: nextRank,
    timestamp: now(),
    event_type: "RANK_PROMOTION",
  };
}

export function runAuthorReputationSystemV1(
  authorId: string,
  authorHistory: AuthorReputationHistoryEntry[],
  authorValueProfile: AuthorValueProfile,
  canonicalHistory: CanonicalHistoryEntry[],
  identityData: UserProfile,
): AuthorReputationResult {
  const scores = computeScores(authorHistory, authorValueProfile, canonicalHistory);
  const currentRank = detectCurrentRank(authorHistory);
  const nextRank = determineNextRank(currentRank, scores);
  const unlockedIdentity = resolveIdentityFormat(nextRank, identityData);
  const unlockedPermissions = resolvePermissions(nextRank);
  const promoted = detectPromotion(currentRank, nextRank);
  const promotionEvent = promoted ? createPromotionEvent(authorId, currentRank, nextRank) : null;

  return {
    author_id: authorId,
    current_rank: currentRank,
    next_rank: nextRank,
    scores,
    promoted,
    promotion_event: promotionEvent,
    unlocked_identity: unlockedIdentity,
    unlocked_permissions: unlockedPermissions,
  };
}
