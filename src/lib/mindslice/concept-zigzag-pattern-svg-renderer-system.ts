import type {
  ZigZagPatternOutput,
  ZigZagSegment,
} from "@/lib/mindslice/concept-zigzag-pattern-engine-system";

export type ZigZagSvgRectNode = {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

export type ZigZagSvgLineNode = {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  stroke_width: number;
  stroke_linecap: "butt";
};

export type ZigZagSvgGroupNode = {
  type: "g";
  id: string;
  transform?: string;
  children: ZigZagSvgNode[];
};

export type ZigZagSvgNode = ZigZagSvgRectNode | ZigZagSvgLineNode | ZigZagSvgGroupNode;

export type ZigZagSvgOutput = {
  type: "svg";
  width: number;
  height: number;
  viewBox: string;
  children: ZigZagSvgNode[];
};

function createSvg(width: number, height: number): ZigZagSvgOutput {
  return {
    type: "svg",
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    children: [],
  };
}

function createGroup(id: string): ZigZagSvgGroupNode {
  return {
    type: "g",
    id,
    children: [],
  };
}

function applyRotation(group: ZigZagSvgGroupNode, rotation: 0 | 180, center: { x: number; y: number }) {
  if (rotation !== 0) {
    group.transform = `rotate(${rotation} ${center.x} ${center.y})`;
  }
}

function drawRect(
  parent: ZigZagSvgOutput | ZigZagSvgGroupNode,
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

function drawLine(parent: ZigZagSvgOutput | ZigZagSvgGroupNode, segment: ZigZagSegment) {
  parent.children.push({
    type: "line",
    x1: segment.x1,
    y1: segment.y1,
    x2: segment.x2,
    y2: segment.y2,
    stroke: segment.stroke,
    stroke_width: segment.stroke_width,
    stroke_linecap: segment.stroke_linecap,
  });
}

function drawBackground(svg: ZigZagSvgOutput, canvas: ZigZagPatternOutput["canvas"], color: string) {
  drawRect(svg, 0, 0, canvas.width, canvas.height, color);
}

function drawChevronLayer(svg: ZigZagSvgOutput, chevrons: ZigZagPatternOutput["chevrons"]) {
  const layer = createGroup("zigzag_grammar_chevrons");

  chevrons.forEach((stack) => {
    const group = createGroup(stack.id);
    applyRotation(group, stack.rotation, stack.cell.center);

    stack.segments.forEach((segment) => {
      drawLine(group, segment);
    });

    layer.children.push(group);
  });

  svg.children.push(layer);
}

export function runZigZagPatternSvgRendererV1(
  patternOutput: ZigZagPatternOutput,
): ZigZagSvgOutput {
  const { canvas, palette } = patternOutput;
  const svg = createSvg(canvas.width, canvas.height);

  drawBackground(svg, canvas, palette.background);
  drawChevronLayer(svg, patternOutput.chevrons);

  return svg;
}

export const RUN = runZigZagPatternSvgRendererV1;
