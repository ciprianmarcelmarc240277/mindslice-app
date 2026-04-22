import type { ParsedSliceContent, ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";

export type AnalyticImportance = "low" | "medium" | "high" | "critical";
export type AnalyticTime = "past" | "present" | "future" | "timeless";
export type AnalyticNature = "abstract" | "concrete" | "hybrid";
export type AnalyticPresentation = "static" | "dynamic" | "emergent";
export type AnalyticAccess = "self" | "advanced" | "expert";
export type AnalyticFlexibility = "rigid" | "semi_flexible" | "adaptive";

export type AnalyticProfile = {
  subject: string[];
  importance: AnalyticImportance;
  context: string;
  time: AnalyticTime;
  nature: AnalyticNature;
  execution: string;
  presentation: AnalyticPresentation;
  difficulty: number;
  access: AnalyticAccess;
  flexibility: AnalyticFlexibility;
  quote: string;
};

const STOPWORDS = new Set([
  "și",
  "sau",
  "în",
  "din",
  "prin",
  "pentru",
  "este",
  "sunt",
  "care",
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "cum",
  "ce",
  "un",
  "o",
  "la",
  "de",
  "cu",
]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-zăâîșț0-9 -]+/giu, " ")
    .split(/[\s-]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function containsAny(text: string, values: string[]) {
  const normalized = text.toLowerCase();
  return values.some((value) => normalized.includes(value));
}

function extractKeywords(text: string) {
  const counts = new Map<string, number>();

  tokenize(text).forEach((token) => {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([token]) => token);
}

function measureIntensity(text: string) {
  const exclamations = (text.match(/!/g) || []).length * 0.08;
  const uppercase = (text.match(/\b[\p{Lu}]{3,}\b/gu) || []).length * 0.06;
  const urgency = containsAny(text, [
    "trebuie",
    "urgent",
    "critic",
    "esențial",
    "vital",
    "acum",
    "determinare",
    "voință",
    "credință",
    "evoluție",
  ])
    ? 0.24
    : 0;
  const density = clamp(tokenize(text).length / 24, 0, 0.5);

  return clamp(exclamations + uppercase + urgency + density, 0, 1);
}

function containsPhilosophicalTerms(text: string) {
  return containsAny(text, [
    "ontologie",
    "ființă",
    "adevăr",
    "sens",
    "gândire",
    "conștiință",
    "filozof",
    "filosof",
    "metafiz",
    "teatru al gândului",
  ]);
}

function containsSocialTerms(text: string) {
  return containsAny(text, [
    "societate",
    "comunitate",
    "public",
    "colectiv",
    "social",
    "politic",
    "oameni",
    "cultural",
  ]);
}

function containsPastMarkers(text: string) {
  return containsAny(text, ["a fost", "odată", "anterior", "trecut", "ieri", "memorie"]);
}

function containsFutureMarkers(text: string) {
  return containsAny(text, ["va", "urmează", "viitor", "mâine", "prospect", "deveni"]);
}

function containsPresentMarkers(text: string) {
  return containsAny(text, ["este", "acum", "în prezent", "astăzi", "se întâmplă"]);
}

function isAbstract(text: string) {
  return containsAny(text, [
    "credință",
    "voință",
    "determinare",
    "evoluție",
    "persuasiune",
    "convingere",
    "sens",
    "idee",
  ]);
}

function isConcrete(text: string) {
  return containsAny(text, [
    "obiect",
    "corp",
    "spațiu",
    "masă",
    "instrument",
    "pencil",
    "pencils",
    "ink",
    "stilou",
    "cadru",
  ]);
}

function containsAction(text: string) {
  return containsAny(text, [
    "face",
    "joacă",
    "construiește",
    "transformă",
    "execută",
    "acționează",
    "creează",
  ]);
}

function containsProcess(text: string) {
  return containsAny(text, [
    "proces",
    "emerge",
    "emergent",
    "devenire",
    "evoluție",
    "iterativ",
    "transformare",
  ]);
}

function requiresSpecializedKnowledge(text: string) {
  return containsAny(text, [
    "framework",
    "labyrinth",
    "meta",
    "shape grammar",
    "composition",
    "analytic",
    "pipeline",
    "architecture",
  ]);
}

function requiresTraining(text: string) {
  return containsAny(text, [
    "metodă",
    "tehnică",
    "studiu",
    "cercetare",
    "antrenament",
    "disciplină",
  ]);
}

function ruleBased(text: string) {
  return containsAny(text, [
    "regulă",
    "rules",
    "constraint",
    "must",
    "obligatoriu",
    "fix",
    "strict",
  ]);
}

function mixed(text: string) {
  return containsAny(text, [
    "hibrid",
    "mix",
    "între",
    "împreună",
    "combină",
    "adaptiv și regulat",
  ]);
}

function computeComplexity(text: string) {
  const tokens = tokenize(text).length;
  const clauses = text.split(/[.,;:!?]+/u).filter((chunk) => chunk.trim().length > 0).length;
  const conceptualBoost = requiresSpecializedKnowledge(text) ? 1.2 : requiresTraining(text) ? 0.7 : 0.2;

  return clamp(tokens / 18 + clauses / 6 + conceptualBoost, 0, 5);
}

function mapToScale(value: number, min: number, max: number) {
  return Math.round(clamp(value, min, max));
}

function compressToStatement(text: string) {
  const sentence = text
    .split(/(?<=[.!?])\s+/u)
    .map((entry) => entry.trim())
    .find(Boolean);

  if (!sentence) {
    return "";
  }

  return sentence.length <= 160 ? sentence : `${sentence.slice(0, 157).trim()}...`;
}

function synthesizeActionLogic(text: string) {
  if (containsAction(text) && containsProcess(text)) {
    return "active process with iterative transformation";
  }

  if (containsAction(text)) {
    return "direct action logic";
  }

  if (containsProcess(text)) {
    return "process-driven emergence";
  }

  return "reflective static logic";
}

export function analyzeSubject(content: ParsedSliceContent) {
  return unique(extractKeywords(content.text));
}

export function evaluateImportance(content: ParsedSliceContent): AnalyticImportance {
  const score = measureIntensity(content.text);

  if (score > 0.8) {
    return "critical";
  }

  if (score > 0.6) {
    return "high";
  }

  if (score > 0.4) {
    return "medium";
  }

  return "low";
}

export function detectContext(content: ParsedSliceContent) {
  if (containsPhilosophicalTerms(content.text)) {
    return "filozofic";
  }

  if (containsSocialTerms(content.text)) {
    return "social";
  }

  return "general";
}

export function detectTime(content: ParsedSliceContent): AnalyticTime {
  if (containsPastMarkers(content.text)) {
    return "past";
  }

  if (containsFutureMarkers(content.text)) {
    return "future";
  }

  if (containsPresentMarkers(content.text)) {
    return "present";
  }

  return "timeless";
}

export function detectNature(content: ParsedSliceContent): AnalyticNature {
  if (isAbstract(content.text) && !isConcrete(content.text)) {
    return "abstract";
  }

  if (isConcrete(content.text) && !isAbstract(content.text)) {
    return "concrete";
  }

  return "hybrid";
}

export function generateExecution(content: ParsedSliceContent) {
  return synthesizeActionLogic(content.text);
}

export function detectPresentation(content: ParsedSliceContent): AnalyticPresentation {
  if (containsAction(content.text)) {
    return "dynamic";
  }

  if (containsProcess(content.text)) {
    return "emergent";
  }

  return "static";
}

export function estimateDifficulty(content: ParsedSliceContent) {
  return mapToScale(computeComplexity(content.text), 1, 5);
}

export function evaluateAccess(content: ParsedSliceContent): AnalyticAccess {
  if (requiresSpecializedKnowledge(content.text)) {
    return "expert";
  }

  if (requiresTraining(content.text)) {
    return "advanced";
  }

  return "self";
}

export function evaluateFlexibility(content: ParsedSliceContent): AnalyticFlexibility {
  if (ruleBased(content.text)) {
    return "rigid";
  }

  if (mixed(content.text)) {
    return "semi_flexible";
  }

  return "adaptive";
}

export function generateQuote(content: ParsedSliceContent) {
  return compressToStatement(content.text);
}

export function runAnalyticEngine(parsedSliceObject: ParsedSliceObject): AnalyticProfile {
  const content = parsedSliceObject.content;

  const subject = analyzeSubject(content);
  const importance = evaluateImportance(content);
  const context = detectContext(content);
  const time = detectTime(content);
  const nature = detectNature(content);
  const execution = generateExecution(content);
  const presentation = detectPresentation(content);
  const difficulty = estimateDifficulty(content);
  const access = evaluateAccess(content);
  const flexibility = evaluateFlexibility(content);
  const quote = generateQuote(content);

  return {
    subject,
    importance,
    context,
    time,
    nature,
    execution,
    presentation,
    difficulty,
    access,
    flexibility,
    quote,
  };
}
