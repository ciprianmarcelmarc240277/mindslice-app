import { evaluateConceptSystemEffect } from "@/lib/mindslice/concept-system-effect";
import type {
  ConceptCandidate,
  ConceptMemoryEntry,
  ConceptPromotionResult,
  ConceptState,
  ConceptValidationResult,
} from "@/lib/mindslice/mindslice-types";

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

export function promoteConceptCandidate(
  conceptCandidate: ConceptCandidate,
  conceptValidation: ConceptValidationResult,
  conceptMemory: ConceptMemoryEntry[],
): ConceptPromotionResult {
  const relatedConceptCount = countRelatedConcepts(
    conceptMemory,
    conceptCandidate.conceptStateDraft,
  );
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
    conceptValidation.scores.contaminationResolution >= 0.78 &&
    conceptValidation.scores.authorDilemmaResolution >= 0.82 &&
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
      ? "canonical promotion: conceptul este suficient de stabil pentru memoria activă"
      : "canonical promotion: conceptul nu are încă destulă persistență și greutate istorică",
    `related concepts from same source idea: ${relatedConceptCount}`,
  ];

  return {
    passesSystemLaw,
    canPromoteToResolved,
    canPromoteToCanonical,
    systemEffect,
    promotedConcept,
    notes,
  };
}
