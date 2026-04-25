import type { VisualGridPoint } from "@/lib/mindslice/concept-visual-composer-system";
import {
  runModularGrammarEngineV1,
  type ModularGrammarProfile,
} from "@/lib/mindslice/concept-modular-grammar-engine-system";

export type RetroGridPatternCanvas = {
  width: number;
  height: number;
};

export type RetroGridPatternSettings = {
  rows?: number;
  cols?: number;
  cell_size?: number;
  seed?: string;
  grammar_profile?: ModularGrammarProfile;
};

export type RetroGridPatternPalette = {
  dark: string;
  coral: string;
  orange: string;
  mint: string;
  white: string;
};

export type RetroGridCell = {
  row: number;
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type RetroGridRectGeometry = {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
};

export type RetroGridPolygonGeometry = {
  type: "polygon";
  points: VisualGridPoint[];
  fill: string;
};

export type RetroGridArcGeometry = {
  type: "path";
  d: string;
  fill: string;
};

export type RetroGridGeometry =
  | RetroGridRectGeometry
  | RetroGridPolygonGeometry
  | RetroGridArcGeometry;

export type RetroGridCellModule = {
  id: string;
  cell: RetroGridCell;
  type:
    | "triangle_split"
    | "quarter_circle"
    | "half_circle"
    | "diagonal_block"
    | "diamond_nested"
    | "stripe_block"
    | "empty_cell";
  rotation: 0 | 90 | 180 | 270;
  geometry: RetroGridGeometry[];
};

export type RetroGridPatternOutput = {
  canvas: RetroGridPatternCanvas;
  palette: RetroGridPatternPalette;
  grid: RetroGridCell[];
  cells: RetroGridCellModule[];
};

const DEFAULT_CANVAS: RetroGridPatternCanvas = {
  width: 1080,
  height: 1080,
};

const DEFAULT_PALETTE: RetroGridPatternPalette = {
  dark: "#252B42",
  coral: "#FF9A82",
  orange: "#F6A043",
  mint: "#9DD8D2",
  white: "#FFFFFF",
};

let uniqueNumber = 0;

function generateId(prefix: string) {
  uniqueNumber += 1;
  return `${prefix}_${uniqueNumber}`;
}

function polygon(points: VisualGridPoint[], fill: string): RetroGridPolygonGeometry {
  return {
    type: "polygon",
    points,
    fill,
  };
}

function rect(x: number, y: number, w: number, h: number, fill: string): RetroGridRectGeometry {
  return {
    type: "rect",
    x,
    y,
    w,
    h,
    fill,
  };
}

function diamond(cell: RetroGridCell, scale: number, fill: string): RetroGridPolygonGeometry {
  const cx = cell.x + cell.w / 2;
  const cy = cell.y + cell.h / 2;
  const s = (cell.w * scale) / 2;

  return polygon(
    [
      { x: cx, y: cy - s },
      { x: cx + s, y: cy },
      { x: cx, y: cy + s },
      { x: cx - s, y: cy },
    ],
    fill,
  );
}

function buildStripes(cell: RetroGridCell, c1: string, c2: string): RetroGridRectGeometry[] {
  const stripes: RetroGridRectGeometry[] = [];
  const stripeCount = 5;

  for (let index = 0; index <= stripeCount; index += 1) {
    stripes.push(
      rect(
        cell.x + index * (cell.w / stripeCount),
        cell.y,
        cell.w / stripeCount,
        cell.h,
        index % 2 === 0 ? c1 : c2,
      ),
    );
  }

  return stripes;
}

function arcQuarter(cell: RetroGridCell, quadrant: 0 | 1 | 2 | 3, fill: string): RetroGridArcGeometry {
  const r = cell.w;
  const corners = [
    { cx: cell.x, cy: cell.y, start: { x: cell.x + r, y: cell.y }, end: { x: cell.x, y: cell.y + r } },
    {
      cx: cell.x + cell.w,
      cy: cell.y,
      start: { x: cell.x + cell.w, y: cell.y + r },
      end: { x: cell.x + cell.w - r, y: cell.y },
    },
    {
      cx: cell.x + cell.w,
      cy: cell.y + cell.h,
      start: { x: cell.x + cell.w - r, y: cell.y + cell.h },
      end: { x: cell.x + cell.w, y: cell.y + cell.h - r },
    },
    {
      cx: cell.x,
      cy: cell.y + cell.h,
      start: { x: cell.x, y: cell.y + cell.h - r },
      end: { x: cell.x + r, y: cell.y + cell.h },
    },
  ];
  const corner = corners[quadrant];

  return {
    type: "path",
    d: `M${corner.cx},${corner.cy} L${corner.start.x},${corner.start.y} A${r},${r} 0 0 1 ${corner.end.x},${corner.end.y} Z`,
    fill,
  };
}

function arcHalf(
  cell: RetroGridCell,
  orientation: "horizontal" | "vertical",
  fill: string,
): RetroGridArcGeometry {
  const cx = cell.x + cell.w / 2;
  const cy = cell.y + cell.h / 2;
  const r = cell.w / 2;
  const d =
    orientation === "horizontal"
      ? `M${cell.x},${cy} A${r},${r} 0 0 1 ${cell.x + cell.w},${cy} L${cell.x},${cy} Z`
      : `M${cx},${cell.y} A${r},${r} 0 0 1 ${cx},${cell.y + cell.h} L${cx},${cell.y} Z`;

  return {
    type: "path",
    d,
    fill,
  };
}

export function buildRetroGrid(
  canvas: RetroGridPatternCanvas,
  settings: Required<RetroGridPatternSettings>,
): RetroGridCell[] {
  const cells: RetroGridCell[] = [];
  const cellW = canvas.width / settings.cols;
  const cellH = canvas.height / settings.rows;

  for (let row = 0; row < settings.rows; row += 1) {
    for (let col = 0; col < settings.cols; col += 1) {
      cells.push({
        row,
        col,
        x: col * cellW,
        y: row * cellH,
        w: cellW,
        h: cellH,
      });
    }
  }

  return cells;
}

function buildGeometry(
  type: RetroGridCellModule["type"],
  cell: RetroGridCell,
  colors: string[],
): RetroGridGeometry[] {
  if (type === "empty_cell") {
    return [];
  }

  if (type === "triangle_split") {
    return [
      polygon(
        [
          { x: cell.x, y: cell.y },
          { x: cell.x + cell.w, y: cell.y },
          { x: cell.x, y: cell.y + cell.h },
        ],
        colors[0],
      ),
      polygon(
        [
          { x: cell.x + cell.w, y: cell.y },
          { x: cell.x + cell.w, y: cell.y + cell.h },
          { x: cell.x, y: cell.y + cell.h },
        ],
        colors[1],
      ),
    ];
  }

  if (type === "quarter_circle") {
    return [arcQuarter(cell, 0, colors[0])];
  }

  if (type === "half_circle") {
    return [arcHalf(cell, "horizontal", colors[0])];
  }

  if (type === "diagonal_block") {
    return [
      polygon(
        [
          { x: cell.x, y: cell.y },
          { x: cell.x + cell.w, y: cell.y },
          { x: cell.x, y: cell.y + cell.h },
        ],
        colors[0],
      ),
      rect(cell.x + cell.w * 0.4, cell.y + cell.h * 0.4, cell.w * 0.6, cell.h * 0.6, colors[1]),
    ];
  }

  if (type === "diamond_nested") {
    return [
      diamond(cell, 1, colors[0]),
      diamond(cell, 0.6, colors[1]),
      diamond(cell, 0.3, colors[2]),
    ];
  }

  return buildStripes(cell, colors[0], colors[1]);
}

function generateCellModule(
  grammarItem: ReturnType<typeof runModularGrammarEngineV1>[number],
): RetroGridCellModule {
  return {
    id: generateId("cell"),
    cell: grammarItem.cell,
    type: grammarItem.module_type,
    rotation: grammarItem.rotation,
    geometry: buildGeometry(
      grammarItem.module_type,
      grammarItem.cell,
      grammarItem.colors,
    ),
  };
}

export function runRetroGridPatternEngineV1(
  canvas: Partial<RetroGridPatternCanvas> = {},
  settings: RetroGridPatternSettings = {},
  palette: Partial<RetroGridPatternPalette> = {},
): RetroGridPatternOutput {
  uniqueNumber = 0;

  const resolvedCanvas = {
    ...DEFAULT_CANVAS,
    ...canvas,
  };
  const resolvedSettings = {
    rows: 4,
    cols: 4,
    cell_size: (canvas.width ?? DEFAULT_CANVAS.width) / (settings.cols ?? 4),
    seed: "mindslice-retro-grid",
    grammar_profile: { name: "retro_geometric_control" },
    ...settings,
  };
  const resolvedPalette = {
    ...DEFAULT_PALETTE,
    ...palette,
  };
  const grid = buildRetroGrid(resolvedCanvas, resolvedSettings);
  const grammarPlan = runModularGrammarEngineV1(
    grid,
    resolvedSettings.grammar_profile ?? { name: "retro_geometric_control" },
    resolvedPalette,
    {
      allow_random: false,
      max_repetition: 3,
      min_contrast_distance: 2,
    },
  );

  return {
    canvas: resolvedCanvas,
    palette: resolvedPalette,
    grid,
    cells: grammarPlan.map((item) => generateCellModule(item)),
  };
}

export function runRetroGridGrammarForPatternPipelineV1(
  canvas: Partial<RetroGridPatternCanvas> = {},
  grammarProfile: ModularGrammarProfile = { name: "retro_geometric_control" },
  palette: Partial<RetroGridPatternPalette> = {},
  settings: RetroGridPatternSettings = {},
) {
  const resolvedCanvas = {
    ...DEFAULT_CANVAS,
    ...canvas,
  };
  const resolvedSettings = {
    rows: 4,
    cols: 4,
    cell_size: (canvas.width ?? DEFAULT_CANVAS.width) / (settings.cols ?? 4),
    seed: "mindslice-retro-grid",
    grammar_profile: grammarProfile,
    ...settings,
  };
  const resolvedPalette = {
    ...DEFAULT_PALETTE,
    ...palette,
  };
  const grid = buildRetroGrid(resolvedCanvas, resolvedSettings);

  return runModularGrammarEngineV1(
    grid,
    grammarProfile,
    resolvedPalette,
    {
      allow_random: false,
      max_repetition: 3,
      min_contrast_distance: 2,
    },
  );
}

export function buildRetroGridPatternFromGrammarV1(
  canvas: Partial<RetroGridPatternCanvas> = {},
  settings: RetroGridPatternSettings = {},
  palette: Partial<RetroGridPatternPalette> = {},
  grammarPlan?: ReturnType<typeof runModularGrammarEngineV1> | null,
): RetroGridPatternOutput {
  uniqueNumber = 0;

  const resolvedCanvas = {
    ...DEFAULT_CANVAS,
    ...canvas,
  };
  const resolvedSettings = {
    rows: 4,
    cols: 4,
    cell_size: (canvas.width ?? DEFAULT_CANVAS.width) / (settings.cols ?? 4),
    seed: "mindslice-retro-grid",
    grammar_profile: { name: "retro_geometric_control" },
    ...settings,
  };
  const resolvedPalette = {
    ...DEFAULT_PALETTE,
    ...palette,
  };
  const grid = buildRetroGrid(resolvedCanvas, resolvedSettings);
  const plan =
    grammarPlan && grammarPlan.length > 0
      ? grammarPlan
      : runModularGrammarEngineV1(
          grid,
          resolvedSettings.grammar_profile ?? { name: "retro_geometric_control" },
          resolvedPalette,
          {
            allow_random: false,
            max_repetition: 3,
            min_contrast_distance: 2,
          },
        );

  return {
    canvas: resolvedCanvas,
    palette: resolvedPalette,
    grid,
    cells: plan.map((item) => generateCellModule(item)),
  };
}

export const RUN = runRetroGridPatternEngineV1;
export const BUILD_FROM_GRAMMAR = buildRetroGridPatternFromGrammarV1;
