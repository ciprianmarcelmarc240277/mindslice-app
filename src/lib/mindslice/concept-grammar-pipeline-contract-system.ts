import type {
  BackgroundModuleDefinition,
  BackgroundModuleKind,
} from "@/lib/mindslice/concept-background-module-registry-system";
import type { PatternOutput } from "@/lib/mindslice/concept-pattern-engine-system";
import type { TriangulationOutput } from "@/lib/mindslice/concept-triangulation-engine-system";
import type { FlatAbstractPatternOutput } from "@/lib/mindslice/concept-flat-abstract-pattern-engine-system";
import type { IsometricPatternOutput } from "@/lib/mindslice/concept-isometric-pattern-engine-system";
import type { ZigZagPatternOutput } from "@/lib/mindslice/concept-zigzag-pattern-engine-system";
import type { RetroGridPatternOutput } from "@/lib/mindslice/concept-retro-grid-pattern-engine-system";

export type GrammarPipelineCanvas = {
  width: number;
  height: number;
};

export type GrammarPipelineSettings = Record<string, unknown>;
export type GrammarPipelinePalette = Record<string, unknown>;

export type GrammarPipelinePatternOutput =
  | (PatternOutput & { canvas?: GrammarPipelineCanvas; palette?: GrammarPipelinePalette })
  | (TriangulationOutput & { canvas?: GrammarPipelineCanvas; palette?: GrammarPipelinePalette })
  | (FlatAbstractPatternOutput & { canvas?: GrammarPipelineCanvas; palette?: GrammarPipelinePalette })
  | (IsometricPatternOutput & { canvas?: GrammarPipelineCanvas; palette?: GrammarPipelinePalette })
  | (ZigZagPatternOutput & { canvas?: GrammarPipelineCanvas; palette?: GrammarPipelinePalette })
  | (RetroGridPatternOutput & { canvas?: GrammarPipelineCanvas; palette?: GrammarPipelinePalette })
  | {
      canvas: GrammarPipelineCanvas;
      palette: GrammarPipelinePalette;
      elements: unknown[];
    };

export type GrammarPipelineOutput = {
  grammar_plan: unknown | null;
  pattern_output: GrammarPipelinePatternOutput;
  svg_layer: unknown;
  fallback_used: boolean;
  warnings: string[];
};

export type GrammarPipelineFailure = {
  status: "fail";
  message: string;
};

type CallableEngine = (...args: unknown[]) => unknown;
type EngineWithBuildFromGrammar = CallableEngine & {
  BUILD_FROM_GRAMMAR?: CallableEngine;
};

function fail(message: string): GrammarPipelineFailure {
  return {
    status: "fail",
    message,
  };
}

function asCallable(value: unknown): CallableEngine | null {
  return typeof value === "function" ? (value as CallableEngine) : null;
}

function asEngineWithBuilder(value: unknown): EngineWithBuildFromGrammar | null {
  return typeof value === "function" ? (value as EngineWithBuildFromGrammar) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (isRecord(value)) {
    const values = Object.values(value);
    return values.length === 0 || values.every((entry) => Array.isArray(entry) && entry.length === 0);
  }

  return false;
}

function isEmptyGrammarPlan(grammarPlan: unknown) {
  if (!isRecord(grammarPlan)) {
    return isEmptyValue(grammarPlan);
  }

  const planArrays = Object.entries(grammarPlan).filter(([, value]) => Array.isArray(value));
  return planArrays.length > 0 && planArrays.every(([, value]) => Array.isArray(value) && value.length === 0);
}

function isPatternOutputEmpty(kind: BackgroundModuleKind, patternOutput: unknown) {
  if (!isRecord(patternOutput)) {
    return true;
  }

  if (kind === "pattern") {
    return (
      Array.isArray(patternOutput.all_patterns) &&
      patternOutput.all_patterns.length === 0
    );
  }

  if (kind === "triangulation") {
    return (
      Array.isArray(patternOutput.points) &&
      Array.isArray(patternOutput.edges) &&
      Array.isArray(patternOutput.triangles) &&
      patternOutput.points.length === 0 &&
      patternOutput.edges.length === 0 &&
      patternOutput.triangles.length === 0
    );
  }

  if (kind === "flat_abstract_pattern") {
    return (
      Array.isArray(patternOutput.blobs) &&
      Array.isArray(patternOutput.micro_glyphs) &&
      patternOutput.blobs.length === 0 &&
      patternOutput.micro_glyphs.length === 0
    );
  }

  if (kind === "isometric_pattern") {
    return Array.isArray(patternOutput.tiles) && patternOutput.tiles.length === 0;
  }

  if (kind === "zigzag_pattern") {
    return Array.isArray(patternOutput.chevrons) && patternOutput.chevrons.length === 0;
  }

  if (kind === "retro_grid_pattern") {
    return Array.isArray(patternOutput.cells) && patternOutput.cells.length === 0;
  }

  return false;
}

function paletteString(palette: GrammarPipelinePalette, key: string, fallback: string): string {
  const value = palette[key];

  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function adaptPaletteForModule(
  kind: BackgroundModuleKind,
  palette: GrammarPipelinePalette,
): GrammarPipelinePalette {
  const background = paletteString(palette, "background", "#F6F4EF");
  const surface = paletteString(palette, "surface", background);
  const ink = paletteString(palette, "ink", "#1C1C1C");
  const accent = paletteString(palette, "accent", "#C85135");
  const primary = paletteString(palette, "primary", ink);
  const secondary = paletteString(palette, "secondary", surface);

  if (kind === "flat_abstract_pattern") {
    return {
      ...palette,
      background,
      dark_blob: paletteString(palette, "dark_blob", primary),
      yellow: paletteString(palette, "yellow", accent),
      teal: paletteString(palette, "teal", secondary),
      light: paletteString(palette, "light", surface),
    };
  }

  if (kind === "retro_grid_pattern") {
    return {
      ...palette,
      dark: paletteString(palette, "dark", ink),
      coral: paletteString(palette, "coral", accent),
      orange: paletteString(palette, "orange", primary),
      mint: paletteString(palette, "mint", secondary),
      white: paletteString(palette, "white", background),
    };
  }

  if (kind === "isometric_pattern") {
    return {
      ...palette,
      background,
      top: paletteString(palette, "top", primary),
      left: paletteString(palette, "left", secondary),
      right: paletteString(palette, "right", surface),
      shadow: paletteString(palette, "shadow", ink),
    };
  }

  if (kind === "zigzag_pattern") {
    return {
      ...palette,
      background,
      primary,
      cyan: paletteString(palette, "cyan", secondary),
      teal: paletteString(palette, "teal", secondary),
      orange: paletteString(palette, "orange", accent),
      yellow: paletteString(palette, "yellow", accent),
      gray: paletteString(palette, "gray", surface),
      dark_gray: paletteString(palette, "dark_gray", ink),
    };
  }

  return palette;
}

function withCanvasPalette<T>(
  patternOutput: T,
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
): T & { canvas: GrammarPipelineCanvas; palette: GrammarPipelinePalette } {
  if (!isRecord(patternOutput)) {
    return {
      canvas,
      palette,
    } as T & { canvas: GrammarPipelineCanvas; palette: GrammarPipelinePalette };
  }

  return {
    ...patternOutput,
    canvas: isRecord(patternOutput.canvas) ? (patternOutput.canvas as GrammarPipelineCanvas) : canvas,
    palette: isRecord(patternOutput.palette)
      ? (patternOutput.palette as GrammarPipelinePalette)
      : palette,
  };
}

function minimalPatternOutput(
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
): PatternOutput & { canvas: GrammarPipelineCanvas; palette: GrammarPipelinePalette } {
  return {
    canvas,
    palette,
    dot_grids: [],
    stripes: [],
    radial_bursts: [],
    micro_glyphs: [],
    all_patterns: [],
  };
}

function minimalTriangulationOutput(
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
): TriangulationOutput & { canvas: GrammarPipelineCanvas; palette: GrammarPipelinePalette } {
  return {
    canvas,
    palette,
    points: [],
    edges: [],
    triangles: [],
  };
}

function minimalFlatAbstractOutput(
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
): FlatAbstractPatternOutput {
  return {
    canvas,
    palette: {
      background: String(palette.background ?? "#34475A"),
      dark_blob: String(palette.dark_blob ?? "#26384A"),
      yellow: String(palette.yellow ?? "#FFD13F"),
      teal: String(palette.teal ?? "#22C7BB"),
      light: String(palette.light ?? "#DDEAF2"),
    },
    blobs: [],
    dot_grids: [],
    striped_circles: [],
    radial_bursts: [],
    curved_paths: [],
    dashed_paths: [],
    micro_glyphs: [],
  };
}

function minimalIsometricOutput(
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
): IsometricPatternOutput {
  return {
    canvas,
    palette: {
      background: String(palette.background ?? "#F2D6BD"),
      top: String(palette.top ?? "#3F3450"),
      left: String(palette.left ?? "#4E7F96"),
      right: String(palette.right ?? "#F2D6BD"),
      shadow: String(palette.shadow ?? "#2D253A"),
    },
    grid: {
      cell_w: 0,
      cell_h: 0,
      cells: [],
    },
    tiles: [],
  };
}

function minimalZigZagOutput(
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
): ZigZagPatternOutput {
  return {
    canvas,
    palette: {
      background: String(palette.background ?? "#000000"),
      primary: String(palette.primary ?? "#FFFFFF"),
      cyan: String(palette.cyan ?? "#46C7D8"),
      teal: String(palette.teal ?? "#55C8B4"),
      orange: String(palette.orange ?? "#FF5A2E"),
      yellow: String(palette.yellow ?? "#FFB637"),
      gray: String(palette.gray ?? "#6E7474"),
      dark_gray: String(palette.dark_gray ?? "#2C2C2C"),
    },
    grid: {
      cells: [],
      cols: 0,
      rows: 0,
      cell_width: 0,
      cell_height: 0,
    },
    chevrons: [],
  };
}

function minimalRetroGridOutput(
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
): RetroGridPatternOutput {
  return {
    canvas,
    palette: {
      dark: String(palette.dark ?? "#252B42"),
      coral: String(palette.coral ?? "#FF9A82"),
      orange: String(palette.orange ?? "#F6A043"),
      mint: String(palette.mint ?? "#9DD8D2"),
      white: String(palette.white ?? "#FFFFFF"),
    },
    grid: [],
    cells: [],
  };
}

export function fallbackPatternOutput(
  module: BackgroundModuleDefinition,
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
  _settings: GrammarPipelineSettings = {},
): GrammarPipelinePatternOutput {
  void _settings;

  if (module.kind === "pattern") {
    return minimalPatternOutput(canvas, palette);
  }

  if (module.kind === "triangulation") {
    return minimalTriangulationOutput(canvas, palette);
  }

  if (module.kind === "flat_abstract_pattern") {
    return minimalFlatAbstractOutput(canvas, palette);
  }

  if (module.kind === "isometric_pattern") {
    return minimalIsometricOutput(canvas, palette);
  }

  if (module.kind === "zigzag_pattern") {
    return minimalZigZagOutput(canvas, palette);
  }

  if (module.kind === "retro_grid_pattern") {
    return minimalRetroGridOutput(canvas, palette);
  }

  return {
    canvas,
    palette,
    elements: [],
  };
}

function renderSvgLayer(
  module: BackgroundModuleDefinition,
  patternOutput: GrammarPipelinePatternOutput,
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
) {
  const renderer = asCallable(module.svg_renderer);

  if (!renderer) {
    return null;
  }

  if (module.kind === "pattern" || module.kind === "triangulation") {
    return renderer(patternOutput, canvas, palette);
  }

  return renderer(patternOutput);
}

function runPatternEngine(
  module: BackgroundModuleDefinition,
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
  settings: GrammarPipelineSettings,
  warnings: string[],
): GrammarPipelinePatternOutput {
  const engine = asCallable(module.pattern_engine);

  if (!engine) {
    warnings.push("PATTERN_ENGINE_NOT_CALLABLE");
    return fallbackPatternOutput(module, canvas, palette);
  }

  if (module.kind === "pattern") {
    const structureOutput = settings.structure_output;
    const colorOutput = settings.color_output;

    if (!structureOutput || !colorOutput) {
      warnings.push("PATTERN_ENGINE_REQUIRES_STRUCTURE_AND_COLOR_OUTPUT");
      return fallbackPatternOutput(module, canvas, palette);
    }

    return engine(canvas, structureOutput, colorOutput, settings) as GrammarPipelinePatternOutput;
  }

  return engine(canvas, settings, palette) as GrammarPipelinePatternOutput;
}

function resolveGrammarBuilder(module: BackgroundModuleDefinition): CallableEngine | null {
  const explicitBuilder = asCallable(module.build_from_grammar_optional);

  if (explicitBuilder) {
    return explicitBuilder;
  }

  if (module.build_from_grammar_optional !== true) {
    return null;
  }

  const patternEngine = asEngineWithBuilder(module.pattern_engine);
  return patternEngine?.BUILD_FROM_GRAMMAR ?? null;
}

function runGrammarEngine(
  module: BackgroundModuleDefinition,
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
  grammarProfile: string | null,
  settings: GrammarPipelineSettings,
  warnings: string[],
) {
  const grammarEngine = asCallable(module.grammar_engine_optional);

  if (!grammarEngine) {
    warnings.push("GRAMMAR_ENGINE_NOT_CALLABLE");
    return null;
  }

  try {
    return grammarEngine(
      canvas,
      { name: grammarProfile ?? module.supported_grammar_profiles[0] },
      palette,
      settings,
    );
  } catch {
    warnings.push("GRAMMAR_ENGINE_RUN_FAILED");
    return null;
  }
}

export function handleEmptyGrammarPlan(
  module: BackgroundModuleDefinition,
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
  settings: GrammarPipelineSettings,
  warnings: string[],
) {
  const fallbackProfile = module.supported_grammar_profiles[0] ?? null;

  if (fallbackProfile) {
    const grammarPlan = runGrammarEngine(
      module,
      canvas,
      palette,
      fallbackProfile,
      settings,
      warnings,
    );

    if (!isEmptyGrammarPlan(grammarPlan)) {
      warnings.push(`GRAMMAR_FALLBACK_PROFILE_USED:${fallbackProfile}`);
      return grammarPlan;
    }
  }

  warnings.push("MINIMAL_GRAMMAR_PLAN_USED");

  return {
    canvas,
    palette,
    profile: fallbackProfile ?? "minimal",
    rules: {},
  };
}

export function runWithGrammar(
  module: BackgroundModuleDefinition,
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
  grammarProfile: string | null,
  settings: GrammarPipelineSettings,
): GrammarPipelineOutput {
  const warnings: string[] = [];
  const adaptedPalette = adaptPaletteForModule(module.kind, palette);
  let grammarPlan = runGrammarEngine(module, canvas, adaptedPalette, grammarProfile, settings, warnings);

  if (isEmptyGrammarPlan(grammarPlan)) {
    grammarPlan = handleEmptyGrammarPlan(module, canvas, adaptedPalette, settings, warnings);
  }

  const builder = resolveGrammarBuilder(module);
  let fallbackUsed = false;
  let patternOutput: GrammarPipelinePatternOutput;

  if (builder) {
    patternOutput = withCanvasPalette(
      builder(canvas, settings, adaptedPalette, grammarPlan),
      canvas,
      adaptedPalette,
    ) as GrammarPipelinePatternOutput;
  } else {
    warnings.push("BUILD_FROM_GRAMMAR_NOT_CALLABLE_USING_PATTERN_ENGINE_RUN");
    patternOutput = withCanvasPalette(
      runPatternEngine(module, canvas, adaptedPalette, settings, warnings),
      canvas,
      adaptedPalette,
    );
  }

  if (isPatternOutputEmpty(module.kind, patternOutput)) {
    warnings.push("EMPTY_PATTERN_OUTPUT");
    patternOutput = fallbackPatternOutput(module, canvas, adaptedPalette, settings);
    fallbackUsed = true;
  }

  return {
    grammar_plan: grammarPlan,
    pattern_output: patternOutput,
    svg_layer: renderSvgLayer(module, patternOutput, canvas, adaptedPalette),
    fallback_used: fallbackUsed,
    warnings,
  };
}

export function runWithoutGrammar(
  module: BackgroundModuleDefinition,
  canvas: GrammarPipelineCanvas,
  palette: GrammarPipelinePalette,
  settings: GrammarPipelineSettings,
): GrammarPipelineOutput {
  const warnings: string[] = [];
  const adaptedPalette = adaptPaletteForModule(module.kind, palette);
  let fallbackUsed = false;
  let patternOutput: GrammarPipelinePatternOutput = withCanvasPalette(
    runPatternEngine(module, canvas, adaptedPalette, settings, warnings),
    canvas,
    adaptedPalette,
  );

  if (isPatternOutputEmpty(module.kind, patternOutput)) {
    warnings.push("EMPTY_PATTERN_OUTPUT");
    patternOutput = fallbackPatternOutput(module, canvas, adaptedPalette, settings);
    fallbackUsed = true;
  }

  return {
    grammar_plan: null,
    pattern_output: patternOutput,
    svg_layer: renderSvgLayer(module, patternOutput, canvas, adaptedPalette),
    fallback_used: fallbackUsed,
    warnings,
  };
}

export function validatePatternOutput(
  _module: BackgroundModuleDefinition,
  patternOutput: unknown,
): { status: "ok" } | GrammarPipelineFailure {
  void _module;

  if (!patternOutput) {
    return fail("NULL_PATTERN_OUTPUT");
  }

  if (!isRecord(patternOutput)) {
    return fail("INVALID_PATTERN_OUTPUT");
  }

  if (!patternOutput.canvas) {
    return fail("PATTERN_OUTPUT_MISSING_CANVAS");
  }

  if (!patternOutput.palette) {
    return fail("PATTERN_OUTPUT_MISSING_PALETTE");
  }

  return {
    status: "ok",
  };
}

export function runGrammarPipelineContractV1(input: {
  background_module: BackgroundModuleDefinition;
  canvas: GrammarPipelineCanvas;
  palette: GrammarPipelinePalette;
  grammar_profile?: string | null;
  settings?: GrammarPipelineSettings;
  render_settings?: GrammarPipelineSettings;
}): GrammarPipelineOutput {
  const settings = {
    ...(input.settings ?? {}),
    ...(input.render_settings ?? {}),
  };
  const hasGrammar =
    Boolean(input.background_module.grammar_engine_optional) &&
    Boolean(input.background_module.build_from_grammar_optional);
  let result = hasGrammar
    ? runWithGrammar(
        input.background_module,
        input.canvas,
        input.palette,
        input.grammar_profile ?? null,
        settings,
      )
    : runWithoutGrammar(input.background_module, input.canvas, input.palette, settings);
  const validation = validatePatternOutput(input.background_module, result.pattern_output);

  if (validation.status === "fail") {
    const patternOutput = fallbackPatternOutput(
      input.background_module,
      input.canvas,
      input.palette,
      settings,
    );

    result = {
      ...result,
      pattern_output: patternOutput,
      svg_layer: renderSvgLayer(input.background_module, patternOutput, input.canvas, input.palette),
      fallback_used: true,
      warnings: [...result.warnings, validation.message],
    };
  }

  return result;
}

export const RUN_WITH_GRAMMAR = runWithGrammar;
export const RUN_WITHOUT_GRAMMAR = runWithoutGrammar;
export const HANDLE_EMPTY_GRAMMAR_PLAN = handleEmptyGrammarPlan;
export const FALLBACK_PATTERN_OUTPUT = fallbackPatternOutput;
export const VALIDATE_PATTERN_OUTPUT = validatePatternOutput;
export const RUN = runGrammarPipelineContractV1;
