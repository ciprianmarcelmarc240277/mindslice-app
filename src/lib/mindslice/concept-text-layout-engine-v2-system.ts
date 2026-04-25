import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type {
  ArtCompositionEngineOutput,
} from "@/lib/mindslice/concept-art-composition-engine-system";
import type {
  ScenarioEngineOutput,
} from "@/lib/mindslice/concept-scenario-engine-system";
import type {
  StructureEngineOutput,
} from "@/lib/mindslice/concept-structure-engine-system";
import type {
  CompositionVisualOutput,
  ScenarioVisualOutput,
  StructureVisualOutput,
} from "@/lib/mindslice/concept-visual-renderer-system";
import type { VisualGridPoint } from "@/lib/mindslice/concept-visual-composer-system";
import {
  runTextEchoConstellationEngineV1,
  type TextEchoConstellationItem,
} from "@/lib/mindslice/concept-text-echo-constellation-engine-system";
import {
  runTextLayoutCollisionResolverV2,
  type TextLayoutCollisionResolverV2Report,
  type TextLayoutCollisionResolverV2Settings,
} from "@/lib/mindslice/concept-text-layout-collision-resolver-v2-system";
import {
  runTextSourceParityBridgeV1,
  type BridgedTextSource,
  type TextSourceParityBridgeContext,
  type TextSourceParityBridgeSettings,
  type TextSourceParityReport,
} from "@/lib/mindslice/concept-text-source-parity-bridge-system";
import {
  runTemplateLikeTextPlacementEngineV1,
  type TemplateLikeTextPlacementReport,
  type TemplateLikeTextPlacementSettings,
} from "@/lib/mindslice/concept-template-like-text-placement-engine-system";

export type TextLayoutV2Canvas = {
  width: number;
  height: number;
  margin?: number;
};

export type TextLayoutV2Settings = {
  show_center_text?: boolean;
  show_peripheral_text?: boolean;
  show_text_constellation?: boolean;
  show_text_echo_constellation?: boolean;
  show_temporal_particles?: boolean;
  show_grammar_particles?: boolean;
  show_stray_letters?: boolean;
  center_max_chars?: number;
  keyword_count?: number;
  max_constellation_items?: number;
  max_echo_items?: number;
  stray_letter_count?: number;
  center_opacity?: number;
  peripheral_opacity?: number;
  constellation_opacity?: number;
  echo_opacity?: number;
  echo_rotation_range?: number;
  echo_distance_min?: number;
  echo_distance_max?: number;
  echo_density_mode?: "mirror_text_constellation";
  keyword_min_length?: number;
  keyword_max_count?: number;
  collision_settings?: TextLayoutCollisionResolverV2Settings;
  source_bridge?: TextSourceParityBridgeContext;
  source_parity_settings?: TextSourceParityBridgeSettings;
  template_placement_settings?: TemplateLikeTextPlacementSettings;
  temporal_opacity?: number;
  stray_opacity?: number;
  seed?: string;
};

export type TextLayoutV2Role =
  | "center_text"
  | "sentence_fragment"
  | "wandering_word"
  | "wandering_letter"
  | "template_fragment"
  | "peripheral_text"
  | "text_constellation"
  | "text_echo_constellation"
  | "temporal_particle"
  | "grammar_particle"
  | "stray_letter";

export type TextLayoutV2Item = {
  id: string;
  type: "text";
  role: TextLayoutV2Role;
  text: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  baseline: "middle";
  font_role: "primary" | "secondary" | "micro" | "stray" | "display" | "micro_mono";
  max_width?: number;
  font_size?: number;
  scale?: number;
  opacity: number;
  rotation: number;
  target_zone_id?: string;
  fallback_zone?: string;
  reduction_type?: string;
};

export type TextLayoutV2Data = {
  main_text: string;
  content_type: string | null;
  tags: string[];
  language: string | null | undefined;
  pipeline: string[];
  index_name: string | null;
};

export type TextLayoutV2Output = {
  center_text: TextLayoutV2Item | null;
  sentence_fragments: TextLayoutV2Item[];
  wandering_words: TextLayoutV2Item[];
  wandering_letters: TextLayoutV2Item[];
  peripheral_text: TextLayoutV2Item[];
  text_constellation: TextLayoutV2Item[];
  template_fragments: TextLayoutV2Item[];
  text_echo_constellation: TextEchoConstellationItem[];
  temporal_particles: TextLayoutV2Item[];
  grammar_particles: TextLayoutV2Item[];
  stray_letters: TextLayoutV2Item[];
  all_text: TextLayoutV2Item[];
  collision_report?: TextLayoutCollisionResolverV2Report;
  source_parity_report?: TextSourceParityReport;
  template_placement_report?: TemplateLikeTextPlacementReport;
};

type StructureLike = StructureEngineOutput | StructureVisualOutput;
type ScenarioLike = ScenarioEngineOutput | ScenarioVisualOutput;
type CompositionLike = ArtCompositionEngineOutput | CompositionVisualOutput;

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

function unwrapStructure(output: StructureLike): StructureVisualOutput {
  return "structure_output" in output ? output.structure_output : output;
}

function unwrapScenario(output: ScenarioLike): ScenarioVisualOutput {
  return "scenario_output" in output ? output.scenario_output : output;
}

function unwrapComposition(output: CompositionLike): CompositionVisualOutput {
  return "composition_output" in output ? output.composition_output : output;
}

function defaultSettings(settings: TextLayoutV2Settings = {}): Required<TextLayoutV2Settings> {
  return {
    show_center_text: true,
    show_peripheral_text: true,
    show_text_constellation: true,
    show_text_echo_constellation:
      settings.show_text_echo_constellation ?? settings.show_text_constellation ?? true,
    show_temporal_particles: true,
    show_grammar_particles: true,
    show_stray_letters: true,
    center_max_chars: 90,
    keyword_count: 8,
    max_constellation_items: 8,
    max_echo_items: 24,
    stray_letter_count: 8,
    center_opacity: 0.88,
    peripheral_opacity: 0.55,
    constellation_opacity: 0.35,
    echo_opacity: 0.22,
    echo_rotation_range: 8,
    echo_distance_min: 18,
    echo_distance_max: 72,
    echo_density_mode: "mirror_text_constellation",
    keyword_min_length: 3,
    keyword_max_count: 32,
    collision_settings: {},
    source_bridge: {},
    source_parity_settings: {},
    template_placement_settings: {},
    temporal_opacity: 0.3,
    stray_opacity: 0.18,
    seed: "mindslice-text-layout-v2",
    ...settings,
  };
}

function shorten(value: string, maxChars: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}...`;
}

function extractTextData(parsedSlice: ParsedSliceObject): TextLayoutV2Data {
  return {
    main_text: parsedSlice.content.text,
    content_type: parsedSlice.content.type,
    tags: parsedSlice.metadata.tags,
    language: parsedSlice.metadata.language,
    pipeline: parsedSlice.process.pipeline,
    index_name: parsedSlice.identity.index_name,
  };
}

function extractKeywords(value: string, count: number) {
  const stopwords = new Set([
    "the",
    "and",
    "with",
    "din",
    "care",
    "pentru",
    "sau",
    "este",
    "prin",
    "plan",
    "mental",
  ]);
  const words = normalizeText(value)
    .split(/[^a-z0-9ăâîșț]+/i)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !stopwords.has(word));

  return [...new Set(words)].slice(0, count);
}

function extractRepresentativeLetters(value: string, count: number) {
  const letters = normalizeText(value)
    .replace(/[^a-zăâîșț]/gi, "")
    .split("");

  return [...new Set(letters)].slice(0, count);
}

function nextAvailableZone(zones: StructureVisualOutput["zones"], index: number) {
  return zones[index % Math.max(zones.length, 1)] ?? {
    id: "fallback",
    center: { x: 540, y: 540 },
    width: 200,
    height: 200,
    weight: "low" as const,
    role: "support" as const,
  };
}

function randomNonCriticalZone(zones: StructureVisualOutput["zones"], index: number) {
  const candidates = zones.filter((zone) => zone.role !== "dominant");
  return nextAvailableZone(candidates.length > 0 ? candidates : zones, index);
}

function randomPointInZone(
  zone: StructureVisualOutput["zones"][number],
  seed: string,
): VisualGridPoint {
  const halfW = zone.width / 2;
  const halfH = zone.height / 2;

  return {
    x: zone.center.x + seededRange(`${seed}:x`, -halfW * 0.34, halfW * 0.34),
    y: zone.center.y + seededRange(`${seed}:y`, -halfH * 0.34, halfH * 0.34),
  };
}

function pointAlongLine(start: VisualGridPoint, end: VisualGridPoint, amount: number) {
  return {
    x: start.x + (end.x - start.x) * amount,
    y: start.y + (end.y - start.y) * amount,
  };
}

function selectPointNearPath(paths: ScenarioVisualOutput["tension_paths"], index: number, seed: string) {
  const path = paths[index % Math.max(paths.length, 1)];

  if (!path) {
    return {
      x: 540 + seededRange(`${seed}:fallback:x`, -160, 160),
      y: 540 + seededRange(`${seed}:fallback:y`, -160, 160),
    };
  }

  const amount = seededRange(`${seed}:amount`, 0.22, 0.78);
  const base = pointAlongLine(path.start, path.end, amount);

  return {
    x: base.x + seededRange(`${seed}:jitter:x`, -36, 36),
    y: base.y + seededRange(`${seed}:jitter:y`, -36, 36),
  };
}

function buildCenterText(
  data: TextLayoutV2Data,
  compositionOutput: CompositionVisualOutput,
  canvas: TextLayoutV2Canvas,
  settings: Required<TextLayoutV2Settings>,
  bridgedSource?: BridgedTextSource,
): TextLayoutV2Item | null {
  if (!settings.show_center_text) {
    return null;
  }

  const center = compositionOutput.focus_field.center ?? {
    x: canvas.width / 2,
    y: canvas.height / 2,
  };
  const bridgeCenter = bridgedSource?.center_text_source;
  const text = bridgeCenter
    ? shorten(
        [bridgeCenter.title, bridgeCenter.fragment]
          .filter(Boolean)
          .filter((value, index, values) => values.indexOf(value) === index)
          .join(" / "),
        settings.center_max_chars,
      )
    : shorten(data.main_text, settings.center_max_chars);

  return {
    id: "center_text",
    type: "text",
    role: "center_text",
    text,
    x: center.x,
    y: center.y,
    anchor: "middle",
    baseline: "middle",
    font_role: "primary",
    max_width: canvas.width * 0.42,
    opacity: settings.center_opacity,
    rotation: 0,
  };
}

function buildTemplateFragments(
  bridgedSource: BridgedTextSource | undefined,
  structureOutput: StructureVisualOutput,
): TextLayoutV2Item[] {
  const fragments = bridgedSource?.fragment_text_source.items ?? [];

  return fragments.map((fragment, index) => {
    const zone = nextAvailableZone(structureOutput.zones, index);
    const offset = index % 2 === 0 ? -28 : 28;

    return {
      id: `template_fragment_${index}`,
      type: "text",
      role: "template_fragment",
      text: fragment,
      x: zone.center.x + offset,
      y: zone.center.y - offset * 0.5,
      anchor: "middle",
      baseline: "middle",
      font_role: "secondary",
      opacity: 0.68,
      rotation: index % 2 === 0 ? -5 : 5,
      scale: 1.12,
    };
  });
}

function buildPeripheralText(
  data: TextLayoutV2Data,
  structureOutput: StructureVisualOutput,
  settings: Required<TextLayoutV2Settings>,
): TextLayoutV2Item[] {
  if (!settings.show_peripheral_text) {
    return [];
  }

  return data.tags.map((tag, index) => {
    const zone = nextAvailableZone(structureOutput.zones, index);

    return {
      id: `peripheral_text_${index}`,
      type: "text",
      role: "peripheral_text",
      text: tag,
      x: zone.center.x,
      y: zone.center.y,
      anchor: "middle",
      baseline: "middle",
      font_role: "secondary",
      opacity: settings.peripheral_opacity,
      rotation: 0,
    };
  });
}

function buildTextConstellation(
  data: TextLayoutV2Data,
  scenarioOutput: ScenarioVisualOutput,
  settings: Required<TextLayoutV2Settings>,
  bridgedSource?: BridgedTextSource,
): TextLayoutV2Item[] {
  if (!settings.show_text_constellation) {
    return [];
  }

  const keywordCount = settings.max_constellation_items ?? settings.keyword_count;
  const keywords = bridgedSource?.keyword_text_source.items.length
    ? bridgedSource.keyword_text_source.items.slice(0, keywordCount)
    : extractKeywords(data.main_text, keywordCount);

  return keywords.map((keyword, index) => {
    const point = selectPointNearPath(
      scenarioOutput.tension_paths,
      index,
      `${settings.seed}:constellation:${keyword}:${index}`,
    );

    return {
      id: `text_constellation_${index}`,
      type: "text",
      role: "text_constellation",
      text: keyword,
      x: point.x,
      y: point.y,
      anchor: "middle",
      baseline: "middle",
      font_role: "micro",
      opacity: bridgedSource ? Math.max(settings.constellation_opacity, 0.48) : settings.constellation_opacity,
      rotation: seededRange(`${settings.seed}:constellation:rotation:${index}`, -6, 6),
      scale: bridgedSource ? 1.08 : 1,
    };
  });
}

function buildStrayLetters(
  data: TextLayoutV2Data,
  structureOutput: StructureVisualOutput,
  settings: Required<TextLayoutV2Settings>,
  bridgedSource?: BridgedTextSource,
): TextLayoutV2Item[] {
  if (!settings.show_stray_letters) {
    return [];
  }

  const letters = bridgedSource?.stray_letter_source.items.length
    ? bridgedSource.stray_letter_source.items
    : extractRepresentativeLetters(data.main_text, settings.stray_letter_count);

  return letters.slice(0, settings.stray_letter_count).map((letter, index) => {
    const zone = randomNonCriticalZone(structureOutput.zones, index);
    const point = randomPointInZone(zone, `${settings.seed}:stray:${letter}:${index}`);

    return {
      id: `stray_letter_${index}`,
      type: "text",
      role: "stray_letter",
      text: letter,
      x: point.x,
      y: point.y,
      anchor: "middle",
      baseline: "middle",
      font_role: "stray",
      opacity: settings.stray_opacity,
      rotation: seededRange(`${settings.seed}:stray:rotation:${index}`, -12, 12),
    };
  });
}

export function runTextLayoutEngineV2(
  parsedSlice: ParsedSliceObject,
  structureOutput: StructureLike,
  scenarioOutput: ScenarioLike,
  compositionOutput: CompositionLike,
  canvas: TextLayoutV2Canvas,
  textSettings: TextLayoutV2Settings = {},
): TextLayoutV2Output {
  const settings = defaultSettings(textSettings);
  const data = extractTextData(parsedSlice);
  const visualStructure = unwrapStructure(structureOutput);
  const visualScenario = unwrapScenario(scenarioOutput);
  const visualComposition = unwrapComposition(compositionOutput);
  const sourceBridgeResult = runTextSourceParityBridgeV1({
    parsed_slice: parsedSlice,
    thought_state: settings.source_bridge.thought_state,
    thought_scene: settings.source_bridge.thought_scene,
    shape_grammar: settings.source_bridge.shape_grammar,
    clock_display: settings.source_bridge.clock_display,
    existing_vnext_text_layout: settings.source_bridge.existing_vnext_text_layout,
    text_settings: settings.source_parity_settings,
  });
  const bridgedSource = sourceBridgeResult.bridged_text_source;
  const templatePlacement = runTemplateLikeTextPlacementEngineV1({
    bridged_text_source: bridgedSource,
    canvas,
    structure_output: visualStructure,
    scenario_output: visualScenario,
    composition_output: visualComposition,
    placement_settings: settings.template_placement_settings,
  });
  const templateLikeText = templatePlacement.template_like_text_layout;
  const centerText = buildCenterText(data, visualComposition, canvas, settings, bridgedSource);
  const templateFragments = buildTemplateFragments(bridgedSource, visualStructure);
  const peripheralText = buildPeripheralText(data, visualStructure, settings);
  const textConstellation = buildTextConstellation(data, visualScenario, settings);
  const textEchoConstellationRaw = runTextEchoConstellationEngineV1(
    parsedSlice,
    visualScenario,
    visualComposition,
    templateLikeText.wandering_words.length > 0 ? templateLikeText.wandering_words : textConstellation,
    settings,
  );
  const textEchoConstellation = textEchoConstellationRaw.map((item, index) => {
    const bridgeText = bridgedSource.echo_constellation_source.items[index % Math.max(bridgedSource.echo_constellation_source.items.length, 1)];

    return {
      ...item,
      ...(bridgeText ? { text: bridgeText } : {}),
      opacity: item.opacity * bridgedSource.echo_constellation_source.opacity_multiplier,
    };
  });
  const temporalParticles = settings.show_temporal_particles
    ? templateLikeText.temporal_particles
    : [];
  const grammarParticles = settings.show_grammar_particles
    ? templateLikeText.grammar_particles
    : [];
  const strayLetters = settings.show_stray_letters
    ? buildStrayLetters(data, visualStructure, settings, bridgedSource)
    : [];
  const wanderingLetters = settings.show_stray_letters
    ? templateLikeText.wandering_letters
    : [];
  const sentenceFragments = templateLikeText.sentence_fragments;
  const wanderingWords = settings.show_text_constellation
    ? templateLikeText.wandering_words
    : [];
  const rawAllText = [
    ...(centerText ? [centerText] : []),
    ...sentenceFragments,
    ...wanderingWords,
    ...wanderingLetters,
    ...templateFragments,
    ...peripheralText,
    ...textConstellation,
    ...textEchoConstellation,
    ...temporalParticles,
    ...grammarParticles,
    ...strayLetters,
  ];
  const unresolvedOutput: TextLayoutV2Output = {
    center_text: centerText,
    sentence_fragments: sentenceFragments,
    wandering_words: wanderingWords,
    wandering_letters: wanderingLetters,
    peripheral_text: peripheralText,
    template_fragments: templateFragments,
    text_constellation: textConstellation,
    text_echo_constellation: textEchoConstellation,
    temporal_particles: temporalParticles,
    grammar_particles: grammarParticles,
    stray_letters: strayLetters,
    all_text: rawAllText,
    source_parity_report: sourceBridgeResult.source_parity_report,
    template_placement_report: templatePlacement.placement_report,
  };
  const collisionResult = runTextLayoutCollisionResolverV2(
    unresolvedOutput,
    canvas,
    visualStructure,
    visualScenario,
    visualComposition,
    settings.collision_settings,
  );

  return {
    ...collisionResult.resolved_text_layout_output,
    collision_report: collisionResult.collision_report,
    source_parity_report: sourceBridgeResult.source_parity_report,
    template_placement_report: templatePlacement.placement_report,
  };
}

export const RUN = runTextLayoutEngineV2;
