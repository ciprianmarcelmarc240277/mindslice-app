import type { AnalyticProfile } from "@/lib/mindslice/concept-analytic-engine-system";

export type ThresholdClassification =
  | "NOISE"
  | "FRAGMENT"
  | "PRE_CONCEPT"
  | "CONCEPT"
  | "CANONICAL_CANDIDATE";

export type ThresholdNextAction =
  | "RETURN_TO_FRAMEWORK"
  | "INSERT_LABYRINTH"
  | "PRIORITIZE_DESIGN"
  | "PRIORITIZE_STRUCTURE"
  | "REFINE"
  | "STORE_AND_SCORE"
  | "STORE_SCORE_AND_CANON_CHECK";

export type ThresholdMeasuredState = {
  structure: number;
  sense: number;
  attention: number;
  coherence: number;
};

export type ThresholdLearningSignals = {
  success: number;
  failure: number;
  reuse: number;
  stability: number;
  learning_factor: number;
};

export type ThresholdValues = {
  "τs": number;
  "τm": number;
  "τa": number;
  "τc": number;
};

export type ThresholdBuildResult = ThresholdValues & {
  learning: ThresholdLearningSignals;
};

export type ThresholdDecisionFlags = {
  weak_structure?: true;
  low_meaning?: true;
  low_attention?: true;
  low_coherence?: true;
  needs_attention_design?: true;
  needs_structural_refinement?: true;
};

export type ThresholdState = {
  classification: ThresholdClassification;
  state: ThresholdMeasuredState;
  thresholds: ThresholdValues;
  learning: ThresholdLearningSignals;
  next_action: ThresholdNextAction;
};

export type ThresholdModelResult = {
  threshold_state: ThresholdState;
  flags: ThresholdDecisionFlags;
  updated_thresholds: ThresholdValues;
};

export type HistoricalMemorySignal = {
  success?: boolean;
  failed?: boolean;
  failure?: boolean;
  canonical?: boolean;
  reuse?: number;
  reuse_count?: number;
  stability?: number;
  stability_score?: number;
  time_persistence?: number;
  impact?: number;
  impact_score?: number;
};

type ExecutionOutputSignal = {
  coherence?: number;
  payload?: unknown;
  introducesNewDirection?: boolean;
};

export type ThresholdExecutionContext = {
  outputs?: Record<string, ExecutionOutputSignal | undefined>;
  score?: {
    clarity?: number;
    impact?: number;
    frequency?: number;
    reusability?: number;
    expansion?: number;
    total?: number;
  };
  system_state?: {
    direction_shift?: boolean;
    master_status?: string;
  };
  master_result?: {
    status?: string;
  } | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[], fallback = 0.5) {
  const finiteValues = values.filter((value) => Number.isFinite(value));

  if (!finiteValues.length) {
    return fallback;
  }

  return clamp(
    finiteValues.reduce((total, value) => total + value, 0) / finiteValues.length,
    0,
    1,
  );
}

function outputCoherence(context: ThresholdExecutionContext, steps: string[]) {
  return steps
    .map((step) => context.outputs?.[step]?.coherence)
    .filter((value): value is number => typeof value === "number");
}

function measureStructure(executionContext: ThresholdExecutionContext) {
  return average(
    outputCoherence(executionContext, [
      "Framework",
      "ShapeTheory",
      "ShapeGrammar",
      "CompositionStructure",
    ]),
    executionContext.score?.clarity ?? 0.5,
  );
}

function measureMeaning(executionContext: ThresholdExecutionContext) {
  return average(
    outputCoherence(executionContext, ["Framework", "Labyrinth", "Scenario", "Business"]),
    executionContext.score?.impact ?? 0.5,
  );
}

function measureAttention(executionContext: ThresholdExecutionContext) {
  return average(
    outputCoherence(executionContext, ["Design", "ArtComposition", "Scenario", "Clock"]),
    executionContext.score?.expansion ?? 0.5,
  );
}

function measureCoherence(executionContext: ThresholdExecutionContext) {
  const allOutputScores = Object.values(executionContext.outputs ?? {})
    .map((output) => output?.coherence)
    .filter((value): value is number => typeof value === "number");
  const masterBonus =
    executionContext.master_result?.status === "ok" || executionContext.system_state?.master_status === "ok"
      ? 0.06
      : 0;

  return clamp(average(allOutputScores, executionContext.score?.reusability ?? 0.5) + masterBonus, 0, 1);
}

export function measureCurrentState(executionContext: ThresholdExecutionContext): ThresholdMeasuredState {
  return {
    structure: measureStructure(executionContext),
    sense: measureMeaning(executionContext),
    attention: measureAttention(executionContext),
    coherence: measureCoherence(executionContext),
  };
}

export function baseThresholdStructure(difficulty: number) {
  return clamp(0.5 + difficulty * 0.08, 0.4, 0.95);
}

export function baseThresholdMeaning(importance: AnalyticProfile["importance"]) {
  if (importance === "critical") {
    return 0.8;
  }
  if (importance === "high") {
    return 0.7;
  }
  if (importance === "medium") {
    return 0.6;
  }
  return 0.5;
}

export function baseThresholdAttention(importance: AnalyticProfile["importance"]) {
  if (importance === "critical") {
    return 0.85;
  }
  if (importance === "high") {
    return 0.7;
  }
  if (importance === "medium") {
    return 0.55;
  }
  return 0.4;
}

export function baseThresholdCoherence(difficulty: number) {
  return clamp(0.6 + difficulty * 0.07, 0.4, 0.95);
}

function normalizeMemoryValue(value: unknown, fallback = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return value > 1 ? clamp(value / 10, 0, 1) : clamp(value, 0, 1);
}

export function extractLearningSignals(historicalMemory: HistoricalMemorySignal[]): ThresholdLearningSignals {
  if (!historicalMemory.length) {
    return {
      success: 0.5,
      failure: 0.1,
      reuse: 0.3,
      stability: 0.3,
      learning_factor: 0.25,
    };
  }

  const success = average(
    historicalMemory.map((entry) => (entry.success || entry.canonical ? 1 : entry.failed || entry.failure ? 0 : 0.5)),
    0.5,
  );
  const failure = average(
    historicalMemory.map((entry) => (entry.failed || entry.failure ? 1 : entry.success || entry.canonical ? 0 : 0.15)),
    0.1,
  );
  const reuse = average(
    historicalMemory.map((entry) => normalizeMemoryValue(entry.reuse ?? entry.reuse_count, 0.3)),
    0.3,
  );
  const stability = average(
    historicalMemory.map((entry) =>
      normalizeMemoryValue(entry.stability ?? entry.stability_score ?? entry.time_persistence, 0.3),
    ),
    0.3,
  );
  const learningFactor = clamp((success - failure + reuse + stability) / 4, -0.25, 0.75);

  return {
    success,
    failure,
    reuse,
    stability,
    learning_factor: learningFactor,
  };
}

export function adaptThreshold(baseValue: number, learningFactor: number, domainWeight: number) {
  return clamp(baseValue + learningFactor * domainWeight, 0.4, 0.95);
}

export function buildThresholds(
  analyticProfile: AnalyticProfile,
  historicalMemory: HistoricalMemorySignal[],
): ThresholdBuildResult {
  const learning = extractLearningSignals(historicalMemory);

  return {
    "τs": adaptThreshold(baseThresholdStructure(analyticProfile.difficulty), learning.learning_factor, 0.05),
    "τm": adaptThreshold(baseThresholdMeaning(analyticProfile.importance), learning.learning_factor, 0.04),
    "τa": adaptThreshold(baseThresholdAttention(analyticProfile.importance), learning.learning_factor, 0.06),
    "τc": adaptThreshold(baseThresholdCoherence(analyticProfile.difficulty), learning.learning_factor, 0.05),
    learning,
  };
}

export function passCount(state: ThresholdMeasuredState, thresholds: ThresholdValues) {
  let count = 0;

  if (state.structure >= thresholds["τs"]) {
    count += 1;
  }
  if (state.sense >= thresholds["τm"]) {
    count += 1;
  }
  if (state.attention >= thresholds["τa"]) {
    count += 1;
  }
  if (state.coherence >= thresholds["τc"]) {
    count += 1;
  }

  return count;
}

function detectCanonicalSignal(historicalMemory: HistoricalMemorySignal[], state: ThresholdMeasuredState) {
  const learning = extractLearningSignals(historicalMemory);
  const stateAverage = average([state.structure, state.sense, state.attention, state.coherence]);
  const canonicalEntries = historicalMemory.filter((entry) => entry.canonical).length;

  return canonicalEntries > 0 || (learning.reuse >= 0.62 && learning.stability >= 0.62 && stateAverage >= 0.74);
}

export function classifyState(
  state: ThresholdMeasuredState,
  thresholds: ThresholdValues,
  historicalMemory: HistoricalMemorySignal[],
): ThresholdClassification {
  const passed = passCount(state, thresholds);
  const canonicalSignal = detectCanonicalSignal(historicalMemory, state);

  if (passed <= 1) {
    return "NOISE";
  }
  if (passed === 2) {
    return "FRAGMENT";
  }
  if (passed === 3) {
    return "PRE_CONCEPT";
  }
  if (canonicalSignal) {
    return "CANONICAL_CANDIDATE";
  }
  return "CONCEPT";
}

export function generateFlags(state: ThresholdMeasuredState, thresholds: ThresholdValues): ThresholdDecisionFlags {
  const flags: ThresholdDecisionFlags = {};

  if (state.structure < thresholds["τs"]) {
    flags.weak_structure = true;
  }
  if (state.sense < thresholds["τm"]) {
    flags.low_meaning = true;
  }
  if (state.attention < thresholds["τa"]) {
    flags.low_attention = true;
  }
  if (state.coherence < thresholds["τc"]) {
    flags.low_coherence = true;
  }
  if (state.structure >= thresholds["τs"] && state.sense >= thresholds["τm"] && state.attention < thresholds["τa"]) {
    flags.needs_attention_design = true;
  }
  if (state.structure >= thresholds["τs"] && state.coherence < thresholds["τc"]) {
    flags.needs_structural_refinement = true;
  }

  return flags;
}

export function suggestNextAction(
  classification: ThresholdClassification,
  flags: ThresholdDecisionFlags,
): ThresholdNextAction {
  if (classification === "NOISE") {
    return "RETURN_TO_FRAMEWORK";
  }
  if (classification === "FRAGMENT") {
    return "INSERT_LABYRINTH";
  }
  if (classification === "PRE_CONCEPT") {
    if (flags.needs_attention_design) {
      return "PRIORITIZE_DESIGN";
    }
    if (flags.needs_structural_refinement) {
      return "PRIORITIZE_STRUCTURE";
    }
    return "REFINE";
  }
  if (classification === "CANONICAL_CANDIDATE") {
    return "STORE_SCORE_AND_CANON_CHECK";
  }
  return "STORE_AND_SCORE";
}

export function evolveThresholds(classification: ThresholdClassification, thresholds: ThresholdValues): ThresholdValues {
  const updated = { ...thresholds };

  if (classification === "NOISE") {
    updated["τs"] -= 0.01;
    updated["τm"] -= 0.01;
  }
  if (classification === "PRE_CONCEPT") {
    updated["τa"] += 0.01;
    updated["τc"] += 0.01;
  }
  if (classification === "CONCEPT") {
    updated["τs"] += 0.01;
    updated["τm"] += 0.01;
    updated["τa"] += 0.01;
    updated["τc"] += 0.01;
  }
  if (classification === "CANONICAL_CANDIDATE") {
    updated["τs"] += 0.02;
    updated["τm"] += 0.02;
    updated["τa"] += 0.02;
    updated["τc"] += 0.02;
  }

  return {
    "τs": clamp(updated["τs"], 0.4, 0.95),
    "τm": clamp(updated["τm"], 0.4, 0.95),
    "τa": clamp(updated["τa"], 0.4, 0.95),
    "τc": clamp(updated["τc"], 0.4, 0.95),
  };
}

export function runThresholdModelV2(
  analyticProfile: AnalyticProfile,
  executionContext: ThresholdExecutionContext,
  historicalMemory: HistoricalMemorySignal[] = [],
): ThresholdModelResult {
  const state = measureCurrentState(executionContext);
  const thresholds = buildThresholds(analyticProfile, historicalMemory);
  const thresholdValues = {
    "τs": thresholds["τs"],
    "τm": thresholds["τm"],
    "τa": thresholds["τa"],
    "τc": thresholds["τc"],
  };
  const classification = classifyState(state, thresholdValues, historicalMemory);
  const flags = generateFlags(state, thresholdValues);
  const nextAction = suggestNextAction(classification, flags);
  const updatedThresholds = evolveThresholds(classification, thresholdValues);

  return {
    threshold_state: {
      classification,
      state,
      thresholds: thresholdValues,
      learning: thresholds.learning,
      next_action: nextAction,
    },
    flags,
    updated_thresholds: updatedThresholds,
  };
}
