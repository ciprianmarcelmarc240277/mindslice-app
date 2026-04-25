import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type { ConceptualPresetOutput } from "@/lib/mindslice/concept-conceptual-preset-system";
import {
  getBackgroundModule,
  matchBackgroundModule,
  type BackgroundModuleDefinition,
  type BackgroundModuleKind,
  type BackgroundRegistryFailure,
  type BackgroundRegistryMatch,
  type BackgroundRegistryRenderSettings,
} from "@/lib/mindslice/concept-background-module-registry-system";

export type BackgroundLayerKind =
  | "pattern"
  | "triangulation"
  | "flat_abstract_pattern"
  | "isometric_pattern"
  | "zigzag_pattern"
  | "retro_grid_pattern";

export type BackgroundOrchestratorDensity = "low" | "medium" | "medium_high" | "high";

export type BackgroundOrchestratorRenderSettings = BackgroundRegistryRenderSettings & {
  background_kind?: BackgroundModuleKind;
  background_layer_kind?: BackgroundModuleKind;
  grammar_profile?: string | null;
  background_opacity?: number;
  opacity?: number;
  density?: BackgroundOrchestratorDensity;
  seed?: string;
  background_settings?: Record<string, unknown>;
};

export type BackgroundOrchestratorCanvas = {
  width: number;
  height: number;
  margin?: number;
};

export type BackgroundRegistryLike = {
  GET?: (backgroundKind: BackgroundModuleKind) => BackgroundModuleDefinition | BackgroundRegistryFailure;
  MATCH?: (
    parsedSlice: ParsedSliceObject,
    conceptualPreset: ConceptualPresetOutput,
    renderSettings?: BackgroundRegistryRenderSettings,
  ) => BackgroundRegistryMatch | BackgroundRegistryFailure;
};

export type BackgroundLayerSelectionV2 = {
  active_kind: BackgroundModuleKind;
  module: BackgroundModuleDefinition;
  grammar_profile: string | null;
  seed: string;
  density: BackgroundOrchestratorDensity;
  opacity: number;
  settings: Record<string, unknown>;
  canvas: BackgroundOrchestratorCanvas;
  render_settings: BackgroundOrchestratorRenderSettings;
  reason: string;
};

export type BackgroundOrchestratorFailure = {
  status: "fail";
  message: string;
};

export type BackgroundPatternSettings = {
  dot_grid_count?: number;
  dot_rows?: number;
  dot_cols?: number;
  dot_spacing?: number;
  dot_radius?: number;
  dot_opacity?: number;
  striped_circle_count?: number;
  striped_radius?: number;
  stripe_count?: number;
  stripe_height?: number;
  burst_count?: number;
  burst_inner?: number;
  burst_outer?: number;
  burst_rays?: number;
  burst_stroke?: number;
  micro_glyph_count?: number;
};

export type BackgroundTriangulationSettings = {
  point_count?: number;
  jitter?: number;
  grid_cols?: number;
  grid_rows?: number;
  color_variation?: number;
};

export type BackgroundFlatAbstractPatternSettings = {
  blob_count?: number;
  dot_grid_count?: number;
  striped_circle_count?: number;
  radial_burst_count?: number;
  curve_count?: number;
  dashed_curve_count?: number;
  micro_glyph_count?: number;
};

export type BackgroundIsometricPatternSettings = {
  tile_size?: number;
  cube_size?: number;
  row_offset?: boolean;
  margin?: number;
};

export type BackgroundZigZagPatternSettings = {
  column_count?: number;
  row_count?: number;
  cell_width?: number;
  cell_height?: number;
  chevron_width?: number;
  chevron_height?: number;
  stroke_width?: number;
  gap?: number;
  accent_probability?: number;
  offset_alternate_rows?: boolean;
};

export type BackgroundRetroGridPatternSettings = {
  rows?: number;
  cols?: number;
  cell_size?: number;
};

export type BackgroundLayerSelection = {
  active_kind: BackgroundLayerKind;
  seed: string;
  opacity: number;
  density: number;
  pattern_settings: BackgroundPatternSettings | null;
  triangulation_settings: BackgroundTriangulationSettings | null;
  flat_abstract_pattern_settings: BackgroundFlatAbstractPatternSettings | null;
  isometric_pattern_settings: BackgroundIsometricPatternSettings | null;
  zigzag_pattern_settings: BackgroundZigZagPatternSettings | null;
  retro_grid_pattern_settings: BackgroundRetroGridPatternSettings | null;
  reason: string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildSeed(parsedSlice: ParsedSliceObject) {
  return [
    parsedSlice.identity.index_name ?? "",
    parsedSlice.content.text,
    parsedSlice.metadata.tags.join("|"),
    parsedSlice.metadata.intensity,
  ].join("::");
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function fail(message: string): BackgroundOrchestratorFailure {
  return {
    status: "fail",
    message,
  };
}

function seededRange(seed: string, min: number, max: number) {
  const value = hashString(seed) / 4294967295;
  return min + (max - min) * value;
}

function inferKind(parsedSlice: ParsedSliceObject, preset: ConceptualPresetOutput): {
  kind: BackgroundLayerKind;
  reason: string;
} {
  const semanticText = normalizeText(
    `${parsedSlice.content.text} ${parsedSlice.metadata.tags.join(" ")}`,
  );

  if (preset.style_mode === "FRAGMENT" || preset.style_mode === "CONSTELLATION") {
    return {
      kind: "pattern",
      reason: "preset_pattern_field",
    };
  }

  if (
    semanticText.includes("retro") ||
    semanticText.includes("grid pattern") ||
    semanticText.includes("quarter circle") ||
    semanticText.includes("diamond") ||
    semanticText.includes("stripe block")
  ) {
    return {
      kind: "retro_grid_pattern",
      reason: "semantic_retro_grid_field",
    };
  }

  if (
    semanticText.includes("zigzag") ||
    semanticText.includes("zig-zag") ||
    semanticText.includes("chevron") ||
    semanticText.includes("ruptm") ||
    semanticText.includes("ritm")
  ) {
    return {
      kind: "zigzag_pattern",
      reason: "semantic_zigzag_field",
    };
  }

  if (
    semanticText.includes("isometric") ||
    semanticText.includes("izometric") ||
    semanticText.includes("cube") ||
    semanticText.includes("cub") ||
    semanticText.includes("tile")
  ) {
    return {
      kind: "isometric_pattern",
      reason: "semantic_isometric_field",
    };
  }

  if (
    semanticText.includes("abstract") ||
    semanticText.includes("suprafata") ||
    semanticText.includes("background") ||
    semanticText.includes("cadru mental virtual")
  ) {
    return {
      kind: "flat_abstract_pattern",
      reason: "semantic_flat_abstract_field",
    };
  }

  if (
    semanticText.includes("memorie") ||
    semanticText.includes("constelatie") ||
    semanticText.includes("atlas") ||
    semanticText.includes("fragment") ||
    semanticText.includes("ruptura")
  ) {
    return {
      kind: "pattern",
      reason: "semantic_pattern_field",
    };
  }

  if (
    semanticText.includes("spatiu") ||
    semanticText.includes("cadru") ||
    semanticText.includes("structura") ||
    semanticText.includes("geometr") ||
    semanticText.includes("perceptie")
  ) {
    return {
      kind: "triangulation",
      reason: "semantic_geometry_field",
    };
  }

  const fallbackIndex = hashString(buildSeed(parsedSlice)) % 6;

  if (fallbackIndex === 0) {
    return { kind: "pattern", reason: "seed_pattern_fallback" };
  }

  if (fallbackIndex === 1) {
    return { kind: "triangulation", reason: "seed_triangulation_fallback" };
  }

  if (fallbackIndex === 2) {
    return { kind: "flat_abstract_pattern", reason: "seed_flat_abstract_fallback" };
  }

  if (fallbackIndex === 3) {
    return { kind: "isometric_pattern", reason: "seed_isometric_fallback" };
  }

  if (fallbackIndex === 4) {
    return { kind: "zigzag_pattern", reason: "seed_zigzag_fallback" };
  }

  return { kind: "retro_grid_pattern", reason: "seed_retro_grid_fallback" };
}

function buildPatternSettings(seed: string, density: number): BackgroundPatternSettings {
  return {
    dot_grid_count: Math.round(seededRange(`${seed}:dot-count`, 1, 4)),
    dot_rows: Math.round(seededRange(`${seed}:dot-rows`, 5, 9)),
    dot_cols: Math.round(seededRange(`${seed}:dot-cols`, 5, 10)),
    dot_spacing: seededRange(`${seed}:dot-spacing`, 14, 28),
    dot_radius: seededRange(`${seed}:dot-radius`, 2.4, 5.8),
    dot_opacity: seededRange(`${seed}:dot-opacity`, 0.38, 0.78),
    striped_circle_count: Math.round(seededRange(`${seed}:stripe-count`, 0, 3)),
    striped_radius: seededRange(`${seed}:stripe-radius`, 44, 112),
    stripe_count: Math.round(seededRange(`${seed}:stripe-lines`, 5, 11)),
    stripe_height: seededRange(`${seed}:stripe-height`, 3.5, 8.5),
    burst_count: Math.round(seededRange(`${seed}:burst-count`, 1, 4)),
    burst_inner: seededRange(`${seed}:burst-inner`, 10, 28),
    burst_outer: seededRange(`${seed}:burst-outer`, 30, 68),
    burst_rays: Math.round(seededRange(`${seed}:burst-rays`, 10, 22)),
    burst_stroke: seededRange(`${seed}:burst-stroke`, 2.6, 6.2),
    micro_glyph_count: Math.round(seededRange(`${seed}:glyph-count`, 12, 36) * density),
  };
}

function buildTriangulationSettings(
  seed: string,
  density: number,
): BackgroundTriangulationSettings {
  return {
    point_count: Math.round(seededRange(`${seed}:point-count`, 110, 260) * density),
    grid_cols: Math.round(seededRange(`${seed}:grid-cols`, 16, 30)),
    grid_rows: Math.round(seededRange(`${seed}:grid-rows`, 7, 14)),
    jitter: seededRange(`${seed}:jitter`, 0.18, 0.42),
    color_variation: seededRange(`${seed}:color-variation`, 0.72, 1.18),
  };
}

function buildFlatAbstractPatternSettings(
  seed: string,
  density: number,
): BackgroundFlatAbstractPatternSettings {
  return {
    blob_count: 6,
    dot_grid_count: 4,
    striped_circle_count: 2,
    radial_burst_count: 6,
    curve_count: 3,
    dashed_curve_count: 2,
    micro_glyph_count: Math.round(seededRange(`${seed}:flat-glyph-count`, 28, 56) * density),
  };
}

function buildIsometricPatternSettings(seed: string): BackgroundIsometricPatternSettings {
  return {
    tile_size: Math.round(seededRange(`${seed}:iso-tile-size`, 92, 138)),
    cube_size: Math.round(seededRange(`${seed}:iso-cube-size`, 52, 82)),
    row_offset: true,
    margin: 0,
  };
}

function buildZigZagPatternSettings(seed: string, density: number): BackgroundZigZagPatternSettings {
  return {
    column_count: 8,
    row_count: 9,
    cell_width: Math.round(seededRange(`${seed}:zig-cell-width`, 128, 164)),
    cell_height: Math.round(seededRange(`${seed}:zig-cell-height`, 112, 146)),
    chevron_width: Math.round(seededRange(`${seed}:zig-chevron-width`, 98, 132)),
    chevron_height: Math.round(seededRange(`${seed}:zig-chevron-height`, 58, 78)),
    stroke_width: Math.round(seededRange(`${seed}:zig-stroke-width`, 20, 30)),
    gap: Math.round(seededRange(`${seed}:zig-gap`, 26, 42)),
    accent_probability: seededRange(`${seed}:zig-accent`, 0.1, 0.24) * density,
    offset_alternate_rows: true,
  };
}

function buildRetroGridPatternSettings(seed: string): BackgroundRetroGridPatternSettings {
  const rows = Math.round(seededRange(`${seed}:retro-rows`, 3, 6));
  const cols = Math.round(seededRange(`${seed}:retro-cols`, 3, 6));

  return {
    rows,
    cols,
    cell_size: 1080 / cols,
  };
}

export function runBackgroundLayerOrchestratorV1(
  parsedSlice: ParsedSliceObject,
  conceptualPreset: ConceptualPresetOutput,
  forcedKind?: BackgroundLayerKind,
): BackgroundLayerSelection {
  const seed = buildSeed(parsedSlice);
  const density = seededRange(`${seed}:density`, 0.72, 1.18);
  const opacity = seededRange(`${seed}:opacity`, 0.28, 0.58);
  const inferred = inferKind(parsedSlice, conceptualPreset);
  const kind = forcedKind ?? inferred.kind;
  const reason = forcedKind ? "manual_background_override" : inferred.reason;

  return {
    active_kind: kind,
    seed,
    opacity,
    density,
    pattern_settings: kind === "pattern" ? buildPatternSettings(seed, density) : null,
    triangulation_settings:
      kind === "triangulation" ? buildTriangulationSettings(seed, density) : null,
    flat_abstract_pattern_settings:
      kind === "flat_abstract_pattern" ? buildFlatAbstractPatternSettings(seed, density) : null,
    isometric_pattern_settings:
      kind === "isometric_pattern" ? buildIsometricPatternSettings(seed) : null,
    zigzag_pattern_settings:
      kind === "zigzag_pattern" ? buildZigZagPatternSettings(seed, density) : null,
    retro_grid_pattern_settings:
      kind === "retro_grid_pattern" ? buildRetroGridPatternSettings(seed) : null,
    reason,
  };
}

function registryGet(registry: BackgroundRegistryLike | undefined, kind: BackgroundModuleKind) {
  return registry?.GET ? registry.GET(kind) : getBackgroundModule(kind);
}

function registryMatch(
  registry: BackgroundRegistryLike | undefined,
  parsedSlice: ParsedSliceObject,
  conceptualPreset: ConceptualPresetOutput,
  renderSettings: BackgroundOrchestratorRenderSettings,
) {
  return registry?.MATCH
    ? registry.MATCH(parsedSlice, conceptualPreset, renderSettings)
    : matchBackgroundModule(parsedSlice, conceptualPreset, renderSettings);
}

export function chooseBackgroundKind(
  parsedSlice: ParsedSliceObject,
  conceptualPreset: ConceptualPresetOutput,
  renderSettings: BackgroundOrchestratorRenderSettings = {},
  registry?: BackgroundRegistryLike,
): { kind: BackgroundModuleKind; reason: string } | BackgroundOrchestratorFailure {
  const explicitKind = renderSettings.background_kind ?? renderSettings.background_layer_kind;

  if (explicitKind) {
    return {
      kind: explicitKind,
      reason: "explicit_background_kind",
    };
  }

  const match = registryMatch(registry, parsedSlice, conceptualPreset, renderSettings);

  if ("status" in match) {
    return fail(match.message);
  }

  return {
    kind: match.kind,
    reason: `registry_match_score_${match.score}`,
  };
}

function firstProfileContaining(profiles: string[], text: string) {
  const normalizedNeedle = normalizeText(text);
  return profiles.find((profile) => normalizeText(profile).includes(normalizedNeedle)) ?? null;
}

export function chooseGrammarProfile(
  moduleDefinition: BackgroundModuleDefinition,
  conceptualPreset: ConceptualPresetOutput,
  renderSettings: BackgroundOrchestratorRenderSettings = {},
) {
  if (renderSettings.grammar_profile !== undefined) {
    return renderSettings.grammar_profile;
  }

  if (!moduleDefinition.grammar_engine_optional) {
    return null;
  }

  if (conceptualPreset.style_mode === "CONTROL_CALM") {
    return (
      firstProfileContaining(moduleDefinition.supported_grammar_profiles, "control") ??
      moduleDefinition.supported_grammar_profiles[0] ??
      null
    );
  }

  if (conceptualPreset.style_mode === "DEVIATION") {
    return (
      firstProfileContaining(moduleDefinition.supported_grammar_profiles, "deviation") ??
      moduleDefinition.supported_grammar_profiles[0] ??
      null
    );
  }

  return moduleDefinition.supported_grammar_profiles[0] ?? null;
}

export function computeBackgroundSeed(
  parsedSlice: ParsedSliceObject,
  renderSettings: BackgroundOrchestratorRenderSettings = {},
) {
  if (renderSettings.seed) {
    return renderSettings.seed;
  }

  return String(
    hashString(
      [
        parsedSlice.identity.index_name,
        parsedSlice.content.text,
        parsedSlice.metadata.language,
      ].join(""),
    ),
  );
}

export function computeBackgroundDensity(
  parsedSlice: ParsedSliceObject,
  renderSettings: BackgroundOrchestratorRenderSettings = {},
): BackgroundOrchestratorDensity {
  if (renderSettings.density) {
    return renderSettings.density;
  }

  const intensity = parsedSlice.metadata.intensity ?? 0.5;

  if (intensity >= 0.85) {
    return "medium_high";
  }

  if (intensity >= 0.6) {
    return "medium";
  }

  return "low";
}

export function buildBackgroundSettings(
  moduleDefinition: BackgroundModuleDefinition,
  _parsedSlice: ParsedSliceObject,
  conceptualPreset: ConceptualPresetOutput,
  canvas: BackgroundOrchestratorCanvas,
  density: BackgroundOrchestratorDensity,
  seed: string,
  renderSettings: BackgroundOrchestratorRenderSettings = {},
) {
  const presetWithBackgroundSettings = conceptualPreset as ConceptualPresetOutput & {
    background_settings?: Record<string, unknown>;
  };

  return {
    ...moduleDefinition.default_settings,
    canvas_width: canvas.width,
    canvas_height: canvas.height,
    density,
    seed,
    ...(presetWithBackgroundSettings.background_settings ?? {}),
    ...(renderSettings.background_settings ?? {}),
  };
}

export function computeBackgroundOpacity(
  moduleDefinition: BackgroundModuleDefinition,
  renderSettings: BackgroundOrchestratorRenderSettings = {},
) {
  if (renderSettings.background_opacity !== undefined) {
    return renderSettings.background_opacity;
  }

  if (renderSettings.opacity !== undefined) {
    return renderSettings.opacity;
  }

  return moduleDefinition.default_opacity;
}

export function runBackgroundOrchestratorV2(
  parsedSlice: ParsedSliceObject,
  conceptualPreset: ConceptualPresetOutput,
  canvas: BackgroundOrchestratorCanvas,
  renderSettings: BackgroundOrchestratorRenderSettings = {},
  registry?: BackgroundRegistryLike,
): BackgroundLayerSelectionV2 | BackgroundOrchestratorFailure {
  const selected = chooseBackgroundKind(
    parsedSlice,
    conceptualPreset,
    renderSettings,
    registry,
  );

  if ("status" in selected) {
    return selected;
  }

  const moduleDefinition = registryGet(registry, selected.kind);

  if ("status" in moduleDefinition) {
    return fail(moduleDefinition.message);
  }

  const grammarProfile = chooseGrammarProfile(
    moduleDefinition,
    conceptualPreset,
    renderSettings,
  );
  const seed = computeBackgroundSeed(parsedSlice, renderSettings);
  const density = computeBackgroundDensity(parsedSlice, renderSettings);
  const settings = buildBackgroundSettings(
    moduleDefinition,
    parsedSlice,
    conceptualPreset,
    canvas,
    density,
    seed,
    renderSettings,
  );
  const opacity = computeBackgroundOpacity(moduleDefinition, renderSettings);

  return {
    active_kind: selected.kind,
    module: moduleDefinition,
    grammar_profile: grammarProfile,
    seed,
    density,
    opacity,
    settings,
    canvas,
    render_settings: renderSettings,
    reason: selected.reason,
  };
}

export const RUN_V1 = runBackgroundLayerOrchestratorV1;
export const RUN_V2 = runBackgroundOrchestratorV2;
export const RUN = runBackgroundOrchestratorV2;
