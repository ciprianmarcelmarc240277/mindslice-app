import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type { ThoughtSceneEngineState } from "@/lib/mindslice/thought-scene-engine";
import type {
  ClockDisplayState,
  ShapeGrammarState,
  ThoughtState,
} from "@/lib/mindslice/mindslice-types";
import type { TextLayoutV2Output } from "@/lib/mindslice/concept-text-layout-engine-v2-system";

export type TextSourceParityBridgeSettings = {
  use_template_sources?: boolean;
  preserve_vnext_sources?: boolean;
  template_source_priority?: "high" | "normal";
  merge_duplicates?: boolean;
  max_visible_template_fragments?: number;
  max_visible_template_keywords?: number;
  max_visible_stray_letters?: number;
  max_visible_grammar_particles?: number;
  max_visible_temporal_particles?: number;
  vnext_enrichment_opacity_multiplier?: number;
};

export type TextSourceParityBridgeContext = {
  thought_state?: ThoughtState | null;
  thought_scene?: ThoughtSceneEngineState | null;
  shape_grammar?: Pick<ShapeGrammarState, "rulesApplied"> | null;
  clock_display?: ClockDisplayState | null;
  existing_vnext_text_layout?: TextLayoutV2Output | null;
};

export type TemplateTextSources = {
  center_title: string | null;
  center_fragment: string | null;
  center_lines: string[];
  fragments: string[];
  keywords: string[];
  stray_letters: string[];
  grammar_particles: string[];
  temporal_particles: string[];
};

export type VNextTextSources = {
  main_text: string;
  tags: string[];
  pipeline: string[];
  content_type: string | null;
  echo_terms: string[];
  constellation_terms: string[];
};

export type BridgedTextSource = {
  source_mode: "template_parity_plus_vnext_enrichment";
  center_text_source: {
    role: "center_text";
    title: string;
    fragment: string;
    lines: string[];
    priority: "primary_template" | "vnext_fallback";
  };
  fragment_text_source: {
    role: "template_fragment";
    items: string[];
    priority: "primary_template";
    visibility: "high";
  };
  keyword_text_source: {
    role: "text_constellation";
    items: string[];
    priority: "primary_template";
    visibility: "high";
  };
  stray_letter_source: {
    role: "stray_letter";
    items: string[];
    priority: "template_controlled";
    visibility: "medium";
  };
  grammar_particle_source: {
    role: "grammar_particle";
    items: string[];
    priority: "secondary_template";
    visibility: "low";
  };
  temporal_particle_source: {
    role: "temporal_particle";
    items: string[];
    priority: "secondary_template";
    visibility: "low";
  };
  echo_constellation_source: {
    role: "text_echo_constellation";
    items: string[];
    priority: "vnext_enrichment";
    opacity_multiplier: number;
  };
  original_parsed_slice: ParsedSliceObject;
};

export type TextSourceParityReport = {
  status: "ok" | "warning";
  template_sources_used: number;
  vnext_sources_preserved: number;
  final_visible_sources: number;
  parity_level: "template_visible_with_vnext_enrichment" | "vnext_fallback_only";
  warnings: string[];
};

export type TextSourceParityBridgeOutput = {
  bridged_text_source: BridgedTextSource;
  source_parity_report: TextSourceParityReport;
};

type RequiredSettings = Required<TextSourceParityBridgeSettings>;

function normalizeSettings(settings: TextSourceParityBridgeSettings = {}): RequiredSettings {
  return {
    use_template_sources: settings.use_template_sources ?? true,
    preserve_vnext_sources: settings.preserve_vnext_sources ?? true,
    template_source_priority: settings.template_source_priority ?? "high",
    merge_duplicates: settings.merge_duplicates ?? true,
    max_visible_template_fragments: settings.max_visible_template_fragments ?? 4,
    max_visible_template_keywords: settings.max_visible_template_keywords ?? 6,
    max_visible_stray_letters: settings.max_visible_stray_letters ?? 8,
    max_visible_grammar_particles: settings.max_visible_grammar_particles ?? 4,
    max_visible_temporal_particles: settings.max_visible_temporal_particles ?? 4,
    vnext_enrichment_opacity_multiplier: settings.vnext_enrichment_opacity_multiplier ?? 0.72,
  };
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeKey(value: string) {
  return normalizeText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function firstN(items: string[], count: number) {
  return items.map(normalizeText).filter(Boolean).slice(0, count);
}

function unique(items: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  items.forEach((item) => {
    const normalized = normalizeText(item);
    const key = normalizeKey(normalized);

    if (!normalized || seen.has(key)) {
      return;
    }

    seen.add(key);
    output.push(normalized);
  });

  return output;
}

function emptyTemplateSources(): TemplateTextSources {
  return {
    center_title: null,
    center_fragment: null,
    center_lines: [],
    fragments: [],
    keywords: [],
    stray_letters: [],
    grammar_particles: [],
    temporal_particles: [],
  };
}

function splitTextIntoShortLines(text: string, maxLines = 5) {
  return text
    .split(/[.!?\n]+/)
    .map(normalizeText)
    .filter(Boolean)
    .slice(0, maxLines);
}

function extractTemplateStrayLetters(
  thoughtState: ThoughtState,
  thoughtScene: ThoughtSceneEngineState | null | undefined,
  settings: RequiredSettings,
) {
  const visibleText = [
    thoughtState.thought,
    thoughtScene?.sceneGraph.thoughtCenterFragment,
    ...thoughtState.fragments,
    ...thoughtState.keywords,
  ]
    .filter(Boolean)
    .join(" ");
  const glyphs = Array.from(visibleText).filter((character) => /[\p{L}\p{N}]/u.test(character));

  if (glyphs.length === 0) {
    return [];
  }

  const selected: string[] = [];
  const step = Math.max(1, Math.floor(glyphs.length / settings.max_visible_stray_letters));

  for (let index = 0; index < glyphs.length && selected.length < settings.max_visible_stray_letters; index += step) {
    const letter = glyphs[index];

    if (letter) {
      selected.push(letter);
    }
  }

  return selected;
}

function extractClockTokens(clockDisplay: ClockDisplayState | null | undefined, settings: RequiredSettings) {
  if (!clockDisplay) {
    return [];
  }

  return firstN(
    [
      clockDisplay.hours,
      clockDisplay.minutes,
      clockDisplay.seconds,
      clockDisplay.transition.replaceAll("_", " "),
    ],
    settings.max_visible_temporal_particles,
  );
}

function extractTemplateSources(
  context: TextSourceParityBridgeContext,
  settings: RequiredSettings,
): TemplateTextSources {
  if (!settings.use_template_sources || !context.thought_state) {
    return emptyTemplateSources();
  }

  const thoughtState = context.thought_state;
  const thoughtScene = context.thought_scene;

  return {
    center_title: thoughtState.direction,
    center_fragment:
      thoughtScene?.sceneGraph.thoughtCenterFragment ??
      thoughtState.fragments[0] ??
      thoughtState.keywords[0] ??
      thoughtState.direction,
    center_lines:
      thoughtScene?.sceneGraph.thoughtLines.slice(0, 5) ??
      splitTextIntoShortLines(thoughtState.thought),
    fragments: firstN(thoughtState.fragments, settings.max_visible_template_fragments),
    keywords: firstN(thoughtState.keywords, settings.max_visible_template_keywords),
    stray_letters: extractTemplateStrayLetters(thoughtState, thoughtScene, settings),
    grammar_particles: firstN(context.shape_grammar?.rulesApplied ?? [], settings.max_visible_grammar_particles),
    temporal_particles: extractClockTokens(context.clock_display, settings),
  };
}

function extractTextsByRole(layout: TextLayoutV2Output | null | undefined, role: string) {
  if (!layout) {
    return [];
  }

  return layout.all_text
    .filter((item) => item.role === role)
    .map((item) => item.text);
}

function extractVNextSources(
  parsedSlice: ParsedSliceObject,
  context: TextSourceParityBridgeContext,
): VNextTextSources {
  return {
    main_text: parsedSlice.content.text,
    tags: parsedSlice.metadata.tags ?? [],
    pipeline: parsedSlice.process.pipeline ?? [],
    content_type: parsedSlice.content.type,
    echo_terms: extractTextsByRole(context.existing_vnext_text_layout, "text_echo_constellation"),
    constellation_terms: extractTextsByRole(context.existing_vnext_text_layout, "text_constellation"),
  };
}

function mergeTextLists(input: {
  primary: string[];
  secondary: string[];
  max_count: number;
  merge_duplicates: boolean;
}) {
  const combined = [...input.primary, ...input.secondary].map(normalizeText).filter(Boolean);
  const merged = input.merge_duplicates ? unique(combined) : combined;

  return merged.slice(0, input.max_count);
}

function mergeTemplateAndVNextSources(
  parsedSlice: ParsedSliceObject,
  templateSources: TemplateTextSources,
  vnextSources: VNextTextSources,
  settings: RequiredSettings,
) {
  return {
    center: {
      title: templateSources.center_title ?? parsedSlice.identity.index_name ?? vnextSources.main_text,
      fragment: templateSources.center_fragment ?? vnextSources.main_text,
      lines: templateSources.center_lines.length > 0
        ? templateSources.center_lines
        : splitTextIntoShortLines(vnextSources.main_text),
    },
    fragments: mergeTextLists({
      primary: templateSources.fragments,
      secondary: settings.preserve_vnext_sources ? [vnextSources.main_text] : [],
      max_count: settings.max_visible_template_fragments,
      merge_duplicates: settings.merge_duplicates,
    }),
    keywords: mergeTextLists({
      primary: templateSources.keywords,
      secondary: settings.preserve_vnext_sources ? [...vnextSources.tags, ...vnextSources.constellation_terms] : [],
      max_count: settings.max_visible_template_keywords,
      merge_duplicates: settings.merge_duplicates,
    }),
    stray_letters: templateSources.stray_letters,
    grammar_particles: mergeTextLists({
      primary: templateSources.grammar_particles,
      secondary: settings.preserve_vnext_sources && vnextSources.content_type ? [vnextSources.content_type] : [],
      max_count: settings.max_visible_grammar_particles,
      merge_duplicates: settings.merge_duplicates,
    }),
    temporal_particles: mergeTextLists({
      primary: templateSources.temporal_particles,
      secondary: settings.preserve_vnext_sources ? vnextSources.pipeline : [],
      max_count: settings.max_visible_temporal_particles,
      merge_duplicates: settings.merge_duplicates,
    }),
    echo_terms: mergeTextLists({
      primary: vnextSources.echo_terms,
      secondary: templateSources.keywords,
      max_count: settings.max_visible_template_keywords,
      merge_duplicates: settings.merge_duplicates,
    }),
  };
}

function buildBridgedTextSource(
  parsedSlice: ParsedSliceObject,
  mergedSources: ReturnType<typeof mergeTemplateAndVNextSources>,
  settings: RequiredSettings,
): BridgedTextSource {
  const hasTemplateCenter = Boolean(mergedSources.center.title);

  return {
    source_mode: "template_parity_plus_vnext_enrichment",
    center_text_source: {
      role: "center_text",
      title: mergedSources.center.title,
      fragment: mergedSources.center.fragment,
      lines: mergedSources.center.lines,
      priority: hasTemplateCenter ? "primary_template" : "vnext_fallback",
    },
    fragment_text_source: {
      role: "template_fragment",
      items: mergedSources.fragments,
      priority: "primary_template",
      visibility: "high",
    },
    keyword_text_source: {
      role: "text_constellation",
      items: mergedSources.keywords,
      priority: "primary_template",
      visibility: "high",
    },
    stray_letter_source: {
      role: "stray_letter",
      items: mergedSources.stray_letters,
      priority: "template_controlled",
      visibility: "medium",
    },
    grammar_particle_source: {
      role: "grammar_particle",
      items: mergedSources.grammar_particles,
      priority: "secondary_template",
      visibility: "low",
    },
    temporal_particle_source: {
      role: "temporal_particle",
      items: mergedSources.temporal_particles,
      priority: "secondary_template",
      visibility: "low",
    },
    echo_constellation_source: {
      role: "text_echo_constellation",
      items: mergedSources.echo_terms,
      priority: "vnext_enrichment",
      opacity_multiplier: settings.vnext_enrichment_opacity_multiplier,
    },
    original_parsed_slice: parsedSlice,
  };
}

function countSources(value: unknown): number {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (typeof value === "string") {
    return value.trim() ? 1 : 0;
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).reduce((count, entry) => count + countSources(entry), 0);
  }

  return 0;
}

function buildSourceParityReport(
  templateSources: TemplateTextSources,
  vnextSources: VNextTextSources,
  bridgedTextSource: BridgedTextSource,
): TextSourceParityReport {
  const templateCount = countSources(templateSources);
  const warnings = templateCount === 0 ? ["NO_TEMPLATE_SOURCES_AVAILABLE_USING_VNEXT_FALLBACK"] : [];

  return {
    status: warnings.length === 0 ? "ok" : "warning",
    template_sources_used: templateCount,
    vnext_sources_preserved: countSources(vnextSources),
    final_visible_sources: countSources(bridgedTextSource),
    parity_level: templateCount > 0 ? "template_visible_with_vnext_enrichment" : "vnext_fallback_only",
    warnings,
  };
}

export function runTextSourceParityBridgeV1(input: {
  parsed_slice: ParsedSliceObject;
  thought_state?: ThoughtState | null;
  thought_scene?: ThoughtSceneEngineState | null;
  shape_grammar?: Pick<ShapeGrammarState, "rulesApplied"> | null;
  clock_display?: ClockDisplayState | null;
  existing_vnext_text_layout?: TextLayoutV2Output | null;
  text_settings?: TextSourceParityBridgeSettings;
}): TextSourceParityBridgeOutput {
  const settings = normalizeSettings(input.text_settings);
  const context: TextSourceParityBridgeContext = {
    thought_state: input.thought_state,
    thought_scene: input.thought_scene,
    shape_grammar: input.shape_grammar,
    clock_display: input.clock_display,
    existing_vnext_text_layout: input.existing_vnext_text_layout,
  };
  const templateSources = extractTemplateSources(context, settings);
  const vnextSources = extractVNextSources(input.parsed_slice, context);
  const mergedSources = mergeTemplateAndVNextSources(input.parsed_slice, templateSources, vnextSources, settings);
  const bridgedTextSource = buildBridgedTextSource(input.parsed_slice, mergedSources, settings);

  return {
    bridged_text_source: bridgedTextSource,
    source_parity_report: buildSourceParityReport(templateSources, vnextSources, bridgedTextSource),
  };
}

export const RUN = runTextSourceParityBridgeV1;
