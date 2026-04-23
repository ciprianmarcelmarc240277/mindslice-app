export type SliceRepetitionType =
  | "NEW_SLICE"
  | "STATIC_REPETITION"
  | "PROGRESSIVE_REPETITION"
  | "TRANSFORMATIVE_REPETITION";

export type SliceIntent =
  | "reflection"
  | "instruction"
  | "question"
  | "declaration"
  | "projection"
  | "general";

export type SliceStructurePattern =
  | "single_block"
  | "multi_sentence"
  | "list_like"
  | "fragmented"
  | "directive";

export type SliceRepetitionInput = {
  id?: string;
  slice_id?: string;
  text?: string | null;
  thought?: string | null;
  content?: {
    text?: string | null;
  } | null;
  cluster_id?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export type SliceSignature = {
  keywords: string[];
  concepts: string[];
  structure: SliceStructurePattern;
  intent: SliceIntent;
};

export type SliceEvolutionDelta = {
  structure: number;
  concepts: number;
  intent: number;
  magnitude: number;
};

export type SliceRepetitionContext = {
  total_slices: number;
  dominant_axis: string;
  evolution_path: string[];
};

export type SliceRepetitionResult = {
  slice_id: string;
  cluster_id: string;
  semantic_axis: string;
  similarity: number;
  repetition_type: SliceRepetitionType;
  evolution: SliceEvolutionDelta | null;
  context: SliceRepetitionContext;
};

const TAU_SIMILARITY = 0.7;
const TAU_TRANSFORM = 0.3;

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

function normalizeText(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractSliceText(slice: SliceRepetitionInput) {
  return (
    slice.text?.trim() ||
    slice.thought?.trim() ||
    slice.content?.text?.trim() ||
    ""
  );
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

function extractStructure(text: string): SliceStructurePattern {
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

function jaccard(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((value) => rightSet.has(value)).length;
  const union = new Set([...leftSet, ...rightSet]).size;

  if (!union) {
    return 0;
  }

  return intersection / union;
}

function computeSimilarity(current: SliceSignature, past: SliceSignature) {
  const keywordScore = jaccard(current.keywords, past.keywords);
  const conceptScore = jaccard(current.concepts, past.concepts);
  const structureScore = current.structure === past.structure ? 1 : 0;
  const intentScore = current.intent === past.intent ? 1 : 0;

  return clamp(
    keywordScore * 0.35 + conceptScore * 0.35 + structureScore * 0.15 + intentScore * 0.15,
    0,
    1,
  );
}

function difference<T>(left: T, right: T) {
  return left === right ? 0 : 1;
}

function conceptDifference(current: string[], past: string[]) {
  return 1 - jaccard(current, past);
}

function magnitude(delta: Omit<SliceEvolutionDelta, "magnitude">) {
  return clamp((delta.structure + delta.concepts + delta.intent) / 3, 0, 1);
}

function dominantConcept(concepts: string[]) {
  return concepts[0] ?? "general";
}

function generateNewCluster() {
  return `cluster_${Math.random().toString(36).slice(2, 10)}`;
}

export function extractSliceSignature(slice: SliceRepetitionInput): SliceSignature {
  const text = extractSliceText(slice);

  return {
    keywords: extractKeywords(text),
    concepts: extractCoreConcepts(text),
    structure: extractStructure(text),
    intent: detectIntent(text),
  };
}

export function detectCluster(
  currentSignature: SliceSignature,
  historicalSlices: SliceRepetitionInput[],
) {
  let bestCluster: string | null = null;
  let highestScore = 0;

  historicalSlices.forEach((pastSlice) => {
    const pastSignature = extractSliceSignature(pastSlice);
    const similarity = computeSimilarity(currentSignature, pastSignature);

    if (similarity > highestScore) {
      highestScore = similarity;
      bestCluster = typeof pastSlice.cluster_id === "string" && pastSlice.cluster_id.trim()
        ? pastSlice.cluster_id
        : null;
    }
  });

  if (highestScore >= TAU_SIMILARITY) {
    return {
      cluster_id: bestCluster ?? generateNewCluster(),
      similarity_score: highestScore,
    };
  }

  return {
    cluster_id: generateNewCluster(),
    similarity_score: 0,
  };
}

export function identifySemanticAxis(signature: SliceSignature) {
  return dominantConcept(signature.concepts);
}

export function computeEvolution(
  currentSignature: SliceSignature,
  pastSignature: SliceSignature,
): SliceEvolutionDelta {
  const partial = {
    structure: difference(currentSignature.structure, pastSignature.structure),
    concepts: conceptDifference(currentSignature.concepts, pastSignature.concepts),
    intent: difference(currentSignature.intent, pastSignature.intent),
  };

  return {
    ...partial,
    magnitude: magnitude(partial),
  };
}

export function classifyRepetition(
  similarityScore: number,
  evolutionDelta: SliceEvolutionDelta | null,
): SliceRepetitionType {
  if (similarityScore < TAU_SIMILARITY) {
    return "NEW_SLICE";
  }

  const evolutionStrength = evolutionDelta?.magnitude ?? 0;

  if (evolutionStrength < 0.1) {
    return "STATIC_REPETITION";
  }

  if (evolutionStrength < TAU_TRANSFORM) {
    return "PROGRESSIVE_REPETITION";
  }

  return "TRANSFORMATIVE_REPETITION";
}

export function findRepresentativeSlice(
  clusterId: string,
  historicalSlices: SliceRepetitionInput[],
  currentSignature: SliceSignature,
) {
  let bestMatch: SliceRepetitionInput | null = null;
  let bestScore = -1;

  historicalSlices
    .filter((slice) => slice.cluster_id === clusterId)
    .forEach((slice) => {
      const score = computeSimilarity(currentSignature, extractSliceSignature(slice));
      if (score > bestScore) {
        bestScore = score;
        bestMatch = slice;
      }
    });

  return bestMatch;
}

export function detectDominantAxis(slices: SliceRepetitionInput[]) {
  const axisCounts = new Map<string, number>();

  slices.forEach((slice) => {
    const axis = identifySemanticAxis(extractSliceSignature(slice));
    axisCounts.set(axis, (axisCounts.get(axis) ?? 0) + 1);
  });

  return [...axisCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "general";
}

export function buildEvolutionSequence(slices: SliceRepetitionInput[]) {
  return [...slices]
    .sort((left, right) => {
      const leftTime = new Date(left.created_at ?? 0).getTime();
      const rightTime = new Date(right.created_at ?? 0).getTime();
      return leftTime - rightTime;
    })
    .map((slice) => `${slice.id ?? slice.slice_id ?? "slice"}:${identifySemanticAxis(extractSliceSignature(slice))}`);
}

export function buildSliceContext(
  clusterId: string,
  historicalSlices: SliceRepetitionInput[],
): SliceRepetitionContext {
  const clusterSlices = historicalSlices.filter((slice) => slice.cluster_id === clusterId);

  return {
    total_slices: clusterSlices.length,
    dominant_axis: detectDominantAxis(clusterSlices),
    evolution_path: buildEvolutionSequence(clusterSlices),
  };
}

export function runSliceRepetitionEngineV1(
  currentSlice: SliceRepetitionInput,
  historicalSlices: SliceRepetitionInput[] = [],
): SliceRepetitionResult {
  const currentSignature = extractSliceSignature(currentSlice);
  const clusterResult = detectCluster(currentSignature, historicalSlices);
  const clusterId = clusterResult.cluster_id;
  const similarityScore = clusterResult.similarity_score;
  const pastSlice = findRepresentativeSlice(clusterId, historicalSlices, currentSignature);
  const semanticAxis = identifySemanticAxis(currentSignature);

  const evolutionDelta = pastSlice
    ? computeEvolution(currentSignature, extractSliceSignature(pastSlice))
    : null;

  const repetitionType = classifyRepetition(similarityScore, evolutionDelta);
  const sliceContext = buildSliceContext(clusterId, historicalSlices);

  return {
    slice_id: currentSlice.id ?? currentSlice.slice_id ?? "current_slice",
    cluster_id: clusterId,
    semantic_axis: semanticAxis,
    similarity: similarityScore,
    repetition_type: repetitionType,
    evolution: evolutionDelta,
    context: sliceContext,
  };
}
