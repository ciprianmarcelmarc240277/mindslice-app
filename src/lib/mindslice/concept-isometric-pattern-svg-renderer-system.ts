import type {
  IsometricPatternOutput,
  IsometricTile,
} from "@/lib/mindslice/concept-isometric-pattern-engine-system";
import type { VisualGridPoint } from "@/lib/mindslice/concept-visual-composer-system";

export type IsometricSvgRectNode = {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

export type IsometricSvgPolygonNode = {
  type: "polygon";
  points: string;
  fill: string;
  stroke: string;
};

export type IsometricSvgGroupNode = {
  type: "g";
  id: string;
  children: IsometricSvgNode[];
};

export type IsometricSvgNode =
  | IsometricSvgRectNode
  | IsometricSvgPolygonNode
  | IsometricSvgGroupNode;

export type IsometricSvgOutput = {
  type: "svg";
  width: number;
  height: number;
  viewBox: string;
  children: IsometricSvgNode[];
};

function createSvg(width: number, height: number): IsometricSvgOutput {
  return {
    type: "svg",
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    children: [],
  };
}

function createGroup(id: string): IsometricSvgGroupNode {
  return {
    type: "g",
    id,
    children: [],
  };
}

function serializePoints(points: VisualGridPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function drawRect(
  parent: IsometricSvgOutput | IsometricSvgGroupNode,
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

function drawPolygon(
  parent: IsometricSvgOutput | IsometricSvgGroupNode,
  points: VisualGridPoint[],
  fill: string,
  stroke: string,
) {
  parent.children.push({
    type: "polygon",
    points: serializePoints(points),
    fill,
    stroke,
  });
}

function drawOuterTile(layer: IsometricSvgGroupNode, tile: IsometricTile) {
  drawPolygon(layer, tile.outer.left_band, tile.colors.outer_left, "none");
  drawPolygon(layer, tile.outer.right_band, tile.colors.outer_right, "none");
  drawPolygon(layer, tile.outer.top_band, tile.colors.outer_top, "none");
}

function drawInnerCube(layer: IsometricSvgGroupNode, tile: IsometricTile) {
  drawPolygon(layer, tile.cube.left_face, tile.colors.cube_left, "none");
  drawPolygon(layer, tile.cube.right_face, tile.colors.cube_right, "none");
  drawPolygon(layer, tile.cube.top_face, tile.colors.cube_top, "none");
}

export function runIsometricPatternSvgRendererV1(
  patternOutput: IsometricPatternOutput,
): IsometricSvgOutput {
  const { canvas, palette } = patternOutput;
  const svg = createSvg(canvas.width, canvas.height);
  const layerOuter = createGroup("outer_tiles");
  const layerCubes = createGroup("inner_cubes");

  drawRect(svg, 0, 0, canvas.width, canvas.height, palette.background);

  patternOutput.tiles.forEach((tile) => {
    drawOuterTile(layerOuter, tile);
  });

  patternOutput.tiles.forEach((tile) => {
    drawInnerCube(layerCubes, tile);
  });

  svg.children.push(layerOuter, layerCubes);

  return svg;
}

export const RUN = runIsometricPatternSvgRendererV1;
