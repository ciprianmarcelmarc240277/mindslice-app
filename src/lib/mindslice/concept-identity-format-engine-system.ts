import type { UserProfile } from "@/lib/mindslice/mindslice-types";
import type { AuthorReputationRank } from "@/lib/mindslice/concept-author-reputation-system";

export type IdentityFormatLayout =
  | "single_line"
  | "horizontal_index"
  | "vertical_index"
  | "executive_layout";

export type IdentityFormatPrestige = "low" | "medium" | "high" | "elite" | "strategic";

export type IdentityFormatPreferences = {
  executive_name?: string | null;
  executive_index?: string | null;
  middle_name?: string | null;
  middle_or_last_initial?: string | null;
};

export type IdentityFormatMeta = {
  tier: AuthorReputationRank;
  visual_weight: 1 | 2 | 3 | 4 | 5;
  prestige_level: IdentityFormatPrestige;
};

export type IdentityFormatOutput =
  | {
      display_name: string | null;
      index_name: string | null;
      layout: IdentityFormatLayout;
      meta: IdentityFormatMeta;
    }
  | {
      status: "fail";
      message: string;
    };

type IdentityData = Pick<
  UserProfile,
  "pseudonym" | "first_name" | "last_name" | "indexed_name"
> &
  IdentityFormatPreferences;

function fail(message: string): IdentityFormatOutput {
  return {
    status: "fail",
    message,
  };
}

function firstLetter(text: string | null | undefined) {
  return text?.trim().charAt(0).toUpperCase() ?? "";
}

function shortenName(name: string | null | undefined) {
  if (!name?.trim()) {
    return "";
  }

  return name.trim().split(/[\s-]+/u)[0] ?? name.trim();
}

export function validateIdentity(identityData: IdentityData | null | undefined) {
  if (!identityData) {
    return fail("NO_IDENTITY");
  }

  if (!identityData.first_name && !identityData.pseudonym) {
    return fail("INVALID_IDENTITY");
  }

  return { status: "pass" as const };
}

export function buildPseudonym(identityData: IdentityData) {
  return identityData.pseudonym ?? null;
}

export function buildTechnologist(identityData: IdentityData) {
  const first = identityData.first_name?.trim() ?? "";
  const lastInitial = firstLetter(identityData.last_name);
  const display = first ? `${first} ${lastInitial}.` : identityData.pseudonym ?? null;
  const index = first ? `${lastInitial}., ${first}` : identityData.indexed_name ?? null;

  return {
    display,
    index,
  };
}

export function buildAuthorArtist(identityData: IdentityData) {
  const first = identityData.first_name?.trim() ?? "";
  const last = identityData.last_name?.trim() ?? "";
  const display = [first, last].filter(Boolean).join(" ") || (identityData.pseudonym ?? null);
  const index = last && first ? `${last}, ${first}` : (identityData.indexed_name ?? null);

  return {
    display,
    index,
  };
}

export function buildOrchestrator(identityData: IdentityData) {
  const first = identityData.first_name?.trim() ?? "";
  const last = identityData.last_name?.trim() ?? "";
  const shortFirst = shortenName(first);
  const initial = firstLetter(identityData.middle_name ?? identityData.middle_or_last_initial ?? last);
  const display =
    [shortFirst, initial ? `${initial}.` : "", last].filter(Boolean).join(" ") || (identityData.indexed_name ?? null);
  const index = last && first ? `${last},\n${first}` : (identityData.indexed_name ?? null);

  return {
    display,
    index,
  };
}

export function buildExecutive(identityData: IdentityData) {
  const first = identityData.first_name?.trim() ?? "";
  const last = identityData.last_name?.trim() ?? "";
  const display =
    identityData.executive_name?.trim() ||
    [first, last].filter(Boolean).join(" ") ||
    (identityData.pseudonym ?? null);
  const index =
    identityData.executive_index?.trim() ||
    (last && first ? `${last},\n${first}` : identityData.indexed_name ?? null);

  return {
    display,
    index,
  };
}

export function resolveLayout(rank: AuthorReputationRank): IdentityFormatLayout {
  switch (rank) {
    case "PSEUDONYM":
      return "single_line";
    case "TECHNOLOGIST":
    case "AUTHOR_ARTIST":
      return "horizontal_index";
    case "ORCHESTRATOR":
      return "vertical_index";
    case "EXECUTIVE":
      return "executive_layout";
    default:
      return "single_line";
  }
}

export function resolveIdentity(rank: AuthorReputationRank, identityData: IdentityData) {
  switch (rank) {
    case "PSEUDONYM":
      return {
        display_name: buildPseudonym(identityData),
        index_name: null,
      };
    case "TECHNOLOGIST": {
      const result = buildTechnologist(identityData);
      return {
        display_name: result.display,
        index_name: result.index,
      };
    }
    case "AUTHOR_ARTIST": {
      const result = buildAuthorArtist(identityData);
      return {
        display_name: result.display,
        index_name: result.index,
      };
    }
    case "ORCHESTRATOR": {
      const result = buildOrchestrator(identityData);
      return {
        display_name: result.display,
        index_name: result.index,
      };
    }
    case "EXECUTIVE": {
      const result = buildExecutive(identityData);
      return {
        display_name: result.display,
        index_name: result.index,
      };
    }
    default:
      return {
        display_name: buildPseudonym(identityData),
        index_name: null,
      };
  }
}

export function computeVisualWeight(rank: AuthorReputationRank): 1 | 2 | 3 | 4 | 5 {
  switch (rank) {
    case "PSEUDONYM":
      return 1;
    case "TECHNOLOGIST":
      return 2;
    case "AUTHOR_ARTIST":
      return 3;
    case "ORCHESTRATOR":
      return 4;
    case "EXECUTIVE":
      return 5;
    default:
      return 1;
  }
}

export function computePrestige(rank: AuthorReputationRank): IdentityFormatPrestige {
  switch (rank) {
    case "PSEUDONYM":
      return "low";
    case "TECHNOLOGIST":
      return "medium";
    case "AUTHOR_ARTIST":
      return "high";
    case "ORCHESTRATOR":
      return "elite";
    case "EXECUTIVE":
      return "strategic";
    default:
      return "low";
  }
}

export function generateMeta(rank: AuthorReputationRank): IdentityFormatMeta {
  return {
    tier: rank,
    visual_weight: computeVisualWeight(rank),
    prestige_level: computePrestige(rank),
  };
}

export function runIdentityFormatEngineV1(
  rank: AuthorReputationRank,
  identityData: IdentityData,
  formatPreferences?: IdentityFormatPreferences | null,
): IdentityFormatOutput {
  const validation = validateIdentity(identityData);

  if ("status" in validation && validation.status === "fail") {
    return fail("INVALID_INPUT");
  }

  const mergedIdentity: IdentityData = {
    ...identityData,
    ...(formatPreferences ?? {}),
  };
  const identity = resolveIdentity(rank, mergedIdentity);
  const layout = resolveLayout(rank);
  const meta = generateMeta(rank);

  return {
    display_name: identity.display_name,
    index_name: identity.index_name,
    layout,
    meta,
  };
}
