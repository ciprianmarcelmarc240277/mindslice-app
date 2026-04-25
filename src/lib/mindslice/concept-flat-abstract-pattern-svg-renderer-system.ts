import type {
  FlatAbstractBlob,
  FlatAbstractCircle,
  FlatAbstractCircleOutline,
  FlatAbstractGlyph,
  FlatAbstractLine,
  FlatAbstractPath,
  FlatAbstractPatternOutput,
  FlatAbstractPolygon,
  FlatAbstractPolyline,
  FlatAbstractRadialBurst,
  FlatAbstractStripedCircle,
} from "@/lib/mindslice/concept-flat-abstract-pattern-engine-system";

export type FlatAbstractSvgRectNode = {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

export type FlatAbstractSvgPathNode = {
  type: "path";
  id?: string;
  d: string;
  fill: string;
  stroke: string | null;
  stroke_width: number | null;
  opacity: number;
  dasharray: string | null;
};

export type FlatAbstractSvgCircleNode = FlatAbstractCircle;

export type FlatAbstractSvgCircleOutlineNode = FlatAbstractCircleOutline;

export type FlatAbstractSvgLineNode = Omit<FlatAbstractLine, "dasharray"> & {
  dasharray: string | null;
};

export type FlatAbstractSvgPolylineNode = Omit<FlatAbstractPolyline, "points"> & {
  points: string;
};

export type FlatAbstractSvgPolygonNode = Omit<FlatAbstractPolygon, "points"> & {
  points: string;
};

export type FlatAbstractSvgGroupNode = {
  type: "g";
  id: string;
  clip_path?: string;
  children: FlatAbstractSvgNode[];
};

export type FlatAbstractSvgClipPathNode = {
  type: "clipPath";
  id: string;
  child: {
    type: "circle";
    cx: number;
    cy: number;
    r: number;
  };
};

export type FlatAbstractSvgNode =
  | FlatAbstractSvgRectNode
  | FlatAbstractSvgPathNode
  | FlatAbstractSvgCircleNode
  | FlatAbstractSvgCircleOutlineNode
  | FlatAbstractSvgLineNode
  | FlatAbstractSvgPolylineNode
  | FlatAbstractSvgPolygonNode
  | FlatAbstractSvgGroupNode;

export type FlatAbstractSvgOutput = {
  type: "svg";
  width: number;
  height: number;
  viewBox: string;
  defs: FlatAbstractSvgClipPathNode[];
  children: FlatAbstractSvgNode[];
};

let uniqueNumber = 0;

function generateId(prefix: string) {
  uniqueNumber += 1;
  return `${prefix}_${uniqueNumber}`;
}

function createSvg(width: number, height: number): FlatAbstractSvgOutput {
  return {
    type: "svg",
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    defs: [],
    children: [],
  };
}

function createGroup(id: string): FlatAbstractSvgGroupNode {
  return {
    type: "g",
    id,
    children: [],
  };
}

function serializePoints(points: FlatAbstractPolyline["points"] | FlatAbstractPolygon["points"]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function drawRect(
  parent: FlatAbstractSvgOutput | FlatAbstractSvgGroupNode,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
) {
  parent.children.push({
    type: "rect",
    x,
    y,
    width,
    height,
    fill,
  });
}

function drawPath(
  parent: FlatAbstractSvgOutput | FlatAbstractSvgGroupNode,
  d: string,
  fill: string,
  stroke: string | null,
  strokeWidth: number | null,
  opacity: number,
  dasharray: string | null,
) {
  parent.children.push({
    type: "path",
    d,
    fill,
    stroke,
    stroke_width: strokeWidth,
    opacity,
    dasharray,
  });
}

function drawCircle(
  parent: FlatAbstractSvgOutput | FlatAbstractSvgGroupNode,
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

function drawCircleOutline(
  parent: FlatAbstractSvgOutput | FlatAbstractSvgGroupNode,
  cx: number,
  cy: number,
  r: number,
  stroke: string,
  strokeWidth: number,
  opacity: number,
) {
  parent.children.push({
    type: "circle_outline",
    cx,
    cy,
    r,
    fill: "none",
    stroke,
    stroke_width: strokeWidth,
    opacity,
  });
}

function drawLine(
  parent: FlatAbstractSvgOutput | FlatAbstractSvgGroupNode,
  line: FlatAbstractLine,
  dasharray: string | null = null,
) {
  parent.children.push({
    type: "line",
    x1: line.x1,
    y1: line.y1,
    x2: line.x2,
    y2: line.y2,
    stroke: line.stroke,
    stroke_width: line.stroke_width,
    opacity: line.opacity,
    stroke_linecap: line.stroke_linecap,
    dasharray,
  });
}

function drawPolyline(parent: FlatAbstractSvgOutput | FlatAbstractSvgGroupNode, glyph: FlatAbstractPolyline) {
  parent.children.push({
    type: "polyline",
    points: serializePoints(glyph.points),
    stroke: glyph.stroke,
    stroke_width: glyph.stroke_width,
    fill: glyph.fill,
    opacity: glyph.opacity,
    stroke_linecap: glyph.stroke_linecap,
    stroke_linejoin: glyph.stroke_linejoin,
  });
}

function drawPolygon(parent: FlatAbstractSvgOutput | FlatAbstractSvgGroupNode, glyph: FlatAbstractPolygon) {
  parent.children.push({
    type: "polygon",
    points: serializePoints(glyph.points),
    fill: glyph.fill,
    stroke: glyph.stroke,
    opacity: glyph.opacity,
  });
}

function addClipCircle(
  svg: FlatAbstractSvgOutput,
  id: string,
  cx: number,
  cy: number,
  r: number,
) {
  svg.defs.push({
    type: "clipPath",
    id,
    child: {
      type: "circle",
      cx,
      cy,
      r,
    },
  });
}

function drawBackground(svg: FlatAbstractSvgOutput, color: string) {
  drawRect(svg, 0, 0, svg.width, svg.height, color);
}

function drawBlobs(svg: FlatAbstractSvgOutput, blobs: FlatAbstractBlob[]) {
  const layer = createGroup("blobs");

  blobs.forEach((blob) => {
    drawPath(layer, blob.path, blob.fill, "none", null, blob.opacity, null);
  });

  svg.children.push(layer);
}

function drawCurvedPaths(svg: FlatAbstractSvgOutput, curvedPaths: FlatAbstractPath[]) {
  const layer = createGroup("curved_paths");

  curvedPaths.forEach((path) => {
    drawPath(layer, path.d, path.fill, path.stroke, path.stroke_width, path.opacity, null);
  });

  svg.children.push(layer);
}

function drawDashedPaths(svg: FlatAbstractSvgOutput, dashedPaths: FlatAbstractPath[]) {
  const layer = createGroup("dashed_paths");

  dashedPaths.forEach((path) => {
    drawPath(
      layer,
      path.d,
      path.fill,
      path.stroke,
      path.stroke_width,
      path.opacity,
      path.dasharray ?? null,
    );
  });

  svg.children.push(layer);
}

function drawDotGrids(svg: FlatAbstractSvgOutput, dotGrids: FlatAbstractPatternOutput["dot_grids"]) {
  const layer = createGroup("dot_grids");

  dotGrids.forEach((grid) => {
    const group = createGroup(grid.id);

    grid.dots.forEach((dot) => {
      drawCircle(group, dot.cx, dot.cy, dot.r, dot.fill, dot.opacity);
    });

    layer.children.push(group);
  });

  svg.children.push(layer);
}

function drawStripedCircles(svg: FlatAbstractSvgOutput, stripedCircles: FlatAbstractStripedCircle[]) {
  const layer = createGroup("striped_circles");

  stripedCircles.forEach((striped) => {
    const clipId = generateId("clip_striped_circle");
    const group = createGroup(striped.id);

    addClipCircle(svg, clipId, striped.center.x, striped.center.y, striped.radius);
    group.clip_path = `url(#${clipId})`;

    striped.stripes.forEach((stripe) => {
      drawLine(group, stripe, null);
    });

    layer.children.push(group);
  });

  svg.children.push(layer);
}

function drawRadialBursts(svg: FlatAbstractSvgOutput, radialBursts: FlatAbstractRadialBurst[]) {
  const layer = createGroup("radial_bursts");

  radialBursts.forEach((burst) => {
    const group = createGroup(burst.id);

    burst.rays.forEach((ray) => {
      drawLine(group, ray, null);
    });

    layer.children.push(group);
  });

  svg.children.push(layer);
}

function drawGlyph(parent: FlatAbstractSvgGroupNode, glyph: FlatAbstractGlyph) {
  if (glyph.type === "circle") {
    drawCircle(parent, glyph.cx, glyph.cy, glyph.r, glyph.fill, glyph.opacity);
  }

  if (glyph.type === "circle_outline") {
    drawCircleOutline(parent, glyph.cx, glyph.cy, glyph.r, glyph.stroke, glyph.stroke_width, glyph.opacity);
  }

  if (glyph.type === "line") {
    drawLine(parent, glyph, glyph.dasharray ?? null);
  }

  if (glyph.type === "polyline") {
    drawPolyline(parent, glyph);
  }

  if (glyph.type === "polygon") {
    drawPolygon(parent, glyph);
  }
}

function drawMicroGlyphs(svg: FlatAbstractSvgOutput, microGlyphs: FlatAbstractGlyph[]) {
  const layer = createGroup("micro_glyphs");

  microGlyphs.forEach((glyph) => {
    drawGlyph(layer, glyph);
  });

  svg.children.push(layer);
}

export function runFlatAbstractPatternSvgRendererV1(
  patternOutput: FlatAbstractPatternOutput,
): FlatAbstractSvgOutput {
  uniqueNumber = 0;

  const { canvas, palette } = patternOutput;
  const svg = createSvg(canvas.width, canvas.height);

  drawBackground(svg, palette.background);
  drawBlobs(svg, patternOutput.blobs);
  drawCurvedPaths(svg, patternOutput.curved_paths);
  drawDashedPaths(svg, patternOutput.dashed_paths);
  drawDotGrids(svg, patternOutput.dot_grids);
  drawStripedCircles(svg, patternOutput.striped_circles);
  drawRadialBursts(svg, patternOutput.radial_bursts);
  drawMicroGlyphs(svg, patternOutput.micro_glyphs);

  return svg;
}

export const RUN = runFlatAbstractPatternSvgRendererV1;
