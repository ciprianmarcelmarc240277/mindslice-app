"use client";

import type {
  CompositionStructureState,
  ShapeGrammarRuntime,
  ShapeGrammarScores,
  ShapeGrammarState,
  ShapeGrammarThresholds,
  ShapeTheoryState,
} from "@/lib/mindslice/mindslice-types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: Array<string | null | undefined>) {
  return values.filter((value, index, array): value is string => {
    if (!value?.trim()) {
      return false;
    }

    return array.findIndex((candidate) => candidate?.trim() === value.trim()) === index;
  });
}

function defaultThresholds(): ShapeGrammarThresholds {
  return {
    coherence: 0.68,
    transformation: 0.64,
    relation: 0.66,
    expressivePower: 0.7,
  };
}

function normalizePrimitiveShape(shape: string): "POINT" | "LINE" | "PLANE" | "VOLUME" {
  const normalized = shape.toUpperCase();

  if (normalized === "POINT" || normalized === "LINE" || normalized === "PLANE" || normalized === "VOLUME") {
    return normalized;
  }

  return "VOLUME" as const;
}

export function applyPrimitiveShapeRules(shapeStructure: {
  type: string;
}) {
  const current = normalizePrimitiveShape(shapeStructure.type);

  if (current === "POINT") {
    return "LINE" as const;
  }

  if (current === "LINE") {
    return "PLANE" as const;
  }

  if (current === "PLANE") {
    return "VOLUME" as const;
  }

  return "VOLUME" as const;
}

export function generatePrimitiveForm(shapeStructure: {
  type: string;
  complexity?: number;
  orientation?: string;
}) {
  const base = normalizePrimitiveShape(shapeStructure.type);
  const evolved: "POINT" | "LINE" | "PLANE" | "VOLUME" = applyPrimitiveShapeRules({ type: base });

  return {
    base: {
      type: base,
      complexity: shapeStructure.complexity ?? 0,
      orientation: shapeStructure.orientation ?? "undirected",
    },
    evolved,
  };
}

function buildRuleset(shape: ShapeTheoryState, structure: CompositionStructureState) {
  return unique([
    shape.behavior === "expanding" ? "scale" : "subtract",
    shape.positionTendency === "edge" ? "translate" : "rotate",
    shape.type === "geometric" ? "mirror" : "distort",
    shape.type === "fragment" ? "fragment" : "repeat",
    structure.symmetryState.includes("symmetry") ? "mirror" : "split",
    structure.centerState === "decentered_tension" ? "translate" : "merge",
  ]).slice(0, 6);
}

function buildConstraints(shape: ShapeTheoryState, structure: CompositionStructureState) {
  return unique([
    `identity:${shape.type}`,
    `behavior:${shape.behavior}`,
    `position:${shape.positionTendency}`,
    `grid:${structure.grid}`,
    `center:${structure.centerState}`,
    `edge:${shape.edges[0] ?? "edge:unset"}`,
  ]);
}

function scoreRulePriority(input: {
  rule: string;
  ruleset: string[];
  currentShape: string;
  constraints: string[];
  iterationIndex: number;
}) {
  const { rule, ruleset, currentShape, constraints, iterationIndex } = input;
  let score = 0.24;

  if ((ruleset[iterationIndex % Math.max(ruleset.length, 1)] ?? null) === rule) {
    score += 0.22;
  }

  if (currentShape.includes("fragment") && rule === "merge") {
    score += 0.26;
  }

  if (currentShape.includes("mirror") && rule === "repeat") {
    score += 0.14;
  }

  if (currentShape.includes("drift") && rule === "translate") {
    score += 0.2;
  }

  if (currentShape.includes("scale") && rule === "subtract") {
    score += 0.12;
  }

  if (currentShape.includes("merge") && rule === "split") {
    score += 0.16;
  }

  if (constraints.some((constraint) => constraint.includes("identity:geometric")) && rule === "mirror") {
    score += 0.2;
  }

  if (constraints.some((constraint) => constraint.includes("identity:fragment")) && rule === "fragment") {
    score += 0.18;
  }

  if (constraints.some((constraint) => constraint.includes("behavior:expanding")) && rule === "scale") {
    score += 0.26;
  }

  if (constraints.some((constraint) => constraint.includes("behavior:unstable")) && rule === "distort") {
    score += 0.2;
  }

  if (constraints.some((constraint) => constraint.includes("position:edge")) && rule === "translate") {
    score += 0.18;
  }

  if (constraints.some((constraint) => constraint.includes("center:decentered_tension")) && rule === "merge") {
    score += 0.12;
  }

  if (constraints.some((constraint) => constraint.includes("grid:golden")) && rule === "scale") {
    score += 0.08;
  }

  if (constraints.some((constraint) => constraint.includes("grid:custom")) && rule === "split") {
    score += 0.12;
  }

  return clamp(score, 0, 1);
}

function prioritizeRules(input: {
  ruleset: string[];
  currentShape: string;
  constraints: string[];
  iterationIndex: number;
}) {
  const scored = input.ruleset.map((rule) => ({
    rule,
    score: scoreRulePriority({
      rule,
      ruleset: input.ruleset,
      currentShape: input.currentShape,
      constraints: input.constraints,
      iterationIndex: input.iterationIndex,
    }),
  }));

  return scored.sort((left, right) => {
    if (right.score === left.score) {
      return input.ruleset.indexOf(left.rule) - input.ruleset.indexOf(right.rule);
    }

    return right.score - left.score;
  });
}

function suppressRules(input: {
  ruleset: string[];
  currentShape: string;
  constraints: string[];
  iterationIndex: number;
}) {
  const suppressed = input.ruleset.flatMap((rule) => {
    if (rule === "fragment" && input.currentShape.includes("fragment")) {
      return [`${rule}:fragment overload`];
    }

    if (rule === "distort" && input.currentShape.includes("distort")) {
      return [`${rule}:distortion already active`];
    }

    if (rule === "mirror" && input.currentShape.includes("mirror")) {
      return [`${rule}:reflection already resolved`];
    }

    if (rule === "merge" && input.currentShape.includes("merge")) {
      return [`${rule}:fusion already dominant`];
    }

    if (rule === "split" && input.currentShape.includes("split")) {
      return [`${rule}:division already dominant`];
    }

    if (rule === "scale" && input.constraints.some((constraint) => constraint.includes("behavior:unstable"))) {
      return [`${rule}:unstable behavior resists amplification`];
    }

    if (rule === "distort" && input.constraints.some((constraint) => constraint.includes("identity:geometric"))) {
      return [`${rule}:geometric identity protects edge logic`];
    }

    if (rule === "subtract" && input.iterationIndex === 0 && input.constraints.some((constraint) => constraint.includes("behavior:expanding"))) {
      return [`${rule}:expanding seed delays subtraction`];
    }

    return [];
  });

  const suppressedRules = suppressed.map((entry) => entry.split(":")[0] ?? entry);

  return {
    suppressed,
    suppressedRules,
  };
}

function recoverRules(input: {
  ruleset: string[];
  currentShape: string;
  constraints: string[];
  iterationIndex: number;
  suppressedRules: string[];
}) {
  const recovered = input.suppressedRules.flatMap((rule) => {
    if (!input.ruleset.includes(rule)) {
      return [];
    }

    if (rule === "subtract" && input.iterationIndex >= 1 && input.currentShape.includes("scale")) {
      return [`${rule}:recovered after expansion cycle stabilized`];
    }

    if (rule === "scale" &&
      input.iterationIndex >= 2 &&
      !input.constraints.some((constraint) => constraint.includes("behavior:unstable")) &&
      (input.currentShape.includes("merge") || input.currentShape.includes("repeat") || input.currentShape.includes("mirror"))
    ) {
      return [`${rule}:recovered after stability returned`];
    }

    if (rule === "distort" &&
      input.iterationIndex >= 2 &&
      !input.constraints.some((constraint) => constraint.includes("identity:geometric")) &&
      (input.currentShape.includes("translate") || input.currentShape.includes("fragment"))
    ) {
      return [`${rule}:recovered after identity softened`];
    }

    if (rule === "merge" && input.iterationIndex >= 2 && input.currentShape.includes("split")) {
      return [`${rule}:recovered to resolve split tension`];
    }

    if (rule === "split" && input.iterationIndex >= 2 && input.currentShape.includes("merge")) {
      return [`${rule}:recovered to reopen compressed field`];
    }

    if (rule === "mirror" && input.iterationIndex >= 2 && input.currentShape.includes("translate")) {
      return [`${rule}:recovered after drift created a new axis`];
    }

    if (rule === "fragment" && input.iterationIndex >= 3 && input.currentShape.includes("repeat")) {
      return [`${rule}:recovered after repetition became too stable`];
    }

    return [];
  });

  const recoveredRules = recovered.map((entry) => entry.split(":")[0] ?? entry);

  return {
    recovered,
    recoveredRules,
  };
}

function selectRule(input: {
  ruleset: string[];
  currentShape: string;
  constraints: string[];
  iterationIndex: number;
}) {
  const prioritized = prioritizeRules(input);
  const suppression = suppressRules(input);
  const recovery = recoverRules({
    ruleset: input.ruleset,
    currentShape: input.currentShape,
    constraints: input.constraints,
    iterationIndex: input.iterationIndex,
    suppressedRules: suppression.suppressedRules,
  });
  const activelySuppressedRules = suppression.suppressedRules.filter((rule) => !recovery.recoveredRules.includes(rule));
  const available = prioritized.filter((entry) => !activelySuppressedRules.includes(entry.rule));

  return {
    selectedRule: available[0]?.rule ?? prioritized[0]?.rule ?? "repeat",
    prioritizedRules: available.length ? available : prioritized,
    suppressedRules: suppression.suppressed,
    recoveredRules: recovery.recovered,
  };
}

function describeStructuralShift(input: {
  rule: string;
  shape: ShapeTheoryState;
  structure: CompositionStructureState;
  iterationIndex: number;
}) {
  const step = input.iterationIndex + 1;

  switch (input.rule) {
    case "add":
      return {
        evolution: `anchor+field:${input.structure.subjectPosition}:layer_${step}`,
        transformation: `add => introduces secondary anchor and field layer ${step}`,
      };
    case "subtract":
      return {
        evolution: `void+mass_reduction:${input.shape.positionTendency}:density_${step}`,
        transformation: `subtract => removes density and expands void pressure ${step}`,
      };
    case "scale":
      return {
        evolution: `scale:${input.shape.positionTendency}:expansion_${step}`,
        transformation: `scale => amplifies mass and attention radius ${step}`,
      };
    case "rotate":
      return {
        evolution: `axis_rotation:${input.structure.centerState}:turn_${step}`,
        transformation: `rotate => reorients attention axis ${step}`,
      };
    case "translate":
      return {
        evolution: `drift:${input.shape.positionTendency}:offset_${step}`,
        transformation: `translate => relocates shape pressure ${step}`,
      };
    case "mirror":
      return {
        evolution: `mirror_axis:${input.structure.symmetryState}:reflection_${step}`,
        transformation: `mirror => duplicates relation across symmetry axis ${step}`,
      };
    case "split":
      return {
        evolution: `split_field:${input.structure.grid}:division_${step}`,
        transformation: `split => separates one form into readable subfields ${step}`,
      };
    case "merge":
      return {
        evolution: `merge_field:${input.structure.centerState}:fusion_${step}`,
        transformation: `merge => compresses multiple tensions into one center ${step}`,
      };
    case "distort":
      return {
        evolution: `distortion:${input.shape.behavior}:bend_${step}`,
        transformation: `distort => bends edge logic without collapsing identity ${step}`,
      };
    case "repeat":
      return {
        evolution: `pattern_repeat:${input.structure.grid}:echo_${step}`,
        transformation: `repeat => extends the sequence into patterned recurrence ${step}`,
      };
    case "fragment":
      return {
        evolution: `fragment:${input.shape.positionTendency}:scatter_${step}`,
        transformation: `fragment => breaks continuity into distributed shards ${step}`,
      };
    default:
      return {
        evolution: `${input.shape.positionTendency}:${input.rule}:${step}`,
        transformation: `${input.rule} => neutral structural continuation ${step}`,
      };
  }
}

function applyRule(seed: string, rule: string, iterationIndex: number) {
  switch (rule) {
    case "add":
      return `${seed} + node_${iterationIndex + 1} + field_${(iterationIndex % 2) + 1}`;
    case "subtract":
      return `${seed.replace(/\s\+\snode_\d+/g, "").replace(/\s\+\sfield_\d+/g, "")} - density_${iterationIndex + 1} - anchor_${iterationIndex + 1}`;
    case "scale":
      return `${seed} * scale_${iterationIndex + 1}`;
    case "rotate":
      return `${seed} ~ rotate_${iterationIndex + 1}`;
    case "translate":
      return `${seed} -> drift_${iterationIndex + 1}`;
    case "mirror":
      return `${seed} :: mirror_${iterationIndex + 1}`;
    case "split":
      return `${seed} // split_${iterationIndex + 1}`;
    case "merge":
      return `${seed} ++ merge_${iterationIndex + 1}`;
    case "distort":
      return `${seed} ~~ distort_${iterationIndex + 1}`;
    case "repeat":
      return `${seed} <> repeat_${iterationIndex + 1}`;
    case "fragment":
      return `${seed} ## fragment_${iterationIndex + 1}`;
    default:
      return seed;
  }
}

function validTransformation(previousShape: string, nextShape: string) {
  const preservesIdentity = previousShape.split(":")[0] === nextShape.split(":")[0] || nextShape.includes(previousShape.split(" ")[0] ?? "");
  const relationPreserved = nextShape.length >= Math.max(previousShape.length - 4, 1);
  const noRandomNoise = !nextShape.includes("noise") && !nextShape.includes("random");

  return preservesIdentity && relationPreserved && noRandomNoise;
}

function updateRulePriorities(input: {
  rulesApplied: string[];
  scores: ShapeGrammarScores;
  prioritizedRules: Array<{ rule: string; score: number }>;
  constraints: string[];
  suppressedRules: string[];
  recoveredRules: string[];
}) {
  const dominantRule = input.prioritizedRules[0]?.rule ?? input.rulesApplied[0] ?? "repeat";
  const rankedRules = input.prioritizedRules.slice(0, 4).map((entry) => entry.rule);
  const constraintBias = clamp(input.constraints.length * 0.08, 0, 1);
  return {
    dominantRule,
    adaptiveBias: clamp(input.scores.coherence * 0.6 + input.scores.relation * 0.2, 0, 1),
    rankedRules,
    constraintBias,
    suppressedRules: input.suppressedRules,
    recoveredRules: input.recoveredRules,
  };
}

function updateTransformationLogic(input: {
  attemptedTransformations: number;
  successfulTransformations: number;
}) {
  return {
    acceptedWeight: clamp(input.successfulTransformations / Math.max(input.attemptedTransformations, 1), 0, 1),
    rejectedWeight: clamp(
      (input.attemptedTransformations - input.successfulTransformations) / Math.max(input.attemptedTransformations, 1),
      0,
      1,
    ),
  };
}

function updateSequenceBehavior(input: {
  scores: ShapeGrammarScores;
}) {
  return {
    continuityWeight: clamp(input.scores.relation * 0.64 + input.scores.coherence * 0.16, 0, 1),
    varianceWeight: clamp(input.scores.expressivePower * 0.68 + input.scores.transformation * 0.12, 0, 1),
  };
}

function updateGrammarSystem(input: {
  rulesApplied: string[];
  scores: ShapeGrammarScores;
  attemptedTransformations: number;
  successfulTransformations: number;
  prioritizedRules: Array<{ rule: string; score: number }>;
  constraints: string[];
  suppressedRules: string[];
  recoveredRules: string[];
}) {
  const rulePriorities = updateRulePriorities({
    rulesApplied: input.rulesApplied,
    scores: input.scores,
    prioritizedRules: input.prioritizedRules,
    constraints: input.constraints,
    suppressedRules: input.suppressedRules,
    recoveredRules: input.recoveredRules,
  });
  const transformationLogic = updateTransformationLogic({
    attemptedTransformations: input.attemptedTransformations,
    successfulTransformations: input.successfulTransformations,
  });
  const sequenceBehavior = updateSequenceBehavior({
    scores: input.scores,
  });

  return {
    rulePriorities,
    transformationLogic,
    sequenceBehavior,
    notes: [
      `dominant rule ${rulePriorities.dominantRule}`,
      `priority queue ${rulePriorities.rankedRules.join(" > ") || "repeat"}`,
      `suppressed ${rulePriorities.suppressedRules.join(" | ") || "none"}`,
      `recovered ${rulePriorities.recoveredRules.join(" | ") || "none"}`,
      `accepted ${input.successfulTransformations} / ${input.attemptedTransformations} transformations`,
    ],
  };
}

export function evaluateGrammarCoherence(sequence: string[]) {
  if (sequence.length <= 1) {
    return 0.4;
  }

  const readableSteps = sequence.slice(1).filter((entry) => /scale|rotate|drift|mirror|split|merge|distort|repeat|fragment|density|node/.test(entry)).length;
  return clamp(0.32 + (readableSteps / Math.max(sequence.length - 1, 1)) * 0.52, 0, 1);
}

export function evaluateGrammarRelations(sequence: string[]) {
  if (sequence.length <= 1) {
    return 0.36;
  }

  const continuity = sequence.slice(1).filter((entry, index) => entry.split(" ")[0] === sequence[index].split(" ")[0]).length;
  return clamp(0.28 + (continuity / Math.max(sequence.length - 1, 1)) * 0.56, 0, 1);
}

export function evaluateExpressivePower(sequence: string[]) {
  const variation = new Set(sequence).size / Math.max(sequence.length, 1);
  const transformationDensity = sequence.filter((entry) => /scale|rotate|drift|mirror|split|merge|distort|repeat|fragment/.test(entry)).length / Math.max(sequence.length, 1);
  return clamp(variation * 0.42 + transformationDensity * 0.42 + 0.12, 0, 1);
}

export function evaluateShapeGrammar(input: {
  sequence: string[];
  successfulTransformations: number;
  attemptedTransformations: number;
}): ShapeGrammarScores {
  return {
    coherence: evaluateGrammarCoherence(input.sequence),
    transformation: clamp(input.successfulTransformations / Math.max(input.attemptedTransformations, 1), 0, 1),
    relation: evaluateGrammarRelations(input.sequence),
    expressivePower: evaluateExpressivePower(input.sequence),
  };
}

export function validGrammar(scores: ShapeGrammarScores, thresholds: ShapeGrammarThresholds) {
  return scores.coherence >= thresholds.coherence &&
    scores.transformation >= thresholds.transformation &&
    scores.relation >= thresholds.relation &&
    scores.expressivePower >= thresholds.expressivePower;
}

export function generateInevitableForms(scores: ShapeGrammarScores, sequence: string[]) {
  const passed = sequence.length >= 3 &&
    (scores.coherence * 0.32 + scores.relation * 0.22 + scores.expressivePower * 0.28) >= 0.68;

  return {
    passed,
    note: passed
      ? "Secvența produce forme care par inevitabile, nu arbitrare."
      : "Secvența produce încă mutații lizibile, dar nu inevitabile.",
  };
}

export function generateShapeSequence(input: {
  shape: ShapeTheoryState;
  structure: CompositionStructureState;
  maxIterations?: number;
  hardFailureMode?: "soft" | "controlled";
}) {
  const { shape, structure, maxIterations = 5, hardFailureMode = "controlled" } = input;
  const thresholds = defaultThresholds();
  const seedShape = `${shape.type}:${shape.mass}:${shape.behavior}`;
  const primitiveForm = generatePrimitiveForm({
    type: shape.runtime?.detectedPrimitiveShape ?? "VOLUME",
    complexity: shape.runtime?.primitiveShapeStructure?.complexity,
    orientation: shape.runtime?.primitiveShapeStructure?.orientation,
  });
  const ruleset = buildRuleset(shape, structure);
  const constraints = buildConstraints(shape, structure);
  const sequence = [seedShape];
  const rulesApplied: string[] = [];
  const transformationMap: string[] = [];
  const structureEvolution: string[] = [`seed:${shape.positionTendency}:${structure.subjectPosition}`];
  let currentShape = seedShape;
  let attemptedTransformations = 0;
  let successfulTransformations = 0;
  let failureReason: ShapeGrammarRuntime["failureReason"] = null;
  let terminationReason: ShapeGrammarRuntime["terminationReason"] = "iteration_limit";
  let terminated = false;
  let finalPrioritizedRules: Array<{ rule: string; score: number }> = [];
  let finalSuppressedRules: string[] = [];
  let finalRecoveredRules: string[] = [];

  for (let index = 0; index < maxIterations; index += 1) {
    const selection = selectRule({
      ruleset,
      currentShape,
      constraints,
      iterationIndex: index,
    });
    const rule = selection.selectedRule;
    finalPrioritizedRules = selection.prioritizedRules;
    finalSuppressedRules = selection.suppressedRules;
    finalRecoveredRules = selection.recoveredRules;
    attemptedTransformations += 1;
    const newShape = applyRule(currentShape, rule, index);

    if (!validTransformation(currentShape, newShape)) {
      failureReason = "transformation_rejection";
      continue;
    }

    sequence.push(newShape);
    currentShape = newShape;
    successfulTransformations += 1;
    rulesApplied.push(rule);
    const structuralShift = describeStructuralShift({
      rule,
      shape,
      structure,
      iterationIndex: index,
    });
    transformationMap.push(`${sequence[index]} => ${newShape} | ${structuralShift.transformation}`);
    structureEvolution.push(structuralShift.evolution);
  }

  const scores = evaluateShapeGrammar({
    sequence,
    successfulTransformations,
    attemptedTransformations,
  });
  const isValid = validGrammar(scores, thresholds);
  const law = generateInevitableForms(scores, sequence);
  const transformationThresholdPassed = scores.transformation >= thresholds.transformation;
  const hardFailureTriggered =
    hardFailureMode === "controlled" && (!transformationThresholdPassed || !law.passed);
  const systemStateUpdate = updateGrammarSystem({
    rulesApplied,
    scores,
    attemptedTransformations,
    successfulTransformations,
    prioritizedRules: finalPrioritizedRules.length
      ? finalPrioritizedRules
      : prioritizeRules({
          ruleset,
          currentShape,
          constraints,
          iterationIndex: Math.max(sequence.length - 1, 0),
        }),
    constraints,
    suppressedRules: finalSuppressedRules,
    recoveredRules: finalRecoveredRules,
  });

  if (!isValid && !failureReason) {
    failureReason = "invalid_grammar";
  }

  if (hardFailureTriggered && !law.passed) {
    failureReason = "law_rejection";
    terminated = true;
    terminationReason = "law_rejection";
  } else if (failureReason === "transformation_rejection" && !transformationThresholdPassed) {
    terminated = true;
    terminationReason = "transformation_rejection";
  } else if (isValid) {
    terminated = true;
    terminationReason = "threshold_reached";
  }

  return {
    sequence,
    rulesApplied,
    transformationMap,
    structureEvolution,
    outputVisual: sequence.join(" · "),
    outputText: isValid
      ? `Gramatica formelor evoluează prin ${rulesApplied.join(", ") || "stabilizare minimă"} și produce o secvență lizibilă. Evoluția primară merge din ${primitiveForm.base.type} spre ${primitiveForm.evolved}.`
      : `Gramatica formelor rămâne instabilă; secvența nu trece încă pragurile de coerență și expresie. Evoluția primară rămâne ${primitiveForm.base.type} -> ${primitiveForm.evolved}.`,
    runtime: {
      seedShape,
      primitiveBaseShape: primitiveForm.base.type,
      primitiveEvolvedShape: primitiveForm.evolved,
      generatedForm: primitiveForm,
      ruleset,
      constraints,
      hardFailureMode,
      hardFailureTriggered,
      iterationCount: sequence.length,
      maxIterations,
      terminated,
      terminationReason,
      failed: !isValid || hardFailureTriggered,
      failureReason,
      thresholds,
      scores,
      lawPassed: law.passed,
      lawNote: law.note,
      systemStateUpdate,
      notes: [
        `seed ${seedShape}`,
        `primitive ${primitiveForm.base.type} -> ${primitiveForm.evolved}`,
        `rules ${ruleset.join(" | ")}`,
        `constraints ${constraints.join(" | ")}`,
        `priority queue ${(finalPrioritizedRules.length
          ? finalPrioritizedRules
          : prioritizeRules({
              ruleset,
              currentShape,
              constraints,
              iterationIndex: Math.max(sequence.length - 1, 0),
            })).map((entry) => `${entry.rule}:${entry.score.toFixed(2)}`).join(" | ")}`,
        `suppressed ${finalSuppressedRules.join(" | ") || "none"}`,
        `recovered ${finalRecoveredRules.join(" | ") || "none"}`,
        `transformation threshold ${transformationThresholdPassed ? "passed" : "failed"}`,
      ],
    } satisfies ShapeGrammarRuntime,
  };
}

export function measureGrammarReuse(input: {
  sourceIdeaCanonCount: number;
}) {
  return clamp(
    input.sourceIdeaCanonCount >= 2 ? 0.76 : 0.42 + input.sourceIdeaCanonCount * 0.16,
    0,
    1,
  );
}

export function measureStructuralImpact(input: {
  validation: ShapeGrammarScores;
}) {
  return clamp(
    input.validation.coherence * 0.24 +
      input.validation.relation * 0.24 +
      input.validation.expressivePower * 0.22,
    0,
    1,
  );
}

export function measureGrammarTimeStability(input: {
  stage: string;
  validation: ShapeGrammarScores;
}) {
  return clamp(
    (input.stage === "canonical" ? 0.42 : input.stage === "resolved" ? 0.32 : 0.16) +
      input.validation.coherence * 0.16 +
      input.validation.relation * 0.14 +
      input.validation.transformation * 0.1,
    0,
    1,
  );
}

export function isGrammarCanonical(input: {
  grammar: ShapeGrammarState;
  validation: ShapeGrammarScores;
  stage: string;
  sourceIdeaCanonCount: number;
}) {
  const reuse = measureGrammarReuse({
    sourceIdeaCanonCount: input.sourceIdeaCanonCount,
  });
  const impact = measureStructuralImpact({
    validation: input.validation,
  });
  const stability = measureGrammarTimeStability({
    stage: input.stage,
    validation: input.validation,
  });

  return reuse >= 0.6 && impact >= 0.64 && stability >= 0.66;
}
