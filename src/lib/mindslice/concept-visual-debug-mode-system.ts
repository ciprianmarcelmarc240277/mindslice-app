import type {
  ColorVisualOutput,
  CompositionVisualOutput,
  ScenarioVisualOutput,
  StructureVisualOutput,
  VisualRendererGuideElement,
} from "@/lib/mindslice/concept-visual-renderer-system";

export type VisualDebugLayerView = {
  guides: VisualRendererGuideElement[];
  summary: {
    label: string;
    guide_count: number;
    note: string;
  };
};

export type VisualDebugModeOutput = {
  full: VisualDebugLayerView;
  structure_only: VisualDebugLayerView;
  scenario_only: VisualDebugLayerView;
  color_only: VisualDebugLayerView;
  composition_only: VisualDebugLayerView;
};

function structureGuides(structure_output: StructureVisualOutput): VisualRendererGuideElement[] {
  const guides: VisualRendererGuideElement[] = [];

  if (structure_output.grid === "golden") {
    guides.push(
      {
        type: "grid_line",
        id: "debug-structure-golden-v1",
        start: { x: 1080 * 0.382, y: 0 },
        end: { x: 1080 * 0.382, y: 1080 },
        stroke: "#5D544C",
        stroke_width: 1,
        opacity: 0.28,
      },
      {
        type: "grid_line",
        id: "debug-structure-golden-v2",
        start: { x: 1080 * 0.618, y: 0 },
        end: { x: 1080 * 0.618, y: 1080 },
        stroke: "#5D544C",
        stroke_width: 1,
        opacity: 0.28,
      },
    );
  } else {
    guides.push(
      {
        type: "grid_line",
        id: "debug-structure-thirds-v1",
        start: { x: 1080 / 3, y: 0 },
        end: { x: 1080 / 3, y: 1080 },
        stroke: "#5D544C",
        stroke_width: 1,
        opacity: 0.24,
      },
      {
        type: "grid_line",
        id: "debug-structure-thirds-v2",
        start: { x: (1080 / 3) * 2, y: 0 },
        end: { x: (1080 / 3) * 2, y: 1080 },
        stroke: "#5D544C",
        stroke_width: 1,
        opacity: 0.24,
      },
      {
        type: "grid_line",
        id: "debug-structure-thirds-h1",
        start: { x: 0, y: 1080 / 3 },
        end: { x: 1080, y: 1080 / 3 },
        stroke: "#5D544C",
        stroke_width: 1,
        opacity: 0.24,
      },
      {
        type: "grid_line",
        id: "debug-structure-thirds-h2",
        start: { x: 0, y: (1080 / 3) * 2 },
        end: { x: 1080, y: (1080 / 3) * 2 },
        stroke: "#5D544C",
        stroke_width: 1,
        opacity: 0.24,
      },
    );
  }

  structure_output.axes.forEach((axis) => {
    guides.push({
      type: "axis_line",
      id: `debug-axis-${axis.id}`,
      start: axis.start,
      end: axis.end,
      stroke: axis.role === "primary" ? "#1F1A17" : "#7E756E",
      stroke_width: axis.role === "primary" ? 1.8 : 1.2,
      opacity: axis.role === "diagonal" ? 0.18 : 0.36,
    });
  });

  structure_output.zones.forEach((zone) => {
    guides.push({
      type: "zone_frame",
      id: `debug-zone-${zone.id}`,
      center: zone.center,
      width: zone.width,
      height: zone.height,
      stroke: zone.role === "dominant" ? "#1F1A17" : "#8A8A8A",
      fill: "rgba(247, 243, 236, 0.18)",
      stroke_width: zone.weight === "high" ? 2 : 1.2,
      opacity: 0.46,
    });
  });

  return guides;
}

function scenarioGuides(scenario_output: ScenarioVisualOutput): VisualRendererGuideElement[] {
  const guides: VisualRendererGuideElement[] = [];

  scenario_output.tension_paths.forEach((path) => {
    guides.push({
      type: "tension_path",
      id: `debug-scenario-path-${path.id}`,
      start: path.start,
      end: path.end,
      stroke: "#C84C61",
      stroke_width: 1 + path.strength * 2,
      opacity: 0.3 + path.strength * 0.38,
    });
  });

  scenario_output.conflict_points.forEach((point) => {
    guides.push({
      type: "conflict_marker",
      id: `debug-scenario-conflict-${point.id}`,
      point: point.point,
      stroke: "#C84C61",
      fill: "rgba(200, 76, 97, 0.12)",
      size: 8 + point.strength * 10,
      stroke_width: 1.5,
      opacity: 0.72,
    });
  });

  scenario_output.progression_flow.forEach((sequence) => {
    for (let index = 0; index < sequence.points.length - 1; index += 1) {
      guides.push({
        type: "proportion_guide",
        id: `debug-scenario-sequence-${sequence.id}-${index}`,
        start: sequence.points[index],
        end: sequence.points[index + 1],
        stroke: "#4C8C68",
        stroke_width: 1.2,
        opacity: 0.34,
      });
    }
  });

  return guides;
}

function colorGuides(color_output: ColorVisualOutput): VisualRendererGuideElement[] {
  const guides: VisualRendererGuideElement[] = [];

  color_output.background_regions.forEach((region) => {
    guides.push({
      type: "background_region",
      id: `debug-color-region-${region.id}`,
      center: region.center,
      width: region.width,
      height: region.height,
      stroke: region.color,
      fill: region.color,
      stroke_width: 1,
      opacity: region.opacity,
    });
  });

  color_output.accent_targets.forEach((target) => {
    guides.push({
      type: "accent_target",
      id: `debug-color-accent-${target.id}`,
      center: target.point,
      width: target.radius * 2,
      height: target.radius * 2,
      radius: target.radius,
      stroke: target.color,
      fill: target.color,
      stroke_width: 1.4,
      opacity: 0.22,
    });
  });

  return guides;
}

function compositionGuides(
  composition_output: CompositionVisualOutput,
): VisualRendererGuideElement[] {
  const guides: VisualRendererGuideElement[] = [
    {
      type: "focus_field",
      id: "debug-composition-focus",
      center: composition_output.focus_field.center,
      width: composition_output.focus_field.radius * 2,
      height: composition_output.focus_field.radius * 2,
      radius: composition_output.focus_field.radius,
      stroke: "#1F1A17",
      fill: "rgba(216, 90, 127, 0.06)",
      stroke_width: 1.4,
      opacity: 0.3 + composition_output.focus_field.strength * 0.2,
    },
  ];

  composition_output.movement_field.forEach((vector) => {
    guides.push({
      type: "balance_vector",
      id: `debug-composition-movement-${vector.id}`,
      start: vector.start,
      end: vector.end,
      stroke: "#D85A7F",
      stroke_width: 1.4 + vector.strength,
      opacity: 0.28 + vector.strength * 0.32,
    });
  });

  composition_output.proportion_guides.forEach((guide) => {
    guides.push({
      type: "proportion_guide",
      id: `debug-composition-proportion-${guide.id}`,
      start: guide.start,
      end: guide.end,
      stroke: "#8A8A8A",
      stroke_width: 1,
      opacity: 0.3,
    });
  });

  return guides;
}

function buildLayerView(
  label: string,
  guides: VisualRendererGuideElement[],
  note: string,
): VisualDebugLayerView {
  return {
    guides,
    summary: {
      label,
      guide_count: guides.length,
      note,
    },
  };
}

export function runVisualDebugModeV1(
  structure_output: StructureVisualOutput,
  scenario_output: ScenarioVisualOutput,
  color_output: ColorVisualOutput,
  composition_output: CompositionVisualOutput,
): VisualDebugModeOutput {
  const structure_only = buildLayerView(
    "structure_only",
    structureGuides(structure_output),
    "Grid, axes, zones, balance anchors.",
  );

  const scenario_only = buildLayerView(
    "scenario_only",
    scenarioGuides(scenario_output),
    "Tension paths, conflict points, progression.",
  );

  const color_only = buildLayerView(
    "color_only",
    colorGuides(color_output),
    "Background regions and accent targets.",
  );

  const composition_only = buildLayerView(
    "composition_only",
    compositionGuides(composition_output),
    "Focus field, movement field, proportion guides.",
  );

  const full = buildLayerView(
    "full",
    [
      ...structure_only.guides,
      ...scenario_only.guides,
      ...color_only.guides,
      ...composition_only.guides,
    ],
    "All visual debug layers combined.",
  );

  return {
    full,
    structure_only,
    scenario_only,
    color_only,
    composition_only,
  };
}
