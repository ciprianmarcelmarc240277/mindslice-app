import type {
  ConceptValidationResult,
  ThoughtIterationResult,
} from "@/lib/mindslice/mindslice-types";

type BuildThoughtIterationInput = {
  validation: ConceptValidationResult;
  thought: string;
};

function weakestAxis(validation: ConceptValidationResult) {
  const pairs = [
    ["structure", validation.thresholds.structure - validation.axes.structure],
    ["sense", validation.thresholds.sense - validation.axes.sense],
    ["attention", validation.thresholds.attention - validation.axes.attention],
    ["coherence", validation.thresholds.coherence - validation.axes.coherence],
  ] as const;

  return [...pairs].sort((left, right) => right[1] - left[1])[0];
}

export function buildThoughtIteration(
  input: BuildThoughtIterationInput,
): ThoughtIterationResult {
  const { validation, thought } = input;

  if (validation.isValidConcept) {
    return {
      shouldIterate: false,
      nextIterationWeight: 0,
      iterationFocus: "hold",
      preview: thought,
      notes: ["concept already satisfies thresholds, iteration is no longer required"],
    };
  }

  const [iterationFocus, gap] = weakestAxis(validation);
  const nextIterationWeight = Math.max(0, Math.min(1, gap));

  return {
    shouldIterate: true,
    nextIterationWeight,
    iterationFocus,
    preview: `${thought} [iterate toward ${iterationFocus}]`,
    notes: [
      `iteration focus: ${iterationFocus}`,
      `iteration weight: ${nextIterationWeight.toFixed(2)}`,
    ],
  };
}
