import type { VisualGridPoint } from "@/lib/mindslice/concept-visual-composer-system";
import type {
  IsometricGrammarPlan,
  IsometricGrammarProfile,
} from "@/lib/mindslice/concept-isometric-grammar-engine-system";
import { runIsometricGrammarEngineV1 } from "@/lib/mindslice/concept-isometric-grammar-engine-system";

export type IsometricPatternCanvas = {
  width: number;
  height: number;
};

export type IsometricPatternSettings = {
  tile_size?: number;
  cube_size?: number;
  row_offset?: boolean;
  margin?: number;
  grammar_profile?: IsometricGrammarProfile;
};

export type IsometricPatternPalette = {
  background: string;
  top: string;
  left: string;
  right: string;
  shadow: string;
};

export type IsometricGridCell = {
  row: number;
  col: number;
  cx: number;
  cy: number;
};

export type IsometricGrid = {
  cell_w: number;
  cell_h: number;
  cells: IsometricGridCell[];
};

export type IsometricOuterTile = {
  top_band: VisualGridPoint[];
  left_band: VisualGridPoint[];
  right_band: VisualGridPoint[];
};

export type IsometricInnerCube = {
  top_face: VisualGridPoint[];
  left_face: VisualGridPoint[];
  right_face: VisualGridPoint[];
};

export type IsometricTile = {
  cell: IsometricGridCell;
  outer: IsometricOuterTile;
  cube: IsometricInnerCube;
  colors: {
    outer_left: string;
    outer_right: string;
    outer_top: string;
    cube_top: string;
    cube_left: string;
    cube_right: string;
  };
};

export type IsometricPatternOutput = {
  canvas: IsometricPatternCanvas;
  grid: IsometricGrid;
  tiles: IsometricTile[];
  palette: IsometricPatternPalette;
};

const DEFAULT_CANVAS: IsometricPatternCanvas = {
  width: 1080,
  height: 1080,
};

const DEFAULT_SETTINGS: Required<IsometricPatternSettings> = {
  tile_size: 120,
  cube_size: 70,
  row_offset: true,
  margin: 0,
  grammar_profile: {},
};

const DEFAULT_PALETTE: IsometricPatternPalette = {
  background: "#F2D6BD",
  top: "#3F3450",
  left: "#4E7F96",
  right: "#F2D6BD",
  shadow: "#2D253A",
};

function buildIsometricGrid(
  canvas: IsometricPatternCanvas,
  settings: Required<IsometricPatternSettings>,
): IsometricGrid {
  const size = settings.tile_size;
  const cellW = size * 2;
  const cellH = size;
  const cols = Math.ceil(canvas.width / cellW) + 3;
  const rows = Math.ceil(canvas.height / cellH) + 3;
  const cells: IsometricGridCell[] = [];

  for (let row = -1; row <= rows; row += 1) {
    const y = row * cellH + settings.margin;
    const offsetX = settings.row_offset && Math.abs(row % 2) === 1 ? -cellW / 2 : 0;

    for (let col = -1; col <= cols; col += 1) {
      cells.push({
        row,
        col,
        cx: col * cellW + offsetX + settings.margin,
        cy: y,
      });
    }
  }

  return {
    cell_w: cellW,
    cell_h: cellH,
    cells,
  };
}

function buildOuterHexTile(cx: number, cy: number, s: number): IsometricOuterTile {
  const top = { x: cx, y: cy - s / 2 };
  const rightTop = { x: cx + s, y: cy };
  const rightBottom = { x: cx + s, y: cy + s };
  const bottom = { x: cx, y: cy + s * 1.5 };
  const leftBottom = { x: cx - s, y: cy + s };
  const leftTop = { x: cx - s, y: cy };
  const mid = { x: cx, y: cy + s / 2 };

  return {
    top_band: [leftTop, top, rightTop, mid],
    left_band: [leftTop, mid, bottom, leftBottom],
    right_band: [rightTop, mid, bottom, rightBottom],
  };
}

function buildInnerCube(cx: number, cy: number, cubeSize: number): IsometricInnerCube {
  const c = cubeSize;
  const center = { x: cx, y: cy + c * 0.15 };
  const top = { x: center.x, y: center.y - c / 2 };
  const left = { x: center.x - c / 2, y: center.y - c / 4 };
  const right = { x: center.x + c / 2, y: center.y - c / 4 };
  const mid = { x: center.x, y: center.y };
  const bottom = { x: center.x, y: center.y + c / 2 };

  return {
    top_face: [top, right, mid, left],
    left_face: [left, mid, bottom, { x: center.x - c / 2, y: center.y + c / 4 }],
    right_face: [right, mid, bottom, { x: center.x + c / 2, y: center.y + c / 4 }],
  };
}

function buildTile(
  cell: IsometricGridCell,
  settings: Required<IsometricPatternSettings>,
  palette: IsometricPatternPalette,
): IsometricTile {
  return {
    cell,
    outer: buildOuterHexTile(cell.cx, cell.cy, settings.tile_size),
    cube: buildInnerCube(cell.cx, cell.cy, settings.cube_size),
    colors: {
      outer_left: palette.left,
      outer_right: palette.right,
      outer_top: palette.top,
      cube_top: palette.right,
      cube_left: palette.top,
      cube_right: palette.left,
    },
  };
}

export function runIsometricPatternEngineV1(
  canvas: Partial<IsometricPatternCanvas> = {},
  settings: IsometricPatternSettings = {},
  palette: Partial<IsometricPatternPalette> = {},
): IsometricPatternOutput {
  const resolvedCanvas = {
    ...DEFAULT_CANVAS,
    ...canvas,
  };
  const resolvedSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
  };
  const resolvedPalette = {
    ...DEFAULT_PALETTE,
    ...palette,
  };
  const grammarPlan = runIsometricGrammarEngineV1(
    resolvedCanvas,
    resolvedSettings.grammar_profile,
    resolvedPalette,
    resolvedSettings,
  );

  return buildIsometricPatternFromGrammarV1(
    resolvedCanvas,
    resolvedSettings,
    resolvedPalette,
    grammarPlan,
  );
}

export function buildIsometricPatternFromGrammarV1(
  canvas: Partial<IsometricPatternCanvas> = {},
  settings: IsometricPatternSettings = {},
  palette: Partial<IsometricPatternPalette> = {},
  grammarPlan?: IsometricGrammarPlan | null,
): IsometricPatternOutput {
  const resolvedCanvas = {
    ...DEFAULT_CANVAS,
    ...canvas,
    ...(grammarPlan?.canvas ?? {}),
  };
  const resolvedSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
  };
  const resolvedPalette = {
    ...DEFAULT_PALETTE,
    ...palette,
    ...(grammarPlan?.palette ?? {}),
  };
  const grid = grammarPlan?.grid ?? buildIsometricGrid(resolvedCanvas, resolvedSettings);
  const tilePlans =
    grammarPlan?.tiles ??
    grid.cells.map((cell) => ({
      cell,
      visible: true,
      colors: buildTile(cell, resolvedSettings, resolvedPalette).colors,
    }));

  return {
    canvas: resolvedCanvas,
    grid,
    tiles: tilePlans
      .filter((tilePlan) => tilePlan.visible)
      .map((tilePlan) => ({
        ...buildTile(tilePlan.cell, resolvedSettings, resolvedPalette),
        colors: tilePlan.colors,
      })),
    palette: resolvedPalette,
  };
}

export const RUN = runIsometricPatternEngineV1;
export const BUILD_FROM_GRAMMAR = buildIsometricPatternFromGrammarV1;
