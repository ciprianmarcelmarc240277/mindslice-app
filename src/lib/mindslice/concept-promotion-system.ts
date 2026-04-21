import { evaluateConceptSystemEffect } from "@/lib/mindslice/concept-system-effect";
import type {
  ConceptCandidate,
  ConceptMemoryEntry,
  ConceptPromotionResult,
  ConceptState,
  ConceptValidationResult,
} from "@/lib/mindslice/mindslice-types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function countRelatedConcepts(
  conceptMemory: ConceptMemoryEntry[],
  concept: ConceptState,
) {
  return conceptMemory.filter(
    (entry) =>
      entry.concept.provenance.sourceIdeaId === concept.provenance.sourceIdeaId &&
      entry.concept.id !== concept.id,
  ).length;
}

function evaluateSubcanonSupport(
  conceptCandidate: ConceptCandidate,
  conceptValidation: ConceptValidationResult,
) {
  const supportBreakdown = {
    narrative: clamp(
      (conceptCandidate.canonInfluence.activeWeights.narrative * 0.28) +
        (conceptCandidate.canonInfluence.normalizedWeights.narrative * 0.14) +
        (conceptValidation.scores.conflict * 0.12) +
        (conceptValidation.scores.tension * 0.14) +
        (conceptValidation.scores.progression * 0.16) +
        (conceptValidation.scores.narrativeAttention * 0.18),
      0,
      1,
    ),
    art: clamp(
      (conceptCandidate.canonInfluence.activeWeights.art * 0.28) +
        (conceptCandidate.canonInfluence.normalizedWeights.art * 0.14) +
        (conceptValidation.scores.focus * 0.18) +
        (conceptValidation.scores.movement * 0.16) +
        (conceptValidation.scores.balance * 0.12) +
        (conceptValidation.scores.crossCanonCoherence * 0.14),
      0,
      1,
    ),
    structure: clamp(
      (conceptCandidate.canonInfluence.activeWeights.structure * 0.28) +
        (conceptCandidate.canonInfluence.normalizedWeights.structure * 0.14) +
        (conceptValidation.scores.structuralAttention * 0.18) +
        (conceptValidation.scores.centerStructure * 0.14) +
        (conceptValidation.scores.symmetryStructure * 0.12) +
        (conceptValidation.scores.crossCanonCoherence * 0.16),
      0,
      1,
    ),
    color: clamp(
      (conceptCandidate.canonInfluence.activeWeights.color * 0.28) +
        (conceptCandidate.canonInfluence.normalizedWeights.color * 0.14) +
        (conceptValidation.scores.attentionImpact * 0.18) +
        (conceptValidation.scores.colorRelations * 0.16) +
        (conceptValidation.scores.valueBalance * 0.12) +
        (conceptValidation.scores.crossCanonCoherence * 0.14),
      0,
      1,
    ),
  };

  const supportedBySubcanons = (Object.entries(supportBreakdown) as Array<
    [keyof typeof supportBreakdown, number]
  >)
    .filter(([, score]) => score >= 0.68)
    .map(([key]) => key);

  const activeSubcanonCount = [
    conceptCandidate.canonInfluence.narrative,
    conceptCandidate.canonInfluence.art,
    conceptCandidate.canonInfluence.structure,
    conceptCandidate.canonInfluence.color,
  ].filter(Boolean).length;

  const subCanonSupportScore = clamp(
    supportBreakdown.narrative * 0.26 +
      supportBreakdown.art * 0.24 +
      supportBreakdown.structure * 0.24 +
      supportBreakdown.color * 0.26,
    0,
    1,
  );

  return {
    supportBreakdown,
    supportedBySubcanons,
    activeSubcanonCount,
    subCanonSupportScore,
  };
}

export function promoteConceptCandidate(
  conceptCandidate: ConceptCandidate,
  conceptValidation: ConceptValidationResult,
  conceptMemory: ConceptMemoryEntry[],
): ConceptPromotionResult {
  const relatedConceptCount = countRelatedConcepts(
    conceptMemory,
    conceptCandidate.conceptStateDraft,
  );
  const {
    supportBreakdown,
    supportedBySubcanons,
    activeSubcanonCount,
    subCanonSupportScore,
  } = evaluateSubcanonSupport(conceptCandidate, conceptValidation);
  const systemEffect = evaluateConceptSystemEffect({
    concept: conceptCandidate.conceptStateDraft,
    validation: conceptValidation,
    relatedConceptCount,
  });

  const passesSystemLaw = systemEffect.modifiesSystem;
  const canPromoteToResolved = conceptValidation.isValidConcept && passesSystemLaw;
  const canPromoteToCanonical =
    canPromoteToResolved &&
    conceptValidation.scores.semanticStability >= 0.84 &&
    conceptValidation.scores.visualConsistency >= 0.8 &&
    conceptValidation.scores.crossModalAlignment >= 0.82 &&
    conceptValidation.scores.crossCanonCoherence >= 0.76 &&
    conceptValidation.scores.contaminationResolution >= 0.78 &&
    conceptValidation.scores.authorDilemmaResolution >= 0.82 &&
    subCanonSupportScore >= 0.72 &&
    supportedBySubcanons.length >= 2 &&
    conceptCandidate.conceptStateDraft.validation.persistenceAcrossCycles >= 0.7 &&
    (relatedConceptCount >= 1 || conceptMemory.some((entry) => entry.validation.isValidConcept));

  const stage = canPromoteToCanonical
    ? "canonical"
    : canPromoteToResolved
      ? "resolved"
      : conceptCandidate.conceptStateDraft.stage;

  const promotedAt = canPromoteToResolved
    ? conceptCandidate.conceptStateDraft.promotedAt ?? new Date().toISOString()
    : null;

  const promotedConcept: ConceptState = {
    ...conceptCandidate.conceptStateDraft,
    systemEffect: passesSystemLaw ? systemEffect : null,
    stage,
    resolutionStatus: canPromoteToResolved
      ? "resolved"
      : conceptValidation.resolutionStatus,
    promotedAt,
    lastUpdatedAt: new Date().toISOString(),
  };

  const notes = [
    canPromoteToResolved
      ? "resolved promotion: pragurile minime pentru concept valid au fost depășite"
      : "resolved promotion: conceptul nu depășește încă pragurile minime",
    passesSystemLaw
      ? "system law: conceptul modifică sistemul și poate intra în memorie"
      : "system law: conceptul este respins pentru că nu modifică sistemul",
    canPromoteToCanonical
      ? "canonical promotion: conceptul este suficient de stabil și suficient de susținut de sub-canoane"
      : "canonical promotion: conceptul nu are încă destulă persistență, convergență sau sprijin din sub-canoane",
    `related concepts from same source idea: ${relatedConceptCount}`,
    `sub-canon support score: ${subCanonSupportScore.toFixed(2)}`,
    `active sub-canons: ${activeSubcanonCount}`,
    `support breakdown -> narrative ${supportBreakdown.narrative.toFixed(2)} / art ${supportBreakdown.art.toFixed(2)} / structure ${supportBreakdown.structure.toFixed(2)} / color ${supportBreakdown.color.toFixed(2)}`,
    supportedBySubcanons.length
      ? `supported by sub-canons: ${supportedBySubcanons.join(", ")}`
      : "supported by sub-canons: none",
  ];

  return {
    passesSystemLaw,
    canPromoteToResolved,
    canPromoteToCanonical,
    subCanonSupportScore,
    activeSubcanonCount,
    supportedBySubcanons,
    systemEffect,
    promotedConcept,
    notes,
  };
}
