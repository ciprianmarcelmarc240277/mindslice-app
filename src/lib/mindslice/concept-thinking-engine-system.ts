import type {
  AuthorIdentityType,
  AuthorRole,
  ConceptCandidate,
  ConceptValidationResult,
  ThinkingEngineResult,
} from "@/lib/mindslice/mindslice-types";

type RunThinkingEngineInput = {
  candidate: ConceptCandidate;
  validation: ConceptValidationResult;
  authorRole?: AuthorRole | null;
  identityType?: AuthorIdentityType | null;
};

function clampAxis(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function buildThinkingThresholds(
  authorRole: AuthorRole,
  identityType: AuthorIdentityType,
): ThinkingEngineResult["thresholds"] {
  const roleRelief =
    authorRole === "active_author" ? 0.03 : authorRole === "author" ? 0.015 : 0;
  const identityRelief = identityType === "indexed" ? 0.01 : 0;
  const relief = roleRelief + identityRelief;

  return {
    structure: clampAxis(0.66 - relief),
    sense: clampAxis(0.68 - relief),
    attention: clampAxis(0.64 - roleRelief),
    coherence: clampAxis(0.67 - relief),
  };
}

export function runThinkingEngine({
  candidate,
  validation,
  authorRole,
  identityType,
}: RunThinkingEngineInput): ThinkingEngineResult {
  const resolvedAuthorRole = authorRole ?? "free";
  const resolvedIdentityType = identityType ?? "pseudonym";
  const structure = clampAxis(candidate.evaluationAxes.structure);
  const sense = clampAxis(candidate.evaluationAxes.sense);
  const attention = clampAxis(candidate.evaluationAxes.attention);
  const coherence = clampAxis(candidate.evaluationAxes.coherence);
  const thresholds = buildThinkingThresholds(resolvedAuthorRole, resolvedIdentityType);
  const state =
    structure >= thresholds.structure &&
    sense >= thresholds.sense &&
    attention >= thresholds.attention &&
    coherence >= thresholds.coherence
      ? "CONCEPT"
      : "IDEA";

  const notes = [
    `role ${resolvedAuthorRole} / identitate ${resolvedIdentityType}`,
    `axe thinking: structură ${structure.toFixed(2)} / sens ${sense.toFixed(2)} / atenție ${attention.toFixed(2)} / coerență ${coherence.toFixed(2)}`,
    `praguri thinking: structură ${thresholds.structure.toFixed(2)} / sens ${thresholds.sense.toFixed(2)} / atenție ${thresholds.attention.toFixed(2)} / coerență ${thresholds.coherence.toFixed(2)}`,
    `thinking state: ${state}`,
  ];

  if (validation.isValidConcept && state === "IDEA") {
    notes.push("validarea finală a ridicat un candidat încă ezitant la nivel de thinking engine.");
  }

  return {
    structure,
    sense,
    attention,
    coherence,
    thresholds,
    userRole: resolvedAuthorRole,
    identityType: resolvedIdentityType,
    state,
    notes,
  };
}
