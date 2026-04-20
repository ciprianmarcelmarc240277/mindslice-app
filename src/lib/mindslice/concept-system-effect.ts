import { buildSystemModificationState } from "@/lib/mindslice/system-state-update";
import type {
  ConceptState,
  ConceptValidationResult,
  SystemModificationState,
} from "@/lib/mindslice/mindslice-types";

type EvaluateConceptSystemEffectInput = {
  concept: ConceptState;
  validation: ConceptValidationResult;
  relatedConceptCount?: number;
};
export function evaluateConceptSystemEffect(
  input: EvaluateConceptSystemEffectInput,
): SystemModificationState {
  const { concept, validation, relatedConceptCount = 0 } = input;
  return buildSystemModificationState({
    concept,
    validation,
    relatedConceptCount,
  });
}
