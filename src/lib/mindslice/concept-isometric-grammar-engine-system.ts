import type {
  IsometricGrid,
  IsometricGridCell,
  IsometricPatternCanvas,
  IsometricPatternPalette,
  IsometricPatternSettings,
  IsometricTile,
} from "@/lib/mindslice/concept-isometric-pattern-engine-system";

export type IsometricGrammarProfile = {
  name?: "isometric_control_grid" | "isometric_soft_variation" | "isometric_strict" | string;
};

export type IsometricGrammarSettings = IsometricPatternSettings & {
  empty_ratio?: number;
  shadow_ratio?: number;
  accent_ratio?: number;
};

export type IsometricGrammarTilePlan = {
  cell: IsometricGridCell;
  module_type: "full_tile" | "shadow_tile" | "accent_tile" | "empty_cell";
  visible: boolean;
  colors: IsometricTile["colors"];
};

export type IsometricGrammarPlan = {
  canvas: IsometricPatternCanvas;
  palette: IsometricPatternPalette;
  profile: string;
  grid: IsometricGrid;
  tiles: IsometricGrammarTilePlan[];
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

function resolveCanvas(canvas: Partial<IsometricPatternCanvas> = {}): IsometricPatternCanvas {
  return {
    ...DEFAULT_CANVAS,
    ...canvas,
  };
}

function resolveSettings(settings: IsometricPatternSettings = {}): Required<IsometricPatternSettings> {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
  };
}

function resolvePalette(palette: Partial<IsometricPatternPalette> = {}): IsometricPatternPalette {
  return {
    ...DEFAULT_PALETTE,
    ...palette,
  };
}

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

function deterministicUnit(cell: IsometricGridCell, salt: number) {
  const value = Math.sin((cell.row + 37) * 12.9898 + (cell.col + 19) * 78.233 + salt) * 43758.5453;
  return value - Math.floor(value);
}

function baseColors(palette: IsometricPatternPalette): IsometricTile["colors"] {
  return {
    outer_left: palette.left,
    outer_right: palette.right,
    outer_top: palette.top,
    cube_top: palette.right,
    cube_left: palette.top,
    cube_right: palette.left,
  };
}

function shadowColors(palette: IsometricPatternPalette): IsometricTile["colors"] {
  return {
    outer_left: palette.shadow,
    outer_right: palette.left,
    outer_top: palette.top,
    cube_top: palette.shadow,
    cube_left: palette.top,
    cube_right: palette.left,
  };
}

function accentColors(palette: IsometricPatternPalette): IsometricTile["colors"] {
  return {
    outer_left: palette.left,
    outer_right: palette.top,
    outer_top: palette.right,
    cube_top: palette.right,
    cube_left: palette.left,
    cube_right: palette.top,
  };
}

function moduleForCell(
  cell: IsometricGridCell,
  profile: string,
  settings: IsometricGrammarSettings,
) {
  if (profile === "isometric_strict") {
    return "full_tile" as const;
  }

  const emptyRatio = settings.empty_ratio ?? (profile === "isometric_soft_variation" ? 0.04 : 0);
  const shadowRatio = settings.shadow_ratio ?? (profile === "isometric_soft_variation" ? 0.16 : 0.08);
  const accentRatio = settings.accent_ratio ?? (profile === "isometric_soft_variation" ? 0.14 : 0.06);
  const rhythm = deterministicUnit(cell, 3);

  if (rhythm < emptyRatio) {
    return "empty_cell" as const;
  }

  if (rhythm < emptyRatio + shadowRatio) {
    return "shadow_tile" as const;
  }

  if (rhythm < emptyRatio + shadowRatio + accentRatio) {
    return "accent_tile" as const;
  }

  return "full_tile" as const;
}

function colorsForModule(
  moduleType: IsometricGrammarTilePlan["module_type"],
  palette: IsometricPatternPalette,
) {
  if (moduleType === "shadow_tile") {
    return shadowColors(palette);
  }

  if (moduleType === "accent_tile") {
    return accentColors(palette);
  }

  return baseColors(palette);
}

export function runIsometricGrammarEngineV1(
  canvas: Partial<IsometricPatternCanvas> = {},
  grammarProfile: IsometricGrammarProfile = {},
  palette: Partial<IsometricPatternPalette> = {},
  settings: IsometricGrammarSettings = {},
): IsometricGrammarPlan {
  const resolvedCanvas = resolveCanvas(canvas);
  const resolvedSettings = resolveSettings(settings);
  const resolvedPalette = resolvePalette(palette);
  const profile = grammarProfile.name ?? "isometric_control_grid";
  const grid = buildIsometricGrid(resolvedCanvas, resolvedSettings);

  return {
    canvas: resolvedCanvas,
    palette: resolvedPalette,
    profile,
    grid,
    tiles: grid.cells.map((cell) => {
      const moduleType = moduleForCell(cell, profile, settings);

      return {
        cell,
        module_type: moduleType,
        visible: moduleType !== "empty_cell",
        colors: colorsForModule(moduleType, resolvedPalette),
      };
    }),
  };
}

export const RUN = runIsometricGrammarEngineV1;
