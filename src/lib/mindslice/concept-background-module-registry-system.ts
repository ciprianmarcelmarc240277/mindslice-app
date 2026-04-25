import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type { ConceptualPresetOutput } from "@/lib/mindslice/concept-conceptual-preset-system";
import { runPatternEngineV1 } from "@/lib/mindslice/concept-pattern-engine-system";
import { runPatternSvgRendererV1 } from "@/lib/mindslice/concept-pattern-svg-renderer-system";
import { runTriangulationEngineV1 } from "@/lib/mindslice/concept-triangulation-engine-system";
import { runTriangulationSvgRendererV1 } from "@/lib/mindslice/concept-triangulation-svg-renderer-system";
import {
  buildFlatAbstractPatternFromGrammarV1,
  runFlatAbstractPatternEngineV1,
} from "@/lib/mindslice/concept-flat-abstract-pattern-engine-system";
import { runFlatAbstractGrammarEngineV1 } from "@/lib/mindslice/concept-flat-abstract-grammar-engine-system";
import { runFlatAbstractPatternSvgRendererV1 } from "@/lib/mindslice/concept-flat-abstract-pattern-svg-renderer-system";
import {
  buildIsometricPatternFromGrammarV1,
  runIsometricPatternEngineV1,
} from "@/lib/mindslice/concept-isometric-pattern-engine-system";
import { runIsometricGrammarEngineV1 } from "@/lib/mindslice/concept-isometric-grammar-engine-system";
import { runIsometricPatternSvgRendererV1 } from "@/lib/mindslice/concept-isometric-pattern-svg-renderer-system";
import {
  buildZigZagPatternFromGrammarV1,
  runZigZagGrammarForPatternPipelineV1,
  runZigZagPatternEngineV1,
} from "@/lib/mindslice/concept-zigzag-pattern-engine-system";
import { runZigZagPatternSvgRendererV1 } from "@/lib/mindslice/concept-zigzag-pattern-svg-renderer-system";
import {
  buildRetroGridPatternFromGrammarV1,
  runRetroGridGrammarForPatternPipelineV1,
  runRetroGridPatternEngineV1,
} from "@/lib/mindslice/concept-retro-grid-pattern-engine-system";
import { runRetroGridPatternSvgRendererV1 } from "@/lib/mindslice/concept-retro-grid-pattern-svg-renderer-system";

export type BackgroundModuleKind =
  | "pattern"
  | "triangulation"
  | "flat_abstract_pattern"
  | "isometric_pattern"
  | "zigzag_pattern"
  | "retro_grid_pattern";

export type BackgroundRegistryRenderSettings = {
  mode?: string;
  background_layer_kind?: BackgroundModuleKind;
  [key: string]: unknown;
};

export type BackgroundInferRules = {
  RUN: (
    parsedSlice: ParsedSliceObject,
    conceptualPreset: ConceptualPresetOutput,
    renderSettings?: BackgroundRegistryRenderSettings,
  ) => number;
};

export type BackgroundModuleDefinition = {
  kind: BackgroundModuleKind;
  infer_rules: BackgroundInferRules;
  default_settings: Record<string, unknown>;
  supported_grammar_profiles: string[];
  grammar_engine_optional: ((...args: never[]) => unknown) | null;
  build_from_grammar_optional: ((...args: never[]) => unknown) | boolean | null;
  pattern_engine: (...args: never[]) => unknown;
  svg_renderer: (...args: never[]) => unknown;
  default_opacity: number;
  layer_order: number;
  semantic_tags: string[];
};

export type BackgroundRegistryFailure = {
  status: "fail";
  message: string;
};

export type BackgroundRegistryMatch = {
  kind: BackgroundModuleKind;
  module: BackgroundModuleDefinition;
  score: number;
};

const SUPPORTED_KINDS: BackgroundModuleKind[] = [
  "pattern",
  "triangulation",
  "flat_abstract_pattern",
  "isometric_pattern",
  "zigzag_pattern",
  "retro_grid_pattern",
];

const modules: Partial<Record<BackgroundModuleKind, BackgroundModuleDefinition>> = {};

function fail(message: string): BackgroundRegistryFailure {
  return {
    status: "fail",
    message,
  };
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sliceText(parsedSlice: ParsedSliceObject) {
  return normalizeText(`${parsedSlice.content.text} ${parsedSlice.metadata.tags.join(" ")}`);
}

function scoreTerms(text: string, terms: string[], weight: number) {
  return terms.reduce((score, term) => score + (text.includes(term) ? weight : 0), 0);
}

function forcedKindScore(
  kind: BackgroundModuleKind,
  renderSettings?: BackgroundRegistryRenderSettings,
) {
  return renderSettings?.background_layer_kind === kind ? 1000 : 0;
}

function presetScore(conceptualPreset: ConceptualPresetOutput, styleModes: string[], weight: number) {
  return styleModes.includes(conceptualPreset.style_mode) ? weight : 0;
}

export const PatternInferRules: BackgroundInferRules = {
  RUN(parsedSlice, conceptualPreset, renderSettings) {
    const text = sliceText(parsedSlice);
    return (
      forcedKindScore("pattern", renderSettings) +
      presetScore(conceptualPreset, ["FRAGMENT", "CONSTELLATION"], 18) +
      scoreTerms(text, ["memorie", "constelatie", "atlas", "fragment", "ruptura", "glyph", "dot"], 6)
    );
  },
};

export const TriangulationInferRules: BackgroundInferRules = {
  RUN(parsedSlice, _conceptualPreset, renderSettings) {
    const text = sliceText(parsedSlice);
    return (
      forcedKindScore("triangulation", renderSettings) +
      scoreTerms(text, ["spatiu", "cadru", "structura", "geometr", "perceptie", "triang", "mesh"], 6)
    );
  },
};

export const FlatAbstractInferRules: BackgroundInferRules = {
  RUN(parsedSlice, _conceptualPreset, renderSettings) {
    const text = sliceText(parsedSlice);
    return (
      forcedKindScore("flat_abstract_pattern", renderSettings) +
      scoreTerms(text, ["abstract", "suprafata", "background", "cadru mental virtual", "editorial", "play"], 7)
    );
  },
};

export const IsometricInferRules: BackgroundInferRules = {
  RUN(parsedSlice, _conceptualPreset, renderSettings) {
    const text = sliceText(parsedSlice);
    return (
      forcedKindScore("isometric_pattern", renderSettings) +
      scoreTerms(text, ["isometric", "izometric", "cube", "cub", "tile", "volum"], 7)
    );
  },
};

export const ZigZagInferRules: BackgroundInferRules = {
  RUN(parsedSlice, _conceptualPreset, renderSettings) {
    const text = sliceText(parsedSlice);
    return (
      forcedKindScore("zigzag_pattern", renderSettings) +
      scoreTerms(text, ["zigzag", "zig-zag", "chevron", "ritm", "rhythm", "signal", "repetitie"], 7)
    );
  },
};

export const RetroGridInferRules: BackgroundInferRules = {
  RUN(parsedSlice, _conceptualPreset, renderSettings) {
    const text = sliceText(parsedSlice);
    return (
      forcedKindScore("retro_grid_pattern", renderSettings) +
      scoreTerms(text, ["retro", "grid pattern", "quarter circle", "diamond", "stripe block", "bauhaus"], 7)
    );
  },
};

export function validateBackgroundModule(moduleDefinition: BackgroundModuleDefinition) {
  if (!moduleDefinition.kind) {
    return fail("MISSING_BACKGROUND_KIND");
  }

  if (!SUPPORTED_KINDS.includes(moduleDefinition.kind)) {
    return fail("UNSUPPORTED_BACKGROUND_KIND");
  }

  if (
    !moduleDefinition.infer_rules ||
    !moduleDefinition.default_settings ||
    !moduleDefinition.supported_grammar_profiles ||
    !moduleDefinition.pattern_engine ||
    !moduleDefinition.svg_renderer ||
    moduleDefinition.default_opacity === undefined ||
    moduleDefinition.layer_order === undefined ||
    !moduleDefinition.semantic_tags
  ) {
    return fail("INVALID_BACKGROUND_MODULE_CONTRACT");
  }

  return true;
}

export function registerBackgroundModule(moduleDefinition: BackgroundModuleDefinition) {
  const validation = validateBackgroundModule(moduleDefinition);

  if (validation !== true) {
    return validation;
  }

  modules[moduleDefinition.kind] = moduleDefinition;

  return {
    status: "registered" as const,
    kind: moduleDefinition.kind,
    module: moduleDefinition,
  };
}

export function getBackgroundModule(backgroundKind: BackgroundModuleKind) {
  const registeredModule = modules[backgroundKind];

  if (!registeredModule) {
    return fail("BACKGROUND_MODULE_NOT_FOUND");
  }

  return registeredModule;
}

export function listBackgroundModules() {
  return modules;
}

export function matchBackgroundModule(
  parsedSlice: ParsedSliceObject,
  conceptualPreset: ConceptualPresetOutput,
  renderSettings: BackgroundRegistryRenderSettings = {},
): BackgroundRegistryMatch | BackgroundRegistryFailure {
  const scoredModules = Object.values(modules).map((moduleDefinition) => ({
    kind: moduleDefinition.kind,
    module: moduleDefinition,
    score: moduleDefinition.infer_rules.RUN(parsedSlice, conceptualPreset, renderSettings),
  }));

  const selected = scoredModules.sort((a, b) => b.score - a.score)[0];

  if (!selected) {
    return fail("NO_BACKGROUND_MODULES_REGISTERED");
  }

  return selected;
}

export function registerDefaultBackgroundModules() {
  registerBackgroundModule({
    kind: "pattern",
    infer_rules: PatternInferRules,
    default_settings: {
      dot_grid_count: 3,
      striped_circle_count: 2,
      burst_count: 3,
      micro_glyph_count: 24,
    },
    supported_grammar_profiles: ["decorative_light", "decorative_dense"],
    grammar_engine_optional: null,
    build_from_grammar_optional: false,
    pattern_engine: runPatternEngineV1,
    svg_renderer: runPatternSvgRendererV1,
    default_opacity: 0.75,
    layer_order: 10,
    semantic_tags: ["decorative", "texture", "glyphs", "dots"],
  });

  registerBackgroundModule({
    kind: "triangulation",
    infer_rules: TriangulationInferRules,
    default_settings: {
      grid_cols: 34,
      grid_rows: 12,
      jitter: 0.42,
      color_variation: 0.75,
    },
    supported_grammar_profiles: ["triangulation_mesh", "soft_network"],
    grammar_engine_optional: null,
    build_from_grammar_optional: false,
    pattern_engine: runTriangulationEngineV1,
    svg_renderer: runTriangulationSvgRendererV1,
    default_opacity: 0.85,
    layer_order: 10,
    semantic_tags: ["mesh", "network", "geometry", "triangles"],
  });

  registerBackgroundModule({
    kind: "flat_abstract_pattern",
    infer_rules: FlatAbstractInferRules,
    default_settings: {
      max_blob_count: 6,
      max_dot_grid_count: 4,
      max_striped_circle_count: 2,
      max_radial_burst_count: 6,
      max_curved_path_count: 3,
      max_dashed_path_count: 2,
      max_micro_glyph_count: 40,
    },
    supported_grammar_profiles: [
      "flat_abstract_balanced_play",
      "flat_abstract_control_calm",
      "flat_abstract_playful_dense",
    ],
    grammar_engine_optional: runFlatAbstractGrammarEngineV1,
    build_from_grammar_optional: buildFlatAbstractPatternFromGrammarV1,
    pattern_engine: runFlatAbstractPatternEngineV1,
    svg_renderer: runFlatAbstractPatternSvgRendererV1,
    default_opacity: 1,
    layer_order: 10,
    semantic_tags: ["play", "flat", "energy", "abstract", "editorial"],
  });

  registerBackgroundModule({
    kind: "isometric_pattern",
    infer_rules: IsometricInferRules,
    default_settings: {
      tile_size: 120,
      cube_size: 70,
      row_offset: true,
    },
    supported_grammar_profiles: [
      "isometric_control_grid",
      "isometric_soft_variation",
      "isometric_strict",
    ],
    grammar_engine_optional: runIsometricGrammarEngineV1,
    build_from_grammar_optional: buildIsometricPatternFromGrammarV1,
    pattern_engine: runIsometricPatternEngineV1,
    svg_renderer: runIsometricPatternSvgRendererV1,
    default_opacity: 0.9,
    layer_order: 10,
    semantic_tags: ["space", "cube", "isometric", "geometry", "structure"],
  });

  registerBackgroundModule({
    kind: "zigzag_pattern",
    infer_rules: ZigZagInferRules,
    default_settings: {
      cell_width: 150,
      cell_height: 130,
      chevron_width: 120,
      chevron_height: 70,
      stroke_width: 26,
      gap: 34,
      accent_probability: 0.18,
      offset_alternate_rows: true,
    },
    supported_grammar_profiles: ["zigzag_control_flow", "zigzag_deviation", "zigzag_strict"],
    grammar_engine_optional: runZigZagGrammarForPatternPipelineV1,
    build_from_grammar_optional: buildZigZagPatternFromGrammarV1,
    pattern_engine: runZigZagPatternEngineV1,
    svg_renderer: runZigZagPatternSvgRendererV1,
    default_opacity: 0.85,
    layer_order: 10,
    semantic_tags: ["rhythm", "zigzag", "movement", "repetition", "signal"],
  });

  registerBackgroundModule({
    kind: "retro_grid_pattern",
    infer_rules: RetroGridInferRules,
    default_settings: {
      rows: 4,
      cols: 4,
      cell_size: 270,
    },
    supported_grammar_profiles: ["retro_geometric_control", "control_calm"],
    grammar_engine_optional: runRetroGridGrammarForPatternPipelineV1,
    build_from_grammar_optional: buildRetroGridPatternFromGrammarV1,
    pattern_engine: runRetroGridPatternEngineV1,
    svg_renderer: runRetroGridPatternSvgRendererV1,
    default_opacity: 1,
    layer_order: 10,
    semantic_tags: ["retro", "grid", "bauhaus", "geometry", "structure"],
  });

  return modules;
}

export type BackgroundRegistryAction =
  | "register"
  | "register_defaults"
  | "get"
  | "list"
  | "match";

export function runBackgroundModuleRegistryV1(input: {
  registry_action: BackgroundRegistryAction;
  module_definition?: BackgroundModuleDefinition;
  background_kind?: BackgroundModuleKind;
  parsed_slice?: ParsedSliceObject;
  conceptual_preset?: ConceptualPresetOutput;
  render_settings?: BackgroundRegistryRenderSettings;
}) {
  if (input.registry_action === "register") {
    if (!input.module_definition) {
      return fail("MISSING_MODULE_DEFINITION");
    }

    return registerBackgroundModule(input.module_definition);
  }

  if (input.registry_action === "register_defaults") {
    return registerDefaultBackgroundModules();
  }

  if (input.registry_action === "get") {
    if (!input.background_kind) {
      return fail("MISSING_BACKGROUND_KIND");
    }

    return getBackgroundModule(input.background_kind);
  }

  if (input.registry_action === "list") {
    return listBackgroundModules();
  }

  if (input.registry_action === "match") {
    if (!input.parsed_slice || !input.conceptual_preset) {
      return fail("MISSING_MATCH_CONTEXT");
    }

    return matchBackgroundModule(
      input.parsed_slice,
      input.conceptual_preset,
      input.render_settings,
    );
  }

  return fail("UNKNOWN_REGISTRY_ACTION");
}

registerDefaultBackgroundModules();

export const REGISTER = registerBackgroundModule;
export const GET = getBackgroundModule;
export const LIST = listBackgroundModules;
export const MATCH = matchBackgroundModule;
export const REGISTER_DEFAULTS = registerDefaultBackgroundModules;
export const RUN = runBackgroundModuleRegistryV1;
