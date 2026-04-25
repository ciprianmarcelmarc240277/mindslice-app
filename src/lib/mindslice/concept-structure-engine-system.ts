import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type {
  StructureVisualAxis,
  StructureVisualBalanceMap,
  StructureVisualCenter,
  StructureVisualOutput,
  StructureVisualZone,
  VisualRendererCanvasSettings,
} from "@/lib/mindslice/concept-visual-renderer-system";

export type StructureEngineCanvas = {
  width: number;
  height: number;
  margin: number;
};

export type StructureEngineGrid = {
  columns: number;
  rows: number;
  type: "thirds" | "golden" | "custom";
};

export type StructureEngineAxes = {
  vertical: number;
  horizontal: number;
  diagonal_a: [number, number, number, number];
  diagonal_b: [number, number, number, number];
};

export type StructureEngineCenters = {
  primary: { x: number; y: number };
  secondary: { x: number; y: number };
  counterpoint: { x: number; y: number };
};

export type StructureEngineZone = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type StructureEngineBalanceMap = {
  center_weight: number;
  left_weight: number;
  right_weight: number;
  symmetry: "symmetric" | "asymmetric_balanced" | "decentered";
};

export type StructureEngineOutput = {
  canvas: StructureEngineCanvas;
  grid: StructureEngineGrid;
  axes: StructureEngineAxes;
  centers: StructureEngineCenters;
  zones: StructureEngineZone[];
  balance_map: StructureEngineBalanceMap;
  structure_output: StructureVisualOutput;
};

function normalizeText(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasAnyToken(haystack: string, tokens: string[]) {
  return tokens.some((token) => haystack.includes(token));
}

function resolveGridType(parsedSlice: ParsedSliceObject): StructureEngineGrid["type"] {
  const normalizedText = normalizeText(parsedSlice.content.text);
  const normalizedTags = parsedSlice.metadata.tags.map((tag) => normalizeText(tag));
  const tagText = normalizedTags.join(" ");

  if (
    hasAnyToken(normalizedText, ["golden", "phi", "proportion", "proportie"]) ||
    hasAnyToken(tagText, ["golden", "proportion", "proportie"])
  ) {
    return "golden";
  }

  if (
    hasAnyToken(normalizedText, ["matrix", "labyrinth", "custom", "schema"]) ||
    hasAnyToken(tagText, ["matrix", "labyrinth", "custom"])
  ) {
    return "custom";
  }

  return "thirds";
}

function resolveSymmetry(parsedSlice: ParsedSliceObject): StructureEngineBalanceMap["symmetry"] {
  const normalizedText = normalizeText(parsedSlice.content.text);

  if (hasAnyToken(normalizedText, ["symmetry", "simetrie", "balance", "echilibru"])) {
    return "symmetric";
  }

  if (hasAnyToken(normalizedText, ["conflict", "tension", "offset", "fracture", "rupture"])) {
    return "decentered";
  }

  return "asymmetric_balanced";
}

function buildVisualAxes(
  axes: StructureEngineAxes,
  canvas: StructureEngineCanvas,
): StructureVisualAxis[] {
  return [
    {
      id: "vertical_axis",
      start: { x: axes.vertical, y: 0 },
      end: { x: axes.vertical, y: canvas.height },
      role: "primary",
    },
    {
      id: "horizontal_axis",
      start: { x: 0, y: axes.horizontal },
      end: { x: canvas.width, y: axes.horizontal },
      role: "secondary",
    },
    {
      id: "diagonal_axis_a",
      start: { x: axes.diagonal_a[0], y: axes.diagonal_a[1] },
      end: { x: axes.diagonal_a[2], y: axes.diagonal_a[3] },
      role: "diagonal",
    },
    {
      id: "diagonal_axis_b",
      start: { x: axes.diagonal_b[0], y: axes.diagonal_b[1] },
      end: { x: axes.diagonal_b[2], y: axes.diagonal_b[3] },
      role: "diagonal",
    },
  ];
}

function buildVisualCenters(centers: StructureEngineCenters): StructureVisualCenter[] {
  return [
    {
      id: "primary_center",
      point: centers.primary,
      weight: 1,
    },
    {
      id: "secondary_center",
      point: centers.secondary,
      weight: 0.68,
    },
    {
      id: "counterpoint_center",
      point: centers.counterpoint,
      weight: 0.54,
    },
  ];
}

function buildVisualZones(zones: StructureEngineZone[]): StructureVisualZone[] {
  return zones.map((zone, index) => ({
    id: zone.id,
    center: {
      x: zone.x + zone.w / 2,
      y: zone.y + zone.h / 2,
    },
    width: zone.w,
    height: zone.h,
    weight: index === 0 ? "high" : index === 1 ? "medium" : "low",
    role:
      zone.id === "focus" ? "dominant" : zone.id === "silence" ? "void" : "support",
  }));
}

function buildVisualBalanceMap(
  canvas: StructureEngineCanvas,
  balanceMap: StructureEngineBalanceMap,
): StructureVisualBalanceMap {
  const centerOfMassX =
    canvas.width * 0.5 +
    (balanceMap.right_weight - balanceMap.left_weight) * canvas.width * 0.18;
  const centerOfMassY =
    canvas.height * (balanceMap.symmetry === "decentered" ? 0.46 : 0.5);

  return {
    center_of_mass: {
      x: centerOfMassX,
      y: centerOfMassY,
    },
    correction_target: {
      x: canvas.width / 2,
      y: canvas.height / 2,
    },
    drift: Math.abs(centerOfMassX - canvas.width / 2) / Math.max(canvas.width, 1),
  };
}

export function runStructureEngineV1(
  parsedSlice: ParsedSliceObject,
  canvasSettings: VisualRendererCanvasSettings = {},
  structureBias?: string,
): StructureEngineOutput {
  const canvas: StructureEngineCanvas = {
    width: canvasSettings.width ?? 1080,
    height: canvasSettings.height ?? 1080,
    margin: canvasSettings.margin ?? 120,
  };

  const gridType =
    structureBias === "strict_grid" || structureBias === "strict_soft_grid"
      ? "thirds"
      : structureBias === "broken_grid"
        ? "custom"
        : resolveGridType(parsedSlice);
  const symmetry =
    structureBias === "displaced_center" || structureBias === "structured_displacement"
      ? "decentered"
      : resolveSymmetry(parsedSlice);

  const grid: StructureEngineGrid = {
    columns: 3,
    rows: 3,
    type: gridType,
  };

  const axes: StructureEngineAxes = {
    vertical: canvas.width / 2,
    horizontal: canvas.height / 2,
    diagonal_a: [0, 0, canvas.width, canvas.height],
    diagonal_b: [canvas.width, 0, 0, canvas.height],
  };

  const centers: StructureEngineCenters = {
    primary: { x: canvas.width / 2, y: canvas.height / 2 },
    secondary: { x: canvas.width * 0.66, y: canvas.height * 0.45 },
    counterpoint: { x: canvas.width * 0.33, y: canvas.height * 0.6 },
  };

  const zones: StructureEngineZone[] =
    structureBias === "distributed_zones" || structureBias === "structured_distributed_zones"
      ? [
          { id: "focus", x: 300, y: 300, w: 300, h: 300 },
          { id: "tension", x: 650, y: 250, w: 220, h: 220 },
          { id: "silence", x: 140, y: 620, w: 240, h: 220 },
        ]
      : structureBias === "single_focus_zone"
        ? [
            { id: "focus", x: 300, y: 300, w: 440, h: 440 },
            { id: "tension", x: 720, y: 260, w: 180, h: 180 },
            { id: "silence", x: 140, y: 160, w: 180, h: 180 },
          ]
        : [
            { id: "focus", x: 360, y: 360, w: 360, h: 360 },
            { id: "tension", x: 660, y: 360, w: 240, h: 240 },
            { id: "silence", x: 120, y: 120, w: 240, h: 240 },
          ];

  const balance_map: StructureEngineBalanceMap = {
    center_weight: 0.55,
    left_weight: symmetry === "decentered" ? 0.21 : 0.25,
    right_weight: symmetry === "decentered" ? 0.24 : 0.2,
    symmetry,
  };

  const structure_output: StructureVisualOutput = {
    grid: grid.type,
    axes: buildVisualAxes(axes, canvas),
    centers: buildVisualCenters(centers),
    zones: buildVisualZones(zones),
    balance_map: buildVisualBalanceMap(canvas, balance_map),
  };

  return {
    canvas,
    grid,
    axes,
    centers,
    zones,
    balance_map,
    structure_output,
  };
}
