import type { AnalyticProfile } from "@/lib/mindslice/concept-analytic-engine-system";
import {
  runAuthorValueSystemV1,
  type AuthorHistoricalDataPoint,
  type AuthorValueProfile,
} from "@/lib/mindslice/concept-author-value-system";
import {
  runCanonEngineV1,
  type CanonEngineResult,
} from "@/lib/mindslice/concept-canon-engine-system";
import {
  runThresholdModelV2,
  type HistoricalMemorySignal,
  type ThresholdModelResult,
} from "@/lib/mindslice/concept-threshold-model-system";
import {
  runSliceRepetitionEngineV1,
  type SliceRepetitionInput,
  type SliceRepetitionResult,
} from "@/lib/mindslice/concept-slice-repetition-engine-system";

export type LearningLoopDecision = "RESTART" | "LOOP_BACK" | "REFINE" | "STORE" | "CANON_CHECK";

export type LearningLoopFailure = {
  status: "fail";
  message: string;
};

export type LearningLoopPresent = {
  raw_experience: unknown;
  context: {
    kind: string;
    signal_count: number;
    has_score: boolean;
  };
  timestamp: string;
};

export type LearningLoopLearning = {
  patterns: string[];
  actions: string[];
  insights: string[];
};

export type LearningLoopRecap = {
  validated_patterns: string[];
  key_insights: string[];
  repeatable_actions: string[];
};

export type LearningLoopLegacy = {
  patterns: string[];
  insights: string[];
  rules: string[];
  stability: number;
};

export type LearningLoopScore = {
  clarity: number;
  impact: number;
  frequency: number;
  reusability: number;
  expansion: number;
  total: number;
};

export type LearningLoopUpdatedState = {
  behavioral_bias: string[];
  scoring_weight: number;
  canonical_influence: boolean;
  next_context: {
    focus: string;
    rules: string[];
    stability: number;
  };
};

export type LearningCycleOutput = {
  present: LearningLoopPresent;
  learning: LearningLoopLearning;
  recap: LearningLoopRecap;
  threshold: ThresholdModelResult;
  slice_repetition_result: SliceRepetitionResult;
  legacy: LearningLoopLegacy;
  score: LearningLoopScore;
  canon_result: CanonEngineResult;
  author_value_profile: AuthorValueProfile;
};

export type LearningLoopResult =
  | {
      updated_state: LearningLoopUpdatedState;
      learning_cycle_output: LearningCycleOutput;
      canonical_state: boolean;
    }
  | LearningLoopFailure;

export type LearningLoopInput = {
  execution_input: unknown;
  author_id?: string;
  historical_author_data?: AuthorHistoricalDataPoint[];
  system_memory?: LearningLoopLegacy[];
  historical_memory?: HistoricalMemorySignal[];
  historical_slices?: SliceRepetitionInput[];
  analytic_profile?: AnalyticProfile;
  max_depth?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function now() {
  return new Date().toISOString();
}

function fail(message = "FAIL"): LearningLoopFailure {
  return {
    status: "fail",
    message,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function extractText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  const record = asRecord(value);
  const directText = [record.thought, record.text, record.quote, record.execution]
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ");

  if (directText.trim()) {
    return directText;
  }

  return JSON.stringify(value);
}

function tokenize(value: unknown) {
  return extractText(value)
    .toLowerCase()
    .replace(/[^a-zăâîșț0-9 -]+/giu, " ")
    .split(/[\s-]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 3);
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function extractContext(executionInput: unknown): LearningLoopPresent["context"] {
  const record = asRecord(executionInput);
  const outputs = asRecord(record.outputs);

  return {
    kind: typeof record.status === "string" ? record.status : Array.isArray(executionInput) ? "list" : typeof executionInput,
    signal_count: Object.keys(outputs).length || tokenize(executionInput).length,
    has_score: typeof asRecord(record.score).total === "number",
  };
}

export function processPresent(executionInput: unknown): LearningLoopPresent {
  return {
    raw_experience: executionInput,
    context: extractContext(executionInput),
    timestamp: now(),
  };
}

function detectPatterns(rawExperience: unknown) {
  const record = asRecord(rawExperience);
  const outputs = asRecord(record.outputs);
  const outputPatterns = Object.keys(outputs).map((step) => `output:${step}`);
  const keywordPatterns = unique(tokenize(rawExperience)).slice(0, 8).map((token) => `keyword:${token}`);

  return unique([...outputPatterns, ...keywordPatterns]).slice(0, 10);
}

function extractActions(rawExperience: unknown) {
  const record = asRecord(rawExperience);
  const learningState = asRecord(record.learning_state);
  const adjustments = Array.isArray(learningState.pipeline_adjustments)
    ? learningState.pipeline_adjustments.filter((entry): entry is string => typeof entry === "string")
    : [];
  const thresholdModel = asRecord(record.threshold_model);
  const thresholdState = asRecord(thresholdModel.threshold_state);
  const nextAction = typeof thresholdState.next_action === "string" ? [thresholdState.next_action] : [];

  return unique([...adjustments, ...nextAction, "review_execution"]).slice(0, 8);
}

function generateInsights(rawExperience: unknown) {
  const record = asRecord(rawExperience);
  const analytic = asRecord(record.analytic_profile);
  const score = asRecord(record.score);
  const thresholdModel = asRecord(record.threshold_model);
  const thresholdState = asRecord(thresholdModel.threshold_state);
  const insights = [
    typeof analytic.subject === "string" ? `subject:${analytic.subject}` : "",
    typeof analytic.importance === "string" ? `importance:${analytic.importance}` : "",
    typeof thresholdState.classification === "string" ? `classification:${thresholdState.classification}` : "",
    typeof score.total === "number" ? `score:${score.total.toFixed(2)}` : "",
  ];

  return unique(insights).slice(0, 8);
}

export function processLearning(present: LearningLoopPresent): LearningLoopLearning {
  return {
    patterns: detectPatterns(present.raw_experience),
    actions: extractActions(present.raw_experience),
    insights: generateInsights(present.raw_experience),
  };
}

function filterNoise(learning: LearningLoopLearning): LearningLoopLearning {
  return {
    patterns: unique(learning.patterns).filter((entry) => !entry.includes("undefined")),
    actions: unique(learning.actions).filter((entry) => !entry.includes("undefined")),
    insights: unique(learning.insights).filter((entry) => !entry.includes("undefined")),
  };
}

function validatePatterns(patterns: string[]) {
  return patterns.filter((pattern) => pattern.length >= 6).slice(0, 8);
}

function selectKeyInsights(insights: string[]) {
  return insights.filter(Boolean).slice(0, 5);
}

function extractRepeatable(actions: string[]) {
  return actions.filter((action) => action !== "RESTART").slice(0, 5);
}

export function processRecap(learning: LearningLoopLearning): LearningLoopRecap {
  const filtered = filterNoise(learning);

  return {
    validated_patterns: validatePatterns(filtered.patterns),
    key_insights: selectKeyInsights(filtered.insights),
    repeatable_actions: extractRepeatable(filtered.actions),
  };
}

function analyticProfileFrom(recap: LearningLoopRecap): AnalyticProfile {
  const joined = [...recap.validated_patterns, ...recap.key_insights, ...recap.repeatable_actions].join(" ");
  const difficulty = clamp(2 + recap.validated_patterns.length / 3 + recap.repeatable_actions.length / 5, 1, 5);
  const importance = recap.key_insights.some((insight) => insight.includes("critical"))
    ? "critical"
    : recap.key_insights.some((insight) => insight.includes("high"))
      ? "high"
      : "medium";

  return {
    subject: recap.key_insights.find((insight) => insight.startsWith("subject:"))?.replace("subject:", "") || "learning loop",
    importance,
    context: joined.includes("tehnologic") ? ["tehnologic"] : joined.includes("social") ? ["social"] : ["general"],
    time: "present",
    nature: joined.includes("output:") ? "hybrid" : "abstract",
    execution: recap.repeatable_actions.join(" / ") || "refine learning cycle",
    presentation: recap.repeatable_actions.length >= 2 ? "emergent" : "dynamic",
    difficulty: Math.round(difficulty),
    access: recap.validated_patterns.length >= 6 ? "advanced" : "self",
    flexibility: recap.repeatable_actions.includes("increase_labyrinth_priority") ? "adaptive" : "semi_flexible",
    quote: recap.key_insights[0] ?? "learning cycle",
  };
}

function recapAsThresholdContext(recap: LearningLoopRecap) {
  const patternCoherence = clamp(recap.validated_patterns.length / 8, 0, 1);
  const insightCoherence = clamp(recap.key_insights.length / 5, 0, 1);
  const actionCoherence = clamp(recap.repeatable_actions.length / 5, 0, 1);

  return {
    outputs: {
      Framework: {
        coherence: patternCoherence,
        payload: recap.validated_patterns,
      },
      Labyrinth: {
        coherence: insightCoherence,
        payload: recap.key_insights,
      },
      Design: {
        coherence: actionCoherence,
        payload: recap.repeatable_actions,
      },
      Memory: {
        coherence: clamp((patternCoherence + insightCoherence + actionCoherence) / 3, 0, 1),
        payload: recap,
      },
    },
    system_state: {
      direction_shift: recap.repeatable_actions.length >= 2,
      master_status: "ok",
    },
  };
}

export function processThreshold(recap: LearningLoopRecap, historicalMemory: HistoricalMemorySignal[]) {
  return runThresholdModelV2(analyticProfileFrom(recap), recapAsThresholdContext(recap), historicalMemory);
}

export function decisionGate(threshold: ThresholdModelResult): LearningLoopDecision {
  const classification = threshold.threshold_state.classification;

  if (classification === "NOISE") {
    return "RESTART";
  }
  if (classification === "FRAGMENT") {
    return "LOOP_BACK";
  }
  if (classification === "PRE_CONCEPT") {
    return "REFINE";
  }
  if (classification === "CANONICAL_CANDIDATE") {
    return "CANON_CHECK";
  }
  return "STORE";
}

function generateRules(actions: string[]) {
  return actions.map((action) => `when similar, ${action.toLowerCase()}`).slice(0, 5);
}

function measureLegacyStability(recap: LearningLoopRecap) {
  return clamp(
    recap.validated_patterns.length * 0.08 +
      recap.key_insights.length * 0.12 +
      recap.repeatable_actions.length * 0.1,
    0,
    1,
  );
}

export function processLegacy(recap: LearningLoopRecap, systemMemory: LearningLoopLegacy[] = []): LearningLoopLegacy {
  const legacy = {
    patterns: unique([...systemMemory.flatMap((entry) => entry.patterns), ...recap.validated_patterns]).slice(0, 14),
    insights: unique([...systemMemory.flatMap((entry) => entry.insights), ...recap.key_insights]).slice(0, 12),
    rules: generateRules(recap.repeatable_actions),
    stability: measureLegacyStability(recap),
  };

  systemMemory.unshift(legacy);

  return legacy;
}

export function processScoring(legacy: LearningLoopLegacy): LearningLoopScore {
  const clarity = clamp(legacy.patterns.length / 4, 0, 5);
  const impact = clamp(legacy.insights.length / 3 + legacy.stability, 0, 5);
  const frequency = clamp(legacy.rules.length / 2, 0, 5);
  const reusability = clamp(legacy.rules.length / 3 + legacy.stability * 2, 0, 5);
  const expansion = clamp((legacy.patterns.length + legacy.insights.length) / 5, 0, 5);

  return {
    clarity,
    impact,
    frequency,
    reusability,
    expansion,
    total: clarity + impact + frequency + reusability + expansion,
  };
}

export function processCanon(
  score: LearningLoopScore,
  legacy: LearningLoopLegacy,
  threshold: ThresholdModelResult,
  historicalMemory: HistoricalMemorySignal[],
) {
  return runCanonEngineV1(
    {
      concept_id: legacy.insights[0] ?? legacy.patterns[0] ?? "learning_loop_concept",
      title: legacy.insights[0] ?? "Learning loop concept",
      subject: legacy.insights[0] ?? legacy.patterns[0] ?? "learning loop",
      keywords: legacy.insights,
      patterns: legacy.patterns,
    },
    score,
    threshold,
    historicalMemory,
    [],
  );
}

function extractBehavioralBias(legacy: LearningLoopLegacy) {
  return legacy.rules.slice(0, 3);
}

function prepareNextContext(legacy: LearningLoopLegacy) {
  return {
    focus: legacy.insights[0] ?? legacy.patterns[0] ?? "continue_learning",
    rules: legacy.rules,
    stability: legacy.stability,
  };
}

function buildAuthorValueConcept(legacy: LearningLoopLegacy, score: LearningLoopScore) {
  return {
    concept_id: legacy.insights[0] ?? legacy.patterns[0] ?? "learning_loop_concept",
    score: {
      total: score.total,
    },
    confidence: {
      overall: clamp(score.total / 25, 0, 1),
    },
  };
}

export function reinject(
  legacy: LearningLoopLegacy,
  score: LearningLoopScore,
  canonResult: CanonEngineResult,
): LearningLoopUpdatedState {
  const canonicalInfluence = !("status" in canonResult) && canonResult.canon_status === "CANONICAL";

  return {
    behavioral_bias: extractBehavioralBias(legacy),
    scoring_weight: score.total,
    canonical_influence: canonicalInfluence,
    next_context: prepareNextContext(legacy),
  };
}

function refine(recap: LearningLoopRecap) {
  return {
    thought: [...recap.key_insights, ...recap.validated_patterns].join(" "),
    actions: recap.repeatable_actions,
    refined: true,
  };
}

function buildCurrentSlice(executionInput: unknown): SliceRepetitionInput {
  const record = asRecord(executionInput);
  const parsedSlice = asRecord(record.parsed_slice);
  const parsedContent = asRecord(parsedSlice.content);
  const analytic = asRecord(record.analytic_profile);

  return {
    id:
      (typeof parsedSlice.slice_id === "string" && parsedSlice.slice_id) ||
      (typeof record.slice_id === "string" && record.slice_id) ||
      "current_slice",
    text:
      (typeof parsedContent.text === "string" && parsedContent.text) ||
      (typeof record.thought === "string" && record.thought) ||
      (typeof analytic.quote === "string" && analytic.quote) ||
      "",
  };
}

export function runLearningLoopEngineV2(input: LearningLoopInput, depth = 0): LearningLoopResult {
  const maxDepth = input.max_depth ?? 2;
  const systemMemory = input.system_memory ?? [];
  const historicalMemory = input.historical_memory ?? [];
  const present = processPresent(input.execution_input);
  const learning = processLearning(present);
  const recap = processRecap(learning);
  const threshold = input.analytic_profile
    ? runThresholdModelV2(input.analytic_profile, recapAsThresholdContext(recap), historicalMemory)
    : processThreshold(recap, historicalMemory);
  const decision = decisionGate(threshold);

  if (decision === "RESTART") {
    return fail("NOISE");
  }

  if ((decision === "LOOP_BACK" || decision === "REFINE") && depth < maxDepth) {
    return runLearningLoopEngineV2(
      {
        ...input,
        execution_input: decision === "LOOP_BACK" ? recap : refine(recap),
      },
      depth + 1,
    );
  }

  const sliceRepetitionResult = runSliceRepetitionEngineV1(
    buildCurrentSlice(input.execution_input),
    input.historical_slices ?? [],
  );
  const legacy = processLegacy(recap, systemMemory);
  const score = processScoring(legacy);
  const canonResult = processCanon(score, legacy, threshold, historicalMemory);
  const authorValueProfile = runAuthorValueSystemV1(
    input.author_id ?? "anonymous_author",
    buildAuthorValueConcept(legacy, score),
    score,
    canonResult,
    input.historical_author_data ?? [],
  );
  const canonicalState = !("status" in canonResult) && canonResult.canon_status === "CANONICAL";
  const updatedState = reinject(legacy, score, canonResult);

  return {
    updated_state: updatedState,
    learning_cycle_output: {
      present,
      learning,
      recap,
      threshold,
      slice_repetition_result: sliceRepetitionResult,
      legacy,
      score,
      canon_result: canonResult,
      author_value_profile: authorValueProfile,
    },
    canonical_state: canonicalState,
  };
}
