import type { AnalyticProfile } from "@/lib/mindslice/concept-analytic-engine-system";
import {
  runCanonEngineV1,
  type CanonConcept,
  type CanonEngineResult,
} from "@/lib/mindslice/concept-canon-engine-system";
import type { LearningLoopLegacy } from "@/lib/mindslice/concept-learning-loop-engine-system";
import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import {
  runScoringEngineV1,
  type ScoringProfile,
} from "@/lib/mindslice/concept-scoring-engine-system";
import {
  runSliceRepetitionEngineV1,
  type SliceIntent,
  type SliceRepetitionInput,
  type SliceRepetitionResult,
  type SliceStructurePattern,
} from "@/lib/mindslice/concept-slice-repetition-engine-system";
import {
  runThresholdModelV2,
  type HistoricalMemorySignal,
  type ThresholdModelResult,
} from "@/lib/mindslice/concept-threshold-model-system";

export type SliceLearningLoopFailure = {
  status: "fail";
  message: string;
};

export type SliceLearningPresent = {
  slice_id: string;
  raw_text: string;
  content_type: string | null;
  context: ParsedSliceObject["metadata"];
  timestamp: string;
};

export type SliceLearningLearning = {
  keywords: string[];
  concepts: string[];
  structure: SliceStructurePattern;
  intent: SliceIntent;
  insights: string[];
  tags: string[];
  intensity: number;
  content_type: string | null;
};

export type SliceLearningRecap = {
  validated_concepts: string[];
  key_insights: string[];
  structure_signature: SliceStructurePattern;
  intent_signature: SliceIntent;
  historical_reference_count: number;
  context_tags: string[];
  estimated_intensity: number;
  content_type: string | null;
};

export type SliceLearningLegacy = {
  stored_concepts: string[];
  stored_insights: string[];
  stored_structure: SliceStructurePattern;
  cluster_id: string;
  semantic_axis: string;
  repetition_type: SliceRepetitionResult["repetition_type"];
  evolution: SliceRepetitionResult["evolution"];
};

export type SliceLearningScore = ScoringProfile;

export type SliceLearningUpdatedState = {
  semantic_bias: string;
  cluster_bias: string;
  repetition_bias: SliceRepetitionResult["repetition_type"];
  score_weight: number;
  canonical_influence: string;
  next_context: {
    focus: string;
    structure: SliceStructurePattern;
    cluster_id: string;
  };
};

export type SliceLearningCycleOutput = {
  present: SliceLearningPresent;
  learning: SliceLearningLearning;
  recap: SliceLearningRecap;
  repetition: SliceRepetitionResult;
  threshold: ThresholdModelResult;
  legacy: SliceLearningLegacy;
  score: SliceLearningScore | null;
  canon: CanonEngineResult | null;
};

export type SliceLearningLoopResult =
  | {
      updated_state: SliceLearningUpdatedState;
      learning_cycle_output: SliceLearningCycleOutput;
      canonical_state: string;
    }
  | SliceLearningLoopFailure;

export type SliceLearningLoopInput = {
  parsed_slice: ParsedSliceObject;
  historical_slices?: SliceRepetitionInput[];
  system_memory?: {
    legacy?: SliceLearningLegacy[];
    canon?: CanonConcept[];
  };
  historical_memory?: HistoricalMemorySignal[];
  max_depth?: number;
};

const MAX_DEPTH_DEFAULT = 2;

const STOPWORDS = new Set([
  "si",
  "sau",
  "sunt",
  "este",
  "care",
  "pentru",
  "prin",
  "din",
  "intr",
  "aceasta",
  "acest",
  "aceste",
  "fara",
  "doar",
  "poate",
  "unde",
  "cand",
  "the",
  "and",
  "with",
  "that",
  "this",
  "from",
]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function now() {
  return new Date().toISOString();
}

function fail(message: string): SliceLearningLoopFailure {
  return {
    status: "fail",
    message,
  };
}

function normalizeText(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(text: string) {
  return normalizeText(text)
    .replace(/[^a-z0-9 -]+/g, " ")
    .split(/[\s-]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function scoreMap(tokens: string[]) {
  const counts = new Map<string, number>();

  tokens.forEach((token) => {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  });

  return counts;
}

function extractKeywords(text: string) {
  return [...scoreMap(tokenize(text)).entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([token]) => token);
}

function extractCoreConcepts(text: string) {
  return [...scoreMap(tokenize(text)).entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return right[0].length - left[0].length;
    })
    .slice(0, 5)
    .map(([token]) => token);
}

function extractStructurePattern(text: string): SliceStructurePattern {
  const trimmed = text.trim();
  const sentenceCount = trimmed.split(/(?<=[.!?])\s+/u).filter(Boolean).length;
  const lineCount = trimmed.split("\n").filter((line) => line.trim().length > 0).length;
  const listMarkers = (trimmed.match(/^\s*[-*]/gmu) || []).length;
  const commaDensity = (trimmed.match(/[,;:]/g) || []).length / Math.max(trimmed.length, 1);

  if (listMarkers >= 2) {
    return "list_like";
  }

  if (lineCount >= 3 && sentenceCount <= 2) {
    return "fragmented";
  }

  if (/^(trebuie|fa|construieste|organizeaza|seteaza)\b/i.test(trimmed)) {
    return "directive";
  }

  if (sentenceCount >= 3 || commaDensity > 0.04) {
    return "multi_sentence";
  }

  return "single_block";
}

function detectIntent(text: string): SliceIntent {
  const normalized = normalizeText(text);

  if (normalized.includes("?")) {
    return "question";
  }

  if (
    ["trebuie", "construieste", "organizeaza", "seteaza", "fa", "defineste"].some((term) =>
      normalized.includes(term),
    )
  ) {
    return "instruction";
  }

  if (["voi", "urmeaza", "viitor", "deveni", "o sa"].some((term) => normalized.includes(term))) {
    return "projection";
  }

  if (["cred", "simt", "gand", "reflect", "memorie", "intrebare interioara"].some((term) => normalized.includes(term))) {
    return "reflection";
  }

  if (["este", "ramane", "reprezinta", "inseamna", "deci"].some((term) => normalized.includes(term))) {
    return "declaration";
  }

  return "general";
}

function generateInsights(
  text: string,
  contentType: string | null,
  tags: string[],
  intensity: number,
) {
  const keywords = extractKeywords(text);
  const structure = extractStructurePattern(text);
  const intent = detectIntent(text);

  return unique([
    ...keywords.slice(0, 4).map((keyword) => `keyword:${keyword}`),
    `structure:${structure}`,
    `intent:${intent}`,
    ...(contentType ? [`content:${contentType}`] : []),
    ...(tags.slice(0, 2).map((tag) => `tag:${tag}`)),
    `intensity:${intensity.toFixed(2)}`,
  ]).slice(0, 6);
}

function filterNoise(learning: SliceLearningLearning): SliceLearningLearning {
  return {
    ...learning,
    keywords: unique(learning.keywords),
    concepts: unique(learning.concepts),
    insights: unique(learning.insights).filter((entry) => !entry.includes("undefined")),
  };
}

function validateConcepts(concepts: string[]) {
  return concepts.filter((concept) => concept.length >= 4).slice(0, 6);
}

function selectKeyInsights(insights: string[]) {
  return insights.filter(Boolean).slice(0, 5);
}

function dominantConcept(concepts: string[]) {
  return concepts[0] ?? "general";
}

function estimateImportance(
  insights: string[],
  historicalReferenceCount: number,
  intensity: number,
): AnalyticProfile["importance"] {
  if (
    intensity >= 0.8 ||
    insights.some((entry) => entry.includes("directive") || entry.includes("question"))
  ) {
    return "high";
  }

  if (historicalReferenceCount >= 3 || insights.length >= 4 || intensity >= 0.55) {
    return "medium";
  }

  return "low";
}

function detectNature(
  concepts: string[],
  contentType: string | null,
  contextTags: string[],
): AnalyticProfile["nature"] {
  const abstractMarkers = ["identitate", "sens", "memorie", "canon", "sistem", "structura"];
  const concreteMarkers = ["corp", "obiect", "cadru", "spatiu", "masa", "instrument"];
  const normalized = concepts.map((concept) => normalizeText(concept));
  const normalizedTags = contextTags.map((tag) => normalizeText(tag));
  const hasAbstract = normalized.some((concept) => abstractMarkers.some((marker) => concept.includes(marker)));
  const hasConcrete =
    normalized.some((concept) => concreteMarkers.some((marker) => concept.includes(marker))) ||
    normalizedTags.some((tag) => concreteMarkers.some((marker) => tag.includes(marker))) ||
    contentType === "visual" ||
    contentType === "object";

  if (hasAbstract && hasConcrete) {
    return "hybrid";
  }

  if (hasConcrete) {
    return "concrete";
  }

  return "abstract";
}

function detectPresentation(
  structureSignature: SliceStructurePattern,
  intentSignature: SliceIntent,
): AnalyticProfile["presentation"] {
  if (structureSignature === "fragmented" || structureSignature === "multi_sentence") {
    return "emergent";
  }

  if (
    structureSignature === "directive" ||
    structureSignature === "list_like" ||
    intentSignature === "instruction" ||
    intentSignature === "projection"
  ) {
    return "dynamic";
  }

  return "static";
}

function estimateDifficulty(
  structureSignature: SliceStructurePattern,
  historicalReferenceCount: number,
  intensity: number,
) {
  const base =
    structureSignature === "fragmented"
      ? 4
      : structureSignature === "multi_sentence" || structureSignature === "directive"
        ? 3
        : structureSignature === "list_like"
          ? 2
          : 1;

  return clamp(
    Math.round(base + historicalReferenceCount * 0.25 + (intensity >= 0.75 ? 1 : 0)),
    1,
    5,
  );
}

function buildThresholdContext(recap: SliceLearningRecap) {
  const conceptCoherence = clamp(recap.validated_concepts.length / 6, 0, 1);
  const insightCoherence = clamp(recap.key_insights.length / 5, 0, 1);
  const structureCoherence = recap.structure_signature === "single_block" ? 0.45 : 0.72;
  const historicalCoherence = clamp(recap.historical_reference_count / 6, 0, 1);

  return {
    outputs: {
      Framework: {
        coherence: conceptCoherence,
        payload: recap.validated_concepts,
      },
      Labyrinth: {
        coherence: insightCoherence,
        payload: recap.key_insights,
      },
      Design: {
        coherence: structureCoherence,
        payload: recap.structure_signature,
      },
      Memory: {
        coherence: clamp(
          (conceptCoherence + insightCoherence + structureCoherence + historicalCoherence) / 4,
          0,
          1,
        ),
        payload: recap,
      },
    },
    system_state: {
      direction_shift: recap.key_insights.length >= 3 || recap.historical_reference_count >= 2,
      master_status: "ok",
    },
  };
}

function resolveContext(recap: SliceLearningRecap): AnalyticProfile["context"] {
  const tags = recap.context_tags.map((tag) => normalizeText(tag));

  if (tags.some((tag) => ["social", "public", "community"].includes(tag))) {
    return ["social"];
  }
  if (tags.some((tag) => ["economic", "business", "market"].includes(tag))) {
    return ["economic"];
  }
  if (tags.some((tag) => ["politic", "political"].includes(tag))) {
    return ["politic"];
  }
  if (tags.some((tag) => ["tehnologic", "technical", "system", "framework"].includes(tag))) {
    return ["tehnologic"];
  }
  if (tags.some((tag) => ["art", "artistic", "visual", "color"].includes(tag))) {
    return ["artistic"];
  }

  return ["general"];
}

function buildAnalyticProfile(recap: SliceLearningRecap): AnalyticProfile {
  return {
    subject: dominantConcept(recap.validated_concepts),
    importance: estimateImportance(
      recap.key_insights,
      recap.historical_reference_count,
      recap.estimated_intensity,
    ),
    context: resolveContext(recap),
    time: recap.historical_reference_count > 0 ? "present" : "timeless",
    nature: detectNature(recap.validated_concepts, recap.content_type, recap.context_tags),
    execution: "derived_from_slice",
    presentation: detectPresentation(recap.structure_signature, recap.intent_signature),
    difficulty: estimateDifficulty(
      recap.structure_signature,
      recap.historical_reference_count,
      recap.estimated_intensity,
    ),
    access: recap.content_type === "directive" || recap.historical_reference_count >= 3 ? "advanced" : "self",
    flexibility: recap.historical_reference_count >= 2 ? "adaptive" : "semi_flexible",
    quote: recap.key_insights[0] ?? dominantConcept(recap.validated_concepts),
  };
}

function storePatterns(data: string[]) {
  return unique(data).slice(0, 8);
}

function storeInsights(data: string[]) {
  return unique(data).slice(0, 8);
}

function storeStructure(data: SliceStructurePattern) {
  return data;
}

function prepareNextContext(legacy: SliceLearningLegacy) {
  return {
    focus: legacy.semantic_axis,
    structure: legacy.stored_structure,
    cluster_id: legacy.cluster_id,
  };
}

function generateId() {
  return `slice_${Math.random().toString(36).slice(2, 10)}`;
}

function asSliceInput(parsedSlice: ParsedSliceObject): SliceRepetitionInput {
  return {
    id: generateId(),
    text: parsedSlice.content.text,
    content: {
      text: parsedSlice.content.text,
    },
  };
}

function refineSlice(
  parsedSlice: ParsedSliceObject,
  recap: SliceLearningRecap,
  repetition: SliceRepetitionResult,
): ParsedSliceObject {
  return {
    ...parsedSlice,
    content: {
      ...parsedSlice.content,
      text: [
        parsedSlice.content.text.trim(),
        recap.key_insights[0] ? `focus:${recap.key_insights[0]}` : "",
        repetition.semantic_axis ? `axis:${repetition.semantic_axis}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    metadata: {
      ...parsedSlice.metadata,
      tags: unique([
        ...parsedSlice.metadata.tags,
        repetition.semantic_axis,
        repetition.repetition_type.toLowerCase(),
      ]).slice(0, 10),
    },
  };
}

export function processPresent(parsedSlice: ParsedSliceObject): SliceLearningPresent {
  return {
    slice_id: generateId(),
    raw_text: parsedSlice.content.text,
    content_type: parsedSlice.content.type,
    context: parsedSlice.metadata ?? {
      language: null,
      intensity: 0.5,
      tags: [],
    },
    timestamp: now(),
  };
}

export function processLearning(present: SliceLearningPresent): SliceLearningLearning {
  return {
    keywords: extractKeywords(present.raw_text),
    concepts: extractCoreConcepts(present.raw_text),
    structure: extractStructurePattern(present.raw_text),
    intent: detectIntent(present.raw_text),
    insights: generateInsights(
      present.raw_text,
      present.content_type,
      present.context.tags ?? [],
      present.context.intensity ?? 0.5,
    ),
    tags: present.context.tags ?? [],
    intensity: present.context.intensity ?? 0.5,
    content_type: present.content_type,
  };
}

export function processRecap(
  learning: SliceLearningLearning,
  historicalSlices: SliceRepetitionInput[],
): SliceLearningRecap {
  const filtered = filterNoise(learning);

  return {
    validated_concepts: validateConcepts(filtered.concepts),
    key_insights: selectKeyInsights(filtered.insights),
    structure_signature: filtered.structure,
    intent_signature: filtered.intent,
    historical_reference_count: historicalSlices.length,
    context_tags: filtered.tags,
    estimated_intensity: filtered.intensity,
    content_type: filtered.content_type,
  };
}

export function processRepetition(
  parsedSlice: ParsedSliceObject,
  historicalSlices: SliceRepetitionInput[],
) {
  return runSliceRepetitionEngineV1(asSliceInput(parsedSlice), historicalSlices);
}

export function processThreshold(
  recap: SliceLearningRecap,
  historicalMemory: HistoricalMemorySignal[],
) {
  return runThresholdModelV2(
    buildAnalyticProfile(recap),
    buildThresholdContext(recap),
    historicalMemory,
  );
}

export function decisionGate(threshold: ThresholdModelResult) {
  const classification = threshold.threshold_state.classification;

  if (classification === "NOISE") {
    return "REJECT" as const;
  }

  if (classification === "FRAGMENT") {
    return "STORE_AS_FRAGMENT" as const;
  }

  if (classification === "PRE_CONCEPT") {
    return "REFINE" as const;
  }

  if (classification === "CONCEPT") {
    return "STORE" as const;
  }

  return "CANON_CHECK" as const;
}

export function processLegacy(
  recap: SliceLearningRecap,
  repetition: SliceRepetitionResult,
  systemMemory: SliceLearningLoopInput["system_memory"],
): SliceLearningLegacy {
  const legacy = {
    stored_concepts: storePatterns(recap.validated_concepts),
    stored_insights: storeInsights(recap.key_insights),
    stored_structure: storeStructure(recap.structure_signature),
    cluster_id: repetition.cluster_id,
    semantic_axis: repetition.semantic_axis,
    repetition_type: repetition.repetition_type,
    evolution: repetition.evolution,
  };

  if (systemMemory?.legacy) {
    systemMemory.legacy.unshift(legacy);
  }

  return legacy;
}

export function processScoring(
  legacy: SliceLearningLegacy,
  repetition: SliceRepetitionResult,
  threshold: ThresholdModelResult,
): SliceLearningScore {
  return runScoringEngineV1(legacy, repetition, threshold, repetition.context);
}

export function processCanon(
  legacy: SliceLearningLegacy,
  score: SliceLearningScore,
  threshold: ThresholdModelResult,
  historicalMemory: HistoricalMemorySignal[],
  systemMemory: SliceLearningLoopInput["system_memory"],
) {
  const conceptProxy = {
    concept_id: legacy.cluster_id || generateId(),
    legacy,
  };

  return runCanonEngineV1(
    conceptProxy,
    score,
    threshold,
    historicalMemory,
    systemMemory?.canon ?? [],
  );
}

export function reinject(
  legacy: SliceLearningLegacy,
  score: SliceLearningScore,
  canon: CanonEngineResult | { canon_status: string },
): SliceLearningUpdatedState {
  const canonStatus =
    "status" in canon ? "NON_CANON" : canon.canon_status;

  return {
    semantic_bias: legacy.semantic_axis,
    cluster_bias: legacy.cluster_id,
    repetition_bias: legacy.repetition_type,
    score_weight: score.total,
    canonical_influence: canonStatus,
    next_context: prepareNextContext(legacy),
  };
}

export function runLearningLoopEngineV2Slices(
  input: SliceLearningLoopInput,
  depth = 0,
): SliceLearningLoopResult {
  const historicalSlices = input.historical_slices ?? [];
  const systemMemory = input.system_memory ?? {};
  const historicalMemory = input.historical_memory ?? [];
  const maxDepth = input.max_depth ?? MAX_DEPTH_DEFAULT;

  const present = processPresent(input.parsed_slice);
  const learning = processLearning(present);
  const recap = processRecap(learning, historicalSlices);
  const repetition = processRepetition(input.parsed_slice, historicalSlices);
  const threshold = processThreshold(recap, historicalMemory);
  const decision = decisionGate(threshold);

  if (decision === "REJECT") {
    return fail("NOISE");
  }

  if (decision === "STORE_AS_FRAGMENT") {
    const legacy = processLegacy(recap, repetition, systemMemory);
    const zeroScore: SliceLearningScore = {
      clarity: 0,
      impact: 0,
      frequency: 0,
      reusability: 0,
      expansion: 0,
      total: 0,
    };
    const updatedState = reinject(legacy, zeroScore, { canon_status: "NON_CANON" });

    return {
      updated_state: updatedState,
      learning_cycle_output: {
        present,
        learning,
        recap,
        repetition,
        threshold,
        legacy,
        score: null,
        canon: null,
      },
      canonical_state: "NON_CANON",
    };
  }

  if (decision === "REFINE" && depth < maxDepth) {
    return runLearningLoopEngineV2Slices(
      {
        ...input,
        parsed_slice: refineSlice(input.parsed_slice, recap, repetition),
      },
      depth + 1,
    );
  }

  const legacy = processLegacy(recap, repetition, systemMemory);
  const score = processScoring(legacy, repetition, threshold);
  const canon = processCanon(legacy, score, threshold, historicalMemory, systemMemory);
  const updatedState = reinject(legacy, score, canon);

  return {
    updated_state: updatedState,
    learning_cycle_output: {
      present,
      learning,
      recap,
      repetition,
      threshold,
      legacy,
      score,
      canon,
    },
    canonical_state: "status" in canon ? "NON_CANON" : canon.canon_status,
  };
}
