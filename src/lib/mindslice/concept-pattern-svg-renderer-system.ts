import type {
  PatternCircle,
  PatternLine,
  PatternOutput,
  PatternPolyline,
} from "@/lib/mindslice/concept-pattern-engine-system";
import type { VisualCanvas } from "@/lib/mindslice/concept-visual-composer-system";
import type { ColorPaletteStop } from "@/lib/mindslice/concept-visual-renderer-system";

export type PatternSvgCircleNode = Omit<PatternCircle, "type"> & {
  type: "circle";
};

export type PatternSvgLineNode = Omit<PatternLine, "type"> & {
  type: "line";
};

export type PatternSvgPolylineNode = Omit<PatternPolyline, "type" | "points" | "fill"> & {
  type: "polyline";
  points: string;
  fill: string;
};

export type PatternSvgGroupNode = {
  type: "g";
  id: string;
  clip_path?: string;
  children: PatternSvgNode[];
};

export type PatternSvgClipPathNode = {
  type: "clipPath";
  id: string;
  child: PatternSvgCircleNode;
};

export type PatternSvgNode =
  | PatternSvgCircleNode
  | PatternSvgLineNode
  | PatternSvgPolylineNode
  | PatternSvgGroupNode;

export type PatternSvgLayer = PatternSvgGroupNode & {
  defs: PatternSvgClipPathNode[];
};

let uniqueId = 0;

function createGroup(id: string, clipPath: string | null = null): PatternSvgGroupNode {
  return {
    type: "g",
    id,
    ...(clipPath ? { clip_path: `url(#${clipPath})` } : {}),
    children: [],
  };
}

function generateId(prefix: string) {
  uniqueId += 1;
  return `${prefix}_${uniqueId}`;
}

function createClipCircle(id: string, cx: number, cy: number, r: number): PatternSvgClipPathNode {
  return {
    type: "clipPath",
    id,
    child: {
      type: "circle",
      cx,
      cy,
      r,
      fill: "black",
      opacity: 1,
    },
  };
}

function drawCircle(
  parent: PatternSvgGroupNode,
  cx: number,
  cy: number,
  r: number,
  fill: string,
  opacity: number,
) {
  parent.children.push({
    type: "circle",
    cx,
    cy,
    r,
    fill,
    opacity,
  });
}

function drawLine(
  parent: PatternSvgGroupNode,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  strokeWidth: number,
  opacity: number,
  strokeLinecap: "round" = "round",
) {
  parent.children.push({
    type: "line",
    x1,
    y1,
    x2,
    y2,
    stroke,
    stroke_width: strokeWidth,
    opacity,
    stroke_linecap: strokeLinecap,
  });
}

function serializePoints(points: PatternPolyline["points"]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function drawPolyline(
  parent: PatternSvgGroupNode,
  points: PatternPolyline["points"],
  stroke: string,
  strokeWidth: number,
  fill: string,
  opacity: number,
  strokeLinecap: "round" = "round",
  strokeLinejoin: "round" = "round",
) {
  parent.children.push({
    type: "polyline",
    points: serializePoints(points),
    stroke,
    stroke_width: strokeWidth,
    fill,
    opacity,
    stroke_linecap: strokeLinecap,
    stroke_linejoin: strokeLinejoin,
  });
}

function drawDotGrids(svgLayer: PatternSvgLayer, dotGrids: PatternOutput["dot_grids"]) {
  dotGrids.forEach((grid, index) => {
    const group = createGroup(`dot_grid_${index}`);

    grid.dots.forEach((dot) => {
      drawCircle(group, dot.cx, dot.cy, dot.r, dot.fill, dot.opacity);
    });

    svgLayer.children.push(group);
  });
}

function drawStripedCircles(
  svgLayer: PatternSvgLayer,
  stripedCircles: PatternOutput["stripes"],
) {
  stripedCircles.forEach((pattern, index) => {
    const clipId = generateId("clip_striped_circle");
    const group = createGroup(`striped_circle_${index}`, clipId);

    svgLayer.defs.push(
      createClipCircle(clipId, pattern.center.x, pattern.center.y, pattern.radius),
    );

    pattern.stripes.forEach((stripe) => {
      drawLine(
        group,
        stripe.x1,
        stripe.y1,
        stripe.x2,
        stripe.y2,
        stripe.stroke,
        stripe.stroke_width,
        stripe.opacity,
        stripe.stroke_linecap,
      );
    });

    svgLayer.children.push(group);
  });
}

function drawRadialBursts(
  svgLayer: PatternSvgLayer,
  radialBursts: PatternOutput["radial_bursts"],
) {
  radialBursts.forEach((burst, index) => {
    const group = createGroup(`radial_burst_${index}`);

    burst.rays.forEach((ray) => {
      drawLine(
        group,
        ray.x1,
        ray.y1,
        ray.x2,
        ray.y2,
        ray.stroke,
        ray.stroke_width,
        ray.opacity,
        ray.stroke_linecap,
      );
    });

    svgLayer.children.push(group);
  });
}

function drawMicroGlyphs(svgLayer: PatternSvgLayer, microGlyphs: PatternOutput["micro_glyphs"]) {
  const group = createGroup("micro_glyphs");

  microGlyphs.forEach((glyph) => {
    if (glyph.type === "circle") {
      drawCircle(group, glyph.cx, glyph.cy, glyph.r, glyph.fill, glyph.opacity);
    }

    if (glyph.type === "line") {
      drawLine(
        group,
        glyph.x1,
        glyph.y1,
        glyph.x2,
        glyph.y2,
        glyph.stroke,
        glyph.stroke_width,
        glyph.opacity,
        glyph.stroke_linecap,
      );
    }

    if (glyph.type === "polyline") {
      drawPolyline(
        group,
        glyph.points,
        glyph.stroke,
        glyph.stroke_width,
        glyph.fill,
        glyph.opacity,
        glyph.stroke_linecap,
        glyph.stroke_linejoin,
      );
    }
  });

  svgLayer.children.push(group);
}

export function runPatternSvgRendererV1(
  patternOutput: PatternOutput,
  _canvas: VisualCanvas,
  _colorPalette: ColorPaletteStop[],
): PatternSvgLayer {
  void _canvas;
  void _colorPalette;

  uniqueId = 0;

  const svgLayer: PatternSvgLayer = {
    ...createGroup("mind_slice_patterns"),
    defs: [],
  };

  drawDotGrids(svgLayer, patternOutput.dot_grids);
  drawStripedCircles(svgLayer, patternOutput.stripes);
  drawRadialBursts(svgLayer, patternOutput.radial_bursts);
  drawMicroGlyphs(svgLayer, patternOutput.micro_glyphs);

  return svgLayer;
}

export const RUN = runPatternSvgRendererV1;
