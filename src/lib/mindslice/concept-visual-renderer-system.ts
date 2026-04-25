import type {
  VisualCanvas,
  VisualComposerForm,
  VisualComposerRelation,
  VisualGridPoint,
} from "@/lib/mindslice/concept-visual-composer-system";
import {
  applyPatternConstraints,
  runPatternEngineV1,
  type PatternOutput,
} from "@/lib/mindslice/concept-pattern-engine-system";
import {
  runTriangulationEngineV1,
  type TriangulationOutput,
} from "@/lib/mindslice/concept-triangulation-engine-system";
import {
  runFlatAbstractPatternEngineV1,
  type FlatAbstractPatternOutput,
} from "@/lib/mindslice/concept-flat-abstract-pattern-engine-system";
import {
  runIsometricPatternEngineV1,
  type IsometricPatternOutput,
} from "@/lib/mindslice/concept-isometric-pattern-engine-system";
import {
  runZigZagPatternEngineV1,
  type ZigZagPatternOutput,
} from "@/lib/mindslice/concept-zigzag-pattern-engine-system";
import {
  runRetroGridPatternEngineV1,
  type RetroGridPatternOutput,
} from "@/lib/mindslice/concept-retro-grid-pattern-engine-system";
import type { ConceptualPresetOutput } from "@/lib/mindslice/concept-conceptual-preset-system";
import type {
  BackgroundLayerKind,
  BackgroundLayerSelection,
} from "@/lib/mindslice/concept-background-layer-orchestrator-system";

export type VisualRendererCanvasSettings = {
  width?: number;
  height?: number;
  margin?: number;
  background?: string;
  shape_population_seed?: string;
  pattern_style_mode?: ConceptualPresetOutput["style_mode"];
  triangulation_point_count?: number;
  background_layer?: BackgroundLayerSelection;
  background_layer_kind?: BackgroundLayerKind;
};

export type StructureVisualAxis = {
  id: string;
  start: VisualGridPoint;
  end: VisualGridPoint;
  role: "primary" | "secondary" | "diagonal";
};

export type StructureVisualCenter = {
  id: string;
  point: VisualGridPoint;
  weight: number;
};

export type StructureVisualZone = {
  id: string;
  center: VisualGridPoint;
  width: number;
  height: number;
  weight: "high" | "medium" | "low";
  role: "dominant" | "support" | "void";
};

export type StructureVisualBalanceMap = {
  center_of_mass: VisualGridPoint;
  correction_target: VisualGridPoint;
  drift: number;
};

export type StructureVisualOutput = {
  grid: "thirds" | "golden" | "custom";
  axes: StructureVisualAxis[];
  centers: StructureVisualCenter[];
  zones: StructureVisualZone[];
  balance_map: StructureVisualBalanceMap;
};

export type ScenarioTensionPath = {
  id: string;
  start: VisualGridPoint;
  end: VisualGridPoint;
  strength: number;
};

export type ScenarioConflictPoint = {
  id: string;
  point: VisualGridPoint;
  strength: number;
};

export type ScenarioSpatialSequence = {
  id: string;
  points: VisualGridPoint[];
};

export type ScenarioVisualOutput = {
  tension_paths: ScenarioTensionPath[];
  conflict_points: ScenarioConflictPoint[];
  progression_flow: ScenarioSpatialSequence[];
  spatial_sequence: ScenarioSpatialSequence[];
};

export type ColorPaletteStop = {
  id: string;
  role: "background" | "surface" | "accent" | "ink";
  color: string;
  weight: number;
};

export type ColorAccentTarget = {
  id: string;
  point: VisualGridPoint;
  radius: number;
  color: string;
};

export type ColorVisualOutput = {
  palette: ColorPaletteStop[];
  accent_targets: ColorAccentTarget[];
  background_regions: Array<{
    id: string;
    center: VisualGridPoint;
    width: number;
    height: number;
    color: string;
    opacity: number;
  }>;
};

export type CompositionProportionGuide = {
  id: string;
  start: VisualGridPoint;
  end: VisualGridPoint;
};

export type CompositionFocusField = {
  center: VisualGridPoint;
  radius: number;
  strength: number;
};

export type CompositionMovementVector = {
  id: string;
  start: VisualGridPoint;
  end: VisualGridPoint;
  strength: number;
};

export type CompositionVisualOutput = {
  proportion_guides: CompositionProportionGuide[];
  focus_field: CompositionFocusField;
  movement_field: CompositionMovementVector[];
};

export type VisualRendererGuideElement =
  | {
      type: "grid_line" | "axis_line" | "tension_path" | "proportion_guide" | "balance_vector";
      id: string;
      start: VisualGridPoint;
      end: VisualGridPoint;
      stroke: string;
      stroke_width: number;
      opacity: number;
    }
  | {
      type: "zone_frame" | "background_region" | "focus_field" | "accent_target";
      id: string;
      center: VisualGridPoint;
      width: number;
      height: number;
      radius?: number;
      stroke: string;
      fill: string;
      stroke_width: number;
      opacity: number;
    }
  | {
      type: "conflict_marker";
      id: string;
      point: VisualGridPoint;
      stroke: string;
      fill: string;
      size: number;
      stroke_width: number;
      opacity: number;
    };

export type VisualRendererScene = {
  canvas: VisualCanvas;
  palette: ColorPaletteStop[];
  background_layer: BackgroundLayerSelection | null;
  triangulation: TriangulationOutput;
  patterns: PatternOutput;
  flat_abstract_pattern: FlatAbstractPatternOutput | null;
  isometric_pattern: IsometricPatternOutput | null;
  zigzag_pattern: ZigZagPatternOutput | null;
  retro_grid_pattern: RetroGridPatternOutput | null;
  guides: VisualRendererGuideElement[];
  forms: VisualComposerForm[];
  relations: VisualComposerRelation[];
  visual_scene: {
    canvas: VisualCanvas;
    background_layer: BackgroundLayerSelection | null;
    triangulation: TriangulationOutput;
    patterns: PatternOutput;
    flat_abstract_pattern: FlatAbstractPatternOutput | null;
    isometric_pattern: IsometricPatternOutput | null;
    zigzag_pattern: ZigZagPatternOutput | null;
    retro_grid_pattern: RetroGridPatternOutput | null;
    guides: VisualRendererGuideElement[];
    forms: VisualComposerForm[];
    relations: VisualComposerRelation[];
    palette: ColorPaletteStop[];
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createCanvas(settings: VisualRendererCanvasSettings = {}): VisualCanvas {
  return {
    width: settings.width ?? 1080,
    height: settings.height ?? 1080,
    margin: 120,
    background: settings.background ?? "warm_white",
    style: "minimal_elegant",
  };
}

function paletteColor(
  palette: ColorPaletteStop[],
  role: ColorPaletteStop["role"],
  fallback: string,
) {
  return palette.find((entry) => entry.role === role)?.color ?? fallback;
}

function emptyTriangulationOutput(): TriangulationOutput {
  return {
    points: [],
    edges: [],
    triangles: [],
  };
}

function emptyPatternOutput(): PatternOutput {
  return {
    dot_grids: [],
    stripes: [],
    radial_bursts: [],
    micro_glyphs: [],
    all_patterns: [],
  };
}

function flatAbstractPalette(palette: ColorPaletteStop[]) {
  return {
    background: paletteColor(palette, "background", "#34475A"),
    dark_blob: paletteColor(palette, "ink", "#26384A"),
    yellow: paletteColor(palette, "accent", "#FFD13F"),
    teal: "#22C7BB",
    light: paletteColor(palette, "surface", "#DDEAF2"),
  };
}

function isometricPalette(palette: ColorPaletteStop[]) {
  return {
    background: paletteColor(palette, "background", "#F2D6BD"),
    top: paletteColor(palette, "ink", "#3F3450"),
    left: paletteColor(palette, "accent", "#4E7F96"),
    right: paletteColor(palette, "surface", "#F2D6BD"),
    shadow: paletteColor(palette, "ink", "#2D253A"),
  };
}

function zigZagPalette(palette: ColorPaletteStop[]) {
  return {
    background: paletteColor(palette, "background", "#000000"),
    primary: paletteColor(palette, "surface", "#FFFFFF"),
    cyan: "#46C7D8",
    teal: "#55C8B4",
    orange: paletteColor(palette, "accent", "#FF5A2E"),
    yellow: "#FFB637",
    gray: "#6E7474",
    dark_gray: paletteColor(palette, "ink", "#2C2C2C"),
  };
}

function retroGridPalette(palette: ColorPaletteStop[]) {
  return {
    dark: paletteColor(palette, "ink", "#252B42"),
    coral: paletteColor(palette, "accent", "#FF9A82"),
    orange: "#F6A043",
    mint: "#9DD8D2",
    white: paletteColor(palette, "surface", "#FFFFFF"),
  };
}

function hashSeed(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededUnit(seed: string, salt: string) {
  const hash = hashSeed(`${seed}:${salt}`);
  const normalized = Math.sin(hash * 12.9898) * 43758.5453;

  return normalized - Math.floor(normalized);
}

function seededRange(seed: string, salt: string, min: number, max: number) {
  return min + seededUnit(seed, salt) * (max - min);
}

function seededSign(seed: string, salt: string) {
  return seededUnit(seed, salt) >= 0.5 ? 1 : -1;
}

function gridLines(
  canvas: VisualCanvas,
  grid: StructureVisualOutput["grid"],
  stroke: string,
) {
  if (grid === "golden") {
    return [
      {
        type: "grid_line" as const,
        id: "golden-v1",
        start: { x: canvas.width * 0.382, y: 0 },
        end: { x: canvas.width * 0.382, y: canvas.height },
        stroke,
        stroke_width: 1,
        opacity: 0.24,
      },
      {
        type: "grid_line" as const,
        id: "golden-v2",
        start: { x: canvas.width * 0.618, y: 0 },
        end: { x: canvas.width * 0.618, y: canvas.height },
        stroke,
        stroke_width: 1,
        opacity: 0.24,
      },
    ];
  }

  return [
    {
      type: "grid_line" as const,
      id: "thirds-v1",
      start: { x: canvas.width / 3, y: 0 },
      end: { x: canvas.width / 3, y: canvas.height },
      stroke,
      stroke_width: 1,
      opacity: 0.22,
    },
    {
      type: "grid_line" as const,
      id: "thirds-v2",
      start: { x: (canvas.width / 3) * 2, y: 0 },
      end: { x: (canvas.width / 3) * 2, y: canvas.height },
      stroke,
      stroke_width: 1,
      opacity: 0.22,
    },
    {
      type: "grid_line" as const,
      id: "thirds-h1",
      start: { x: 0, y: canvas.height / 3 },
      end: { x: canvas.width, y: canvas.height / 3 },
      stroke,
      stroke_width: 1,
      opacity: 0.22,
    },
    {
      type: "grid_line" as const,
      id: "thirds-h2",
      start: { x: 0, y: (canvas.height / 3) * 2 },
      end: { x: canvas.width, y: (canvas.height / 3) * 2 },
      stroke,
      stroke_width: 1,
      opacity: 0.22,
    },
  ];
}

function drawAxes(axes: StructureVisualAxis[], stroke: string): VisualRendererGuideElement[] {
  return axes.map((axis) => ({
    type: "axis_line" as const,
    id: axis.id,
    start: axis.start,
    end: axis.end,
    stroke,
    stroke_width: axis.role === "primary" ? 1.6 : 1,
    opacity: axis.role === "primary" ? 0.34 : 0.22,
  }));
}

function generateShape(
  zone: StructureVisualZone,
  proportionGuides: CompositionProportionGuide[],
  accent: string,
  ink: string,
): VisualComposerForm {
  const guideInfluence = proportionGuides.length > 0 ? clamp(proportionGuides.length / 4, 0, 1) : 0;
  const baseSize = Math.min(zone.width, zone.height) * (zone.weight === "high" ? 0.56 : zone.weight === "medium" ? 0.42 : 0.28);
  const size = baseSize * (1 + guideInfluence * 0.12);

  return {
    concept: zone.id,
    type:
      zone.role === "dominant"
        ? "central_shape"
        : zone.role === "void"
          ? "incomplete_shape"
          : zone.weight === "medium"
            ? "square"
            : "circle",
    weight: zone.weight === "high" ? "high" : "low",
    priority: zone.role === "dominant" ? 1 : 2,
    direction: null,
    relation: zone.role === "dominant" ? "center" : "peripheral",
    x: zone.center.x,
    y: zone.center.y,
    size,
    fill: "none",
    stroke: zone.role === "dominant" ? accent : ink,
    stroke_width: zone.role === "dominant" ? 2.2 : 1.3,
    opacity: zone.role === "void" ? 0.72 : 0.9,
  };
}

function makeForm(input: {
  concept: string;
  type: VisualComposerForm["type"];
  weight?: VisualComposerForm["weight"];
  priority?: VisualComposerForm["priority"];
  relation?: VisualComposerForm["relation"];
  x: number;
  y: number;
  size: number;
  stroke: string;
  strokeWidth?: number;
  opacity?: number;
}): VisualComposerForm {
  return {
    concept: input.concept,
    type: input.type,
    weight: input.weight ?? "low",
    priority: input.priority ?? 2,
    direction: null,
    relation: input.relation ?? "peripheral",
    x: input.x,
    y: input.y,
    size: input.size,
    fill: "none",
    stroke: input.stroke,
    stroke_width: input.strokeWidth ?? 1.1,
    opacity: input.opacity ?? 0.72,
  };
}

function pointOnCircle(center: VisualGridPoint, radius: number, angleDegrees: number) {
  const angle = (angleDegrees * Math.PI) / 180;

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

function lineMidpoint(start: VisualGridPoint, end: VisualGridPoint) {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
}

function generateFocusForms(
  focusField: CompositionFocusField,
  accent: string,
  ink: string,
  seed: string,
) {
  const radius = Math.max(90, focusField.radius);
  const count = 8;
  const angleOffset = seededRange(seed, "focus-angle-offset", -32, 32);
  const centerJitter = {
    x: seededRange(seed, "focus-center-x", -36, 36),
    y: seededRange(seed, "focus-center-y", -36, 36),
  };
  const focusCenter = {
    x: focusField.center.x + centerJitter.x,
    y: focusField.center.y + centerJitter.y,
  };
  const forms: VisualComposerForm[] = [
    makeForm({
      concept: "focus_mass_large",
      type: "central_shape",
      weight: "high",
      priority: 1,
      relation: "center",
      x: focusCenter.x,
      y: focusCenter.y,
      size: radius * seededRange(seed, "focus-mass-scale", 0.76, 1.04),
      stroke: accent,
      strokeWidth: 2.4,
      opacity: 0.54 + focusField.strength * 0.22,
    }),
    makeForm({
      concept: "focus_inner_incomplete",
      type: "incomplete_shape",
      weight: "high",
      priority: 1,
      relation: "center",
      x: focusCenter.x + seededRange(seed, "focus-inner-x", -18, 18),
      y: focusCenter.y + seededRange(seed, "focus-inner-y", -18, 18),
      size: radius * seededRange(seed, "focus-inner-scale", 0.44, 0.64),
      stroke: ink,
      strokeWidth: 1.4,
      opacity: 0.46,
    }),
  ];

  for (let index = 0; index < count; index += 1) {
    const orbitRadius = radius * seededRange(seed, `focus-orbit-radius-${index}`, 0.54, 0.88);
    const point = pointOnCircle(
      focusCenter,
      orbitRadius,
      angleOffset + index * (360 / count) + seededRange(seed, `focus-orbit-angle-${index}`, -12, 12),
    );
    forms.push(
      makeForm({
        concept: `focus_orbit_${index}`,
        type: index % 3 === 0 ? "circle" : index % 3 === 1 ? "square" : "incomplete_shape",
        x: point.x,
        y: point.y,
        size: radius * seededRange(seed, `focus-orbit-size-${index}`, 0.08, 0.22),
        stroke: index % 2 === 0 ? accent : ink,
        strokeWidth: index % 2 === 0 ? 1.2 : 0.9,
        opacity: 0.36 + focusField.strength * 0.14,
      }),
    );
  }

  return forms;
}

function generateTensionForms(
  paths: ScenarioTensionPath[],
  accent: string,
  ink: string,
  seed: string,
) {
  return paths.flatMap((path, index): VisualComposerForm[] => {
    const mid = lineMidpoint(path.start, path.end);
    const size = 62 + path.strength * 54;
    const jitterX = seededRange(seed, `${path.id}-tension-x-${index}`, -42, 42);
    const jitterY = seededRange(seed, `${path.id}-tension-y-${index}`, -42, 42);

    return [
      makeForm({
        concept: `${path.id}_tension_vector_${index}`,
        type: "vector_line",
        x: mid.x + jitterX,
        y: mid.y + jitterY,
        size: size * seededRange(seed, `${path.id}-tension-scale-${index}`, 0.88, 1.45),
        stroke: accent,
        strokeWidth: 1.2 + path.strength,
        opacity: 0.44 + path.strength * 0.22,
      }),
      makeForm({
        concept: `${path.id}_tension_start_${index}`,
        type: "circle",
        x: path.start.x + seededRange(seed, `${path.id}-start-x-${index}`, -28, 28),
        y: path.start.y + seededRange(seed, `${path.id}-start-y-${index}`, -28, 28),
        size: size * seededRange(seed, `${path.id}-start-scale-${index}`, 0.32, 0.62),
        stroke: ink,
        strokeWidth: 1,
        opacity: 0.42,
      }),
      makeForm({
        concept: `${path.id}_tension_end_${index}`,
        type: "incomplete_shape",
        x: path.end.x + seededRange(seed, `${path.id}-end-x-${index}`, -28, 28),
        y: path.end.y + seededRange(seed, `${path.id}-end-y-${index}`, -28, 28),
        size: size * seededRange(seed, `${path.id}-end-scale-${index}`, 0.38, 0.72),
        stroke: accent,
        strokeWidth: 1.1,
        opacity: 0.5,
      }),
    ];
  });
}

function generateConflictForms(
  conflictPoints: ScenarioConflictPoint[],
  accent: string,
  ink: string,
  seed: string,
) {
  return conflictPoints.flatMap((point, index): VisualComposerForm[] => {
    const size = 42 + point.strength * 64;
    const direction = seededSign(seed, `${point.id}-conflict-sign-${index}`);
    const origin = {
      x: point.point.x + seededRange(seed, `${point.id}-conflict-x-${index}`, -34, 34),
      y: point.point.y + seededRange(seed, `${point.id}-conflict-y-${index}`, -34, 34),
    };

    return [
      makeForm({
        concept: `${point.id}_conflict_intersection_${index}`,
        type: "intersection",
        x: origin.x,
        y: origin.y,
        size,
        stroke: accent,
        strokeWidth: 1.4 + point.strength,
        opacity: 0.58 + point.strength * 0.18,
      }),
      makeForm({
        concept: `${point.id}_conflict_echo_a_${index}`,
        type: "square",
        x: origin.x + size * seededRange(seed, `${point.id}-echo-a-x-${index}`, 0.42, 0.86) * direction,
        y: origin.y - size * seededRange(seed, `${point.id}-echo-a-y-${index}`, 0.22, 0.58),
        size: size * seededRange(seed, `${point.id}-echo-a-scale-${index}`, 0.34, 0.62),
        stroke: ink,
        strokeWidth: 0.9,
        opacity: 0.34,
      }),
      makeForm({
        concept: `${point.id}_conflict_echo_b_${index}`,
        type: "circle",
        x: origin.x - size * seededRange(seed, `${point.id}-echo-b-x-${index}`, 0.36, 0.76) * direction,
        y: origin.y + size * seededRange(seed, `${point.id}-echo-b-y-${index}`, 0.32, 0.7),
        size: size * seededRange(seed, `${point.id}-echo-b-scale-${index}`, 0.28, 0.52),
        stroke: accent,
        strokeWidth: 0.9,
        opacity: 0.32,
      }),
    ];
  });
}

function generateProportionForms(
  guides: CompositionProportionGuide[],
  accent: string,
  ink: string,
  seed: string,
) {
  return guides.flatMap((guide, index): VisualComposerForm[] => {
    const mid = lineMidpoint(guide.start, guide.end);
    const side = seededSign(seed, `${guide.id}-proportion-side-${index}`);

    return [
      makeForm({
        concept: `${guide.id}_proportion_line_${index}`,
        type: "straight_line",
        x: mid.x + seededRange(seed, `${guide.id}-line-x-${index}`, -36, 36),
        y: mid.y + seededRange(seed, `${guide.id}-line-y-${index}`, -36, 36),
        size: seededRange(seed, `${guide.id}-line-size-${index}`, 72, 144),
        stroke: index % 2 === 0 ? ink : accent,
        strokeWidth: 0.9,
        opacity: 0.3,
      }),
      makeForm({
        concept: `${guide.id}_proportion_marker_a_${index}`,
        type: "circle",
        x: guide.start.x + side * seededRange(seed, `${guide.id}-marker-a-x-${index}`, 12, 44),
        y: guide.start.y + seededRange(seed, `${guide.id}-marker-a-y-${index}`, -34, 34),
        size: seededRange(seed, `${guide.id}-marker-a-size-${index}`, 22, 48),
        stroke: accent,
        strokeWidth: 0.8,
        opacity: 0.28,
      }),
      makeForm({
        concept: `${guide.id}_proportion_marker_b_${index}`,
        type: "square",
        x: guide.end.x - side * seededRange(seed, `${guide.id}-marker-b-x-${index}`, 12, 44),
        y: guide.end.y + seededRange(seed, `${guide.id}-marker-b-y-${index}`, -34, 34),
        size: seededRange(seed, `${guide.id}-marker-b-size-${index}`, 24, 54),
        stroke: ink,
        strokeWidth: 0.8,
        opacity: 0.28,
      }),
    ];
  });
}

function generateZoneEchoForms(
  zones: StructureVisualZone[],
  accent: string,
  ink: string,
  seed: string,
) {
  return zones.flatMap((zone, index): VisualComposerForm[] => {
    const baseSize = Math.min(zone.width, zone.height);
    const echoScale = zone.role === "dominant" ? 0.34 : zone.role === "void" ? 0.22 : 0.26;
    const side = seededSign(seed, `${zone.id}-zone-side-${index}`);

    return [
      makeForm({
        concept: `${zone.id}_zone_echo_large_${index}`,
        type: zone.role === "void" ? "incomplete_shape" : "circle",
        x: zone.center.x + side * baseSize * seededRange(seed, `${zone.id}-echo-large-x-${index}`, 0.1, 0.32),
        y: zone.center.y - baseSize * seededRange(seed, `${zone.id}-echo-large-y-${index}`, 0.08, 0.3),
        size: baseSize * echoScale * seededRange(seed, `${zone.id}-echo-large-scale-${index}`, 0.82, 1.22),
        stroke: zone.role === "dominant" ? accent : ink,
        strokeWidth: 0.9,
        opacity: 0.22,
      }),
      makeForm({
        concept: `${zone.id}_zone_echo_small_${index}`,
        type: "square",
        x: zone.center.x - side * baseSize * seededRange(seed, `${zone.id}-echo-small-x-${index}`, 0.12, 0.34),
        y: zone.center.y + baseSize * seededRange(seed, `${zone.id}-echo-small-y-${index}`, 0.08, 0.32),
        size: baseSize * seededRange(seed, `${zone.id}-echo-small-scale-${index}`, 0.08, 0.18),
        stroke: zone.role === "dominant" ? ink : accent,
        strokeWidth: 0.8,
        opacity: 0.24,
      }),
    ];
  });
}

function generateShapePopulation(input: {
  structureOutput: StructureVisualOutput;
  scenarioOutput: ScenarioVisualOutput;
  compositionOutput: CompositionVisualOutput;
  accent: string;
  ink: string;
  seed: string;
}) {
  const baseForms = input.structureOutput.zones.map((zone) =>
    generateShape(zone, input.compositionOutput.proportion_guides, input.accent, input.ink),
  );

  return [
    ...baseForms,
    ...generateZoneEchoForms(input.structureOutput.zones, input.accent, input.ink, input.seed),
    ...generateFocusForms(input.compositionOutput.focus_field, input.accent, input.ink, input.seed),
    ...generateTensionForms(input.scenarioOutput.tension_paths, input.accent, input.ink, input.seed),
    ...generateConflictForms(input.scenarioOutput.conflict_points, input.accent, input.ink, input.seed),
    ...generateProportionForms(input.compositionOutput.proportion_guides, input.accent, input.ink, input.seed),
  ];
}

function drawScenarioRelations(
  paths: ScenarioTensionPath[],
  conflictPoints: ScenarioConflictPoint[],
  accent: string,
): {
  relations: VisualComposerRelation[];
  guides: VisualRendererGuideElement[];
} {
  const relations: VisualComposerRelation[] = paths.map((path) => ({
    type: "thin_line",
    from: path.id,
    to: `${path.id}_end`,
    x1: path.start.x,
    y1: path.start.y,
    x2: path.end.x,
    y2: path.end.y,
    stroke: accent,
    stroke_width: 1 + path.strength * 1.2,
    opacity: 0.42 + path.strength * 0.34,
  }));

  const guides: VisualRendererGuideElement[] = [
    ...paths.map((path) => ({
      type: "tension_path" as const,
      id: path.id,
      start: path.start,
      end: path.end,
      stroke: accent,
      stroke_width: 1.2 + path.strength,
      opacity: 0.28 + path.strength * 0.24,
    })),
    ...conflictPoints.map((point) => ({
      type: "conflict_marker" as const,
      id: point.id,
      point: point.point,
      stroke: accent,
      fill: accent,
      size: 10 + point.strength * 8,
      stroke_width: 1.2,
      opacity: 0.36 + point.strength * 0.34,
    })),
  ];

  return { relations, guides };
}

function applyPaletteGuides(
  regions: ColorVisualOutput["background_regions"],
  palette: ColorPaletteStop[],
) {
  const surface = paletteColor(palette, "surface", "#f4efe6");
  return regions.map((region) => ({
    type: "background_region" as const,
    id: region.id,
    center: region.center,
    width: region.width,
    height: region.height,
    stroke: surface,
    fill: region.color,
    stroke_width: 0,
    opacity: region.opacity,
  }));
}

function accentTargetGuides(targets: ColorAccentTarget[], ink: string): VisualRendererGuideElement[] {
  return targets.map((target) => ({
    type: "accent_target" as const,
    id: target.id,
    center: target.point,
    width: target.radius * 2,
    height: target.radius * 2,
    radius: target.radius,
    stroke: ink,
    fill: target.color,
    stroke_width: 1,
    opacity: 0.22,
  }));
}

function compositionGuides(
  compositionOutput: CompositionVisualOutput,
  accent: string,
): VisualRendererGuideElement[] {
  const guides: VisualRendererGuideElement[] = compositionOutput.proportion_guides.map((guide) => ({
    type: "proportion_guide",
    id: guide.id,
    start: guide.start,
    end: guide.end,
    stroke: accent,
    stroke_width: 1,
    opacity: 0.18,
  }));

  guides.push({
    type: "focus_field",
    id: "focus-field",
    center: compositionOutput.focus_field.center,
    width: compositionOutput.focus_field.radius * 2,
    height: compositionOutput.focus_field.radius * 2,
    radius: compositionOutput.focus_field.radius,
    stroke: accent,
    fill: accent,
    stroke_width: 1,
    opacity: 0.08 + compositionOutput.focus_field.strength * 0.12,
  });

  guides.push(
    ...compositionOutput.movement_field.map((vector) => ({
      type: "balance_vector" as const,
      id: vector.id,
      start: vector.start,
      end: vector.end,
      stroke: accent,
      stroke_width: 1 + vector.strength,
      opacity: 0.2 + vector.strength * 0.18,
    })),
  );

  return guides;
}

function zoneFrames(
  zones: StructureVisualZone[],
  accent: string,
): VisualRendererGuideElement[] {
  return zones.map((zone) => ({
    type: "zone_frame" as const,
    id: zone.id,
    center: zone.center,
    width: zone.width,
    height: zone.height,
    stroke: accent,
    fill: "transparent",
    stroke_width: zone.role === "dominant" ? 1.4 : 1,
    opacity: zone.role === "dominant" ? 0.18 : 0.1,
  }));
}

function balanceGuides(
  balanceMap: StructureVisualBalanceMap,
  ink: string,
): VisualRendererGuideElement[] {
  return [
    {
      type: "balance_vector" as const,
      id: "balance-map",
      start: balanceMap.center_of_mass,
      end: balanceMap.correction_target,
      stroke: ink,
      stroke_width: 1.2,
      opacity: 0.16 + clamp(balanceMap.drift, 0, 1) * 0.18,
    },
  ];
}

export function runVisualRendererV1(input: {
  structure_output: StructureVisualOutput;
  scenario_output: ScenarioVisualOutput;
  color_output: ColorVisualOutput;
  composition_output: CompositionVisualOutput;
  canvas_settings?: VisualRendererCanvasSettings;
}): VisualRendererScene {
  const canvas = createCanvas(input.canvas_settings);
  const ink = paletteColor(input.color_output.palette, "ink", "#181411");
  const accent = paletteColor(input.color_output.palette, "accent", "#b5452f");
  const shapePopulationSeed = input.canvas_settings?.shape_population_seed ?? "base-shape-population";
  const backgroundLayer = input.canvas_settings?.background_layer ?? null;
  const backgroundKind = backgroundLayer?.active_kind ?? "triangulation";
  const backgroundSeed = backgroundLayer?.seed ?? shapePopulationSeed;
  const triangulation =
    backgroundKind === "triangulation"
      ? runTriangulationEngineV1(
          canvas,
          {
            point_count:
              backgroundLayer?.triangulation_settings?.point_count ??
              input.canvas_settings?.triangulation_point_count ??
              180,
            grid_cols: backgroundLayer?.triangulation_settings?.grid_cols ?? 22,
            grid_rows: backgroundLayer?.triangulation_settings?.grid_rows ?? 10,
            jitter: backgroundLayer?.triangulation_settings?.jitter ?? 0.32,
            color_variation: backgroundLayer?.triangulation_settings?.color_variation ?? 1,
            seed: backgroundSeed,
          },
          {
            stops: input.color_output.palette,
            light_blue: paletteColor(input.color_output.palette, "surface", "#DDEAF2"),
            medium_blue: paletteColor(input.color_output.palette, "accent", "#7FB7D8"),
            deep_blue: paletteColor(input.color_output.palette, "ink", "#21445B"),
          },
        )
      : emptyTriangulationOutput();
  const patterns =
    backgroundKind === "pattern"
      ? applyPatternConstraints(
          runPatternEngineV1(canvas, input.structure_output, input.color_output, {
            ...input.canvas_settings,
            ...(backgroundLayer?.pattern_settings ?? {}),
            pattern_seed: backgroundSeed,
          }),
          {
            canvas,
            primary_center:
              input.structure_output.centers.find((center) => center.id === "primary_center")?.point ??
              input.composition_output.focus_field.center,
            style_mode: input.canvas_settings?.pattern_style_mode ?? "CONTROL_CALM",
          },
        )
      : emptyPatternOutput();
  const flatAbstractPattern =
    backgroundKind === "flat_abstract_pattern"
      ? runFlatAbstractPatternEngineV1(
          canvas,
          {
            ...(backgroundLayer?.flat_abstract_pattern_settings ?? {}),
            seed: backgroundSeed,
          },
          flatAbstractPalette(input.color_output.palette),
        )
      : null;
  const isometricPattern =
    backgroundKind === "isometric_pattern"
      ? runIsometricPatternEngineV1(
          canvas,
          backgroundLayer?.isometric_pattern_settings ?? {},
          isometricPalette(input.color_output.palette),
        )
      : null;
  const zigZagPattern =
    backgroundKind === "zigzag_pattern"
      ? runZigZagPatternEngineV1(
          canvas,
          {
            ...(backgroundLayer?.zigzag_pattern_settings ?? {}),
            seed: backgroundSeed,
          },
          zigZagPalette(input.color_output.palette),
        )
      : null;
  const retroGridPattern =
    backgroundKind === "retro_grid_pattern"
      ? runRetroGridPatternEngineV1(
          canvas,
          {
            ...(backgroundLayer?.retro_grid_pattern_settings ?? {}),
            seed: backgroundSeed,
          },
          retroGridPalette(input.color_output.palette),
        )
      : null;

  const forms = generateShapePopulation({
    structureOutput: input.structure_output,
    scenarioOutput: input.scenario_output,
    compositionOutput: input.composition_output,
    accent,
    ink,
    seed: shapePopulationSeed,
  });

  const scenarioRelations = drawScenarioRelations(
    input.scenario_output.tension_paths,
    input.scenario_output.conflict_points,
    accent,
  );

  const guides: VisualRendererGuideElement[] = [
    ...gridLines(canvas, input.structure_output.grid, ink),
    ...drawAxes(input.structure_output.axes, ink),
    ...zoneFrames(input.structure_output.zones, accent),
    ...applyPaletteGuides(input.color_output.background_regions, input.color_output.palette),
    ...accentTargetGuides(input.color_output.accent_targets, ink),
    ...compositionGuides(input.composition_output, accent),
    ...balanceGuides(input.structure_output.balance_map, ink),
    ...scenarioRelations.guides,
  ];

  return {
    canvas,
    palette: input.color_output.palette,
    background_layer: backgroundLayer,
    triangulation,
    patterns,
    flat_abstract_pattern: flatAbstractPattern,
    isometric_pattern: isometricPattern,
    zigzag_pattern: zigZagPattern,
    retro_grid_pattern: retroGridPattern,
    guides,
    forms,
    relations: scenarioRelations.relations,
    visual_scene: {
      canvas,
      background_layer: backgroundLayer,
      triangulation,
      patterns,
      flat_abstract_pattern: flatAbstractPattern,
      isometric_pattern: isometricPattern,
      zigzag_pattern: zigZagPattern,
      retro_grid_pattern: retroGridPattern,
      guides,
      forms,
      relations: scenarioRelations.relations,
      palette: input.color_output.palette,
    },
  };
}
