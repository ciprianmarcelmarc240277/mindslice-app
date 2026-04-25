import {
  runZigZagGrammarEngineV1,
  type ZigZagGrammarProfile,
  type ZigZagGrammarModuleType,
} from "@/lib/mindslice/concept-zigzag-grammar-engine-system";
import type { VisualGridPoint } from "@/lib/mindslice/concept-visual-composer-system";

export type ZigZagPatternCanvas = {
  width: number;
  height: number;
};

export type ZigZagPatternPalette = {
  background: string;
  primary: string;
  cyan: string;
  teal: string;
  orange: string;
  yellow: string;
  gray: string;
  dark_gray: string;
};

export type ZigZagPatternSettings = {
  column_count?: number;
  row_count?: number;
  cell_width?: number;
  cell_height?: number;
  chevron_width?: number;
  chevron_height?: number;
  stroke_width?: number;
  gap?: number;
  accent_probability?: number;
  offset_alternate_rows?: boolean;
  seed?: string;
  grammar_profile?: ZigZagGrammarProfile;
};

export type ZigZagGridCell = {
  row: number;
  col: number;
  x: number;
  y: number;
  center: VisualGridPoint;
};

export type ZigZagGrid = {
  cells: ZigZagGridCell[];
  cols: number;
  rows: number;
  cell_width: number;
  cell_height: number;
};

export type ZigZagSegment = {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  stroke_width: number;
  stroke_linecap: "butt";
  segment_role: "left_arm" | "right_arm";
  hidden_by_accent?: boolean;
  is_accent?: boolean;
};

export type ZigZagChevronStack = {
  id: string;
  cell: ZigZagGridCell;
  type: "chevron_stack";
  rotation: 0 | 180;
  module_type: ZigZagGrammarModuleType;
  segments: ZigZagSegment[];
};

export type ZigZagPatternOutput = {
  canvas: ZigZagPatternCanvas;
  palette: ZigZagPatternPalette;
  grid: ZigZagGrid;
  chevrons: ZigZagChevronStack[];
};

const DEFAULT_CANVAS: ZigZagPatternCanvas = {
  width: 1080,
  height: 1080,
};

const DEFAULT_PALETTE: ZigZagPatternPalette = {
  background: "#000000",
  primary: "#FFFFFF",
  cyan: "#46C7D8",
  teal: "#55C8B4",
  orange: "#FF5A2E",
  yellow: "#FFB637",
  gray: "#6E7474",
  dark_gray: "#2C2C2C",
};

const DEFAULT_SETTINGS: Required<ZigZagPatternSettings> = {
  column_count: 8,
  row_count: 9,
  cell_width: 150,
  cell_height: 130,
  chevron_width: 120,
  chevron_height: 70,
  stroke_width: 26,
  gap: 34,
  accent_probability: 0.18,
  offset_alternate_rows: true,
  seed: "mindslice-zigzag",
  grammar_profile: { name: "zigzag_control_flow" },
};

let uniqueNumber = 0;

function generateId(prefix: string) {
  uniqueNumber += 1;
  return `${prefix}_${uniqueNumber}`;
}

export function buildZigZagGrid(
  canvas: ZigZagPatternCanvas,
  settings: Required<ZigZagPatternSettings>,
): ZigZagGrid {
  const cols = Math.ceil(canvas.width / settings.cell_width) + 2;
  const rows = Math.ceil(canvas.height / settings.cell_height) + 2;
  const cells: ZigZagGridCell[] = [];

  for (let row = -1; row <= rows; row += 1) {
    const offsetX =
      settings.offset_alternate_rows && Math.abs(row % 2) === 1
        ? settings.cell_width / 2
        : 0;

    for (let col = -1; col <= cols; col += 1) {
      const x = col * settings.cell_width - offsetX;
      const y = row * settings.cell_height;

      cells.push({
        row,
        col,
        x,
        y,
        center: {
          x: x + settings.cell_width / 2,
          y: y + settings.cell_height / 2,
        },
      });
    }
  }

  return {
    cells,
    cols,
    rows,
    cell_width: settings.cell_width,
    cell_height: settings.cell_height,
  };
}

function buildChevronStackFromPlan(
  item: ReturnType<typeof runZigZagGrammarEngineV1>[number],
): ZigZagChevronStack {
  return {
    id: generateId("chevron_stack"),
    cell: item.cell,
    type: "chevron_stack",
    rotation: item.rotation,
    module_type: item.module_type,
    segments: item.segment_plan.segments,
  };
}

export function runZigZagPatternEngineV1(
  canvas: Partial<ZigZagPatternCanvas> = {},
  settings: ZigZagPatternSettings = {},
  palette: Partial<ZigZagPatternPalette> = {},
): ZigZagPatternOutput {
  uniqueNumber = 0;

  const resolvedCanvas = {
    ...DEFAULT_CANVAS,
    ...canvas,
  };
  const resolvedSettings = {
    ...DEFAULT_SETTINGS,
    grammar_profile: { name: "zigzag_control_flow" },
    ...settings,
  };
  const resolvedPalette = {
    ...DEFAULT_PALETTE,
    ...palette,
  };
  const grid = buildZigZagGrid(resolvedCanvas, resolvedSettings);
  const grammarPlan = runZigZagGrammarEngineV1(
    grid,
    resolvedSettings.grammar_profile,
    resolvedPalette,
    resolvedSettings,
  );
  const chevrons = grammarPlan.map((item) =>
    buildChevronStackFromPlan(item),
  );

  return {
    canvas: resolvedCanvas,
    palette: resolvedPalette,
    grid,
    chevrons,
  };
}

export function runZigZagGrammarForPatternPipelineV1(
  canvas: Partial<ZigZagPatternCanvas> = {},
  grammarProfile: ZigZagGrammarProfile = { name: "zigzag_control_flow" },
  palette: Partial<ZigZagPatternPalette> = {},
  settings: ZigZagPatternSettings = {},
) {
  const resolvedCanvas = {
    ...DEFAULT_CANVAS,
    ...canvas,
  };
  const resolvedSettings = {
    ...DEFAULT_SETTINGS,
    grammar_profile: grammarProfile,
    ...settings,
  };
  const resolvedPalette = {
    ...DEFAULT_PALETTE,
    ...palette,
  };
  const grid = buildZigZagGrid(resolvedCanvas, resolvedSettings);

  return runZigZagGrammarEngineV1(
    grid,
    grammarProfile,
    resolvedPalette,
    resolvedSettings,
  );
}

export function buildZigZagPatternFromGrammarV1(
  canvas: Partial<ZigZagPatternCanvas> = {},
  settings: ZigZagPatternSettings = {},
  palette: Partial<ZigZagPatternPalette> = {},
  grammarPlan?: ReturnType<typeof runZigZagGrammarEngineV1> | null,
): ZigZagPatternOutput {
  uniqueNumber = 0;

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
  const grid = buildZigZagGrid(resolvedCanvas, resolvedSettings);
  const plan =
    grammarPlan && grammarPlan.length > 0
      ? grammarPlan
      : runZigZagGrammarEngineV1(
          grid,
          resolvedSettings.grammar_profile,
          resolvedPalette,
          resolvedSettings,
        );

  return {
    canvas: resolvedCanvas,
    palette: resolvedPalette,
    grid,
    chevrons: plan.map((item) => buildChevronStackFromPlan(item)),
  };
}

export const RUN = runZigZagPatternEngineV1;
export const BUILD_FROM_GRAMMAR = buildZigZagPatternFromGrammarV1;
