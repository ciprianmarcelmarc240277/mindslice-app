import {
  runFlatAbstractGrammarEngineV1,
  type FlatAbstractBlobPlan,
  type FlatAbstractDotGridPlan,
  type FlatAbstractGrammarPlan,
  type FlatAbstractGrammarProfile,
  type FlatAbstractMicroGlyphPlan,
  type FlatAbstractPathPlan,
  type FlatAbstractRadialBurstPlan,
  type FlatAbstractStripedCirclePlan,
} from "@/lib/mindslice/concept-flat-abstract-grammar-engine-system";
import type { VisualGridPoint } from "@/lib/mindslice/concept-visual-composer-system";

export type FlatAbstractPatternCanvas = {
  width: number;
  height: number;
};

export type FlatAbstractPatternPalette = {
  background: string;
  dark_blob: string;
  yellow: string;
  teal: string;
  light: string;
};

export type FlatAbstractPatternSettings = {
  blob_count?: number;
  dot_grid_count?: number;
  striped_circle_count?: number;
  radial_burst_count?: number;
  curve_count?: number;
  dashed_curve_count?: number;
  micro_glyph_count?: number;
  seed?: string;
  grammar_profile?: FlatAbstractGrammarProfile;
  max_blob_count?: number;
  max_dot_grid_count?: number;
  max_striped_circle_count?: number;
  max_radial_burst_count?: number;
  max_curved_path_count?: number;
  max_dashed_path_count?: number;
  max_micro_glyph_count?: number;
};

export type FlatAbstractBlob = {
  id: string;
  type: "blob";
  fill: string;
  opacity: number;
  path: string;
};

export type FlatAbstractCircle = {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity: number;
};

export type FlatAbstractCircleOutline = {
  type: "circle_outline";
  cx: number;
  cy: number;
  r: number;
  fill: "none";
  stroke: string;
  stroke_width: number;
  opacity: number;
};

export type FlatAbstractLine = {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  stroke_width: number;
  opacity: number;
  stroke_linecap: "round";
  dasharray?: string;
};

export type FlatAbstractPolyline = {
  type: "polyline";
  points: VisualGridPoint[];
  stroke: string;
  stroke_width: number;
  fill: "none";
  opacity: number;
  stroke_linecap: "round";
  stroke_linejoin: "round";
};

export type FlatAbstractPolygon = {
  type: "polygon";
  points: VisualGridPoint[];
  fill: string;
  stroke: "none";
  opacity: number;
};

export type FlatAbstractPath = {
  id: string;
  type: "path";
  d: string;
  stroke: string;
  stroke_width: number;
  fill: "none";
  opacity: number;
  dasharray?: string;
};

export type FlatAbstractGlyph =
  | FlatAbstractCircle
  | FlatAbstractCircleOutline
  | FlatAbstractLine
  | FlatAbstractPolyline
  | FlatAbstractPolygon;

export type FlatAbstractDotGrid = {
  id: string;
  type: "dot_grid";
  dots: FlatAbstractCircle[];
};

export type FlatAbstractStripedCircle = {
  id: string;
  type: "striped_circle";
  center: VisualGridPoint;
  radius: number;
  stripes: FlatAbstractLine[];
};

export type FlatAbstractRadialBurst = {
  id: string;
  type: "radial_burst";
  rays: FlatAbstractLine[];
};

export type FlatAbstractPatternOutput = {
  canvas: FlatAbstractPatternCanvas;
  palette: FlatAbstractPatternPalette;
  blobs: FlatAbstractBlob[];
  dot_grids: FlatAbstractDotGrid[];
  striped_circles: FlatAbstractStripedCircle[];
  radial_bursts: FlatAbstractRadialBurst[];
  curved_paths: FlatAbstractPath[];
  dashed_paths: FlatAbstractPath[];
  micro_glyphs: FlatAbstractGlyph[];
};

const DEFAULT_CANVAS: FlatAbstractPatternCanvas = {
  width: 1536,
  height: 864,
};

const DEFAULT_PALETTE: FlatAbstractPatternPalette = {
  background: "#34475A",
  dark_blob: "#26384A",
  yellow: "#FFD13F",
  teal: "#22C7BB",
  light: "#DDEAF2",
};

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRange(seed: string, min: number, max: number) {
  const value = hashString(seed) / 4294967295;
  return min + (max - min) * value;
}

function pointOnCircle(center: VisualGridPoint, radius: number, angleDegrees: number) {
  const angle = (angleDegrees * Math.PI) / 180;

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

function perpendicular(v: VisualGridPoint) {
  return {
    x: -v.y,
    y: v.x,
  };
}

function normalize(v: VisualGridPoint) {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);

  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: v.x / length,
    y: v.y / length,
  };
}

function buildCornerBlob(
  canvas: FlatAbstractPatternCanvas,
  corner: "top_left" | "bottom_left",
  widthRatio: number,
  heightRatio: number,
) {
  const w = canvas.width * widthRatio;
  const h = canvas.height * heightRatio;

  if (corner === "top_left") {
    return `M0,0 H${w} C${w},${h * 0.35} ${w * 0.65},${h * 0.55} 0,${h} Z`;
  }

  const y = canvas.height;
  return `M0,${y} C${w * 0.25},${y - h * 0.45} ${w * 0.75},${y - h * 0.05} ${w},${y - h * 0.55} L${w},${y} L0,${y} Z`;
}

function buildEdgeBlob(
  canvas: FlatAbstractPatternCanvas,
  edge: "right",
  centerYRatio: number,
  widthRatio: number,
  heightRatio: number,
) {
  const width = canvas.width * widthRatio;
  const height = canvas.height * heightRatio;
  const centerY = canvas.height * centerYRatio;
  const xEdge = canvas.width;
  const xInner = canvas.width - width;
  const yTop = centerY - height / 2;
  const yBottom = centerY + height / 2;

  if (edge === "right") {
    return `M${xEdge},${yTop} C${xInner},${yTop} ${xInner},${yBottom} ${xEdge},${yBottom} Z`;
  }

  return "";
}

function buildSoftBand(start: VisualGridPoint, end: VisualGridPoint, thickness: number) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const normal = normalize(perpendicular({ x: dx, y: dy }));
  const offset = {
    x: normal.x * thickness,
    y: normal.y * thickness,
  };
  const p1 = { x: start.x + offset.x, y: start.y + offset.y };
  const p2 = { x: end.x + offset.x, y: end.y + offset.y };
  const p3 = { x: end.x - offset.x, y: end.y - offset.y };
  const p4 = { x: start.x - offset.x, y: start.y - offset.y };

  return `M${p1.x},${p1.y} C${start.x + dx * 0.35},${start.y + dy * 0.1} ${start.x + dx * 0.65},${start.y + dy * 0.9} ${p2.x},${p2.y} L${p3.x},${p3.y} C${start.x + dx * 0.65},${start.y + dy * 1.1} ${start.x + dx * 0.35},${start.y + dy * -0.1} ${p4.x},${p4.y} Z`;
}

function buildDotGridFromPlan(plan: FlatAbstractDotGridPlan): FlatAbstractDotGrid {
  const dots: FlatAbstractCircle[] = [];
  const startX = plan.center.x - ((plan.cols - 1) * plan.spacing) / 2;
  const startY = plan.center.y - ((plan.rows - 1) * plan.spacing) / 2;

  for (let row = 0; row < plan.rows; row += 1) {
    for (let col = 0; col < plan.cols; col += 1) {
      dots.push({
        type: "circle",
        cx: startX + col * plan.spacing,
        cy: startY + row * plan.spacing,
        r: plan.radius,
        fill: plan.color,
        opacity: plan.opacity,
      });
    }
  }

  return {
    id: plan.id,
    type: "dot_grid",
    dots,
  };
}

function buildStripedCircleFromPlan(plan: FlatAbstractStripedCirclePlan): FlatAbstractStripedCircle {
  const stripes: FlatAbstractLine[] = [];

  for (let index = 0; index < plan.stripe_count; index += 1) {
    const y = plan.center.y - plan.radius + index * ((plan.radius * 2) / (plan.stripe_count - 1));
    const dy = Math.abs(plan.center.y - y);
    const halfWidth = Math.sqrt(Math.max(0, plan.radius * plan.radius - dy * dy));

    stripes.push({
      type: "line",
      x1: plan.center.x - halfWidth,
      y1: y,
      x2: plan.center.x + halfWidth,
      y2: y,
      stroke: plan.color,
      stroke_width: plan.stripe_height,
      opacity: plan.opacity,
      stroke_linecap: "round",
    });
  }

  return {
    id: plan.id,
    type: "striped_circle",
    center: plan.center,
    radius: plan.radius,
    stripes,
  };
}

function buildRadialBurstFromPlan(plan: FlatAbstractRadialBurstPlan): FlatAbstractRadialBurst {
  const rays: FlatAbstractLine[] = [];

  for (let index = 0; index < plan.ray_count; index += 1) {
    const angle = index * (360 / plan.ray_count);
    const start = pointOnCircle(plan.center, plan.radius_inner, angle);
    const end = pointOnCircle(plan.center, plan.radius_outer, angle);

    rays.push({
      type: "line",
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      stroke: plan.color,
      stroke_width: plan.stroke_width,
      opacity: plan.opacity,
      stroke_linecap: "round",
    });
  }

  return {
    id: plan.id,
    type: "radial_burst",
    rays,
  };
}

function buildCurvePathFromPlan(plan: FlatAbstractPathPlan): FlatAbstractPath {
  const dx = plan.end.x - plan.start.x;
  const dy = plan.end.y - plan.start.y;
  const normal = normalize(perpendicular({ x: dx, y: dy }));
  const distance = Math.hypot(dx, dy);
  const control = {
    x: (plan.start.x + plan.end.x) / 2 + normal.x * distance * plan.curvature,
    y: (plan.start.y + plan.end.y) / 2 + normal.y * distance * plan.curvature,
  };

  return {
    id: plan.id,
    type: "path",
    d: `M${plan.start.x},${plan.start.y} C${control.x},${control.y} ${control.x},${control.y} ${plan.end.x},${plan.end.y}`,
    stroke: plan.stroke,
    stroke_width: plan.stroke_width,
    fill: plan.fill,
    opacity: plan.opacity,
    dasharray: plan.dasharray,
  };
}

function buildBlobFromPlan(
  canvas: FlatAbstractPatternCanvas,
  plan: FlatAbstractBlobPlan,
): FlatAbstractBlob {
  if (plan.subtype === "corner_blob" && plan.anchor === "bottom_left") {
    return {
      id: plan.id,
      type: "blob",
      fill: plan.fill,
      opacity: plan.opacity,
      path: buildCornerBlob(canvas, "bottom_left", 0.35, 0.22),
    };
  }

  if (plan.subtype === "corner_blob") {
    return {
      id: plan.id,
      type: "blob",
      fill: plan.fill,
      opacity: plan.opacity,
      path: buildCornerBlob(canvas, "top_left", 0.22, 0.22),
    };
  }

  if (plan.subtype === "edge_blob") {
    return {
      id: plan.id,
      type: "blob",
      fill: plan.fill,
      opacity: plan.opacity,
      path: buildEdgeBlob(canvas, "right", 0.5, 0.22, 0.46),
    };
  }

  if (plan.anchor === "right") {
    return {
      id: plan.id,
      type: "blob",
      fill: plan.fill,
      opacity: plan.opacity,
      path: buildSoftBand(
        { x: canvas.width * 0.7, y: canvas.height * 0.08 },
        { x: canvas.width, y: canvas.height * 0.86 },
        canvas.height * 0.25,
      ),
    };
  }

  if (plan.anchor === "bottom") {
    return {
      id: plan.id,
      type: "blob",
      fill: plan.fill,
      opacity: plan.opacity,
      path: buildSoftBand(
        { x: canvas.width * 0.05, y: canvas.height * 0.92 },
        { x: canvas.width * 0.78, y: canvas.height * 0.98 },
        canvas.height * 0.11,
      ),
    };
  }

  return {
    id: plan.id,
    type: "blob",
    fill: plan.fill,
    opacity: plan.opacity,
    path: buildSoftBand(
      { x: 0, y: canvas.height * 0.25 },
      { x: canvas.width * 0.45, y: canvas.height * 0.04 },
      canvas.height * 0.22,
    ),
  };
}

type GlyphSpec = {
  type: "dot" | "chevron" | "dash" | "dash_vertical" | "circle_outline" | "tiny_triangle";
  x: number;
  y: number;
  color: string;
  seed?: string;
};

function buildGlyph(glyph: GlyphSpec): FlatAbstractGlyph {
  if (glyph.type === "dot") {
    return {
      type: "circle",
      cx: glyph.x,
      cy: glyph.y,
      r: seededRange(`${glyph.seed}:dot-r`, 2, 5),
      fill: glyph.color,
      opacity: seededRange(`${glyph.seed}:dot-opacity`, 0.5, 0.9),
    };
  }

  if (glyph.type === "chevron") {
    return {
      type: "polyline",
      points: [
        { x: glyph.x - 8, y: glyph.y + 5 },
        { x: glyph.x, y: glyph.y - 5 },
        { x: glyph.x + 8, y: glyph.y + 5 },
      ],
      stroke: glyph.color,
      stroke_width: 5,
      fill: "none",
      opacity: 0.9,
      stroke_linecap: "round",
      stroke_linejoin: "round",
    };
  }

  if (glyph.type === "dash") {
    return {
      type: "line",
      x1: glyph.x - 90,
      y1: glyph.y,
      x2: glyph.x + 90,
      y2: glyph.y,
      stroke: glyph.color,
      stroke_width: 6,
      opacity: 0.9,
      stroke_linecap: "round",
      dasharray: "14 18",
    };
  }

  if (glyph.type === "dash_vertical") {
    return {
      type: "line",
      x1: glyph.x,
      y1: glyph.y - 45,
      x2: glyph.x,
      y2: glyph.y + 45,
      stroke: glyph.color,
      stroke_width: 6,
      opacity: 0.9,
      stroke_linecap: "round",
      dasharray: "14 18",
    };
  }

  if (glyph.type === "circle_outline") {
    return {
      type: "circle_outline",
      cx: glyph.x,
      cy: glyph.y,
      r: 20,
      fill: "none",
      stroke: glyph.color,
      stroke_width: 4,
      opacity: 0.9,
    };
  }

  return {
    type: "polygon",
    points: [
      { x: glyph.x, y: glyph.y - 10 },
      { x: glyph.x - 10, y: glyph.y + 8 },
      { x: glyph.x + 10, y: glyph.y + 8 },
    ],
    fill: glyph.color,
    stroke: "none",
    opacity: 0.85,
  };
}

function buildGlyphFromPlan(plan: FlatAbstractMicroGlyphPlan): FlatAbstractGlyph {
  return buildGlyph({
    type: plan.type,
    x: plan.position.x,
    y: plan.position.y,
    color: plan.color,
    seed: plan.id,
  });
}

export function buildFlatAbstractPatternFromGrammarV1(
  canvas: FlatAbstractPatternCanvas,
  _settings: FlatAbstractPatternSettings,
  palette: FlatAbstractPatternPalette,
  grammarPlan: FlatAbstractGrammarPlan,
): FlatAbstractPatternOutput {
  void _settings;

  return {
    canvas,
    palette,
    blobs: grammarPlan.blobs.map((plan) => buildBlobFromPlan(canvas, plan)),
    dot_grids: grammarPlan.dot_grids.map((plan) => buildDotGridFromPlan(plan)),
    striped_circles: grammarPlan.striped_circles.map((plan) => buildStripedCircleFromPlan(plan)),
    radial_bursts: grammarPlan.radial_bursts.map((plan) => buildRadialBurstFromPlan(plan)),
    curved_paths: grammarPlan.curved_paths.map((plan) => buildCurvePathFromPlan(plan)),
    dashed_paths: grammarPlan.dashed_paths.map((plan) => buildCurvePathFromPlan(plan)),
    micro_glyphs: grammarPlan.micro_glyphs.map((plan) => buildGlyphFromPlan(plan)),
  };
}

export function runFlatAbstractPatternEngineV1(
  canvas: Partial<FlatAbstractPatternCanvas> = {},
  settings: FlatAbstractPatternSettings = {},
  palette: Partial<FlatAbstractPatternPalette> = {},
): FlatAbstractPatternOutput {
  const resolvedCanvas = {
    ...DEFAULT_CANVAS,
    ...canvas,
  };
  const resolvedSettings = {
    blob_count: 6,
    dot_grid_count: 4,
    striped_circle_count: 2,
    radial_burst_count: 6,
    curve_count: 3,
    dashed_curve_count: 2,
    micro_glyph_count: 40,
    grammar_profile: { name: "flat_abstract_balanced_play" },
    ...settings,
  };
  const resolvedPalette = {
    ...DEFAULT_PALETTE,
    ...palette,
  };
  const grammarPlan = runFlatAbstractGrammarEngineV1(
    resolvedCanvas,
    resolvedSettings.grammar_profile,
    resolvedPalette,
    resolvedSettings,
  );

  return buildFlatAbstractPatternFromGrammarV1(
    resolvedCanvas,
    resolvedSettings,
    resolvedPalette,
    grammarPlan,
  );
}

export const RUN = runFlatAbstractPatternEngineV1;
export const BUILD_FROM_GRAMMAR = buildFlatAbstractPatternFromGrammarV1;
