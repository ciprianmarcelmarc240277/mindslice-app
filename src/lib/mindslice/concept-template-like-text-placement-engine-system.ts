import type {
  CompositionVisualOutput,
  StructureVisualOutput,
} from "@/lib/mindslice/concept-visual-renderer-system";
import type {
  BridgedTextSource,
} from "@/lib/mindslice/concept-text-source-parity-bridge-system";
import type {
  TextLayoutV2Canvas,
  TextLayoutV2Item,
} from "@/lib/mindslice/concept-text-layout-engine-v2-system";

export type TemplateLikeTextPlacementSettings = {
  max_sentence_fragments?: number;
  max_wandering_words?: number;
  max_wandering_letters?: number;
  max_grammar_particles?: number;
  max_temporal_particles?: number;
  fragment_max_width_ch?: number;
  word_max_width_ch?: number;
  fragment_opacity?: number;
  word_opacity?: number;
  letter_opacity?: number;
  grammar_opacity?: number;
  temporal_opacity?: number;
  influence_mode?: "neutral" | "whisper" | "echo" | "rupture" | "counterpoint" | "stain";
  placement_mode?: "template_constellation";
};

export type TemplateLikeTextLayout = {
  sentence_fragments: TextLayoutV2Item[];
  wandering_words: TextLayoutV2Item[];
  wandering_letters: TextLayoutV2Item[];
  grammar_particles: TextLayoutV2Item[];
  temporal_particles: TextLayoutV2Item[];
  all_text: TextLayoutV2Item[];
};

export type TemplateLikeTextPlacementReport = {
  status: "ok" | "warning";
  item_count: number;
  sentence_fragment_count: number;
  wandering_word_count: number;
  wandering_letter_count: number;
  grammar_particle_count: number;
  temporal_particle_count: number;
  warnings: string[];
};

export type TemplateLikeTextPlacementOutput = {
  template_like_text_layout: TemplateLikeTextLayout;
  placement_report: TemplateLikeTextPlacementReport;
};

type RequiredSettings = Required<TemplateLikeTextPlacementSettings>;
type AnchorPercent = {
  left_percent: number;
  top_percent: number;
};
type Slot = {
  x: number;
  y: number;
  rotation: number;
  animation?: string;
  scale?: number;
};

const FRAGMENT_SLOTS: Slot[] = [
  { x: -22, y: -18, rotation: -6, animation: "driftOne" },
  { x: 18, y: -12, rotation: 6, animation: "driftTwo" },
  { x: -16, y: 20, rotation: -4, animation: "driftThree" },
  { x: 20, y: 26, rotation: 5, animation: "driftFour" },
];

const WORD_SLOTS: Slot[] = [
  { x: -8, y: -26, rotation: 0, animation: "shimmerOne" },
  { x: -24, y: -2, rotation: -4, animation: "shimmerTwo" },
  { x: 22, y: 0, rotation: 4, animation: "shimmerThree" },
  { x: 4, y: 28, rotation: 0, animation: "shimmerOne" },
  { x: -18, y: 34, rotation: -3, animation: "shimmerTwo" },
  { x: 24, y: 30, rotation: 3, animation: "shimmerThree" },
  { x: -34, y: -14, rotation: -2, animation: "shimmerOne" },
  { x: 34, y: 18, rotation: 2, animation: "shimmerTwo" },
];

const LETTER_SLOTS: Slot[] = [
  { x: -14, y: -40, scale: 0.9, rotation: -12, animation: "shimmerOne" },
  { x: 26, y: -28, scale: 1.3, rotation: 7, animation: "driftTwo" },
  { x: -30, y: -2, scale: 0.78, rotation: -4, animation: "shimmerThree" },
  { x: 34, y: 12, scale: 1.7, rotation: 10, animation: "driftFour" },
  { x: -2, y: 24, scale: 1.05, rotation: -8, animation: "shimmerTwo" },
  { x: 6, y: 34, scale: 0.86, rotation: 4, animation: "driftOne" },
  { x: -22, y: 42, scale: 1.4, rotation: 9, animation: "shimmerOne" },
  { x: 20, y: 40, scale: 0.74, rotation: -6, animation: "shimmerThree" },
];

const GRAMMAR_SLOTS: Slot[] = [
  { x: -26, y: -28, rotation: -10 },
  { x: 22, y: -16, rotation: 9 },
  { x: -18, y: 24, rotation: -7 },
  { x: 24, y: 30, rotation: 7 },
];

const TEMPORAL_SLOTS: Slot[] = [
  { x: 24, y: -34, rotation: 0 },
  { x: 38, y: -8, rotation: 90 },
  { x: 30, y: 34, rotation: 0 },
  { x: -38, y: 10, rotation: -90 },
];

function normalizeSettings(settings: TemplateLikeTextPlacementSettings = {}): RequiredSettings {
  return {
    max_sentence_fragments: settings.max_sentence_fragments ?? 4,
    max_wandering_words: settings.max_wandering_words ?? 8,
    max_wandering_letters: settings.max_wandering_letters ?? 8,
    max_grammar_particles: settings.max_grammar_particles ?? 4,
    max_temporal_particles: settings.max_temporal_particles ?? 4,
    fragment_max_width_ch: settings.fragment_max_width_ch ?? 16,
    word_max_width_ch: settings.word_max_width_ch ?? 12,
    fragment_opacity: settings.fragment_opacity ?? 0.68,
    word_opacity: settings.word_opacity ?? 0.56,
    letter_opacity: settings.letter_opacity ?? 0.38,
    grammar_opacity: settings.grammar_opacity ?? 0.42,
    temporal_opacity: settings.temporal_opacity ?? 0.38,
    influence_mode: settings.influence_mode ?? "neutral",
    placement_mode: settings.placement_mode ?? "template_constellation",
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(items: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  items.forEach((item) => {
    const normalized = item.replace(/\s+/g, " ").trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      return;
    }

    seen.add(key);
    output.push(normalized);
  });

  return output;
}

function firstN(items: string[], count: number) {
  return unique(items).slice(0, count);
}

function unwrapComposition(output?: unknown): CompositionVisualOutput | undefined {
  if (typeof output === "object" && output !== null && "composition_output" in output) {
    return output.composition_output as CompositionVisualOutput | undefined;
  }

  return output as CompositionVisualOutput | undefined;
}

function resolveTextAnchor(
  canvas: TextLayoutV2Canvas,
  _structureOutput?: StructureVisualOutput | unknown,
  compositionOutput?: CompositionVisualOutput | unknown,
): AnchorPercent {
  const composition = unwrapComposition(compositionOutput);
  const center = composition?.focus_field?.center ?? {
    x: canvas.width / 2,
    y: canvas.height / 2,
  };

  return {
    left_percent: clamp((center.x / canvas.width) * 100, 22, 78),
    top_percent: clamp((center.y / canvas.height) * 100, 22, 78),
  };
}

function positionFromAnchorPercent(anchor: AnchorPercent, slot: Slot, canvas: TextLayoutV2Canvas) {
  const leftPercent = clamp(anchor.left_percent + slot.x, 14, 86);
  const topPercent = clamp(anchor.top_percent + slot.y, 14, 86);

  return {
    x: (canvas.width * leftPercent) / 100,
    y: (canvas.height * topPercent) / 100,
  };
}

function maxWidthFromCh(ch: number, fontSize: number) {
  return ch * fontSize * 0.58;
}

function resolveFragmentScale(index: number) {
  return [1.18, 1.05, 1, 1.1][index % 4] ?? 1;
}

function contextualWordFilter(words: string[]) {
  return unique(words)
    .filter((word) => word.length >= 2)
    .filter((word) => !["și", "sau", "the", "and", "or"].includes(word.toLowerCase()));
}

function buildSentenceFragments(
  source: BridgedTextSource,
  anchor: AnchorPercent,
  canvas: TextLayoutV2Canvas,
  settings: RequiredSettings,
): TextLayoutV2Item[] {
  const fragments = firstN(
    source.fragment_text_source.items.length > 0
      ? source.fragment_text_source.items
      : source.center_text_source.lines,
    settings.max_sentence_fragments,
  );

  return fragments.map((fragment, index) => {
    const slot = FRAGMENT_SLOTS[index % FRAGMENT_SLOTS.length] ?? FRAGMENT_SLOTS[0]!;
    const position = positionFromAnchorPercent(anchor, slot, canvas);

    return {
      id: `sentence_fragment_${index}`,
      type: "text",
      role: "sentence_fragment",
      text: fragment,
      x: position.x,
      y: position.y,
      anchor: "middle",
      baseline: "middle",
      font_role: "display",
      max_width: maxWidthFromCh(settings.fragment_max_width_ch, 28),
      opacity: settings.fragment_opacity,
      rotation: slot.rotation,
      scale: resolveFragmentScale(index),
    };
  });
}

function buildWanderingWords(
  source: BridgedTextSource,
  anchor: AnchorPercent,
  canvas: TextLayoutV2Canvas,
  settings: RequiredSettings,
): TextLayoutV2Item[] {
  const words = contextualWordFilter([
    ...source.keyword_text_source.items,
    ...source.echo_constellation_source.items,
  ]).slice(0, settings.max_wandering_words);

  return words.map((word, index) => {
    const slot = WORD_SLOTS[index % WORD_SLOTS.length] ?? WORD_SLOTS[0]!;
    const position = positionFromAnchorPercent(anchor, slot, canvas);

    return {
      id: `wandering_word_${index}`,
      type: "text",
      role: "wandering_word",
      text: word.toUpperCase(),
      x: position.x,
      y: position.y,
      anchor: "middle",
      baseline: "middle",
      font_role: "micro_mono",
      max_width: maxWidthFromCh(settings.word_max_width_ch, 13),
      opacity: settings.word_opacity,
      rotation: slot.rotation,
      scale: 1,
    };
  });
}

function buildWanderingLetters(
  source: BridgedTextSource,
  anchor: AnchorPercent,
  canvas: TextLayoutV2Canvas,
  settings: RequiredSettings,
): TextLayoutV2Item[] {
  const letters = firstN(source.stray_letter_source.items, settings.max_wandering_letters);

  return letters.map((letter, index) => {
    const slot = LETTER_SLOTS[index % LETTER_SLOTS.length] ?? LETTER_SLOTS[0]!;
    const position = positionFromAnchorPercent(anchor, slot, canvas);

    return {
      id: `wandering_letter_${index}`,
      type: "text",
      role: "wandering_letter",
      text: letter,
      x: position.x,
      y: position.y,
      anchor: "middle",
      baseline: "middle",
      font_role: "display",
      opacity: settings.letter_opacity,
      rotation: slot.rotation,
      scale: slot.scale ?? 1,
    };
  });
}

function buildGrammarParticles(
  source: BridgedTextSource,
  anchor: AnchorPercent,
  canvas: TextLayoutV2Canvas,
  settings: RequiredSettings,
): TextLayoutV2Item[] {
  return firstN(source.grammar_particle_source.items, settings.max_grammar_particles).map((particle, index) => {
    const slot = GRAMMAR_SLOTS[index % GRAMMAR_SLOTS.length] ?? GRAMMAR_SLOTS[0]!;
    const position = positionFromAnchorPercent(anchor, slot, canvas);

    return {
      id: `template_grammar_particle_${index}`,
      type: "text",
      role: "grammar_particle",
      text: particle.toUpperCase(),
      x: position.x,
      y: position.y,
      anchor: "middle",
      baseline: "middle",
      font_role: "micro_mono",
      opacity: settings.grammar_opacity,
      rotation: slot.rotation,
      scale: 1,
    };
  });
}

function buildTemporalParticles(
  source: BridgedTextSource,
  anchor: AnchorPercent,
  canvas: TextLayoutV2Canvas,
  settings: RequiredSettings,
): TextLayoutV2Item[] {
  return firstN(source.temporal_particle_source.items, settings.max_temporal_particles).map((particle, index) => {
    const slot = TEMPORAL_SLOTS[index % TEMPORAL_SLOTS.length] ?? TEMPORAL_SLOTS[0]!;
    const position = positionFromAnchorPercent(anchor, slot, canvas);

    return {
      id: `template_temporal_particle_${index}`,
      type: "text",
      role: "temporal_particle",
      text: particle.toUpperCase(),
      x: position.x,
      y: position.y,
      anchor: "middle",
      baseline: "middle",
      font_role: "micro_mono",
      opacity: settings.temporal_opacity,
      rotation: slot.rotation,
      scale: 1,
    };
  });
}

function applyInfluenceModeVisuals<T extends TextLayoutV2Item>(
  items: T[],
  influenceMode: RequiredSettings["influence_mode"],
) {
  return items.map((item, index) => {
    if (influenceMode === "whisper") {
      return { ...item, opacity: item.opacity * 0.65 };
    }

    if (influenceMode === "echo") {
      return { ...item, opacity: Math.min(item.opacity * 1.05, 0.82) };
    }

    if (influenceMode === "rupture") {
      return {
        ...item,
        rotation: item.rotation + (index % 2 === 0 ? -6 : 6),
      };
    }

    if (influenceMode === "counterpoint") {
      return {
        ...item,
        x: item.x + (index % 2 === 0 ? -16 : 16),
      };
    }

    if (influenceMode === "stain") {
      return { ...item, opacity: item.opacity * 0.75 };
    }

    return item;
  });
}

function clampItemsToCanvas<T extends TextLayoutV2Item>(items: T[], canvas: TextLayoutV2Canvas, margin: number) {
  return items.map((item) => ({
    ...item,
    x: clamp(item.x, margin, canvas.width - margin),
    y: clamp(item.y, margin, canvas.height - margin),
  }));
}

function estimateBounds(item: TextLayoutV2Item) {
  const fontSize = item.font_role === "display" ? 28 : item.font_role === "micro_mono" ? 13 : 16;
  const effectiveFontSize = fontSize * (item.scale ?? 1);
  const width = item.max_width ?? Math.max(8, item.text.length * effectiveFontSize * 0.56);
  const height = effectiveFontSize * 1.35;

  return {
    x: item.anchor === "middle" ? item.x - width / 2 : item.anchor === "end" ? item.x - width : item.x,
    y: item.y - height / 2,
    w: width,
    h: height,
  };
}

function overlaps(first: TextLayoutV2Item, second: TextLayoutV2Item) {
  const a = estimateBounds(first);
  const b = estimateBounds(second);

  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function runSoftCollisionPass<T extends TextLayoutV2Item>(items: T[], canvas: TextLayoutV2Canvas) {
  const highPriority = items.filter((item) => item.role === "sentence_fragment");
  const placed: T[] = [...highPriority];

  items
    .filter((item) => item.role !== "sentence_fragment")
    .forEach((item, index) => {
      let candidate = { ...item };

      if (placed.some((placedItem) => overlaps(candidate, placedItem))) {
        candidate = {
          ...candidate,
          x: clamp(candidate.x + (index % 2 === 0 ? 28 : -28), 56, canvas.width - 56),
          y: clamp(candidate.y + (index % 3 === 0 ? 18 : -18), 56, canvas.height - 56),
        };
      }

      if (placed.some((placedItem) => overlaps(candidate, placedItem))) {
        candidate = {
          ...candidate,
          opacity: candidate.opacity * 0.72,
          scale: (candidate.scale ?? 1) * 0.92,
        };
      }

      placed.push(candidate as T);
    });

  return placed;
}

function buildPlacementReport(layout: TemplateLikeTextLayout): TemplateLikeTextPlacementReport {
  const warnings = layout.sentence_fragments.length === 0
    ? ["NO_SENTENCE_FRAGMENTS_AVAILABLE"]
    : [];

  return {
    status: warnings.length === 0 ? "ok" : "warning",
    item_count: layout.all_text.length,
    sentence_fragment_count: layout.sentence_fragments.length,
    wandering_word_count: layout.wandering_words.length,
    wandering_letter_count: layout.wandering_letters.length,
    grammar_particle_count: layout.grammar_particles.length,
    temporal_particle_count: layout.temporal_particles.length,
    warnings,
  };
}

export function runTemplateLikeTextPlacementEngineV1(input: {
  bridged_text_source: BridgedTextSource;
  canvas: TextLayoutV2Canvas;
  structure_output?: StructureVisualOutput | unknown;
  scenario_output?: unknown;
  composition_output?: CompositionVisualOutput | unknown;
  placement_settings?: TemplateLikeTextPlacementSettings;
}): TemplateLikeTextPlacementOutput {
  void input.scenario_output;

  const settings = normalizeSettings(input.placement_settings);
  const anchor = resolveTextAnchor(input.canvas, input.structure_output, input.composition_output);
  const sentenceFragments = buildSentenceFragments(input.bridged_text_source, anchor, input.canvas, settings);
  const wanderingWords = buildWanderingWords(input.bridged_text_source, anchor, input.canvas, settings);
  const wanderingLetters = buildWanderingLetters(input.bridged_text_source, anchor, input.canvas, settings);
  const grammarParticles = buildGrammarParticles(input.bridged_text_source, anchor, input.canvas, settings);
  const temporalParticles = buildTemporalParticles(input.bridged_text_source, anchor, input.canvas, settings);
  const allItems = runSoftCollisionPass(
    clampItemsToCanvas(
      applyInfluenceModeVisuals(
        [
          ...sentenceFragments,
          ...wanderingWords,
          ...wanderingLetters,
          ...grammarParticles,
          ...temporalParticles,
        ],
        settings.influence_mode,
      ),
      input.canvas,
      56,
    ),
    input.canvas,
  );
  const layout: TemplateLikeTextLayout = {
    sentence_fragments: allItems.filter((item) => item.role === "sentence_fragment"),
    wandering_words: allItems.filter((item) => item.role === "wandering_word"),
    wandering_letters: allItems.filter((item) => item.role === "wandering_letter"),
    grammar_particles: allItems.filter((item) => item.role === "grammar_particle"),
    temporal_particles: allItems.filter((item) => item.role === "temporal_particle"),
    all_text: allItems,
  };

  return {
    template_like_text_layout: layout,
    placement_report: buildPlacementReport(layout),
  };
}

export const RUN = runTemplateLikeTextPlacementEngineV1;
