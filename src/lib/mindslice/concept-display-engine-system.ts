import type { ConceptState, UserProfile } from "@/lib/mindslice/mindslice-types";

export type DisplayIdentityContext = {
  author_id: string | null;
  role: string;
  identity_type: UserProfile["identity_type"] | "none";
  pseudonym: string | null;
  indexed_name: string | null;
};

export type MasterDisplayConcept = {
  concept_id: string;
  created_at: string;
  conceptState: ConceptState;
};

export type DisplayOutput = {
  identity: {
    author_id: string | null;
    display_name: string | null;
    role: string;
    identity_type: UserProfile["identity_type"] | "none";
  };
  concept: MasterDisplayConcept;
  timestamp: string;
};

export function resolvePublicIdentity(identityContext: DisplayIdentityContext) {
  return {
    author_id: identityContext.author_id,
    display_name:
      identityContext.identity_type === "indexed"
        ? identityContext.indexed_name
        : identityContext.pseudonym,
    role: identityContext.role,
    identity_type: identityContext.identity_type,
  };
}

export function buildDisplayOutput(
  identityContext: DisplayIdentityContext,
  concept: MasterDisplayConcept,
): DisplayOutput {
  return {
    identity: resolvePublicIdentity(identityContext),
    concept,
    timestamp: concept.created_at,
  };
}
