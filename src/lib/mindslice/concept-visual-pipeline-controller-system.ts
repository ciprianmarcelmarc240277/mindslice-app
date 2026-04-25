import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import { runParserEngine } from "@/lib/mindslice/concept-parser-engine-system";
import {
  type ArtCompositionEngineOutput,
  runArtCompositionEngineV1,
} from "@/lib/mindslice/concept-art-composition-engine-system";
import {
  type ColorTheoryEngineOutput,
  runColorTheoryEngineV1,
} from "@/lib/mindslice/concept-color-theory-engine-system";
import { runBackgroundLayerOrchestratorV1 } from "@/lib/mindslice/concept-background-layer-orchestrator-system";
import {
  type ConceptualPresetName,
  type ConceptualPresetOutput,
  runConceptualPresetSystemV1,
} from "@/lib/mindslice/concept-conceptual-preset-system";
import { runDeviationModeV2 } from "@/lib/mindslice/concept-deviation-mode-system";
import {
  balance_score,
  clamp_point_to_area,
  golden_points,
  project_toward,
  safe_area,
  thirds_points,
} from "@/lib/mindslice/concept-geometry-engine-system";
import {
  type ScenarioEngineOutput,
  runScenarioEngineV1,
} from "@/lib/mindslice/concept-scenario-engine-system";
import { runSnapEngineV1, type SnapEngineElement } from "@/lib/mindslice/concept-snap-engine-system";
import {
  type StructureEngineOutput,
  runStructureEngineV1,
} from "@/lib/mindslice/concept-structure-engine-system";
import {
  type VisualDebugModeOutput,
  runVisualDebugModeV1,
} from "@/lib/mindslice/concept-visual-debug-mode-system";
import {
  type VisualRendererCanvasSettings,
  type VisualRendererScene,
  type CompositionVisualOutput,
} from "@/lib/mindslice/concept-visual-renderer-system";
import { runSvgRendererV1 } from "@/lib/mindslice/concept-svg-renderer-system";

const MIN_LAYER_SCORE = 3;
const DEFAULT_RENDER_MODE = "final";
const DEBUG_RENDER_MODE = "debug";
const DEVIATION_RENDER_MODE = "deviation";

export type VisualPipelineControllerRenderSettings = {
  mode?: "final" | "debug" | "deviation";
  preset_name?:
    | "CONTROL_CALM"
    | "DEVIATION_OF_THOUGHT"
    | "FRAGMENTED_MEANING"
    | "CONSTELLATION_MEMORY"
    | "ATTENTION_FOCUS";
};

export type VisualPipelineControllerOutputs = {
  structure: StructureEngineOutput;
  scenario: ScenarioEngineOutput;
  color: ColorTheoryEngineOutput;
  composition: ArtCompositionEngineOutput;
};

export type VisualLayerAudit = {
  structure: number;
  scenario: number;
  color: number;
  composition: number;
  weakest_layer: "structure" | "scenario" | "color" | "composition";
};

export type VisualPipelineControllerResult =
  | {
      status: "fail";
      message: string;
    }
  | {
      parsed_slice: ParsedSliceObject;
      conceptual_preset: ConceptualPresetOutput;
      visual_model: VisualPipelineControllerOutputs;
      audit_before: VisualLayerAudit;
      audit_after: VisualLayerAudit;
      render:
        | {
            mode: "debug";
            views: VisualDebugModeOutput;
          }
        | {
            mode: "final";
            svg: VisualRendererScene;
          };
    };

export type MindSliceVisualSystemResult =
  | {
      status: "fail";
      message: string;
    }
  | {
      svg_output: VisualPipelineControllerResult extends infer TResult
        ? TResult extends { render: infer TRender }
          ? TRender
          : never
        : never;
      system_result: Extract<VisualPipelineControllerResult, { parsed_slice: ParsedSliceObject }> & {
        balance_score: number;
        svg_output: VisualPipelineControllerResult extends infer TResult
          ? TResult extends { render: infer TRender }
            ? TRender
            : never
          : never;
      };
    };

function fail(message: string): Extract<VisualPipelineControllerResult, { status: "fail" }> {
  return {
    status: "fail",
    message,
  };
}

function parseInput(raw_slice: string) {
  const parsed_slice = runParserEngine(raw_slice);

  if (!parsed_slice) {
    return fail("INVALID_SLICE");
  }

  return parsed_slice;
}

function normalizeConceptText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function inferVisualPreset(parsed_slice: ParsedSliceObject): ConceptualPresetName {
  const tags = parsed_slice.metadata.tags.map((tag) => normalizeConceptText(tag));
  const text = normalizeConceptText(parsed_slice.content.text);

  if (tags.includes("structure") && tags.includes("perception")) {
    return "CONTROL_CALM";
  }

  if (text.includes("deviere") || text.includes("instabil") || text.includes("tensiune")) {
    return "DEVIATION_OF_THOUGHT";
  }

  if (text.includes("fragment") || text.includes("ruptura") || text.includes("deconstructie")) {
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

function buildShapePopulationSeed(parsed_slice: ParsedSliceObject) {
  return [
    parsed_slice.identity.index_name ?? "",
    parsed_slice.content.text,
    parsed_slice.metadata.tags.join("|"),
    parsed_slice.metadata.intensity,
  ].join("::");
}

function buildStructure(
  parsed_slice: ParsedSliceObject,
  canvas_settings: VisualRendererCanvasSettings,
  conceptual_preset: ConceptualPresetOutput,
) {
  return runStructureEngineV1(parsed_slice, canvas_settings, conceptual_preset.structure_bias);
}

function buildScenario(
  parsed_slice: ParsedSliceObject,
  structure_output: StructureEngineOutput,
  conceptual_preset: ConceptualPresetOutput,
) {
  return runScenarioEngineV1(
    parsed_slice,
    structure_output.structure_output,
    conceptual_preset.scenario_bias,
  );
}

function buildColor(
  parsed_slice: ParsedSliceObject,
  structure_output: StructureEngineOutput,
  scenario_output: ScenarioEngineOutput,
  conceptual_preset: ConceptualPresetOutput,
) {
  return runColorTheoryEngineV1(
    parsed_slice,
    structure_output.structure_output,
    scenario_output,
    conceptual_preset.color_bias,
  );
}

function buildComposition(
  parsed_slice: ParsedSliceObject,
  structure_output: StructureEngineOutput,
  scenario_output: ScenarioEngineOutput,
  color_output: ColorTheoryEngineOutput,
  conceptual_preset: ConceptualPresetOutput,
) {
  return runArtCompositionEngineV1(
    parsed_slice,
    structure_output.structure_output,
    scenario_output,
    color_output,
    conceptual_preset.composition_bias,
  );
}

function auditStructure(structure_output: StructureEngineOutput) {
  let score = 0;

  if (structure_output.grid) {
    score += 1;
  }

  if (structure_output.centers.primary) {
    score += 1;
  }

  if (structure_output.zones.length >= 2) {
    score += 1;
  }

  if (structure_output.balance_map) {
    score += 1;
  }

  if (structure_output.axes) {
    score += 1;
  }

  return score;
}

function auditScenario(scenario_output: ScenarioEngineOutput) {
  let score = 0;

  if (scenario_output.tension_paths.length >= 1) {
    score += 1;
  }

  if (scenario_output.conflict_points.length >= 1) {
    score += 1;
  }

  if (scenario_output.progression_flow) {
    score += 1;
  }

  if (scenario_output.sequence_regions.length >= 2) {
    score += 1;
  }

  if (scenario_output.dominant_concept) {
    score += 1;
  }

  return score;
}

function auditColor(color_output: ColorTheoryEngineOutput) {
  let score = 0;

  if (color_output.palette.background) {
    score += 1;
  }

  if (color_output.palette.primary) {
    score += 1;
  }

  if (color_output.palette.accent) {
    score += 1;
  }

  if (color_output.accent_targets.length >= 1) {
    score += 1;
  }

  if (color_output.contrast_roles) {
    score += 1;
  }

  return score;
}

function auditComposition(composition_output: ArtCompositionEngineOutput) {
  let score = 0;

  if (composition_output.focus_field) {
    score += 1;
  }

  if (composition_output.rhythm_pattern.length > 0) {
    score += 1;
  }

  if (composition_output.movement_field) {
    score += 1;
  }

  if (composition_output.proportion_guides) {
    score += 1;
  }

  if (composition_output.focus_field.intensity >= 0.5) {
    score += 1;
  }

  return score;
}

function detectWeakestLayer(scores: Omit<VisualLayerAudit, "weakest_layer">): VisualLayerAudit["weakest_layer"] {
  const ordered = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  return (ordered[0]?.[0] as VisualLayerAudit["weakest_layer"]) ?? "structure";
}

function auditLayers(
  structure_output: StructureEngineOutput,
  scenario_output: ScenarioEngineOutput,
  color_output: ColorTheoryEngineOutput,
  composition_output: ArtCompositionEngineOutput,
): VisualLayerAudit {
  const scores = {
    structure: auditStructure(structure_output),
    scenario: auditScenario(scenario_output),
    color: auditColor(color_output),
    composition: auditComposition(composition_output),
  };

  return {
    ...scores,
    weakest_layer: detectWeakestLayer(scores),
  };
}

function buildSnapLayoutGrid(structure_output: StructureEngineOutput) {
  const area = safe_area(structure_output.canvas, structure_output.canvas.margin);

  return {
    center: structure_output.centers.primary,
    thirds: thirds_points(structure_output.canvas),
    golden_points: golden_points(structure_output.canvas),
    safe_area: {
      left: area.x,
      top: area.y,
      right: area.x + area.width,
      bottom: area.y + area.height,
    },
  };
}

function snapPoint(
  id: string,
  role: SnapEngineElement["role"],
  position: SnapEngineElement["position"],
  structure_output: StructureEngineOutput,
  conceptual_preset: ConceptualPresetOutput,
) {
  const [snapped] = runSnapEngineV1({
    elements: [{ id, role, position }],
    grid: buildSnapLayoutGrid(structure_output),
    conceptual_preset: {
      style_mode: conceptual_preset.style_mode,
      conceptual_modes: conceptual_preset.conceptual_modes,
    },
  });

  return snapped?.position ?? position;
}

function applyGeometryToComposition(
  composition_output: ArtCompositionEngineOutput,
  structure_output: StructureEngineOutput,
): ArtCompositionEngineOutput {
  const area = safe_area(structure_output.canvas, structure_output.canvas.margin);
  const primaryCenter = structure_output.centers.primary;
  const focusCenter = clamp_point_to_area(composition_output.composition_output.focus_field.center, area);
  const projectedFocusCenter = project_toward(
    focusCenter,
    primaryCenter,
    composition_output.focus_field.intensity * 12,
  );

  return {
    ...composition_output,
    focus_field: {
      ...composition_output.focus_field,
      center: projectedFocusCenter,
    },
    composition_output: {
      ...composition_output.composition_output,
      focus_field: {
        ...composition_output.composition_output.focus_field,
        center: projectedFocusCenter,
      },
      movement_field: composition_output.composition_output.movement_field.map((movement) => ({
        ...movement,
        start: clamp_point_to_area(movement.start, area),
        end: clamp_point_to_area(movement.end, area),
      })),
      proportion_guides: composition_output.composition_output.proportion_guides.map((guide) => ({
        ...guide,
        start: clamp_point_to_area(guide.start, area),
        end: clamp_point_to_area(guide.end, area),
      })),
    },
  };
}

function applySnapToComposition(
  composition_output: ArtCompositionEngineOutput,
  structure_output: StructureEngineOutput,
  conceptual_preset: ConceptualPresetOutput,
): ArtCompositionEngineOutput {
  const snappedFocusCenter = snapPoint(
    "composition_focus",
    "primary",
    composition_output.composition_output.focus_field.center,
    structure_output,
    conceptual_preset,
  );
  const snappedMovementField = composition_output.composition_output.movement_field.map(
    (movement, index) => ({
      ...movement,
      start: snapPoint(
        `${movement.id}:start:${index}`,
        "secondary",
        movement.start,
        structure_output,
        conceptual_preset,
      ),
      end: snapPoint(
        `${movement.id}:end:${index}`,
        "accent",
        movement.end,
        structure_output,
        conceptual_preset,
      ),
    }),
  );
  const snappedProportionGuides = composition_output.composition_output.proportion_guides.map(
    (guide, index) => ({
      ...guide,
      start: snapPoint(
        `${guide.id}:start:${index}`,
        "secondary",
        guide.start,
        structure_output,
        conceptual_preset,
      ),
      end: snapPoint(
        `${guide.id}:end:${index}`,
        "secondary",
        guide.end,
        structure_output,
        conceptual_preset,
      ),
    }),
  );

  return {
    ...composition_output,
    focus_field: {
      ...composition_output.focus_field,
      center: snappedFocusCenter,
    },
    composition_output: {
      ...composition_output.composition_output,
      focus_field: {
        ...composition_output.composition_output.focus_field,
        center: snappedFocusCenter,
      },
      movement_field: snappedMovementField,
      proportion_guides: snappedProportionGuides,
    },
  };
}

function buildBalanceElements(composition_output: CompositionVisualOutput) {
  return [
    {
      ...composition_output.focus_field.center,
      visual_weight: Math.max(composition_output.focus_field.strength, 0.1) * 3,
    },
    ...composition_output.movement_field.flatMap((movement) => [
      { ...movement.start, visual_weight: movement.strength },
      { ...movement.end, visual_weight: movement.strength },
    ]),
    ...composition_output.proportion_guides.flatMap((guide) => [
      { ...guide.start, visual_weight: 0.35 },
      { ...guide.end, visual_weight: 0.35 },
    ]),
  ];
}

function measureCompositionBalance(
  composition_output: ArtCompositionEngineOutput,
  structure_output: StructureEngineOutput,
) {
  return balance_score(
    buildBalanceElements(composition_output.composition_output),
    structure_output.canvas,
  );
}

function rebalanceComposition(
  composition_output: ArtCompositionEngineOutput,
  structure_output: StructureEngineOutput,
): ArtCompositionEngineOutput {
  const center = structure_output.centers.primary;
  const rebalancePoint = (point: { x: number; y: number }) =>
    project_toward(point, center, Math.min(48, Math.max(16, structure_output.canvas.width * 0.035)));

  return {
    ...composition_output,
    focus_field: {
      ...composition_output.focus_field,
      center: rebalancePoint(composition_output.focus_field.center),
    },
    composition_output: {
      ...composition_output.composition_output,
      focus_field: {
        ...composition_output.composition_output.focus_field,
        center: rebalancePoint(composition_output.composition_output.focus_field.center),
      },
      movement_field: composition_output.composition_output.movement_field.map((movement) => ({
        ...movement,
        start: rebalancePoint(movement.start),
        end: rebalancePoint(movement.end),
      })),
      proportion_guides: composition_output.composition_output.proportion_guides.map((guide) => ({
        ...guide,
        start: rebalancePoint(guide.start),
        end: rebalancePoint(guide.end),
      })),
    },
  };
}

function defaultTensionPath(structure_output: StructureEngineOutput) {
  return {
    id: "default_tension",
    start: structure_output.centers.primary,
    end: structure_output.centers.secondary,
    strength: 0.5,
    type: "default_relation" as const,
  };
}

function defaultConflictPoint(structure_output: StructureEngineOutput) {
  return {
    id: "default_conflict",
    point: {
      x: structure_output.centers.primary.x + 60,
      y: structure_output.centers.primary.y,
    },
    strength: 0.45,
    intensity: 0.45,
  };
}

function defaultAccentTarget(scenario_output: ScenarioEngineOutput) {
  return {
    target_id: scenario_output.conflict_points[0]?.id ?? "default_conflict",
    color: "#D85A7F",
    role: "tension_marker" as const,
  };
}

function defaultFocusField(structure_output: StructureEngineOutput) {
  return {
    center: structure_output.centers.primary,
    radius: 180,
    intensity: 0.75,
  };
}

function defaultProportionGuides() {
  return {
    primary_size: 240,
    secondary_size: 90,
    marker_size: 18,
    stroke_primary: 3,
    stroke_secondary: 1.5,
  };
}

function repairStructure(
  parsed_slice: ParsedSliceObject,
  canvas_settings: VisualRendererCanvasSettings,
) {
  const structure = runStructureEngineV1(parsed_slice, canvas_settings);

  if (!structure.centers.primary) {
    structure.centers.primary = { x: structure.canvas.width / 2, y: structure.canvas.height / 2 };
  }

  if (structure.zones.length < 3) {
    structure.zones = [
      { id: "focus", x: 360, y: 360, w: 360, h: 360 },
      { id: "tension", x: 660, y: 360, w: 240, h: 240 },
      { id: "silence", x: 120, y: 120, w: 240, h: 240 },
    ];
  }

  if (!structure.balance_map) {
    structure.balance_map = {
      center_weight: 0.55,
      left_weight: 0.25,
      right_weight: 0.2,
      symmetry: "asymmetric_balanced",
    };
  }

  return structure;
}

function repairScenario(
  parsed_slice: ParsedSliceObject,
  structure_output: StructureEngineOutput,
) {
  const scenario = runScenarioEngineV1(parsed_slice, structure_output.structure_output);

  if (scenario.tension_paths.length === 0) {
    const fallbackPath = defaultTensionPath(structure_output);
    scenario.tension_paths.push({
      ...fallbackPath,
      type: "support",
    });
    scenario.scenario_output.tension_paths.push({
      id: fallbackPath.id,
      start: fallbackPath.start,
      end: fallbackPath.end,
      strength: fallbackPath.strength,
    });
  }

  if (scenario.conflict_points.length === 0) {
    const fallbackPoint = defaultConflictPoint(structure_output);
    scenario.conflict_points.push(fallbackPoint);
    scenario.scenario_output.conflict_points.push({
      id: fallbackPoint.id,
      point: fallbackPoint.point,
      strength: fallbackPoint.strength,
    });
  }

  return scenario;
}

function repairColor(
  parsed_slice: ParsedSliceObject,
  structure_output: StructureEngineOutput,
  scenario_output: ScenarioEngineOutput,
) {
  const color = runColorTheoryEngineV1(parsed_slice, structure_output.structure_output, scenario_output);

  if (!color.palette.accent) {
    color.palette.accent = "#D85A7F";
  }

  if (color.accent_targets.length === 0) {
    const fallbackTarget = defaultAccentTarget(scenario_output);
    color.accent_targets.push(fallbackTarget);

    const fallbackPoint = scenario_output.conflict_points[0];
    if (fallbackPoint) {
      color.color_output.accent_targets.push({
        id: fallbackTarget.target_id,
        point: fallbackPoint.point,
        radius: 24,
        color: fallbackTarget.color,
      });
    }
  }

  return color;
}

function repairComposition(
  parsed_slice: ParsedSliceObject,
  structure_output: StructureEngineOutput,
  scenario_output: ScenarioEngineOutput,
  color_output: ColorTheoryEngineOutput,
) {
  const composition = runArtCompositionEngineV1(
    parsed_slice,
    structure_output.structure_output,
    scenario_output,
    color_output,
  );

  if (!composition.focus_field) {
    composition.focus_field = defaultFocusField(structure_output);
  }

  if (!composition.proportion_guides) {
    composition.proportion_guides = defaultProportionGuides();
  }

  return composition;
}

function repairIfNeeded(
  parsed_slice: ParsedSliceObject,
  canvas_settings: VisualRendererCanvasSettings,
  outputs: VisualPipelineControllerOutputs,
  audit: VisualLayerAudit,
) {
  const repaired = { ...outputs };

  if (audit.structure < MIN_LAYER_SCORE) {
    repaired.structure = repairStructure(parsed_slice, canvas_settings);
  }

  if (audit.scenario < MIN_LAYER_SCORE) {
    repaired.scenario = repairScenario(parsed_slice, repaired.structure);
  }

  if (audit.color < MIN_LAYER_SCORE) {
    repaired.color = repairColor(parsed_slice, repaired.structure, repaired.scenario);
  }

  if (audit.composition < MIN_LAYER_SCORE) {
    repaired.composition = repairComposition(
      parsed_slice,
      repaired.structure,
      repaired.scenario,
      repaired.color,
    );
  }

  return repaired;
}

function render(
  outputs: VisualPipelineControllerOutputs,
  canvas_settings: VisualRendererCanvasSettings = {},
  render_settings: VisualPipelineControllerRenderSettings = {},
) {
  const mode = render_settings.mode ?? DEFAULT_RENDER_MODE;

  if (mode === DEBUG_RENDER_MODE) {
    const debug_views = runVisualDebugModeV1(
      outputs.structure.structure_output,
      outputs.scenario.scenario_output,
      outputs.color.color_output,
      outputs.composition.composition_output,
    );

    return {
      mode: "debug" as const,
      views: debug_views,
    };
  }

  const render_output = runSvgRendererV1(
    outputs.structure.structure_output,
    outputs.scenario.scenario_output,
    outputs.color.color_output,
    outputs.composition.composition_output,
    canvas_settings,
  );

  return {
    mode: "final" as const,
    svg: render_output,
  };
}

export function runVisualPipelineControllerV2(
  raw_slice: string,
  canvas_settings: VisualRendererCanvasSettings = {},
  render_settings: VisualPipelineControllerRenderSettings = {},
): VisualPipelineControllerResult {
  const parsed_slice = parseInput(raw_slice);

  if ("status" in parsed_slice) {
    return fail("PARSE_FAILED");
  }

  const conceptual_preset = runConceptualPresetSystemV1(
    render_settings.preset_name ?? inferVisualPreset(parsed_slice),
    parsed_slice,
  );
  let structure_output = buildStructure(parsed_slice, canvas_settings, conceptual_preset);
  let scenario_output = buildScenario(parsed_slice, structure_output, conceptual_preset);
  let color_output = buildColor(
    parsed_slice,
    structure_output,
    scenario_output,
    conceptual_preset,
  );
  let composition_output = buildComposition(
    parsed_slice,
    structure_output,
    scenario_output,
    color_output,
    conceptual_preset,
  );
  composition_output = applyGeometryToComposition(composition_output, structure_output);
  composition_output = applySnapToComposition(
    composition_output,
    structure_output,
    conceptual_preset,
  );

  if (
    conceptual_preset.style_mode === "DEVIATION" ||
    render_settings.mode === DEVIATION_RENDER_MODE
  ) {
    const modified_outputs = runDeviationModeV2(
      structure_output,
      scenario_output,
      color_output,
      composition_output,
    );

    structure_output = modified_outputs.structure;
    scenario_output = modified_outputs.scenario;
    color_output = modified_outputs.color;
    composition_output = modified_outputs.composition;
  }

  const initial_balance_score = measureCompositionBalance(composition_output, structure_output);

  if (initial_balance_score < 0.4) {
    composition_output = rebalanceComposition(composition_output, structure_output);
  }

  const audit_before = auditLayers(
    structure_output,
    scenario_output,
    color_output,
    composition_output,
  );

  const repaired_outputs = repairIfNeeded(
    parsed_slice,
    canvas_settings,
    {
      structure: structure_output,
      scenario: scenario_output,
      color: color_output,
      composition: composition_output,
    },
    audit_before,
  );

  const audit_after = auditLayers(
    repaired_outputs.structure,
    repaired_outputs.scenario,
    repaired_outputs.color,
    repaired_outputs.composition,
  );

  const render_result = render(
    repaired_outputs,
    {
      ...canvas_settings,
      shape_population_seed: buildShapePopulationSeed(parsed_slice),
      pattern_style_mode: conceptual_preset.style_mode,
      background_layer: runBackgroundLayerOrchestratorV1(
        parsed_slice,
        conceptual_preset,
        canvas_settings.background_layer_kind,
      ),
    },
    render_settings,
  );

  return {
    parsed_slice,
    conceptual_preset,
    visual_model: repaired_outputs,
    audit_before,
    audit_after,
    render: render_result,
  };
}

export function runMindSliceVisualSystemV1(
  raw_slice: string,
  canvas_settings: VisualRendererCanvasSettings = {},
  render_settings: VisualPipelineControllerRenderSettings = {},
): MindSliceVisualSystemResult {
  const result = runVisualPipelineControllerV2(raw_slice, canvas_settings, render_settings);

  if ("status" in result) {
    return result;
  }

  const finalBalanceScore = measureCompositionBalance(
    result.visual_model.composition,
    result.visual_model.structure,
  );

  return {
    svg_output: result.render,
    system_result: {
      ...result,
      balance_score: finalBalanceScore,
      svg_output: result.render,
    },
  };
}

export const RUN = runMindSliceVisualSystemV1;
