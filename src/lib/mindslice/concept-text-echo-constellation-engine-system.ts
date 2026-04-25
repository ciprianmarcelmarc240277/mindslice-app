import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type {
  ArtCompositionEngineOutput,
} from "@/lib/mindslice/concept-art-composition-engine-system";
import type {
  ScenarioEngineOutput,
} from "@/lib/mindslice/concept-scenario-engine-system";
import type {
  CompositionVisualOutput,
  ScenarioVisualOutput,
} from "@/lib/mindslice/concept-visual-renderer-system";
import type { VisualGridPoint } from "@/lib/mindslice/concept-visual-composer-system";
import type {
  TextLayoutV2Item,
  TextLayoutV2Settings,
} from "@/lib/mindslice/concept-text-layout-engine-v2-system";

export type TextEchoConstellationSettings = TextLayoutV2Settings & {
  show_text_echo_constellation?: boolean;
  max_constellation_items?: number;
  max_echo_items?: number;
  echo_opacity?: number;
  echo_rotation_range?: number;
  echo_distance_min?: number;
  echo_distance_max?: number;
  echo_density_mode?: "mirror_text_constellation";
  keyword_min_length?: number;
  keyword_max_count?: number;
};

export type TextEchoConstellationItem = TextLayoutV2Item & {
  role: "text_echo_constellation";
  semantic_source: string;
  relation_to_reference: "echo";
  reference_id: string | null;
  echo_index: number;
};

type ScenarioLike = ScenarioEngineOutput | ScenarioVisualOutput;
type CompositionLike = ArtCompositionEngineOutput | CompositionVisualOutput;

type EchoReferencePoint = {
  id: string;
  x: number;
  y: number;
  semantic_source: string;
  source_type: "text_constellation" | "scenario_path" | "composition_focus" | "scenario_conflict" | "fallback";
};

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededUnit(seed: string) {
  const hash = hashString(seed);
  const normalized = Math.sin(hash * 12.9898) * 43758.5453;

  return normalized - Math.floor(normalized);
}

function seededRange(seed: string, min: number, max: number) {
  return min + seededUnit(seed) * (max - min);
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function unwrapScenario(output: ScenarioLike): ScenarioVisualOutput {
  return "scenario_output" in output ? output.scenario_output : output;
}

function unwrapComposition(output: CompositionLike): CompositionVisualOutput {
  return "composition_output" in output ? output.composition_output : output;
}

function pointAlongLine(start: VisualGridPoint, end: VisualGridPoint, amount: number) {
  return {
    x: start.x + (end.x - start.x) * amount,
    y: start.y + (end.y - start.y) * amount,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPoint(value: unknown): value is VisualGridPoint {
  return isRecord(value) && typeof value.x === "number" && typeof value.y === "number";
}

function removeDuplicates(items: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  items.forEach((item) => {
    const normalized = item.trim();

    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    output.push(normalized);
  });

  return output;
}

function normalizeTerm(value: unknown) {
  return normalizeText(String(value ?? ""))
    .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSettings(settings: TextEchoConstellationSettings = {}): Required<TextEchoConstellationSettings> {
  return {
    show_center_text: settings.show_center_text ?? true,
    show_peripheral_text: settings.show_peripheral_text ?? true,
    show_text_constellation: settings.show_text_constellation ?? true,
    show_text_echo_constellation: settings.show_text_echo_constellation ?? true,
    show_temporal_particles: settings.show_temporal_particles ?? true,
    show_grammar_particles: settings.show_grammar_particles ?? true,
    show_stray_letters: settings.show_stray_letters ?? true,
    center_max_chars: settings.center_max_chars ?? 90,
    keyword_count: settings.keyword_count ?? 8,
    max_constellation_items: settings.max_constellation_items ?? settings.keyword_count ?? 24,
    max_echo_items: settings.max_echo_items ?? settings.max_constellation_items ?? 24,
    stray_letter_count: settings.stray_letter_count ?? 8,
    center_opacity: settings.center_opacity ?? 0.88,
    peripheral_opacity: settings.peripheral_opacity ?? 0.55,
    constellation_opacity: settings.constellation_opacity ?? 0.35,
    echo_opacity: settings.echo_opacity ?? 0.22,
    echo_rotation_range: settings.echo_rotation_range ?? 8,
    echo_distance_min: settings.echo_distance_min ?? 18,
    echo_distance_max: settings.echo_distance_max ?? 72,
    echo_density_mode: settings.echo_density_mode ?? "mirror_text_constellation",
    keyword_min_length: settings.keyword_min_length ?? 3,
    keyword_max_count: settings.keyword_max_count ?? 32,
    collision_settings: settings.collision_settings ?? {},
    source_bridge: settings.source_bridge ?? {},
    source_parity_settings: settings.source_parity_settings ?? {},
    template_placement_settings: settings.template_placement_settings ?? {},
    temporal_opacity: settings.temporal_opacity ?? 0.3,
    stray_opacity: settings.stray_opacity ?? 0.18,
    seed: settings.seed ?? "mindslice-text-echo-constellation",
  };
}

export function extractEchoTermsLikeTextConstellation(
  parsedSlice: ParsedSliceObject,
  settings: TextEchoConstellationSettings = {},
) {
  const normalizedSettings = normalizeSettings(settings);
  const stopwords = new Set([
    "și",
    "sau",
    "dar",
    "cu",
    "în",
    "din",
    "pe",
    "la",
    "the",
    "and",
    "or",
    "of",
    "to",
    "in",
    "a",
    "an",
  ]);

  const keywords = normalizeText(parsedSlice.content.text)
    .split(/[^a-z0-9ăâîșț]+/i)
    .map((word) => normalizeTerm(word))
    .filter(
      (word) =>
        word.length >= normalizedSettings.keyword_min_length &&
        !stopwords.has(word),
    );
  const sourcePool = [
    ...keywords,
    ...parsedSlice.metadata.tags.map((tag) => normalizeTerm(tag)),
    ...parsedSlice.process.pipeline.map((step) => normalizeTerm(step)),
  ];

  return removeDuplicates(sourcePool)
    .filter((term) => term.length >= normalizedSettings.keyword_min_length)
    .slice(0, normalizedSettings.keyword_max_count);
}

function pointBetween(a: VisualGridPoint, b: VisualGridPoint, ratio: number, sourceId: string): EchoReferencePoint {
  const point = pointAlongLine(a, b, ratio);

  return {
    id: `${sourceId}_sample_${ratio}`,
    x: point.x,
    y: point.y,
    semantic_source: "path",
    source_type: "scenario_path",
  };
}

function samplePointsOnTensionPath(path: ScenarioVisualOutput["tension_paths"][number]): EchoReferencePoint[] {
  const points: EchoReferencePoint[] = [];

  if (path.start && path.end) {
    points.push(
      pointBetween(path.start, path.end, 0.25, path.id),
      pointBetween(path.start, path.end, 0.5, path.id),
      pointBetween(path.start, path.end, 0.75, path.id),
    );
  }

  const pathRecord = path as unknown;
  const explicitPoints = isRecord(pathRecord) && Array.isArray(pathRecord.points) ? pathRecord.points : [];

  const semanticSource =
    isRecord(pathRecord) && typeof pathRecord.semantic_source === "string"
      ? pathRecord.semantic_source
      : "path";

  explicitPoints.forEach((point, index) => {
    if (!isPoint(point)) {
      return;
    }

    points.push({
      id: `${path.id}_point_${index}`,
      x: point.x,
      y: point.y,
      semantic_source: semanticSource,
      source_type: "scenario_path",
    });
  });

  return points;
}

export function buildReferencePointsLikeTextConstellation(
  scenarioOutput: ScenarioLike,
  compositionOutput: CompositionLike,
  textConstellationOutput: TextLayoutV2Item[] = [],
  _settings?: TextEchoConstellationSettings,
): EchoReferencePoint[] {
  void _settings;

  const references: EchoReferencePoint[] = [];

  if (textConstellationOutput.length > 0) {
    return textConstellationOutput.map((item, index) => ({
      id: item.id,
      x: item.x,
      y: item.y,
      semantic_source: item.text || `text_constellation:${index}`,
      source_type: "text_constellation",
    }));
  }

  const scenario = unwrapScenario(scenarioOutput);
  scenario.tension_paths.forEach((path) => {
    references.push(...samplePointsOnTensionPath(path));
  });

  const composition = unwrapComposition(compositionOutput);
  references.push({
    id: "focus_field_center",
    x: composition.focus_field.center.x,
    y: composition.focus_field.center.y,
    semantic_source: "focus",
    source_type: "composition_focus",
  });

  const scenarioRecord = scenario as unknown;
  const conflictPoints =
    isRecord(scenarioRecord) && Array.isArray(scenarioRecord.conflict_points)
      ? scenarioRecord.conflict_points
      : [];

  conflictPoints.forEach((point, index) => {
    if (!isPoint(point)) {
      return;
    }

    const pointRecord = point as Record<string, unknown>;

    references.push({
      id: typeof pointRecord.id === "string" ? pointRecord.id : `conflict_ref_${index}`,
      x: point.x,
      y: point.y,
      semantic_source: "conflict",
      source_type: "scenario_conflict",
    });
  });

  return references;
}

export function resolveEchoCount(
  textConstellationOutput: TextLayoutV2Item[] = [],
  sourceTerms: string[] = [],
  settings: TextEchoConstellationSettings = {},
) {
  const normalizedSettings = normalizeSettings(settings);

  if (
    normalizedSettings.echo_density_mode === "mirror_text_constellation" &&
    textConstellationOutput.length > 0
  ) {
    return Math.min(textConstellationOutput.length, normalizedSettings.max_echo_items);
  }

  return Math.min(sourceTerms.length, normalizedSettings.max_echo_items);
}

export function selectBalancedEchoTerm(
  sourceTerms: string[],
  echoItems: TextEchoConstellationItem[],
) {
  const fallback = "echo";
  const terms = sourceTerms.length > 0 ? sourceTerms : [fallback];
  const usage = new Map<string, number>();

  echoItems.forEach((item) => {
    usage.set(item.text, (usage.get(item.text) ?? 0) + 1);
  });

  return terms
    .map((term) => ({ term, count: usage.get(term) ?? 0 }))
    .sort((a, b) => a.count - b.count || a.term.localeCompare(b.term))[0]?.term ?? fallback;
}

export function selectReferencePoint(referencePoints: EchoReferencePoint[], index: number) {
  return referencePoints[index % Math.max(referencePoints.length, 1)] ?? {
    id: "fallback_reference",
    x: 540,
    y: 540,
    semantic_source: "fallback_center",
  };
}

export function offsetFromReference(
  reference: EchoReferencePoint,
  minDistance: number,
  maxDistance: number,
  index: number,
) {
  const angle = (index * 137.507764 * Math.PI) / 180;
  const wave = (Math.sin(index * 0.7) + 1) / 2;
  const distance = minDistance + (maxDistance - minDistance) * wave;

  return {
    x: reference.x + Math.cos(angle) * distance,
    y: reference.y + Math.sin(angle) * distance,
  };
}

export function computeEchoOpacity(
  index: number,
  maxItems: number,
  settings: TextEchoConstellationSettings = {},
) {
  const baseOpacity = settings.echo_opacity ?? 0.22;
  const fade = 1 - (index / Math.max(maxItems, 1)) * 0.35;

  return Math.max(0.06, Math.min(baseOpacity, baseOpacity * fade));
}

export function computeEchoRotation(index: number, settings: TextEchoConstellationSettings = {}) {
  const range = settings.echo_rotation_range ?? 8;
  const direction = index % 2 === 0 ? 1 : -1;

  return seededRange(`${settings.seed ?? "mindslice-text-echo-constellation"}:rotation:${index}`, 0, range) * direction;
}

function generateId(prefix: string, index: number) {
  return `${prefix}_${index}`;
}

export function runTextEchoConstellationEngineV1(
  parsedSlice: ParsedSliceObject,
  scenarioOutput: ScenarioLike,
  compositionOutput: CompositionLike,
  textConstellationOutput: TextLayoutV2Item[] = [],
  textSettings: TextEchoConstellationSettings = {},
): TextEchoConstellationItem[] {
  const settings = normalizeSettings(textSettings);

  if (settings.show_text_echo_constellation === false) {
    return [];
  }

  const sourceTerms = extractEchoTermsLikeTextConstellation(parsedSlice, settings);

  if (sourceTerms.length === 0) {
    return [];
  }

  const referencePoints = buildReferencePointsLikeTextConstellation(
    scenarioOutput,
    compositionOutput,
    textConstellationOutput,
    settings,
  );

  if (referencePoints.length === 0) {
    return [];
  }

  const maxItems = resolveEchoCount(textConstellationOutput, sourceTerms, settings);
  const echoItems: TextEchoConstellationItem[] = [];

  for (let index = 0; index < maxItems; index += 1) {
    const sourceTerm = selectBalancedEchoTerm(sourceTerms, echoItems);
    const reference = selectReferencePoint(referencePoints, index);
    const position = offsetFromReference(
      reference,
      settings.echo_distance_min,
      settings.echo_distance_max,
      index,
    );

    echoItems.push({
      id: generateId("text_echo_constellation", index),
      type: "text",
      role: "text_echo_constellation",
      text: sourceTerm,
      x: position.x,
      y: position.y,
      anchor: "middle",
      baseline: "middle",
      font_role: "micro",
      opacity: computeEchoOpacity(index, maxItems, settings),
      rotation: computeEchoRotation(index, settings),
      semantic_source: reference.semantic_source,
      relation_to_reference: "echo",
      reference_id: reference.id ?? null,
      echo_index: index,
    });
  }

  return echoItems;
}

export const RUN = runTextEchoConstellationEngineV1;
