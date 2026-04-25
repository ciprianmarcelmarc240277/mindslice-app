import type {
  RetroGridGeometry,
  RetroGridPatternOutput,
} from "@/lib/mindslice/concept-retro-grid-pattern-engine-system";

export type RetroGridSvgRectNode = {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

export type RetroGridSvgPolygonNode = {
  type: "polygon";
  points: string;
  fill: string;
};

export type RetroGridSvgPathNode = {
  type: "path";
  d: string;
  fill: string;
};

export type RetroGridSvgGroupNode = {
  type: "g";
  id: string;
  transform?: string;
  children: RetroGridSvgNode[];
};

export type RetroGridSvgNode =
  | RetroGridSvgRectNode
  | RetroGridSvgPolygonNode
  | RetroGridSvgPathNode
  | RetroGridSvgGroupNode;

export type RetroGridSvgOutput = {
  type: "svg";
  width: number;
  height: number;
  viewBox: string;
  children: RetroGridSvgNode[];
};

function createSvg(width: number, height: number): RetroGridSvgOutput {
  return {
    type: "svg",
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    children: [],
  };
}

function createGroup(id: string): RetroGridSvgGroupNode {
  return {
    type: "g",
    id,
    children: [],
  };
}

function applyRotation(group: RetroGridSvgGroupNode, angle: number, cell: RetroGridPatternOutput["grid"][number]) {
  const cx = cell.x + cell.w / 2;
  const cy = cell.y + cell.h / 2;

  group.transform = `rotate(${angle} ${cx} ${cy})`;
}

function serializePoints(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function drawGeometry(parent: RetroGridSvgGroupNode, geometry: RetroGridGeometry) {
  if (geometry.type === "rect") {
    parent.children.push({
      type: "rect",
      x: geometry.x,
      y: geometry.y,
      width: geometry.w,
      height: geometry.h,
      fill: geometry.fill,
    });
  }

  if (geometry.type === "polygon") {
    parent.children.push({
      type: "polygon",
      points: serializePoints(geometry.points),
      fill: geometry.fill,
    });
  }

  if (geometry.type === "path") {
    parent.children.push({
      type: "path",
      d: geometry.d,
      fill: geometry.fill,
    });
  }
}

export function runRetroGridPatternSvgRendererV1(
  patternOutput: RetroGridPatternOutput,
): RetroGridSvgOutput {
  const { canvas } = patternOutput;
  const svg = createSvg(canvas.width, canvas.height);

  svg.children.push({
    type: "rect",
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    fill: "#FFFFFF",
  });

  patternOutput.cells.forEach((cell) => {
    const group = createGroup(cell.id);

    applyRotation(group, cell.rotation, cell.cell);

    cell.geometry.forEach((geometry) => {
      drawGeometry(group, geometry);
    });

    svg.children.push(group);
  });

  return svg;
}

export const RUN = runRetroGridPatternSvgRendererV1;
