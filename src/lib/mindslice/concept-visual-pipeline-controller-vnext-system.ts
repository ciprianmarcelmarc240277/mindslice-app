import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import { runParserEngine } from "@/lib/mindslice/concept-parser-engine-system";
import {
  type ConceptualPresetName,
  runConceptualPresetSystemV1,
} from "@/lib/mindslice/concept-conceptual-preset-system";
import {
  type StructureEngineOutput,
  runStructureEngineV1,
} from "@/lib/mindslice/concept-structure-engine-system";
import {
  type ScenarioEngineOutput,
  runScenarioEngineV1,
} from "@/lib/mindslice/concept-scenario-engine-system";
import {
  type ColorTheoryEngineOutput,
  runColorTheoryEngineV1,
} from "@/lib/mindslice/concept-color-theory-engine-system";
import {
  type ArtCompositionEngineOutput,
  runArtCompositionEngineV1,
} from "@/lib/mindslice/concept-art-composition-engine-system";
import {
  clamp_point_to_area,
  project_toward,
  safe_area,
} from "@/lib/mindslice/concept-geometry-engine-system";
import { runSnapEngineV1 } from "@/lib/mindslice/concept-snap-engine-system";
import {
  runBackgroundModuleRegistryV1,
  type BackgroundModuleKind,
} from "@/lib/mindslice/concept-background-module-registry-system";
import {
  runBackgroundOrchestratorV2,
  type BackgroundLayerSelectionV2,
  type BackgroundRegistryLike,
} from "@/lib/mindslice/concept-background-layer-orchestrator-system";
import {
  runGrammarPipelineContractV1,
} from "@/lib/mindslice/concept-grammar-pipeline-contract-system";
import {
  runTextLayoutEngineV2,
  type TextLayoutV2Item,
  type TextLayoutV2Output,
  type TextLayoutV2Settings,
} from "@/lib/mindslice/concept-text-layout-engine-v2-system";
import {
  runVisualRendererV2,
  type VisualRendererV2BackgroundResult,
  type VisualRendererV2PaletteReady,
  type VisualRendererV2ReadyLayer,
  type VisualSvgCircle,
  type VisualSvgLine,
  type VisualSvgNode,
  type VisualSvgRect,
  type VisualSvgScene,
  type VisualSvgText,
} from "@/lib/mindslice/concept-visual-renderer-v2-system";
import {
  runVisualAuditEngineV1,
  type VisualAuditEngineReport,
} from "@/lib/mindslice/concept-visual-audit-engine-system";
import { runSvgObjectSerializerV1 } from "@/lib/mindslice/concept-svg-object-serializer-system";
import {
  runBackgroundSelectionTelemetryV1,
  type BackgroundSelectionTelemetryOutput,
} from "@/lib/mindslice/concept-background-selection-telemetry-system";
import type { VisualRendererCanvasSettings } from "@/lib/mindslice/concept-visual-renderer-system";
import { runPaletteContractAdapterV1 } from "@/lib/mindslice/concept-palette-contract-adapter-system";

export type VisualPipelineVNextCanvasSettings = VisualRendererCanvasSettings;

export type VisualPipelineVNextRenderSettings = {
  preset_name?: ConceptualPresetName;
  background_kind?: BackgroundModuleKind;
  background_layer_kind?: BackgroundModuleKind;
  visual_debug_mode?:
    | "full"
    | "deviation"
    | "structure_only"
    | "scenario_only"
    | "color_only"
    | "composition_only";
  state_palette?: {
    background?: string;
    ink?: string;
    accent?: string;
    primary?: string;
    secondary?: string;
    surface?: string;
  };
  background_settings?: Record<string, unknown>;
  grammar_profile?: string | null;
  opacity?: number;
  background_opacity?: number;
  density?: "low" | "medium" | "medium_high" | "high";
  seed?: string;
  allow_repair?: boolean;
  text_backplate?: boolean;
};

export type VisualPipelineVNextFailure = {
  status: "fail";
  message: string;
};

export type VisualPipelineVNextResult =
  | VisualPipelineVNextFailure
  | {
      final_svg_string: string;
      pipeline_result: {
        parsed_slice: ParsedSliceObject;
        conceptual_preset: ReturnType<typeof runConceptualPresetSystemV1>;
        canvas: Required<Pick<VisualRendererCanvasSettings, "width" | "height" | "margin">>;
        structure_output: StructureEngineOutput;
        scenario_output: ScenarioEngineOutput;
        color_output: ColorTheoryEngineOutput;
        composition_output: ArtCompositionEngineOutput;
        background_layer_selection: BackgroundLayerSelectionV2;
        background_selection_telemetry: BackgroundSelectionTelemetryOutput;
        text_layout_output: TextLayoutV2Output;
        visual_svg_scene: VisualSvgScene;
        audit_result: VisualAuditEngineReport;
      };
    };

function fail(message: string): VisualPipelineVNextFailure {
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

function inferPreset(parsedSlice: ParsedSliceObject): ConceptualPresetName {
  const tags = parsedSlice.metadata.tags.map((tag) => normalizeText(tag));
  const text = normalizeText(parsedSlice.content.text);

  if (tags.includes("structure") || tags.includes("space")) {
    return "CONTROL_CALM";
  }

  if (tags.includes("rhythm") || text.includes("zigzag") || text.includes("ritm")) {
    return "CONTROL_CALM";
  }

  if (text.includes("deviere") || text.includes("instabil") || text.includes("tensiune")) {
    return "DEVIATION_OF_THOUGHT";
  }

  if (text.includes("fragment") || text.includes("ruptura")) {
    return "FRAGMENTED_MEANING";
  }

  if (text.includes("memorie") || text.includes("constelatie") || text.includes("atlas")) {
    return "CONSTELLATION_MEMORY";
  }

  if (text.includes("atentie") || text.includes("focus")) {
    return "ATTENTION_FOCUS";
  }

  return "CONTROL_CALM";
}

function buildCanvas(canvasSettings: VisualPipelineVNextCanvasSettings = {}) {
  return {
    width: canvasSettings.width ?? 1080,
    height: canvasSettings.height ?? 1080,
    margin: canvasSettings.margin ?? 80,
  };
}

function buildBackgroundRegistryRuntime(): BackgroundRegistryLike {
  type RegistryGet = NonNullable<BackgroundRegistryLike["GET"]>;
  type RegistryMatch = NonNullable<BackgroundRegistryLike["MATCH"]>;

  runBackgroundModuleRegistryV1({
    registry_action: "register_defaults",
  });

  return {
    GET(backgroundKind) {
      return runBackgroundModuleRegistryV1({
        registry_action: "get",
        background_kind: backgroundKind,
      }) as ReturnType<RegistryGet>;
    },
    MATCH(parsedSlice, conceptualPreset, renderSettings) {
      return runBackgroundModuleRegistryV1({
        registry_action: "match",
        parsed_slice: parsedSlice,
        conceptual_preset: conceptualPreset,
        render_settings: renderSettings,
      }) as ReturnType<RegistryMatch>;
    },
  };
}

function buildSnapGrid(structureOutput: StructureEngineOutput) {
  const area = safe_area(structureOutput.canvas, structureOutput.canvas.margin);

  return {
    center: structureOutput.centers.primary,
    thirds: [],
    golden_points: [],
    safe_area: {
      left: area.x,
      top: area.y,
      right: area.x + area.width,
      bottom: area.y + area.height,
    },
  };
}

function applyGeometry(
  compositionOutput: ArtCompositionEngineOutput,
  structureOutput: StructureEngineOutput,
): ArtCompositionEngineOutput {
  const area = safe_area(structureOutput.canvas, structureOutput.canvas.margin);
  const center = structureOutput.centers.primary;
  const focusCenter = clamp_point_to_area(compositionOutput.composition_output.focus_field.center, area);
  const projectedCenter = project_toward(focusCenter, center, compositionOutput.focus_field.intensity * 12);

  return {
    ...compositionOutput,
    focus_field: {
      ...compositionOutput.focus_field,
      center: projectedCenter,
    },
    composition_output: {
      ...compositionOutput.composition_output,
      focus_field: {
        ...compositionOutput.composition_output.focus_field,
        center: projectedCenter,
      },
      movement_field: compositionOutput.composition_output.movement_field.map((movement) => ({
        ...movement,
        start: clamp_point_to_area(movement.start, area),
        end: clamp_point_to_area(movement.end, area),
      })),
      proportion_guides: compositionOutput.composition_output.proportion_guides.map((guide) => ({
        ...guide,
        start: clamp_point_to_area(guide.start, area),
        end: clamp_point_to_area(guide.end, area),
      })),
    },
  };
}

function applySnap(
  compositionOutput: ArtCompositionEngineOutput,
  structureOutput: StructureEngineOutput,
  conceptualPreset: ReturnType<typeof runConceptualPresetSystemV1>,
): ArtCompositionEngineOutput {
  const [snappedFocus] = runSnapEngineV1({
    elements: [
      {
        id: "composition_focus",
        role: "primary",
        position: compositionOutput.composition_output.focus_field.center,
      },
    ],
    grid: buildSnapGrid(structureOutput),
    conceptual_preset: {
      style_mode: conceptualPreset.style_mode,
      conceptual_modes: conceptualPreset.conceptual_modes,
    },
  });
  const focusCenter = snappedFocus?.position ?? compositionOutput.composition_output.focus_field.center;

  return {
    ...compositionOutput,
    focus_field: {
      ...compositionOutput.focus_field,
      center: focusCenter,
    },
    composition_output: {
      ...compositionOutput.composition_output,
      focus_field: {
        ...compositionOutput.composition_output.focus_field,
        center: focusCenter,
      },
    },
  };
}

function buildBackgroundSelection(input: {
  parsed_slice: ParsedSliceObject;
  conceptual_preset: ReturnType<typeof runConceptualPresetSystemV1>;
  canvas: ReturnType<typeof buildCanvas>;
  render_settings: VisualPipelineVNextRenderSettings;
  registry: BackgroundRegistryLike;
}): BackgroundLayerSelectionV2 | VisualPipelineVNextFailure {
  const selection = runBackgroundOrchestratorV2(
    input.parsed_slice,
    input.conceptual_preset,
    input.canvas,
    {
      ...input.render_settings,
      mode: "vnext",
    },
    input.registry,
  );

  if ("status" in selection) {
    return fail(selection.message);
  }

  return selection;
}

function applyRepairSuggestions(
  renderSettings: VisualPipelineVNextRenderSettings,
  suggestions: string[],
): VisualPipelineVNextRenderSettings {
  const repaired = { ...renderSettings };

  suggestions.forEach((suggestion) => {
    if (suggestion === "reduce_background_density") {
      repaired.density = "low";
    }

    if (suggestion === "increase_background_density") {
      repaired.density = "medium_high";
    }

    if (suggestion === "increase_text_contrast_or_add_text_backplate") {
      repaired.text_backplate = true;
    }

    if (suggestion === "select_fallback_background_module") {
      repaired.background_kind = "pattern";
    }
  });

  repaired.allow_repair = false;
  return repaired;
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/iu.test(value);
}

function buildRuntimePalette(
  colorOutput: ColorTheoryEngineOutput,
  statePalette: VisualPipelineVNextRenderSettings["state_palette"] = {},
): VisualRendererV2PaletteReady {
  const canonicalPalette = runPaletteContractAdapterV1(colorOutput.color_output.palette);
  const basePalette = Object.fromEntries(
    Object.entries(canonicalPalette).filter((entry): entry is [string, string] => {
      return typeof entry[1] === "string";
    }),
  );

  const background = isHexColor(statePalette.background) ? statePalette.background : basePalette.background;
  const ink = isHexColor(statePalette.ink) ? statePalette.ink : basePalette.ink;
  const accent = isHexColor(statePalette.accent) ? statePalette.accent : basePalette.accent;
  const primary = isHexColor(statePalette.primary) ? statePalette.primary : ink;
  const secondary = isHexColor(statePalette.secondary) ? statePalette.secondary : basePalette.secondary;
  const surface = isHexColor(statePalette.surface) ? statePalette.surface : basePalette.surface;

  return {
    ...basePalette,
    background,
    surface,
    ink,
    accent,
    primary,
    secondary,
  };
}

function prepareBackgroundLayer(input: {
  background_layer_selection: BackgroundLayerSelectionV2;
  structure_output: StructureEngineOutput;
  color_output: ColorTheoryEngineOutput;
  palette_ready: VisualRendererV2PaletteReady;
}): VisualRendererV2BackgroundResult {
  const result = runGrammarPipelineContractV1({
    background_module: input.background_layer_selection.module,
    canvas: input.background_layer_selection.canvas,
    palette: input.palette_ready,
    grammar_profile: input.background_layer_selection.grammar_profile,
    settings: {
      ...(input.background_layer_selection.settings ?? {}),
      structure_output: input.structure_output.structure_output,
      color_output: {
        ...input.color_output.color_output,
        palette: input.color_output.color_output.palette.map((entry) => {
          const color = input.palette_ready[entry.role];

          return typeof color === "string" ? { ...entry, color } : entry;
        }),
      },
    },
    render_settings: input.background_layer_selection.render_settings,
  });

  return {
    layer: result.svg_layer as VisualRendererV2ReadyLayer,
    grammar_plan: result.grammar_plan,
    pattern_output: result.pattern_output,
    fallback_used: result.fallback_used,
    warnings: result.warnings,
  };
}

function prepareBaseBackgroundLayer(
  canvas: Required<Pick<VisualRendererCanvasSettings, "width" | "height" | "margin">>,
  paletteReady: VisualRendererV2PaletteReady,
): VisualSvgRect {
  return {
    type: "rect",
    id: "state_background_base",
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    fill: paletteReady.background ?? "#F6F4EF",
  };
}

function prepareStructureLayer(
  structureOutput: StructureEngineOutput,
  paletteReady: VisualRendererV2PaletteReady,
): VisualSvgNode[] {
  const structure = structureOutput.structure_output;
  const ink = paletteReady.ink ?? "#1E1E1E";

  return [
    ...structure.axes.map((axis): VisualSvgLine => ({
      type: "line",
      id: axis.id,
      x1: axis.start.x,
      y1: axis.start.y,
      x2: axis.end.x,
      y2: axis.end.y,
      stroke: ink,
      stroke_width: 1,
      opacity: 0.18,
    })),
    ...structure.zones.map((zone): VisualSvgRect => ({
      type: "rect",
      id: zone.id,
      x: zone.center.x - zone.width / 2,
      y: zone.center.y - zone.height / 2,
      width: zone.width,
      height: zone.height,
      fill: "none",
      stroke: ink,
      stroke_width: 0.8,
      opacity: 0.12,
    })),
    ...structure.centers.map((center): VisualSvgCircle => ({
      type: "circle",
      id: center.id,
      cx: center.point.x,
      cy: center.point.y,
      r: 4,
      fill: ink,
      opacity: 0.22,
    })),
  ];
}

function prepareScenarioLayer(
  scenarioOutput: ScenarioEngineOutput,
  paletteReady: VisualRendererV2PaletteReady,
): VisualSvgNode[] {
  const scenario = scenarioOutput.scenario_output;
  const accent = paletteReady.accent ?? "#D85A7F";

  return [
    ...scenario.tension_paths.map((path): VisualSvgLine => ({
      type: "line",
      id: path.id,
      x1: path.start.x,
      y1: path.start.y,
      x2: path.end.x,
      y2: path.end.y,
      stroke: accent,
      stroke_width: 1,
      opacity: 0.24,
    })),
    ...scenario.conflict_points.map((point): VisualSvgCircle => ({
      type: "circle",
      id: point.id,
      cx: point.point.x,
      cy: point.point.y,
      r: 8,
      fill: "none",
      stroke: accent,
      stroke_width: 1.2,
      opacity: 0.36,
    })),
  ];
}

function prepareCompositionLayer(
  compositionOutput: ArtCompositionEngineOutput,
  paletteReady: VisualRendererV2PaletteReady,
): VisualSvgNode[] {
  const composition = compositionOutput.composition_output;
  const ink = paletteReady.ink ?? "#1E1E1E";
  const accent = paletteReady.accent ?? "#D85A7F";

  return [
    {
      type: "circle",
      id: "composition_focus",
      cx: composition.focus_field.center.x,
      cy: composition.focus_field.center.y,
      r: composition.focus_field.radius,
      fill: "none",
      stroke: accent,
      stroke_width: 1.4,
      opacity: 0.12,
    } satisfies VisualSvgCircle,
    ...composition.movement_field.map((vector): VisualSvgLine => ({
      type: "line",
      id: vector.id,
      x1: vector.start.x,
      y1: vector.start.y,
      x2: vector.end.x,
      y2: vector.end.y,
      stroke: ink,
      stroke_width: 1,
      opacity: 0.24,
    })),
    ...composition.proportion_guides.map((guide): VisualSvgLine => ({
      type: "line",
      id: guide.id,
      x1: guide.start.x,
      y1: guide.start.y,
      x2: guide.end.x,
      y2: guide.end.y,
      stroke: ink,
      stroke_width: 0.8,
      opacity: 0.18,
    })),
  ];
}

function textFontSize(item: TextLayoutV2Item) {
  if (typeof item.font_size === "number" && Number.isFinite(item.font_size)) {
    return item.font_size;
  }

  return 12;
}

function prepareTextLayer(
  textLayoutOutput: TextLayoutV2Output,
  paletteReady: VisualRendererV2PaletteReady,
): VisualSvgNode[] {
  const ink = paletteReady.ink ?? "#1E1E1E";

  return textLayoutOutput.all_text.map((item): VisualSvgText => ({
    type: "text",
    id: item.id,
    role: item.role,
    x: item.x,
    y: item.y,
    text: item.text,
    fill: ink,
    opacity: item.opacity,
    font_size: textFontSize(item),
    rotation: item.rotation,
    anchor: item.anchor,
    baseline: item.baseline,
    font_role: item.font_role,
    max_width: item.max_width,
    scale: item.scale,
  }));
}

function selectLayerForDebugMode(
  layerName: "background" | "structure" | "scenario" | "composition" | "text",
  layer: VisualRendererV2ReadyLayer | null,
  debugMode: VisualPipelineVNextRenderSettings["visual_debug_mode"] = "full",
): VisualRendererV2ReadyLayer | null {
  if (debugMode === "full" || debugMode === "deviation") {
    return layer;
  }

  if (debugMode === "color_only") {
    return layerName === "background" || layerName === "text" ? layer : [];
  }

  if (debugMode === "structure_only") {
    return layerName === "background" || layerName === "structure" || layerName === "text" ? layer : [];
  }

  if (debugMode === "scenario_only") {
    return layerName === "background" || layerName === "scenario" || layerName === "text" ? layer : [];
  }

  if (debugMode === "composition_only") {
    return layerName === "background" || layerName === "composition" || layerName === "text" ? layer : [];
  }

  return layer;
}

function attachBackgroundResult(
  visualSvgScene: VisualSvgScene,
  backgroundLayerOutput: VisualRendererV2BackgroundResult,
): VisualSvgScene {
  return {
    ...visualSvgScene,
    background_layer_output: backgroundLayerOutput,
  };
}

export function runVisualPipelineControllerVNext(
  rawSlice: string,
  canvasSettings: VisualPipelineVNextCanvasSettings = {},
  renderSettings: VisualPipelineVNextRenderSettings = {},
  textSettings: TextLayoutV2Settings = {},
): VisualPipelineVNextResult {
  const registry = buildBackgroundRegistryRuntime();

  const parsedSlice = runParserEngine(rawSlice);

  if (!parsedSlice) {
    return fail("PARSE_FAILED");
  }

  const conceptualPreset = runConceptualPresetSystemV1(
    renderSettings.preset_name ?? inferPreset(parsedSlice),
    parsedSlice,
  );
  const canvas = buildCanvas(canvasSettings);
  const structureOutput = runStructureEngineV1(parsedSlice, canvas, conceptualPreset.structure_bias);
  const scenarioOutput = runScenarioEngineV1(
    parsedSlice,
    structureOutput.structure_output,
    conceptualPreset.scenario_bias,
  );
  const colorOutput = runColorTheoryEngineV1(
    parsedSlice,
    structureOutput.structure_output,
    scenarioOutput,
    conceptualPreset.color_bias,
  );
  let compositionOutput = runArtCompositionEngineV1(
    parsedSlice,
    structureOutput.structure_output,
    scenarioOutput,
    colorOutput,
    conceptualPreset.composition_bias,
  );

  compositionOutput = applyGeometry(compositionOutput, structureOutput);
  compositionOutput = applySnap(compositionOutput, structureOutput, conceptualPreset);

  const backgroundLayerSelection = buildBackgroundSelection({
    parsed_slice: parsedSlice,
    conceptual_preset: conceptualPreset,
    canvas,
    render_settings: renderSettings,
    registry,
  });

  if ("status" in backgroundLayerSelection) {
    return backgroundLayerSelection;
  }

  const textLayoutOutput = runTextLayoutEngineV2(
    parsedSlice,
    structureOutput,
    scenarioOutput,
    compositionOutput,
    canvas,
    textSettings,
  );
  const paletteReady = buildRuntimePalette(colorOutput, renderSettings.state_palette);
  const backgroundLayerOutput = prepareBackgroundLayer({
    background_layer_selection: backgroundLayerSelection,
    structure_output: structureOutput,
    color_output: colorOutput,
    palette_ready: paletteReady,
  });
  const structureLayerReady = prepareStructureLayer(structureOutput, paletteReady);
  const scenarioLayerReady = prepareScenarioLayer(scenarioOutput, paletteReady);
  const compositionLayerReady = prepareCompositionLayer(compositionOutput, paletteReady);
  const textLayerReady = prepareTextLayer(textLayoutOutput, paletteReady);
  const backgroundLayerReady = [
    prepareBaseBackgroundLayer(canvas, paletteReady),
    ...(
      Array.isArray(backgroundLayerOutput.layer)
        ? backgroundLayerOutput.layer
        : [backgroundLayerOutput.layer]
    ),
  ];
  const visualSvgScene = attachBackgroundResult(runVisualRendererV2({
    canvas,
    background_layer_ready: selectLayerForDebugMode(
      "background",
      backgroundLayerReady,
      renderSettings.visual_debug_mode,
    ) ?? [],
    palette_ready: paletteReady,
    structure_layer_ready: selectLayerForDebugMode(
      "structure",
      structureLayerReady,
      renderSettings.visual_debug_mode,
    ) ?? [],
    scenario_layer_ready: selectLayerForDebugMode(
      "scenario",
      scenarioLayerReady,
      renderSettings.visual_debug_mode,
    ) ?? [],
    composition_layer_ready: selectLayerForDebugMode(
      "composition",
      compositionLayerReady,
      renderSettings.visual_debug_mode,
    ) ?? [],
    wrapped_text_ready: selectLayerForDebugMode(
      "text",
      textLayerReady,
      renderSettings.visual_debug_mode,
    ),
  }), backgroundLayerOutput);
  const auditResult = runVisualAuditEngineV1({
    svg_tree: visualSvgScene.svg_tree,
  });
  const backgroundSelectionTelemetry = runBackgroundSelectionTelemetryV1(
    backgroundLayerSelection,
    visualSvgScene.background_layer_output,
  );

  if (auditResult.status === "fail" && renderSettings.allow_repair === true) {
    return runVisualPipelineControllerVNext(
      rawSlice,
      canvasSettings,
      applyRepairSuggestions(renderSettings, auditResult.errors),
      textSettings,
    );
  }

  const finalSvgString = runSvgObjectSerializerV1(visualSvgScene.svg_tree);

  return {
    final_svg_string: finalSvgString,
    pipeline_result: {
      parsed_slice: parsedSlice,
      conceptual_preset: conceptualPreset,
      canvas,
      structure_output: structureOutput,
      scenario_output: scenarioOutput,
      color_output: colorOutput,
      composition_output: compositionOutput,
      background_layer_selection: backgroundLayerSelection,
      background_selection_telemetry: backgroundSelectionTelemetry,
      text_layout_output: textLayoutOutput,
      visual_svg_scene: visualSvgScene,
      audit_result: auditResult,
    },
  };
}

export const RUN = runVisualPipelineControllerVNext;
