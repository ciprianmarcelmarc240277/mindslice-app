import type {
  TriangulationOutput,
  TriangulationPoint,
} from "@/lib/mindslice/concept-triangulation-engine-system";
import type { VisualCanvas } from "@/lib/mindslice/concept-visual-composer-system";
import type { ColorPaletteStop } from "@/lib/mindslice/concept-visual-renderer-system";
import { runPaletteContractAdapterV1 } from "@/lib/mindslice/concept-palette-contract-adapter-system";

export type TriangulationSvgPolygonNode = {
  type: "polygon";
  points: string;
  fill: string;
  opacity: number;
  stroke: "none";
};

export type TriangulationSvgLineNode = {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  stroke_width: number;
  opacity: number;
};

export type TriangulationSvgCircleNode = {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity: number;
};

export type TriangulationSvgGroupNode = {
  type: "g";
  id: string;
  children: TriangulationSvgNode[];
};

export type TriangulationSvgNode =
  | TriangulationSvgPolygonNode
  | TriangulationSvgLineNode
  | TriangulationSvgCircleNode
  | TriangulationSvgGroupNode;

export type TriangulationSvgLayer = TriangulationSvgGroupNode;

type TriangulationRendererPalette =
  | ColorPaletteStop[]
  | {
      background?: unknown;
      primary?: unknown;
      secondary?: unknown;
      accent?: unknown;
    };

function paletteColor(
  palette: TriangulationRendererPalette,
  role: ColorPaletteStop["role"],
  fallback: string,
) {
  if (Array.isArray(palette)) {
    return palette.find((entry) => entry.role === role)?.color ?? fallback;
  }

  const canonical = runPaletteContractAdapterV1(palette);

  return canonical[role] ?? fallback;
}

function serializePoints(points: TriangulationPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function createGroup(id: string): TriangulationSvgGroupNode {
  return {
    type: "g",
    id,
    children: [],
  };
}

export function runTriangulationSvgRendererV1(
  triangulationOutput: TriangulationOutput,
  _canvas: VisualCanvas,
  colorPalette: TriangulationRendererPalette,
): TriangulationSvgLayer {
  void _canvas;

  const layer = createGroup("mind_slice_triangulation");
  const edgeColor = paletteColor(colorPalette, "ink", "#181411");
  const nodeColor = paletteColor(colorPalette, "accent", "#D85A7F");

  triangulationOutput.triangles.forEach((triangle) => {
    layer.children.push({
      type: "polygon",
      points: serializePoints(triangle.points),
      fill: triangle.fill,
      opacity: triangle.opacity * 0.34,
      stroke: "none",
    });
  });

  triangulationOutput.edges.forEach((edge) => {
    layer.children.push({
      type: "line",
      x1: edge.a.x,
      y1: edge.a.y,
      x2: edge.b.x,
      y2: edge.b.y,
      stroke: edgeColor,
      stroke_width: 0.8,
      opacity: 0.18,
    });
  });

  triangulationOutput.points.forEach((point) => {
    layer.children.push({
      type: "circle",
      cx: point.x,
      cy: point.y,
      r: 1.7,
      fill: nodeColor,
      opacity: 0.28,
    });
  });

  return layer;
}

export const RUN = runTriangulationSvgRendererV1;
