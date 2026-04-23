import { runAnalyticEngine, type AnalyticProfile } from "@/lib/mindslice/concept-analytic-engine-system";
import { runMasterEngine, type RunMasterEngineResult } from "@/lib/mindslice/concept-master-engine-system";
import { runParserEngine, type ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type {
  CanonInfluenceContext,
  ClockDisplayState,
  HistoryEntry,
  LiveInterference,
  ThoughtMemoryEntry,
  ThoughtState,
  UserProfile,
} from "@/lib/mindslice/mindslice-types";

export type ExecutionEngineStep =
  | "Framework"
  | "Labyrinth"
  | "Design"
  | "ShapeTheory"
  | "ShapeGrammar"
  | "CompositionStructure"
  | "ColorTheory"
  | "ArtComposition"
  | "Scenario"
  | "Memory"
  | "Business"
  | "Clock";

export type ExecutionScore = {
  clarity: number;
  impact: number;
  frequency: number;
  reusability: number;
  expansion: number;
  total: number;
};

export type ExecutionLearningState = {
  successful_steps: ExecutionEngineStep[];
  weak_steps: ExecutionEngineStep[];
  pipeline_adjustments: string[];
  new_thresholds: Record<string, string>;
};

export type ExecutionLogEntry = {
  step: ExecutionEngineStep;
  status: "success";
  result: unknown;
};

type StepResult = {
  step: ExecutionEngineStep;
  payload: unknown;
  coherence: number;
  introducesNewDirection: boolean;
};

export type ExecutionContext = {
  slice: ParsedSliceObject;
  analytic: AnalyticProfile;
  outputs: Partial<Record<ExecutionEngineStep, StepResult>>;
  last_output: StepResult | null;
  system_state: {
    direction_shift?: boolean;
    master_status?: RunMasterEngineResult["status"];
  };
  master_result: RunMasterEngineResult | null;
  thought: ThoughtState;
};

export type ExecutionEngineFailure = {
  status: "fail";
  message: string;
};

export type ExecutionEngineResult =
  | {
      parsed_slice: ParsedSliceObject;
      analytic_profile: AnalyticProfile;
      outputs: Partial<Record<ExecutionEngineStep, unknown>>;
      score: ExecutionScore;
      execution_log: ExecutionLogEntry[];
      learning_state: ExecutionLearningState;
    }
  | ExecutionEngineFailure;

type RunExecutionEngineInput = {
  rawSliceText: string;
  user?: UserProfile | null;
  history?: HistoryEntry[];
  thoughtMemory?: ThoughtMemoryEntry[];
  interference?: LiveInterference | null;
  canonInfluence?: CanonInfluenceContext | null;
  clockDisplay?: ClockDisplayState | null;
};

const MAX_RETRIES = 2;

const DEFAULT_PIPELINE: ExecutionEngineStep[] = [
  "Framework",
  "Labyrinth",
  "Design",
  "ShapeTheory",
  "ShapeGrammar",
  "CompositionStructure",
  "ColorTheory",
  "ArtComposition",
  "Scenario",
  "Memory",
  "Business",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/u)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeStepName(step: string): ExecutionEngineStep | null {
  const normalized = step.trim().toLowerCase().replace(/[\s_-]+/gu, "");
  const registry: Record<string, ExecutionEngineStep> = {
    framework: "Framework",
    labyrinth: "Labyrinth",
    design: "Design",
    shapetheory: "ShapeTheory",
    shapegrammar: "ShapeGrammar",
    compositionstructure: "CompositionStructure",
    colortheory: "ColorTheory",
    artcomposition: "ArtComposition",
    scenario: "Scenario",
    memory: "Memory",
    business: "Business",
    clock: "Clock",
  };

  return registry[normalized] ?? null;
}

function importanceToScore(importance: AnalyticProfile["importance"]) {
  if (importance === "critical") {
    return 0.92;
  }
  if (importance === "high") {
    return 0.78;
  }
  if (importance === "medium") {
    return 0.61;
  }
  return 0.42;
}

function accessToScore(access: AnalyticProfile["access"]) {
  if (access === "expert") {
    return 0.88;
  }
  if (access === "advanced") {
    return 0.68;
  }
  return 0.5;
}

function buildPaletteFromAnalytic(analytic: AnalyticProfile, parsedSlice: ParsedSliceObject) {
  const taggedPalette = parsedSlice.metadata.tags
    .filter((tag) => ["ink", "graphite", "sepia", "crimson", "azure", "ochre"].includes(tag.toLowerCase()))
    .slice(0, 3);

  if (taggedPalette.length) {
    return taggedPalette;
  }

  if (analytic.context.includes("filozofic")) {
    return ["ink", "bone", "graphite"];
  }
  if (analytic.context.includes("social")) {
    return ["crimson", "ash", "steel"];
  }

  return ["paper", "graphite", "ember"];
}

function buildThoughtState(parsedSlice: ParsedSliceObject, analytic: AnalyticProfile): ThoughtState {
  const fragments = splitSentences(parsedSlice.content.text).slice(0, 4);
  const subjectLead = analytic.subject || parsedSlice.content.type || "concept";
  const direction = analytic.quote || `${subjectLead} în devenire`;
  const intensity = parsedSlice.metadata.intensity ?? 0.5;
  const difficultyRatio = clamp(analytic.difficulty / 5, 0, 1);

  return {
    direction,
    thought: parsedSlice.content.text.trim(),
    fragments: fragments.length ? fragments : [parsedSlice.content.text.trim()],
    mood: analytic.context.join(", "),
    palette: buildPaletteFromAnalytic(analytic, parsedSlice),
    materials: unique([
      ...(parsedSlice.metadata.tags.length ? parsedSlice.metadata.tags : []),
      analytic.nature === "concrete" ? "ink" : "conceptual graphite",
    ]).slice(0, 4),
    motion:
      analytic.presentation === "dynamic"
        ? "advancing"
        : analytic.presentation === "emergent"
          ? "forming"
          : "still",
    triad: {
      art: {
        score: clamp(0.48 + intensity * 0.34, 0.18, 0.95),
        label: analytic.nature === "abstract" ? "visionary" : "situated",
      },
      design: {
        score: clamp(0.44 + difficultyRatio * 0.38, 0.18, 0.95),
        label: analytic.presentation === "static" ? "ordered" : "adaptive",
      },
      business: {
        score: clamp(importanceToScore(analytic.importance), 0.18, 0.95),
        label: analytic.access === "expert" ? "focused" : "open",
      },
    },
    visual: {
      background: analytic.context.includes("filozofic") ? "bone" : "paper",
      accent: buildPaletteFromAnalytic(analytic, parsedSlice)[0] ?? "ink",
      ink: "graphite",
      mode: analytic.presentation,
      density: clamp(0.36 + intensity * 0.4, 0, 1),
      wave: clamp(0.28 + (analytic.presentation === "dynamic" ? 0.34 : 0.12), 0, 1),
      fracture: clamp(analytic.flexibility === "rigid" ? 0.2 : 0.48, 0, 1),
      drift: clamp(analytic.time === "future" ? 0.64 : 0.32, 0, 1),
      convergence: clamp(0.3 + accessToScore(analytic.access) * 0.44, 0, 1),
    },
    keywords: unique([analytic.subject, ...parsedSlice.metadata.tags]).slice(0, 8),
  };
}

function fail(message = "FAIL"): ExecutionEngineFailure {
  return {
    status: "fail",
    message,
  };
}

export function buildPipeline(
  parsedSlice: ParsedSliceObject,
  analyticProfile: AnalyticProfile,
): ExecutionEngineStep[] {
  const declaredPipeline = parsedSlice.process.pipeline
    .map(normalizeStepName)
    .filter((step): step is ExecutionEngineStep => step !== null);

  const pipeline = declaredPipeline.length ? [...declaredPipeline] : [...DEFAULT_PIPELINE];

  if (analyticProfile.importance === "critical" && !pipeline.includes("Scenario")) {
    pipeline.push("Scenario");
  }

  if (analyticProfile.difficulty >= 4) {
    const labyrinthIndex = pipeline.indexOf("Labyrinth");
    const designIndex = pipeline.indexOf("Design");

    if (labyrinthIndex === -1) {
      pipeline.unshift("Labyrinth");
    } else if (designIndex !== -1 && labyrinthIndex > designIndex) {
      pipeline.splice(labyrinthIndex, 1);
      pipeline.splice(designIndex, 0, "Labyrinth");
    }
  }

  if (analyticProfile.nature === "abstract") {
    const withoutFramework = pipeline.filter((step) => step !== "Framework");
    return unique(["Framework", ...withoutFramework]);
  }

  return unique(pipeline);
}

export function initContext(
  parsedSlice: ParsedSliceObject,
  analyticProfile: AnalyticProfile,
): ExecutionContext {
  return {
    slice: parsedSlice,
    analytic: analyticProfile,
    outputs: {},
    last_output: null,
    system_state: {},
    master_result: null,
    thought: buildThoughtState(parsedSlice, analyticProfile),
  };
}

function buildExecutionIdentity(user: UserProfile | null | undefined, parsedSlice: ParsedSliceObject) {
  const identityType =
    user?.identity_type ??
    (parsedSlice.identity.type === "indexed" ? "indexed" : "pseudonym");
  const displayName =
    identityType === "indexed"
      ? parsedSlice.identity.index_name ?? user?.indexed_name ?? null
      : parsedSlice.identity.pseudonym ?? user?.pseudonym ?? null;

  return {
    user: user
      ? {
          ...user,
          identity_type: identityType,
          pseudonym: user.pseudonym ?? parsedSlice.identity.pseudonym ?? null,
          indexed_name: user.indexed_name ?? parsedSlice.identity.index_name ?? null,
        }
      : {
          user_id: "execution-engine-anonymous",
          pseudonym: displayName,
          indexed_name: identityType === "indexed" ? displayName : null,
          identity_type: identityType,
          author_role: null,
          subscription_status: null,
        },
  };
}

function getMasterResult(
  context: ExecutionContext,
  user: UserProfile | null | undefined,
  input: Omit<RunExecutionEngineInput, "rawSliceText" | "user">,
) {
  if (context.master_result) {
    return context.master_result;
  }

  const identity = buildExecutionIdentity(user, context.slice);
  context.master_result = runMasterEngine({
    user: identity.user,
    idea: context.thought,
    history: input.history ?? [],
    thoughtMemory: input.thoughtMemory ?? [],
    interference: context.slice.control.allow_contamination ? input.interference ?? null : null,
    canonInfluence: input.canonInfluence ?? null,
    clockDisplay: input.clockDisplay ?? null,
  });
  context.system_state.master_status = context.master_result.status;

  return context.master_result;
}

function buildBusinessStep(context: ExecutionContext) {
  const businessScore = clamp(
    context.thought.triad.business.score * 0.42 +
      importanceToScore(context.analytic.importance) * 0.28 +
      (context.outputs.Memory?.coherence ?? 0.5) * 0.16 +
      accessToScore(context.analytic.access) * 0.14,
    0,
    1,
  );

  return {
    focus: context.analytic.execution,
    access: context.analytic.access,
    flexibility: context.analytic.flexibility,
    strategic_quote: context.analytic.quote,
    score: businessScore,
  };
}

export function executeStep(
  step: ExecutionEngineStep,
  context: ExecutionContext,
  input: Omit<RunExecutionEngineInput, "rawSliceText">,
): StepResult | ExecutionEngineFailure {
  const masterResult = getMasterResult(context, input.user, input);

  if (masterResult.status === "fail") {
    return fail(masterResult.reason.toUpperCase());
  }

  const metaRuntime = masterResult.output.concept.conceptState.expression.metaSystem.runtime;
  const expression = masterResult.output.concept.conceptState.expression;

  switch (step) {
    case "Framework":
      return {
        step,
        payload: metaRuntime.framework,
        coherence: clamp(metaRuntime.scores.coherence, 0, 1),
        introducesNewDirection: context.analytic.nature === "abstract",
      };
    case "Labyrinth":
      return {
        step,
        payload: metaRuntime.labyrinth.explorationMap,
        coherence: clamp(metaRuntime.scores.integration, 0, 1),
        introducesNewDirection: (metaRuntime.labyrinth.connections?.length ?? 0) >= 2,
      };
    case "Design":
      return {
        step,
        payload: metaRuntime.designOutput,
        coherence: clamp((metaRuntime.scores.structure + metaRuntime.scores.attention) / 2, 0, 1),
        introducesNewDirection: metaRuntime.designOutput.motion === "counter_motion",
      };
    case "ShapeTheory":
      return {
        step,
        payload: expression.shape,
        coherence: clamp(expression.shape.runtime.scores.identity, 0, 1),
        introducesNewDirection: expression.shape.runtime.detectedPrimitiveShape === "VOLUME",
      };
    case "ShapeGrammar":
      return {
        step,
        payload: expression.shapeGrammar,
        coherence: clamp(expression.shapeGrammar.runtime.scores.coherence, 0, 1),
        introducesNewDirection:
          expression.shapeGrammar.runtime.generatedForm.evolved === "VOLUME",
      };
    case "CompositionStructure":
      return {
        step,
        payload: expression.compositionStructure,
        coherence: clamp(
          expression.compositionStructure.runtime.compositionLayout?.balanceScore ??
            expression.compositionStructure.runtime.generatedLayout?.balanceScore ??
            0.4,
          0,
          1,
        ),
        introducesNewDirection:
          expression.compositionStructure.runtime.selectedStrategy === "offset",
      };
    case "ColorTheory":
      return {
        step,
        payload: expression.palette,
        coherence: clamp(
          expression.palette.runtime.colorPalette?.saturation ??
            expression.palette.runtime.compositionPalette?.saturation ??
            0.3,
          0.3,
          1,
        ),
        introducesNewDirection:
          (expression.palette.runtime.colorPalette?.hue ??
            expression.palette.runtime.compositionPalette?.hue) === "contrast_hue",
      };
    case "ArtComposition":
      return {
        step,
        payload: expression.artComposition,
        coherence: clamp(expression.artComposition.runtime.visualScore ?? 0.4, 0, 1),
        introducesNewDirection: Boolean(expression.artComposition.runtime.visualRefined),
      };
    case "Scenario":
      return {
        step,
        payload: expression.scenario,
        coherence: clamp(
          (expression.scenario.runtime.extractedTension ? 0.4 : 0.2) +
            (expression.scenario.runtime.narrativeSequence?.length ?? 0) * 0.14,
          0,
          1,
        ),
        introducesNewDirection:
          (expression.scenario.runtime.narrativeSequence?.length ?? 0) >= 4,
      };
    case "Memory":
      return {
        step,
        payload: masterResult.memory,
        coherence: clamp(masterResult.memory.canonicalImpact ?? 0.5, 0, 1),
        introducesNewDirection: Boolean(masterResult.memory.canonical),
      };
    case "Business": {
      const business = buildBusinessStep(context);
      return {
        step,
        payload: business,
        coherence: business.score,
        introducesNewDirection: business.flexibility === "adaptive",
      };
    }
    case "Clock":
      return {
        step,
        payload: expression.clock,
        coherence: clamp(expression.clock?.runtime.scores.attention ?? 0.38, 0, 1),
        introducesNewDirection: Boolean(expression.clock?.transition?.includes("shift")),
      };
    default:
      return fail("UNKNOWN_STEP");
  }
}

export function minCoherence(step: ExecutionEngineStep) {
  switch (step) {
    case "Framework":
      return 0.6;
    case "Labyrinth":
      return 0.55;
    case "Design":
      return 0.65;
    case "ShapeTheory":
      return 0.6;
    case "ShapeGrammar":
      return 0.6;
    case "CompositionStructure":
      return 0.7;
    case "ColorTheory":
      return 0.65;
    case "ArtComposition":
      return 0.75;
    case "Scenario":
      return 0.7;
    case "Memory":
      return 0.5;
    case "Business":
      return 0.55;
    case "Clock":
      return 0.5;
    default:
      return 0.5;
  }
}

export function validateStep(step: ExecutionEngineStep, result: StepResult | ExecutionEngineFailure) {
  if ("status" in result) {
    return false;
  }

  if (result.payload == null) {
    return false;
  }

  if (Array.isArray(result.payload) && result.payload.length === 0) {
    return false;
  }

  if (
    typeof result.payload === "object" &&
    result.payload !== null &&
    !Array.isArray(result.payload) &&
    Object.keys(result.payload).length === 0
  ) {
    return false;
  }

  return result.coherence >= minCoherence(step);
}

export function executeWithRetry(
  step: ExecutionEngineStep,
  context: ExecutionContext,
  input: Omit<RunExecutionEngineInput, "rawSliceText">,
) {
  let attempts = 0;

  while (attempts <= MAX_RETRIES) {
    const result = executeStep(step, context, input);

    if (validateStep(step, result)) {
      return result as StepResult;
    }

    attempts += 1;
  }

  return fail();
}

export function updateContext(
  context: ExecutionContext,
  step: ExecutionEngineStep,
  result: StepResult,
) {
  context.outputs[step] = result;
  context.last_output = result;

  if (result.introducesNewDirection) {
    context.system_state.direction_shift = true;
  }

  return context;
}

export function adaptPipelineIfNeeded(
  pipeline: ExecutionEngineStep[],
  context: ExecutionContext,
  analyticProfile: AnalyticProfile,
) {
  const adapted = [...pipeline];

  if (context.system_state.direction_shift === true) {
    if (analyticProfile.presentation === "dynamic" && !adapted.includes("Scenario")) {
      adapted.push("Scenario");
    }

    if (analyticProfile.flexibility === "adaptive" && !adapted.includes("Labyrinth")) {
      adapted.unshift("Labyrinth");
    }
  }

  return unique(adapted);
}

export function handleFailure(step: ExecutionEngineStep): ExecutionEngineStep | ExecutionEngineFailure {
  switch (step) {
    case "Design":
      return "Framework";
    case "Scenario":
      return "Labyrinth";
    case "ArtComposition":
      return "CompositionStructure";
    case "ColorTheory":
      return "ShapeTheory";
    default:
      return fail();
  }
}

function measureClarity(context: ExecutionContext) {
  return clamp(
    (context.outputs.Framework?.coherence ?? 0.4) * 0.35 +
      (context.outputs.Design?.coherence ?? 0.4) * 0.35 +
      (context.outputs.Scenario?.coherence ?? 0.4) * 0.3,
    0,
    5,
  );
}

function measureImpact(context: ExecutionContext) {
  return clamp(
    (context.outputs.ArtComposition?.coherence ?? 0.4) * 0.42 +
      (context.outputs.Business?.coherence ?? 0.4) * 0.3 +
      (context.outputs.Memory?.coherence ?? 0.4) * 0.28,
    0,
    5,
  );
}

function measureFrequency(context: ExecutionContext) {
  const outputCount = Object.keys(context.outputs).length;
  return clamp(outputCount / 2.4, 0, 5);
}

function measureReusability(context: ExecutionContext) {
  return clamp(
    (context.outputs.Memory?.coherence ?? 0.4) * 0.6 +
      (context.outputs.Framework?.coherence ?? 0.4) * 0.4,
    0,
    5,
  );
}

function measureExpansion(context: ExecutionContext) {
  const directionShift = context.system_state.direction_shift ? 0.9 : 0.45;
  return clamp(
    directionShift * 1.8 +
      (context.outputs.Labyrinth?.coherence ?? 0.4) * 1.7 +
      (context.outputs.ShapeGrammar?.coherence ?? 0.4) * 1.5,
    0,
    5,
  );
}

export function computeScore(context: ExecutionContext): ExecutionScore {
  const clarity = measureClarity(context);
  const impact = measureImpact(context);
  const frequency = measureFrequency(context);
  const reusability = measureReusability(context);
  const expansion = measureExpansion(context);

  return {
    clarity,
    impact,
    frequency,
    reusability,
    expansion,
    total: clarity + impact + frequency + reusability + expansion,
  };
}

export function updateThresholds(score: ExecutionScore) {
  const thresholds: Record<string, string> = {};

  if (score.total > 18) {
    thresholds.coherence = "higher";
    thresholds.attention = "higher";
  } else if (score.total < 12) {
    thresholds.labyrinth = "earlier";
    thresholds.design = "stricter";
  } else {
    thresholds.state = "stable";
  }

  return thresholds;
}

export function learnFromExecution(
  context: ExecutionContext,
  executionLog: ExecutionLogEntry[],
  score: ExecutionScore,
): ExecutionLearningState {
  const learning: ExecutionLearningState = {
    successful_steps: executionLog.map((entry) => entry.step),
    weak_steps: [],
    pipeline_adjustments: [],
    new_thresholds: {},
  };

  for (const [step, result] of Object.entries(context.outputs) as Array<[ExecutionEngineStep, StepResult]>) {
    if (result.coherence < 0.65) {
      learning.weak_steps.push(step);
    }
  }

  if (score.total > 18) {
    learning.pipeline_adjustments.push("reinforce_current_pipeline");
  }

  if (score.total < 12) {
    learning.pipeline_adjustments.push("increase_labyrinth_priority");
    learning.pipeline_adjustments.push("increase_validation_strictness");
  }

  learning.new_thresholds = updateThresholds(score);

  return learning;
}

export function runExecutionEngineV3(
  input: RunExecutionEngineInput | string,
): ExecutionEngineResult {
  const normalizedInput =
    typeof input === "string"
      ? {
          rawSliceText: input,
        }
      : input;

  const parsedSlice = runParserEngine(normalizedInput.rawSliceText);

  if (!parsedSlice) {
    return fail("INVALID_SLICE");
  }

  const analyticProfile = runAnalyticEngine(parsedSlice);

  if (!analyticProfile) {
    return fail("INVALID_ANALYTIC_PROFILE");
  }

  let pipeline = buildPipeline(parsedSlice, analyticProfile);
  let context = initContext(parsedSlice, analyticProfile);
  const executionLog: ExecutionLogEntry[] = [];

  for (let index = 0; index < pipeline.length; index += 1) {
    const step = pipeline[index];
    let result = executeWithRetry(step, context, normalizedInput);

    if ("status" in result) {
      const recovery = handleFailure(step);

      if (typeof recovery !== "string") {
        return fail("PIPELINE_ABORTED");
      }

      result = executeWithRetry(recovery, context, normalizedInput);

      if ("status" in result) {
        return fail("RECOVERY_FAILED");
      }
    }

    context = updateContext(context, step, result);
    executionLog.push({
      step,
      status: "success",
      result: result.payload,
    });

    pipeline = adaptPipelineIfNeeded(pipeline, context, analyticProfile);
  }

  const score = computeScore(context);
  const learningState = learnFromExecution(context, executionLog, score);

  return {
    parsed_slice: parsedSlice,
    analytic_profile: analyticProfile,
    outputs: Object.fromEntries(
      Object.entries(context.outputs).map(([step, result]) => [step, result.payload]),
    ) as Partial<Record<ExecutionEngineStep, unknown>>,
    score,
    execution_log: executionLog,
    learning_state: learningState,
  };
}
