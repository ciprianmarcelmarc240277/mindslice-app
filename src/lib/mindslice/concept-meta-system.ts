"use client";

import type {
  ArtCompositionState,
  CanonInfluenceContext,
  ClockDisplayState,
  ColorPaletteState,
  CompositionStructureState,
  MetaSystemState,
  MetaSystemRuntime,
  MetaSystemScores,
  MetaSystemThresholds,
  NarrativeScenarioState,
  ShapeGrammarState,
  ShapeTheoryState,
  ThoughtMemoryEntry,
  ThoughtState,
  HistoryEntry,
} from "@/lib/mindslice/mindslice-types";

type MetaModuleKey =
  | "shape_theory"
  | "shape_grammar"
  | "composition_structure"
  | "clock"
  | "art_composition"
  | "scenario"
  | "color_theory";

type MetaFramework = ReturnType<typeof buildFramework>;
type MetaLabyrinth = ReturnType<typeof runLabyrinth>;

type MetaModuleContext = {
  shape: ShapeTheoryState;
  shapeGrammar: ShapeGrammarState;
  structure: CompositionStructureState;
  artComposition: ArtCompositionState;
  scenario: NarrativeScenarioState;
  palette: ColorPaletteState;
  clockDisplay: ClockDisplayState | null;
};

type MetaConductorState = {
  mode: "conductor";
  targetModules: MetaModuleKey[];
  labyrinthPressure: number;
  pipelinePressure: number;
  relationPressure: number;
  notes: string[];
};

type MetaDesignState = {
  axes: string[];
  variations: string[];
  relations: string[];
  executedModules: MetaModuleKey[];
  reorderedPipeline: MetaModuleKey[];
  suppressedModules: string[];
  suppressionNotes: string[];
  recoveredModules: string[];
  recoveryNotes: string[];
  moduleWeights: Record<MetaModuleKey, number>;
  reweightNotes: string[];
  moduleNotes: string[];
  structureBias: number;
  coherenceBias: number;
  attentionBias: number;
  integrationBias: number;
  failed: boolean;
  failureModule: MetaModuleKey | null;
  failureReason: string | null;
};

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

function tokenize(values: string[]) {
  return new Set(
    values
      .flatMap((value) => value.toLowerCase().split(/[^-\p{L}\p{N}]+/u))
      .filter((token) => token.length >= 3),
  );
}

function overlapScore(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) {
    return 0;
  }

  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(Math.min(left.size, right.size), 1);
}

const LABYRINTH_DIMENSIONS = [
  "artistic",
  "emotional",
  "technical",
  "social",
] as const;

function defaultThresholds(): MetaSystemThresholds {
  return {
    structure: 0.66,
    coherence: 0.68,
    attention: 0.67,
    integration: 0.7,
  };
}

function detectDomains(input: {
  clockDisplay: ClockDisplayState | null;
}) {
  return unique([
    "shape",
    "composition",
    "color",
    "scenario",
    input.clockDisplay ? "time" : null,
  ]);
}

export function extractFrameworkIntent(input: {
  current: ThoughtState;
}) {
  return input.current.direction || input.current.thought || "intent latent";
}

export function extractFrameworkFunction(input: {
  shape: ShapeTheoryState;
  shapeGrammar: ShapeGrammarState;
  structure: CompositionStructureState;
}) {
  return [
    `shape:${input.shape.type}`,
    `grammar:${input.shapeGrammar.runtime.systemStateUpdate.rulePriorities.dominantRule}`,
    `structure:${input.structure.grid}`,
  ].join(" / ");
}

export function extractFrameworkTarget(input: {
  scenario: NarrativeScenarioState;
  current: ThoughtState;
}) {
  return input.current.mood || input.scenario.stakes || "context deschis";
}

export function extractFrameworkDifferentiator(input: {
  shapeGrammar: ShapeGrammarState;
  palette: ColorPaletteState;
  artComposition: ArtCompositionState;
}) {
  return unique([
    input.shapeGrammar.runtime.generatedForm
      ? `form:${input.shapeGrammar.runtime.generatedForm.base.type}->${input.shapeGrammar.runtime.generatedForm.evolved}`
      : null,
    input.palette.runtime?.colorPalette ? `color:${input.palette.runtime.colorPalette.hue}` : null,
    input.artComposition.runtime?.visualRefined ? "visual:refined" : "visual:stable",
  ]).join(" / ") || "diferențiator latent";
}

export function buildMindSliceFramework(input: {
  sliceContent: {
    current: ThoughtState;
    shape: ShapeTheoryState;
    shapeGrammar: ShapeGrammarState;
    structure: CompositionStructureState;
    artComposition: ArtCompositionState;
    scenario: NarrativeScenarioState;
    palette: ColorPaletteState;
  };
}) {
  return {
    intent: extractFrameworkIntent({
      current: input.sliceContent.current,
    }),
    function: extractFrameworkFunction({
      shape: input.sliceContent.shape,
      shapeGrammar: input.sliceContent.shapeGrammar,
      structure: input.sliceContent.structure,
    }),
    target: extractFrameworkTarget({
      scenario: input.sliceContent.scenario,
      current: input.sliceContent.current,
    }),
    differentiator: extractFrameworkDifferentiator({
      shapeGrammar: input.sliceContent.shapeGrammar,
      palette: input.sliceContent.palette,
      artComposition: input.sliceContent.artComposition,
    }),
  };
}

function buildFramework(input: {
  current: ThoughtState;
  shape: ShapeTheoryState;
  shapeGrammar: ShapeGrammarState;
  structure: CompositionStructureState;
  artComposition: ArtCompositionState;
  scenario: NarrativeScenarioState;
  palette: ColorPaletteState;
  clockDisplay: ClockDisplayState | null;
}) {
  const domain = detectDomains({
    clockDisplay: input.clockDisplay,
  });
  const frameworkModel = buildMindSliceFramework({
    sliceContent: {
      current: input.current,
      shape: input.shape,
      shapeGrammar: input.shapeGrammar,
      structure: input.structure,
      artComposition: input.artComposition,
      scenario: input.scenario,
      palette: input.palette,
    },
  });

  return {
    ...frameworkModel,
    domain,
    constraints: unique([
      ...input.shapeGrammar.runtime.constraints,
      `shape:${input.shape.type}`,
      `behavior:${input.shape.behavior}`,
      `structure:${input.structure.grid}`,
      `focus:${input.artComposition.focusNode}`,
      `scenario:${input.scenario.coreConflict}`,
      `color:${input.palette.dominant}`,
      input.clockDisplay ? `time:${input.clockDisplay.transition}` : null,
    ]).slice(0, 12),
    goal: input.scenario.resolution,
    priority:
      input.shape.attentionProfile[0] ??
      input.artComposition.focusNode ??
      input.structure.centerState,
  };
}

export function exploreFrameworkDimension(input: {
  model: ReturnType<typeof buildFramework>;
  dimension: (typeof LABYRINTH_DIMENSIONS)[number];
  shape: ShapeTheoryState;
  shapeGrammar: ShapeGrammarState;
  structure: CompositionStructureState;
  artComposition: ArtCompositionState;
  scenario: NarrativeScenarioState;
  palette: ColorPaletteState;
  clockDisplay: ClockDisplayState | null;
}) {
  if (input.dimension === "artistic") {
    return unique([
      input.model.differentiator,
      `focus:${input.artComposition.focusNode}`,
      `shape:${input.shape.type}`,
      `grammar:${input.shapeGrammar.rulesApplied[0] ?? input.shapeGrammar.runtime.systemStateUpdate.rulePriorities.dominantRule}`,
    ]).slice(0, 4);
  }

  if (input.dimension === "emotional") {
    return unique([
      input.model.intent,
      input.model.target,
      `stakes:${input.scenario.stakes}`,
      `resolution:${input.scenario.resolution}`,
    ]).slice(0, 4);
  }

  if (input.dimension === "technical") {
    return unique([
      input.model.function,
      `grid:${input.structure.grid}`,
      `color:${input.palette.runtime?.colorPalette?.hue ?? input.palette.dominant}`,
      input.clockDisplay ? `time:${input.clockDisplay.transition}` : null,
    ]).slice(0, 4);
  }

  return unique([
    input.model.target,
    `scenario:${input.scenario.coreConflict}`,
    `attention:${input.structure.subjectPosition}`,
    input.clockDisplay ? `clock:${input.clockDisplay.attentionAnchor}` : null,
  ]).slice(0, 4);
}

export function generateLabyrinthVariations(input: {
  model: ReturnType<typeof buildFramework>;
  dimension: (typeof LABYRINTH_DIMENSIONS)[number];
  shape: ShapeTheoryState;
  shapeGrammar: ShapeGrammarState;
  structure: CompositionStructureState;
  artComposition: ArtCompositionState;
  scenario: NarrativeScenarioState;
  palette: ColorPaletteState;
  clockDisplay: ClockDisplayState | null;
}) {
  return exploreFrameworkDimension(input);
}

export function findLabyrinthOverlap(input: {
  dimensionA: string;
  valuesA: string[];
  dimensionB: string;
  valuesB: string[];
}) {
  const tokensA = tokenize(input.valuesA);
  const tokensB = tokenize(input.valuesB);
  const overlap = [...tokensA].filter((token) => tokensB.has(token));

  if (!overlap.length) {
    return null;
  }

  return `${input.dimensionA}<->${input.dimensionB}:${overlap.slice(0, 3).join("|")}`;
}

export function detectLabyrinthConnections(explorations: Record<string, string[]>) {
  const connections: string[] = [];
  const entries = Object.entries(explorations);

  for (const [dimensionA, valuesA] of entries) {
    for (const [dimensionB, valuesB] of entries) {
      if (dimensionA >= dimensionB) {
        continue;
      }

      const link = findLabyrinthOverlap({
        dimensionA,
        valuesA,
        dimensionB,
        valuesB,
      });

      if (link) {
        connections.push(link);
      }
    }
  }

  return connections;
}

function runLabyrinth(input: {
  framework: ReturnType<typeof buildFramework>;
  shape: ShapeTheoryState;
  shapeGrammar: ShapeGrammarState;
  structure: CompositionStructureState;
  artComposition: ArtCompositionState;
  scenario: NarrativeScenarioState;
  palette: ColorPaletteState;
  clockDisplay: ClockDisplayState | null;
}) {
  const explorations = Object.fromEntries(
    LABYRINTH_DIMENSIONS.map((dimension) => [
      dimension,
      generateLabyrinthVariations({
        model: input.framework,
        dimension,
        shape: input.shape,
        shapeGrammar: input.shapeGrammar,
        structure: input.structure,
        artComposition: input.artComposition,
        scenario: input.scenario,
        palette: input.palette,
        clockDisplay: input.clockDisplay,
      }),
    ]),
  ) as Record<string, string[]>;
  const connections = detectLabyrinthConnections(explorations);
  const axes = unique([
    ...input.framework.domain.map((domain) => `axis:${domain}`),
    ...LABYRINTH_DIMENSIONS.map((dimension) => `dimension:${dimension}`),
    `shape:${input.shape.positionTendency}`,
    `grammar:${input.shapeGrammar.rulesApplied[0] ?? input.shapeGrammar.runtime.systemStateUpdate.rulePriorities.dominantRule}`,
    `structure:${input.structure.centerState}`,
    `art:${input.artComposition.focusNode}`,
    `scenario:${input.scenario.coreConflict}`,
    `color:${input.palette.dominant}`,
    input.clockDisplay ? `time:${input.clockDisplay.attentionAnchor}` : null,
  ]).slice(0, 8);

  const variations = unique([
    input.shape.outputVisual,
    input.shapeGrammar.outputVisual,
    input.structure.outputVisual,
    input.artComposition.outputVisual,
    input.scenario.outputStructure,
    input.palette.outputVisual,
    input.clockDisplay?.outputVisual ?? null,
  ]).slice(0, 7);

  const relations = unique([
    `shape -> grammar via ${input.shapeGrammar.rulesApplied[0] ?? "stabilization"}`,
    `scenario -> structure via ${input.structure.centerState}`,
    `art -> color via ${input.palette.accent}`,
    `shape -> art via ${input.artComposition.focusNode}`,
    ...connections,
    input.clockDisplay ? `time -> scenario via ${input.clockDisplay.attentionAnchor}` : null,
    input.clockDisplay ? `time -> composition via ${input.clockDisplay.transition}` : null,
  ]);

  return {
    explorationMap: {
      explorations,
      connections,
    },
    explorations,
    connections,
    axes,
    variations,
    relations,
  };
}

export function selectVisualDirection(input: {
  explorationMap: {
    explorations: Record<string, string[]>;
    connections: string[];
  };
}) {
  const rankedDimensions = Object.entries(input.explorationMap.explorations)
    .map(([dimension, values]) => {
      const connectionWeight = input.explorationMap.connections.filter((connection) =>
        connection.includes(dimension),
      ).length;
      return {
        dimension,
        score: values.length + connectionWeight * 0.75,
      };
    })
    .sort((left, right) => right.score - left.score);

  return rankedDimensions[0]?.dimension ?? "artistic";
}

export function generateVisualStyle(direction: string) {
  if (direction === "artistic") {
    return "expressive_field";
  }
  if (direction === "emotional") {
    return "atmospheric_tension";
  }
  if (direction === "technical") {
    return "precision_grid";
  }
  if (direction === "social") {
    return "dialogic_stage";
  }

  return "hybrid_stage";
}

export function generateDesignLayout(style: string) {
  if (style === "expressive_field") {
    return "floating_composition";
  }
  if (style === "atmospheric_tension") {
    return "centered_pressure";
  }
  if (style === "precision_grid") {
    return "modular_alignment";
  }
  if (style === "dialogic_stage") {
    return "offset_dual_frame";
  }

  return "adaptive_layout";
}

export function generateDesignMotion(style: string) {
  if (style === "expressive_field") {
    return "slow_drift";
  }
  if (style === "atmospheric_tension") {
    return "breathing_pulse";
  }
  if (style === "precision_grid") {
    return "measured_step";
  }
  if (style === "dialogic_stage") {
    return "counter_motion";
  }

  return "ambient_motion";
}

export function generateDesignOutput(input: {
  explorationMap: {
    explorations: Record<string, string[]>;
    connections: string[];
  };
}) {
  const direction = selectVisualDirection({
    explorationMap: input.explorationMap,
  });
  const style = generateVisualStyle(direction);
  const layout = generateDesignLayout(style);
  const motion = generateDesignMotion(style);

  return {
    direction,
    style,
    layout,
    motion,
  };
}

function selectModulePipeline(domains: string[]) {
  const pipeline: MetaModuleKey[] = [];

  if (domains.includes("shape")) {
    pipeline.push("shape_theory", "shape_grammar");
  }

  if (domains.includes("composition")) {
    pipeline.push("composition_structure", "art_composition");
  }

  if (domains.includes("color")) {
    pipeline.push("color_theory");
  }

  if (domains.includes("scenario")) {
    pipeline.push("scenario");
  }

  if (domains.includes("time")) {
    pipeline.push("clock");
  }

  return pipeline;
}

function initializeDesignState(labyrinth: MetaLabyrinth): MetaDesignState {
  return {
    axes: [...labyrinth.axes],
    variations: [...labyrinth.variations],
    relations: [...labyrinth.relations],
    executedModules: [],
    reorderedPipeline: [],
    suppressedModules: [],
    suppressionNotes: [],
    recoveredModules: [],
    recoveryNotes: [],
    moduleWeights: {
      shape_theory: 0.5,
      shape_grammar: 0.5,
      composition_structure: 0.5,
      clock: 0.5,
      art_composition: 0.5,
      scenario: 0.5,
      color_theory: 0.5,
    },
    reweightNotes: [],
    moduleNotes: [],
    structureBias: 0,
    coherenceBias: 0,
    attentionBias: 0,
    integrationBias: 0,
    failed: false,
    failureModule: null,
    failureReason: null,
  };
}

function buildConductorState(input: {
  framework: MetaFramework;
  labyrinth: MetaLabyrinth;
  context: MetaModuleContext;
}) {
  const targetModules = unique([
    input.context.scenario.runtime.scores.meaning >= 0.72 ? "scenario" : null,
    input.context.structure.runtime.scores.center >= 0.72 ? "composition_structure" : null,
    input.context.shapeGrammar.runtime.scores.coherence >= 0.72 ? "shape_grammar" : null,
    input.context.artComposition.runtime.scores.focus >= 0.72 ? "art_composition" : null,
    input.context.palette.runtime.scores.colorRelations >= 0.72 ? "color_theory" : null,
    input.context.clockDisplay?.runtime.scores.attention && input.context.clockDisplay.runtime.scores.attention >= 0.72
      ? "clock"
      : null,
    input.context.shape.runtime.scores.attention >= 0.72 ? "shape_theory" : null,
  ]) as MetaModuleKey[];

  const labyrinthPressure = clamp(
    input.context.shapeGrammar.runtime.scores.relation * 0.26 +
      input.context.structure.runtime.scores.center * 0.18 +
      input.context.scenario.runtime.scores.progression * 0.18 +
      clamp(input.labyrinth.relations.length / 6, 0, 1) * 0.18,
    0,
    1,
  );
  const pipelinePressure = clamp(
    input.context.scenario.runtime.scores.attention * 0.22 +
      input.context.artComposition.runtime.scores.focus * 0.2 +
      input.context.palette.runtime.scores.attentionImpact * 0.18 +
      clamp(targetModules.length / 4, 0, 1) * 0.18,
    0,
    1,
  );
  const relationPressure = clamp(
    input.context.shape.runtime.scores.relation * 0.2 +
      input.context.shapeGrammar.runtime.scores.relation * 0.24 +
      input.context.structure.runtime.scores.attention * 0.14 +
      input.context.scenario.runtime.scores.meaning * 0.16,
    0,
    1,
  );

  return {
    mode: "conductor" as const,
    targetModules: targetModules.length ? targetModules : ["shape_grammar", "composition_structure", "scenario"],
    labyrinthPressure,
    pipelinePressure,
    relationPressure,
    notes: unique([
      `conductor goal ${input.framework.goal}`,
      `conductor priority ${input.framework.priority}`,
      `conductor domains ${input.framework.domain.join("/") || "none"}`,
      `conductor targets ${(targetModules.length ? targetModules : ["shape_grammar", "composition_structure", "scenario"]).join(" > ")}`,
    ]),
  } satisfies MetaConductorState;
}

function composeConductedLabyrinth(input: {
  labyrinth: MetaLabyrinth;
  framework: MetaFramework;
  conductor: MetaConductorState;
  context: MetaModuleContext;
}) {
  return {
    explorationMap: {
      explorations: Object.fromEntries(
        Object.entries(input.labyrinth.explorationMap.explorations).map(([dimension, values]) => [
          dimension,
          unique([
            ...values,
            input.conductor.targetModules[0] ? `conductor:${input.conductor.targetModules[0]}` : null,
            input.conductor.labyrinthPressure >= 0.66 ? `pressure:${input.conductor.labyrinthPressure.toFixed(2)}` : null,
          ]).slice(0, 6),
        ]),
      ) as Record<string, string[]>,
      connections: unique([
        ...input.labyrinth.explorationMap.connections,
        `conductor<->goal:${input.framework.goal}`,
        ...input.conductor.targetModules.slice(0, 3).map((module) => `conductor<->${module}`),
      ]).slice(0, 12),
    },
    explorations: Object.fromEntries(
      Object.entries(input.labyrinth.explorations).map(([dimension, values]) => [
        dimension,
        unique([
          ...values,
          input.conductor.targetModules[0] ? `conductor:${input.conductor.targetModules[0]}` : null,
          input.conductor.labyrinthPressure >= 0.66 ? `pressure:${input.conductor.labyrinthPressure.toFixed(2)}` : null,
        ]).slice(0, 6),
      ]),
    ) as Record<string, string[]>,
    connections: unique([
      ...input.labyrinth.connections,
      `conductor<->goal:${input.framework.goal}`,
      ...input.conductor.targetModules.slice(0, 3).map((module) => `conductor<->${module}`),
    ]).slice(0, 12),
    axes: unique([
      ...input.labyrinth.axes,
      `conductor:priority:${input.framework.priority}`,
      ...input.conductor.targetModules.slice(0, 3).map((module) => `conductor:${module}`),
      input.conductor.pipelinePressure >= 0.68 ? `conductor:goal:${input.framework.goal}` : null,
    ]).slice(0, 12),
    variations: unique([
      ...input.labyrinth.variations,
      `conductor-focus:${input.context.artComposition.focusNode}`,
      `conductor-shape:${input.context.shape.type}`,
      input.conductor.labyrinthPressure >= 0.66 ? `conductor-structure:${input.context.structure.centerState}` : null,
    ]).slice(0, 10),
    relations: unique([
      ...input.labyrinth.relations,
      `conductor -> labyrinth via ${input.framework.goal}`,
      ...input.conductor.targetModules.slice(0, 3).map((module) => `conductor -> ${module}`),
      input.conductor.relationPressure >= 0.66
        ? `conductor -> relations via ${input.context.shapeGrammar.runtime.systemStateUpdate.rulePriorities.dominantRule}`
        : null,
    ]).slice(0, 14),
  };
}

function applyConductorPrelude(input: {
  designState: MetaDesignState;
  conductor: MetaConductorState;
  conductedLabyrinth: MetaLabyrinth;
}) {
  return {
    ...input.designState,
    axes: [...input.conductedLabyrinth.axes],
    variations: [...input.conductedLabyrinth.variations],
    relations: [...input.conductedLabyrinth.relations],
    structureBias: clamp(
      input.designState.structureBias + input.conductor.labyrinthPressure * 0.12,
      0,
      1,
    ),
    coherenceBias: clamp(
      input.designState.coherenceBias + input.conductor.relationPressure * 0.1,
      0,
      1,
    ),
    attentionBias: clamp(
      input.designState.attentionBias + input.conductor.pipelinePressure * 0.08,
      0,
      1,
    ),
    integrationBias: clamp(
      input.designState.integrationBias + input.conductor.relationPressure * 0.14,
      0,
      1,
    ),
    moduleNotes: unique([
      ...input.designState.moduleNotes,
      ...input.conductor.notes,
      "conductor prelude applied",
    ]),
  };
}

function executeModule(input: {
  module: MetaModuleKey;
  currentState: MetaDesignState;
  context: MetaModuleContext;
}) {
  const nextState: MetaDesignState = {
    ...input.currentState,
    axes: [...input.currentState.axes],
    variations: [...input.currentState.variations],
    relations: [...input.currentState.relations],
    executedModules: [...input.currentState.executedModules],
    reorderedPipeline: [...input.currentState.reorderedPipeline],
    suppressedModules: [...input.currentState.suppressedModules],
    suppressionNotes: [...input.currentState.suppressionNotes],
    recoveredModules: [...input.currentState.recoveredModules],
    recoveryNotes: [...input.currentState.recoveryNotes],
    moduleWeights: { ...input.currentState.moduleWeights },
    reweightNotes: [...input.currentState.reweightNotes],
    moduleNotes: [...input.currentState.moduleNotes],
  };

  const fail = (reason: string) => ({
    ...nextState,
    failed: true,
    failureModule: input.module,
    failureReason: reason,
    moduleNotes: [...nextState.moduleNotes, `${input.module}: FAIL / ${reason}`],
  });

  switch (input.module) {
    case "shape_theory": {
      if (input.context.shape.runtime.hardFailureTriggered || !input.context.shape.runtime.lawPassed) {
        return fail(input.context.shape.runtime.failureReason ?? "shape theory failed meta execution");
      }

      nextState.executedModules.push(input.module);
      nextState.variations = unique([...nextState.variations, input.context.shape.outputVisual]);
      nextState.relations = unique([
        ...nextState.relations,
        `shape_theory -> field via ${input.context.shape.positionTendency}`,
      ]);
      nextState.structureBias = clamp(nextState.structureBias + input.context.shape.runtime.scores.relation * 0.18, 0, 1);
      nextState.attentionBias = clamp(nextState.attentionBias + input.context.shape.runtime.scores.attention * 0.2, 0, 1);
      nextState.moduleNotes.push(`shape_theory: ${input.context.shape.type} / ${input.context.shape.behavior}`);
      return nextState;
    }
    case "shape_grammar": {
      if (input.context.shapeGrammar.runtime.hardFailureTriggered || !input.context.shapeGrammar.runtime.lawPassed) {
        return fail(input.context.shapeGrammar.runtime.failureReason ?? "shape grammar failed meta execution");
      }

      nextState.executedModules.push(input.module);
      nextState.axes = unique([
        ...nextState.axes,
        `grammar:${input.context.shapeGrammar.runtime.systemStateUpdate.rulePriorities.dominantRule}`,
      ]);
      nextState.variations = unique([...nextState.variations, input.context.shapeGrammar.outputVisual]);
      nextState.relations = unique([
        ...nextState.relations,
        `shape_grammar -> shape_theory via ${input.context.shapeGrammar.rulesApplied[0] ?? "stabilization"}`,
      ]);
      nextState.coherenceBias = clamp(nextState.coherenceBias + input.context.shapeGrammar.runtime.scores.coherence * 0.22, 0, 1);
      nextState.integrationBias = clamp(nextState.integrationBias + input.context.shapeGrammar.runtime.scores.relation * 0.18, 0, 1);
      nextState.moduleNotes.push(`shape_grammar: ${input.context.shapeGrammar.rulesApplied.join(", ") || "none"}`);
      return nextState;
    }
    case "composition_structure": {
      if (!input.context.structure.runtime.isValidStructure || !input.context.structure.runtime.lawPassed) {
        return fail("composition structure invalid for meta execution");
      }

      nextState.executedModules.push(input.module);
      nextState.axes = unique([...nextState.axes, `structure:${input.context.structure.grid}`]);
      nextState.variations = unique([...nextState.variations, input.context.structure.outputVisual]);
      nextState.relations = unique([
        ...nextState.relations,
        `composition_structure -> attention via ${input.context.structure.subjectPosition}`,
      ]);
      nextState.structureBias = clamp(nextState.structureBias + input.context.structure.runtime.scores.center * 0.24, 0, 1);
      nextState.integrationBias = clamp(nextState.integrationBias + input.context.structure.runtime.scores.attention * 0.16, 0, 1);
      nextState.moduleNotes.push(`composition_structure: ${input.context.structure.grid} / ${input.context.structure.centerState}`);
      return nextState;
    }
    case "art_composition": {
      if (!input.context.artComposition.runtime.isValidComposition || !input.context.artComposition.runtime.lawPassed) {
        return fail("art composition invalid for meta execution");
      }

      nextState.executedModules.push(input.module);
      nextState.axes = unique([...nextState.axes, `art:${input.context.artComposition.focusNode}`]);
      nextState.variations = unique([...nextState.variations, input.context.artComposition.outputVisual]);
      nextState.relations = unique([
        ...nextState.relations,
        `art_composition -> color_theory via ${input.context.artComposition.focusNode}`,
      ]);
      nextState.coherenceBias = clamp(nextState.coherenceBias + input.context.artComposition.runtime.scores.unity * 0.18, 0, 1);
      nextState.attentionBias = clamp(nextState.attentionBias + input.context.artComposition.runtime.scores.focus * 0.2, 0, 1);
      nextState.moduleNotes.push(`art_composition: ${input.context.artComposition.focusNode}`);
      return nextState;
    }
    case "color_theory": {
      if (!input.context.palette.runtime.isValidPalette || !input.context.palette.runtime.lawPassed) {
        return fail("color theory invalid for meta execution");
      }

      nextState.executedModules.push(input.module);
      nextState.axes = unique([...nextState.axes, `color:${input.context.palette.dominant}`]);
      nextState.variations = unique([...nextState.variations, input.context.palette.outputVisual]);
      nextState.relations = unique([
        ...nextState.relations,
        `color_theory -> art_composition via ${input.context.palette.accent}`,
      ]);
      nextState.coherenceBias = clamp(nextState.coherenceBias + input.context.palette.runtime.scores.colorRelations * 0.18, 0, 1);
      nextState.attentionBias = clamp(nextState.attentionBias + input.context.palette.runtime.scores.attentionImpact * 0.14, 0, 1);
      nextState.moduleNotes.push(`color_theory: ${input.context.palette.dominant} / ${input.context.palette.accent}`);
      return nextState;
    }
    case "scenario": {
      if (!input.context.scenario.runtime.isValidScenario || !input.context.scenario.runtime.lawPassed) {
        return fail("scenario invalid for meta execution");
      }

      nextState.executedModules.push(input.module);
      nextState.axes = unique([...nextState.axes, `scenario:${input.context.scenario.coreConflict}`]);
      nextState.variations = unique([...nextState.variations, input.context.scenario.outputStructure]);
      nextState.relations = unique([
        ...nextState.relations,
        `scenario -> composition_structure via ${input.context.scenario.progression[0] ?? "drift"}`,
      ]);
      nextState.coherenceBias = clamp(nextState.coherenceBias + input.context.scenario.runtime.scores.meaning * 0.2, 0, 1);
      nextState.attentionBias = clamp(nextState.attentionBias + input.context.scenario.runtime.scores.attention * 0.18, 0, 1);
      nextState.integrationBias = clamp(nextState.integrationBias + input.context.scenario.runtime.scores.progression * 0.16, 0, 1);
      nextState.moduleNotes.push(`scenario: ${input.context.scenario.coreConflict}`);
      return nextState;
    }
    case "clock": {
      if (!input.context.clockDisplay || !input.context.clockDisplay.runtime.isValidClockState || !input.context.clockDisplay.runtime.lawPassed) {
        return fail("clock invalid for meta execution");
      }

      nextState.executedModules.push(input.module);
      nextState.axes = unique([...nextState.axes, `time:${input.context.clockDisplay.attentionAnchor}`]);
      nextState.variations = unique([...nextState.variations, input.context.clockDisplay.outputVisual]);
      nextState.relations = unique([
        ...nextState.relations,
        `clock -> pipeline via ${input.context.clockDisplay.transition}`,
      ]);
      nextState.attentionBias = clamp(nextState.attentionBias + input.context.clockDisplay.runtime.scores.attention * 0.14, 0, 1);
      nextState.integrationBias = clamp(nextState.integrationBias + input.context.clockDisplay.runtime.scores.perception * 0.12, 0, 1);
      nextState.moduleNotes.push(`clock: ${input.context.clockDisplay.visualStyle} / ${input.context.clockDisplay.transition}`);
      return nextState;
    }
  }
}

function reweightRemainingModules(input: {
  currentState: MetaDesignState;
  remainingPipeline: MetaModuleKey[];
  context: MetaModuleContext;
}) {
  const {
    shape,
    shapeGrammar,
    structure,
    artComposition,
    scenario,
    palette,
    clockDisplay,
  } = input.context;

  const nextWeights: Record<MetaModuleKey, number> = {
    ...input.currentState.moduleWeights,
  };

  nextWeights.shape_theory = clamp(
    shape.runtime.scores.identity * 0.28 +
      shape.runtime.scores.attention * 0.24 +
      (input.currentState.executedModules.includes("shape_grammar") ? 0.18 : 0.08),
    0,
    1,
  );
  nextWeights.shape_grammar = clamp(
    shapeGrammar.runtime.scores.coherence * 0.32 +
      shapeGrammar.runtime.scores.relation * 0.24 +
      (shape.behavior === "unstable" ? 0.12 : 0.04),
    0,
    1,
  );
  nextWeights.composition_structure = clamp(
    structure.runtime.scores.center * 0.28 +
      structure.runtime.scores.attention * 0.24 +
      (scenario.runtime.scores.progression >= 0.72 ? 0.14 : 0.06),
    0,
    1,
  );
  nextWeights.art_composition = clamp(
    artComposition.runtime.scores.focus * 0.28 +
      artComposition.runtime.scores.unity * 0.2 +
      (palette.runtime.scores.attentionImpact >= 0.72 ? 0.14 : 0.06),
    0,
    1,
  );
  nextWeights.color_theory = clamp(
    palette.runtime.scores.colorRelations * 0.28 +
      palette.runtime.scores.attentionImpact * 0.24 +
      (artComposition.runtime.scores.contrast >= 0.72 ? 0.12 : 0.04),
    0,
    1,
  );
  nextWeights.scenario = clamp(
    scenario.runtime.scores.meaning * 0.28 +
      scenario.runtime.scores.attention * 0.24 +
      (shapeGrammar.runtime.scores.coherence >= 0.72 ? 0.12 : 0.04),
    0,
    1,
  );
  nextWeights.clock = clamp(
    clockDisplay
      ? clockDisplay.runtime.scores.attention * 0.24 +
        clockDisplay.runtime.scores.perception * 0.18 +
        (scenario.runtime.scores.progression >= 0.7 ? 0.12 : 0.04)
      : 0,
    0,
    1,
  );

  const reorderedRemaining = [...input.remainingPipeline].sort((left, right) => {
    const scoreDelta = nextWeights[right] - nextWeights[left];
    if (scoreDelta === 0) {
      return input.remainingPipeline.indexOf(left) - input.remainingPipeline.indexOf(right);
    }

    return scoreDelta;
  });

  const lead = reorderedRemaining[0] ?? null;
  const note = lead
    ? `lead ${lead} (${nextWeights[lead].toFixed(2)}) after ${input.currentState.executedModules.at(-1) ?? "start"}`
    : "no remaining modules to reweight";

  return {
    reorderedRemaining,
    moduleWeights: nextWeights,
    reweightNote: note,
  };
}

function conductRemainingPipeline(input: {
  currentState: MetaDesignState;
  remainingPipeline: MetaModuleKey[];
  conductor: MetaConductorState;
}) {
  const nextWeights = { ...input.currentState.moduleWeights };
  const boostedWeights = Object.fromEntries(
    Object.entries(nextWeights).map(([key, value]) => {
      const isTarget = input.conductor.targetModules.includes(key as MetaModuleKey);
      return [
        key,
        clamp(
          value + (isTarget ? input.conductor.pipelinePressure * 0.18 : 0),
          0,
          1,
        ),
      ];
    }),
  ) as Record<MetaModuleKey, number>;

  const reorderedRemaining = [...input.remainingPipeline].sort((left, right) => {
    const leftTarget = input.conductor.targetModules.indexOf(left);
    const rightTarget = input.conductor.targetModules.indexOf(right);

    if (leftTarget !== -1 || rightTarget !== -1) {
      if (leftTarget === -1) {
        return 1;
      }
      if (rightTarget === -1) {
        return -1;
      }
      if (leftTarget !== rightTarget) {
        return leftTarget - rightTarget;
      }
    }

    return (boostedWeights[right] ?? 0) - (boostedWeights[left] ?? 0);
  });

  return {
    reorderedRemaining,
    moduleWeights: boostedWeights,
    note: `conductor lead ${reorderedRemaining[0] ?? "none"} / targets ${input.conductor.targetModules.join(" > ") || "none"}`,
  };
}

function suppressRemainingModules(input: {
  currentState: MetaDesignState;
  remainingPipeline: MetaModuleKey[];
  context: MetaModuleContext;
}) {
  const suppressed = input.remainingPipeline.flatMap((module) => {
    if (module === "clock" && !input.context.clockDisplay) {
      return ["clock:time domain inactive"];
    }

    if (
      module === "color_theory" &&
      input.context.palette.runtime.scores.colorRelations < 0.58 &&
      input.currentState.executedModules.includes("art_composition")
    ) {
      return ["color_theory:palette too unstable after art pass"];
    }

    if (
      module === "art_composition" &&
      input.context.artComposition.runtime.scores.unity < 0.58 &&
      input.currentState.executedModules.includes("composition_structure")
    ) {
      return ["art_composition:unity too weak after structural lock"];
    }

    if (
      module === "scenario" &&
      input.context.scenario.runtime.scores.meaning < 0.56 &&
      input.currentState.coherenceBias >= 0.64
    ) {
      return ["scenario:meaning too weak for current coherence demand"];
    }

    if (
      module === "shape_grammar" &&
      input.context.shapeGrammar.runtime.hardFailureTriggered
    ) {
      return ["shape_grammar:hard failure active"];
    }

    if (
      module === "shape_theory" &&
      input.context.shape.runtime.hardFailureTriggered
    ) {
      return ["shape_theory:hard failure active"];
    }

    if (
      module === "composition_structure" &&
      input.context.structure.runtime.scores.center < 0.54 &&
      input.currentState.attentionBias >= 0.66
    ) {
      return ["composition_structure:center too weak for current attention demand"];
    }

    return [];
  });

  const suppressedModules = suppressed.map((entry) => entry.split(":")[0] ?? entry);
  const filteredRemaining = input.remainingPipeline.filter((module) => !suppressedModules.includes(module));

  return {
    filteredRemaining,
    suppressed,
    suppressedModules,
  };
}

function recoverSuppressedModules(input: {
  currentState: MetaDesignState;
  remainingPipeline: MetaModuleKey[];
  basePipeline: MetaModuleKey[];
  context: MetaModuleContext;
}) {
  const suppressedModuleNames = unique(
    input.currentState.suppressedModules.map((entry) => entry.split(":")[0] as MetaModuleKey),
  );

  const recoverable = suppressedModuleNames.flatMap((module) => {
    if (
      module === "clock" &&
      input.context.clockDisplay &&
      input.context.clockDisplay.runtime.isValidClockState &&
      input.context.clockDisplay.runtime.lawPassed
    ) {
      return ["clock:recovered after time field revalidated"];
    }

    if (
      module === "color_theory" &&
      (input.context.palette.runtime.scores.colorRelations >= 0.64 ||
        input.context.palette.runtime.scores.attentionImpact >= 0.68)
    ) {
      return ["color_theory:recovered after palette stabilized"];
    }

    if (
      module === "art_composition" &&
      (input.context.artComposition.runtime.scores.unity >= 0.62 ||
        input.context.artComposition.runtime.scores.focus >= 0.7)
    ) {
      return ["art_composition:recovered after compositional focus returned"];
    }

    if (
      module === "scenario" &&
      (input.context.scenario.runtime.scores.meaning >= 0.6 ||
        input.context.scenario.runtime.scores.attention >= 0.68)
    ) {
      return ["scenario:recovered after narrative meaning returned"];
    }

    if (
      module === "shape_grammar" &&
      !input.context.shapeGrammar.runtime.hardFailureTriggered &&
      input.context.shapeGrammar.runtime.lawPassed &&
      input.context.shapeGrammar.runtime.scores.coherence >= 0.64
    ) {
      return ["shape_grammar:recovered after grammar stabilized"];
    }

    if (
      module === "shape_theory" &&
      !input.context.shape.runtime.hardFailureTriggered &&
      input.context.shape.runtime.lawPassed &&
      input.context.shape.runtime.scores.identity >= 0.64
    ) {
      return ["shape_theory:recovered after shape identity returned"];
    }

    if (
      module === "composition_structure" &&
      (input.context.structure.runtime.scores.center >= 0.6 ||
        input.context.structure.runtime.scores.attention >= 0.68)
    ) {
      return ["composition_structure:recovered after structure re-centered"];
    }

    return [];
  });

  const recoveredModuleNames = unique(
    recoverable.map((entry) => entry.split(":")[0] as MetaModuleKey),
  );
  const recoveredModules = input.basePipeline.filter((module) =>
    recoveredModuleNames.includes(module) &&
    !input.currentState.executedModules.includes(module) &&
    !input.remainingPipeline.includes(module),
  );

  return {
    recovered: recoverable,
    recoveredModules,
  };
}

function runDesign(input: {
  pipeline: MetaModuleKey[];
  labyrinth: MetaLabyrinth;
  context: MetaModuleContext;
  conductor: MetaConductorState;
}) {
  let currentState = applyConductorPrelude({
    designState: initializeDesignState(input.labyrinth),
    conductor: input.conductor,
    conductedLabyrinth: input.labyrinth,
  });
  let remainingPipeline = [...input.pipeline];
  currentState.reorderedPipeline = [...remainingPipeline];

  while (remainingPipeline.length) {
    const [module, ...rest] = remainingPipeline;
    currentState = executeModule({
      module,
      currentState,
      context: input.context,
    });

    if (currentState.failed) {
      break;
    }

    const recovery = recoverSuppressedModules({
      currentState,
      remainingPipeline: rest,
      basePipeline: input.pipeline,
      context: input.context,
    });
    const suppression = suppressRemainingModules({
      currentState,
      remainingPipeline: [...rest, ...recovery.recoveredModules],
      context: input.context,
    });
    const reweighted = reweightRemainingModules({
      currentState,
      remainingPipeline: suppression.filteredRemaining,
      context: input.context,
    });
    const conducted = conductRemainingPipeline({
      currentState,
      remainingPipeline: reweighted.reorderedRemaining,
      conductor: input.conductor,
    });
    remainingPipeline = conducted.reorderedRemaining;
    currentState.moduleWeights = conducted.moduleWeights;
    currentState.reweightNotes = unique([
      ...currentState.reweightNotes,
      reweighted.reweightNote,
      conducted.note,
    ]);
    currentState.suppressedModules = unique([...currentState.suppressedModules, ...suppression.suppressed]);
    currentState.suppressionNotes = unique([...currentState.suppressionNotes, ...suppression.suppressed]);
    currentState.recoveredModules = unique([...currentState.recoveredModules, ...recovery.recovered]);
    currentState.recoveryNotes = unique([...currentState.recoveryNotes, ...recovery.recovered]);
    currentState.reorderedPipeline = [...currentState.executedModules, ...remainingPipeline];
  }

  return currentState;
}

function evaluateGlobalOutput(input: {
  designState: MetaDesignState;
  context: MetaModuleContext;
  pipeline: MetaModuleKey[];
}) {
  const { shape, shapeGrammar, structure, artComposition, scenario, palette, clockDisplay } = input.context;
  const shapeTokens = tokenize([shape.outputText, shape.outputVisual]);
  const grammarTokens = tokenize([shapeGrammar.outputText, shapeGrammar.outputVisual]);
  const structureTokens = tokenize([structure.outputText, structure.outputVisual]);
  const artTokens = tokenize([artComposition.outputText, artComposition.outputVisual]);
  const scenarioTokens = tokenize([scenario.outputText, scenario.outputStructure]);
  const colorTokens = tokenize([palette.outputText, palette.outputVisual]);

  const structureScore = clamp(
    structure.runtime.scores.attention * 0.26 +
      structure.runtime.scores.center * 0.2 +
      artComposition.runtime.scores.balance * 0.16 +
      shape.runtime.scores.relation * 0.12 +
      shapeGrammar.runtime.scores.relation * 0.12 +
      input.designState.structureBias * 0.14,
    0,
    1,
  );

  const coherence = clamp(
    shapeGrammar.runtime.scores.coherence * 0.2 +
      scenario.runtime.scores.meaning * 0.18 +
      palette.runtime.scores.colorRelations * 0.16 +
      artComposition.runtime.scores.unity * 0.16 +
      shape.runtime.scores.identity * 0.16 +
      input.designState.coherenceBias * 0.14,
    0,
    1,
  );

  const attention = clamp(
    shape.runtime.scores.attention * 0.2 +
      artComposition.runtime.scores.focus * 0.18 +
      structure.runtime.scores.attention * 0.16 +
      scenario.runtime.scores.attention * 0.16 +
      (clockDisplay ? clockDisplay.runtime.scores.attention * 0.12 : 0.08) +
      input.designState.attentionBias * 0.18,
    0,
    1,
  );

  const integration = clamp(
    overlapScore(shapeTokens, grammarTokens) * 0.2 +
      overlapScore(scenarioTokens, structureTokens) * 0.16 +
      overlapScore(artTokens, colorTokens) * 0.14 +
      overlapScore(shapeTokens, artTokens) * 0.12 +
      clamp(input.pipeline.length / 7, 0, 1) * 0.1 +
      clamp(input.designState.relations.length / 8, 0, 1) * 0.12 +
      clamp(input.designState.executedModules.length / Math.max(input.pipeline.length, 1), 0, 1) * 0.08 +
      shapeGrammar.runtime.scores.relation * 0.1 +
      input.designState.integrationBias * 0.18,
    0,
    1,
  );

  return {
    structure: structureScore,
    coherence,
    attention,
    integration,
  } satisfies MetaSystemScores;
}

export function validMetaSystem(scores: MetaSystemScores, thresholds: MetaSystemThresholds) {
  return scores.structure >= thresholds.structure &&
    scores.coherence >= thresholds.coherence &&
    scores.attention >= thresholds.attention &&
    scores.integration >= thresholds.integration;
}

function metasystemLaw(input: {
  scores: MetaSystemScores;
  pipeline: MetaModuleKey[];
  designState: MetaDesignState;
}) {
  const passed =
    input.designState.executedModules.length >= 3 &&
    input.designState.relations.length >= 3 &&
    (input.scores.integration * 0.42 + input.scores.coherence * 0.3 + input.scores.attention * 0.28) >= 0.7;

  return {
    passed,
    note: passed
      ? "MetaSystem modifică sistemul printr-o orchestrare lizibilă și inevitabilă."
      : "MetaSystem orchestrează modulele, dar nu schimbă încă suficient întregul sistem.",
  };
}

export function storeConceptInMetaMemory(input: {
  concept: {
    framework: ReturnType<typeof buildFramework>;
  };
  systemMemory: ReturnType<typeof runMemory>;
}) {
  return {
    ...input.systemMemory,
    influenceNotes: unique([
      ...input.systemMemory.influenceNotes,
      `stored ${input.concept.framework.intent}`,
    ]),
  };
}

function runMemory(input: {
  framework: ReturnType<typeof buildFramework>;
  history: HistoryEntry[];
  thoughtMemory: ThoughtMemoryEntry[];
  canonInfluence: CanonInfluenceContext;
}) {
  const globalWeight = clamp(
    Math.min(input.history.length, 6) * 0.08 +
      Math.min(input.thoughtMemory.length, 8) * 0.05 +
      input.canonInfluence.totalInfluence * 0.24,
    0,
    1,
  );

  const domainWeights = Object.fromEntries(
    input.framework.domain.map((domain) => [
      domain,
      clamp(globalWeight * 0.52 + (domain === "shape" ? 0.08 : domain === "composition" ? 0.06 : 0.04), 0, 1),
    ]),
  ) as Record<string, number>;

  return {
    globalWeight,
    domainWeights,
    appliedDomains: input.framework.domain,
    influenceWeight: clamp(globalWeight * 0.62 + input.canonInfluence.totalInfluence * 0.18, 0, 1),
    influenceNotes: unique([
      `memory global ${globalWeight.toFixed(2)}`,
      ...input.framework.domain.map((domain) => `memory ${domain} ${(domainWeights[domain] ?? 0).toFixed(2)}`),
    ]),
  };
}

export function evaluateCanonicalForMemory(input: {
  concept: {
    validation: MetaSystemScores;
    stage: string;
    sourceIdeaCanonCount: number;
  };
}) {
  const reuse = measureReuse({
    sourceIdeaCanonCount: input.concept.sourceIdeaCanonCount,
    validation: input.concept.validation,
  });
  const impact = measureImpact({
    validation: input.concept.validation,
  });
  const stability = measureStability({
    stage: input.concept.stage,
    validation: input.concept.validation,
  });

  return {
    canonical: reuse >= 0.62 && impact >= 0.66 && stability >= 0.64,
    reuse,
    impact,
    stability,
  };
}

export function updateMetaMemory(input: {
  concept: {
    framework: ReturnType<typeof buildFramework>;
    validation: MetaSystemScores;
    stage: string;
    sourceIdeaCanonCount: number;
  };
  systemMemory: ReturnType<typeof runMemory>;
}) {
  const storedMemory = storeConceptInMetaMemory({
    concept: {
      framework: input.concept.framework,
    },
    systemMemory: input.systemMemory,
  });
  const canonicalEvaluation = evaluateCanonicalForMemory({
    concept: {
      validation: input.concept.validation,
      stage: input.concept.stage,
      sourceIdeaCanonCount: input.concept.sourceIdeaCanonCount,
    },
  });

  return {
    ...storedMemory,
    storedConcept: input.concept.framework.intent,
    canonical: canonicalEvaluation.canonical,
    canonicalReuse: canonicalEvaluation.reuse,
    canonicalImpact: canonicalEvaluation.impact,
    canonicalStability: canonicalEvaluation.stability,
    influenceNotes: unique([
      ...storedMemory.influenceNotes,
      canonicalEvaluation.canonical
        ? `marked canonical ${input.concept.framework.intent}`
        : `not canonical ${input.concept.framework.intent}`,
    ]),
  };
}

function applyMemoryInfluence(input: {
  designState: MetaDesignState;
  memory: ReturnType<typeof updateMetaMemory>;
  framework: ReturnType<typeof buildFramework>;
}) {
  return {
    ...input.designState,
    relations: unique([
      ...input.designState.relations,
      `memory -> pipeline via ${input.framework.domain.join("/") || "none"}`,
      `memory -> priority via ${input.framework.priority}`,
    ]),
    moduleNotes: unique([
      ...input.designState.moduleNotes,
      ...input.memory.influenceNotes,
    ]),
    structureBias: clamp(
      input.designState.structureBias + input.memory.influenceWeight * 0.08,
      0,
      1,
    ),
    coherenceBias: clamp(
      input.designState.coherenceBias + input.memory.influenceWeight * 0.1,
      0,
      1,
    ),
    attentionBias: clamp(
      input.designState.attentionBias + input.memory.influenceWeight * 0.06,
      0,
      1,
    ),
    integrationBias: clamp(
      input.designState.integrationBias + input.memory.influenceWeight * 0.12,
      0,
      1,
    ),
  };
}

function runCanon(input: {
  framework: ReturnType<typeof buildFramework>;
  scores: MetaSystemScores;
  memory: ReturnType<typeof runMemory>;
}) {
  const reuse = clamp(input.memory.globalWeight * 0.58 + input.scores.coherence * 0.16, 0, 1);
  const impact = clamp(input.scores.attention * 0.4 + input.scores.integration * 0.34, 0, 1);
  const stability = clamp(input.scores.structure * 0.32 + input.scores.coherence * 0.28 + input.memory.globalWeight * 0.16, 0, 1);

  return {
    globalCandidate: reuse >= 0.64 && impact >= 0.68 && stability >= 0.66,
    domainCandidates: input.framework.domain.filter((domain) => {
      const domainWeight = input.memory.domainWeights[domain] ?? 0;
      return clamp(domainWeight * 0.5 + input.scores.integration * 0.22 + input.scores.attention * 0.18, 0, 1) >= 0.62;
    }),
    influenceWeight: clamp(
      (reuse >= 0.64 ? reuse * 0.18 : 0) +
        (impact >= 0.68 ? impact * 0.22 : 0) +
        (stability >= 0.66 ? stability * 0.18 : 0),
      0,
      1,
    ),
    influenceNotes: unique([
      `canon reuse ${reuse.toFixed(2)}`,
      `canon impact ${impact.toFixed(2)}`,
      `canon stability ${stability.toFixed(2)}`,
    ]),
  };
}

function applyCanonInfluence(input: {
  designState: MetaDesignState;
  canon: ReturnType<typeof runCanon>;
  framework: ReturnType<typeof buildFramework>;
}) {
  if (!input.canon.globalCandidate && !input.canon.domainCandidates.length) {
    return input.designState;
  }

  return {
    ...input.designState,
    relations: unique([
      ...input.designState.relations,
      `canon -> global via ${input.canon.globalCandidate ? "accepted" : "pending"}`,
      ...input.canon.domainCandidates.map((domain) => `canon -> ${domain}`),
    ]),
    moduleNotes: unique([
      ...input.designState.moduleNotes,
      ...input.canon.influenceNotes,
      `canon influence ${input.canon.influenceWeight.toFixed(2)} on ${input.framework.goal}`,
    ]),
    coherenceBias: clamp(
      input.designState.coherenceBias + input.canon.influenceWeight * 0.08,
      0,
      1,
    ),
    integrationBias: clamp(
      input.designState.integrationBias + input.canon.influenceWeight * 0.1,
      0,
      1,
    ),
  };
}

export function measureReuse(input: {
  sourceIdeaCanonCount: number;
  validation: MetaSystemScores;
}) {
  return clamp(
    (input.sourceIdeaCanonCount >= 2 ? 0.4 : 0.22) +
      input.validation.integration * 0.18 +
      input.validation.coherence * 0.12,
    0,
    1,
  );
}

export function measureImpact(input: {
  validation: MetaSystemScores;
}) {
  return clamp(
    input.validation.attention * 0.28 +
      input.validation.integration * 0.32 +
      input.validation.structure * 0.18,
    0,
    1,
  );
}

export function measureStability(input: {
  stage: string;
  validation: MetaSystemScores;
}) {
  return clamp(
    (input.stage === "canonical" ? 0.38 : input.stage === "resolved" ? 0.28 : 0.16) +
      input.validation.coherence * 0.14 +
      input.validation.structure * 0.12 +
      input.validation.integration * 0.1,
    0,
    1,
  );
}

export function isMetaCanonical(input: {
  metaSystem: MetaSystemState;
  validation: MetaSystemScores;
  stage: string;
  sourceIdeaCanonCount: number;
}) {
  const reuse = measureReuse({
    sourceIdeaCanonCount: input.sourceIdeaCanonCount,
    validation: input.validation,
  });
  const impact = measureImpact({
    validation: input.validation,
  });
  const stability = measureStability({
    stage: input.stage,
    validation: input.validation,
  });

  return reuse >= 0.62 && impact >= 0.66 && stability >= 0.64;
}

export function runMetaSystem(input: {
  current: ThoughtState;
  history: HistoryEntry[];
  thoughtMemory: ThoughtMemoryEntry[];
  canonInfluence: CanonInfluenceContext;
  clockDisplay: ClockDisplayState | null;
  scenario: NarrativeScenarioState;
  artComposition: ArtCompositionState;
  compositionStructure: CompositionStructureState;
  shape: ShapeTheoryState;
  shapeGrammar: ShapeGrammarState;
  palette: ColorPaletteState;
}) {
  const framework = buildFramework({
    current: input.current,
    shape: input.shape,
    shapeGrammar: input.shapeGrammar,
    structure: input.compositionStructure,
    artComposition: input.artComposition,
    scenario: input.scenario,
    palette: input.palette,
    clockDisplay: input.clockDisplay,
  });
  const labyrinth = runLabyrinth({
    framework,
    shape: input.shape,
    shapeGrammar: input.shapeGrammar,
    structure: input.compositionStructure,
    artComposition: input.artComposition,
    scenario: input.scenario,
    palette: input.palette,
    clockDisplay: input.clockDisplay,
  });
  const conductor = buildConductorState({
    framework,
    labyrinth,
    context: {
      shape: input.shape,
      shapeGrammar: input.shapeGrammar,
      structure: input.compositionStructure,
      artComposition: input.artComposition,
      scenario: input.scenario,
      palette: input.palette,
      clockDisplay: input.clockDisplay,
    },
  });
  const conductedLabyrinth = composeConductedLabyrinth({
    labyrinth,
    framework,
    conductor,
    context: {
      shape: input.shape,
      shapeGrammar: input.shapeGrammar,
      structure: input.compositionStructure,
      artComposition: input.artComposition,
      scenario: input.scenario,
      palette: input.palette,
      clockDisplay: input.clockDisplay,
    },
  });
  const designOutput = generateDesignOutput({
    explorationMap: conductedLabyrinth.explorationMap,
  });
  const activePipeline = selectModulePipeline(framework.domain);
  const designState = runDesign({
    pipeline: activePipeline,
    labyrinth: conductedLabyrinth,
    context: {
      shape: input.shape,
      shapeGrammar: input.shapeGrammar,
      structure: input.compositionStructure,
      artComposition: input.artComposition,
      scenario: input.scenario,
      palette: input.palette,
      clockDisplay: input.clockDisplay,
    },
    conductor,
  });
  const thresholds = defaultThresholds();
  const baseMemory = runMemory({
    framework,
    history: input.history,
    thoughtMemory: input.thoughtMemory,
    canonInfluence: input.canonInfluence,
  });
  const preliminaryScores = {
    structure: clamp(
      input.compositionStructure.runtime.scores.center * 0.34 +
        input.shape.runtime.scores.relation * 0.2 +
        input.artComposition.runtime.scores.balance * 0.18,
      0,
      1,
    ),
    coherence: clamp(
      input.shapeGrammar.runtime.scores.coherence * 0.38 +
        input.scenario.runtime.scores.meaning * 0.22 +
        input.palette.runtime.scores.colorRelations * 0.14,
      0,
      1,
    ),
    attention: clamp(
      input.artComposition.runtime.scores.focus * 0.34 +
        input.palette.runtime.scores.attentionImpact * 0.22 +
        input.scenario.runtime.scores.attention * 0.16,
      0,
      1,
    ),
    integration: clamp(
      input.shapeGrammar.runtime.scores.relation * 0.3 +
        input.scenario.runtime.scores.progression * 0.2 +
        input.compositionStructure.runtime.scores.attention * 0.16,
      0,
      1,
    ),
  } satisfies MetaSystemScores;
  const updatedMemory = updateMetaMemory({
    concept: {
      framework,
      validation: preliminaryScores,
      stage: "resolved",
      sourceIdeaCanonCount: input.canonInfluence.totalInfluence >= 0.66 ? 2 : input.canonInfluence.totalInfluence >= 0.32 ? 1 : 0,
    },
    systemMemory: baseMemory,
  });
  const memoryInfluencedDesignState = applyMemoryInfluence({
    designState,
    memory: updatedMemory,
    framework,
  });
  const scores = evaluateGlobalOutput({
    designState: memoryInfluencedDesignState,
    context: {
      shape: input.shape,
      shapeGrammar: input.shapeGrammar,
      structure: input.compositionStructure,
      artComposition: input.artComposition,
      scenario: input.scenario,
      palette: input.palette,
      clockDisplay: input.clockDisplay,
    },
    pipeline: activePipeline,
  });
  const validationPassed = !designState.failed && validMetaSystem(scores, thresholds);
  const canon = runCanon({
    framework,
    scores,
    memory: updatedMemory,
  });
  const canonInfluencedDesignState = applyCanonInfluence({
    designState: memoryInfluencedDesignState,
    canon,
    framework,
  });
  const law = metasystemLaw({
    scores,
    pipeline: activePipeline,
    designState: canonInfluencedDesignState,
  });
  const failureReason =
    designState.failed
      ? "design_failure"
      : !validationPassed
        ? "validation_thresholds"
        : !law.passed
          ? "law_rejection"
          : null;
  const failed = failureReason !== null;

  return {
    outputText: `MetaSystem orchestrează ${activePipeline.join(", ") || "niciun modul"} în jurul intenției ${framework.intent}.`,
    outputVisual: `${framework.domain.join(" / ") || "none"} :: ${activePipeline.join(" > ") || "no-pipeline"} :: memory ${updatedMemory.influenceWeight.toFixed(2)} :: canon ${canon.influenceWeight.toFixed(2)}`,
    runtime: {
      framework,
      labyrinth: conductedLabyrinth,
      designOutput,
      conductor,
      activePipeline,
      designState: {
        executedModules: canonInfluencedDesignState.executedModules,
        reorderedPipeline: canonInfluencedDesignState.reorderedPipeline,
        suppressedModules: canonInfluencedDesignState.suppressedModules,
        suppressionNotes: canonInfluencedDesignState.suppressionNotes,
        recoveredModules: canonInfluencedDesignState.recoveredModules,
        recoveryNotes: canonInfluencedDesignState.recoveryNotes,
        moduleWeights: canonInfluencedDesignState.moduleWeights,
        reweightNotes: canonInfluencedDesignState.reweightNotes,
        failed: canonInfluencedDesignState.failed,
        failureModule: canonInfluencedDesignState.failureModule,
        failureReason: canonInfluencedDesignState.failureReason,
        moduleNotes: canonInfluencedDesignState.moduleNotes,
      },
      memory: updatedMemory,
      validationPassed,
      canon,
      thresholds,
      scores,
      failed,
      failureReason,
      lawPassed: law.passed,
      lawNote: law.note,
      notes: [
        `framework ${framework.intent}`,
        `domains ${framework.domain.join(" | ") || "none"}`,
        `conductor ${conductor.targetModules.join(" > ") || "none"}`,
        `design ${designOutput.direction} / ${designOutput.style} / ${designOutput.layout} / ${designOutput.motion}`,
        `pipeline ${activePipeline.join(" > ") || "none"}`,
        `executed ${designState.executedModules.join(" > ") || "none"}`,
        `reordered ${designState.reorderedPipeline.join(" > ") || "none"}`,
        `design fail ${designState.failed ? `${designState.failureModule ?? "unknown"} / ${designState.failureReason ?? "unknown"}` : "none"}`,
        `meta fail ${failureReason ?? "none"}`,
        `memory ${updatedMemory.globalWeight.toFixed(2)}`,
        `canon global ${canon.globalCandidate ? "candidate" : "not-yet"}`,
      ],
    } satisfies MetaSystemRuntime,
  };
}
