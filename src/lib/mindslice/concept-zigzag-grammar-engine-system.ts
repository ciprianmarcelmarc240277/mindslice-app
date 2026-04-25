import type {
  ZigZagGrid,
  ZigZagGridCell,
  ZigZagPatternPalette,
  ZigZagPatternSettings,
  ZigZagSegment,
} from "@/lib/mindslice/concept-zigzag-pattern-engine-system";

export type ZigZagGrammarModuleType =
  | "full_white_stack"
  | "single_chevron"
  | "double_chevron"
  | "broken_chevron"
  | "accent_left_arm"
  | "accent_right_arm"
  | "shadow_chevron"
  | "empty_cell";

export type ZigZagGrammarProfile = {
  name?: "zigzag_control_flow" | "zigzag_deviation" | "zigzag_strict" | string;
};

export type ZigZagGrammarSettings = ZigZagPatternSettings & {
  allow_random?: boolean;
  max_empty_ratio?: number;
  max_accent_ratio?: number;
  max_shadow_ratio?: number;
  max_same_module_in_row?: number;
  min_white_stack_ratio?: number;
};

export type ZigZagGrammarRules = {
  rhythm: "dense_ordered" | "ordered_with_interruptions" | "strict_repeat";
  base_modules: ZigZagGrammarModuleType[];
  accent_modules: ZigZagGrammarModuleType[];
  disruption_modules: ZigZagGrammarModuleType[];
  quiet_modules: ZigZagGrammarModuleType[];
  preferred_neighbors: Array<[ZigZagGrammarModuleType, ZigZagGrammarModuleType]>;
  forbidden_neighbors: Array<[ZigZagGrammarModuleType, ZigZagGrammarModuleType]>;
  accent_colors: string[];
  base_color: string;
  shadow_colors: string[];
  direction_logic: "up_chevrons";
  rotation_logic: "mostly_static" | "controlled_variation" | "static";
  color_logic: "rare_accents" | "visible_accents" | "none";
  density_logic: "high_density" | "medium_high_density" | "full_density";
  disruption_logic: "controlled" | "visible" | "none";
};

export type ZigZagSegmentPlan = {
  segments: ZigZagSegment[];
};

export type ZigZagGrammarItem = {
  cell: ZigZagGridCell;
  module_type: ZigZagGrammarModuleType;
  segment_plan: ZigZagSegmentPlan;
  rotation: 0 | 180;
};

type ZigZagGrammarMemory = {
  previous_item: ZigZagGrammarItem | null;
  total_count: number;
  module_counts: Partial<Record<ZigZagGrammarModuleType, number>>;
  row_counts: Record<number, Partial<Record<ZigZagGrammarModuleType, number>>>;
  accent_count: number;
  shadow_count: number;
  empty_count: number;
  color_usage: Record<string, number>;
  last_rotation: 0 | 180;
};

function defaultSettings(settings: ZigZagGrammarSettings = {}): Required<ZigZagGrammarSettings> {
  return {
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
    allow_random: false,
    max_empty_ratio: 0.08,
    max_accent_ratio: 0.2,
    max_shadow_ratio: 0.12,
    max_same_module_in_row: 3,
    min_white_stack_ratio: 0.55,
    ...settings,
  };
}

function loadRules(
  grammarProfile: ZigZagGrammarProfile = { name: "zigzag_control_flow" },
  palette: ZigZagPatternPalette,
): ZigZagGrammarRules {
  if (grammarProfile.name === "zigzag_deviation") {
    return {
      rhythm: "ordered_with_interruptions",
      base_modules: ["full_white_stack", "double_chevron"],
      accent_modules: ["accent_left_arm", "accent_right_arm"],
      disruption_modules: ["broken_chevron", "shadow_chevron", "empty_cell"],
      quiet_modules: ["empty_cell"],
      preferred_neighbors: [
        ["full_white_stack", "broken_chevron"],
        ["broken_chevron", "full_white_stack"],
        ["accent_left_arm", "full_white_stack"],
        ["accent_right_arm", "full_white_stack"],
      ],
      forbidden_neighbors: [
        ["broken_chevron", "broken_chevron"],
        ["empty_cell", "empty_cell"],
        ["accent_left_arm", "accent_left_arm"],
        ["accent_right_arm", "accent_right_arm"],
      ],
      accent_colors: [palette.cyan, palette.teal, palette.orange, palette.yellow],
      base_color: palette.primary,
      shadow_colors: [palette.gray, palette.dark_gray],
      direction_logic: "up_chevrons",
      rotation_logic: "controlled_variation",
      color_logic: "visible_accents",
      density_logic: "medium_high_density",
      disruption_logic: "visible",
    };
  }

  if (grammarProfile.name === "zigzag_strict") {
    return {
      rhythm: "strict_repeat",
      base_modules: ["full_white_stack"],
      accent_modules: [],
      disruption_modules: [],
      quiet_modules: [],
      preferred_neighbors: [["full_white_stack", "full_white_stack"]],
      forbidden_neighbors: [],
      accent_colors: [],
      base_color: palette.primary,
      shadow_colors: [],
      direction_logic: "up_chevrons",
      rotation_logic: "static",
      color_logic: "none",
      density_logic: "full_density",
      disruption_logic: "none",
    };
  }

  return {
    rhythm: "dense_ordered",
    base_modules: ["full_white_stack", "double_chevron", "single_chevron"],
    accent_modules: ["accent_left_arm", "accent_right_arm"],
    disruption_modules: ["broken_chevron", "shadow_chevron"],
    quiet_modules: ["empty_cell"],
    preferred_neighbors: [
      ["full_white_stack", "double_chevron"],
      ["double_chevron", "full_white_stack"],
      ["single_chevron", "full_white_stack"],
    ],
    forbidden_neighbors: [
      ["accent_left_arm", "accent_right_arm"],
      ["accent_right_arm", "accent_left_arm"],
      ["broken_chevron", "broken_chevron"],
      ["empty_cell", "empty_cell"],
    ],
    accent_colors: [
      palette.cyan,
      palette.teal,
      palette.orange,
      palette.yellow,
      palette.gray,
      palette.dark_gray,
    ],
    base_color: palette.primary,
    shadow_colors: [palette.gray, palette.dark_gray],
    direction_logic: "up_chevrons",
    rotation_logic: "mostly_static",
    color_logic: "rare_accents",
    density_logic: "high_density",
    disruption_logic: "controlled",
  };
}

function initMemory(): ZigZagGrammarMemory {
  return {
    previous_item: null,
    total_count: 0,
    module_counts: {},
    row_counts: {},
    accent_count: 0,
    shadow_count: 0,
    empty_count: 0,
    color_usage: {},
    last_rotation: 0,
  };
}

function incrementRecord<T extends string | number>(record: Partial<Record<T, number>>, key: T) {
  record[key] = (record[key] ?? 0) + 1;
}

function updateMemory(
  memory: ZigZagGrammarMemory,
  item: ZigZagGrammarItem,
  rules: ZigZagGrammarRules,
) {
  memory.previous_item = item;
  memory.total_count += 1;
  incrementRecord(memory.module_counts, item.module_type);
  memory.row_counts[item.cell.row] ??= {};
  incrementRecord(memory.row_counts[item.cell.row], item.module_type);

  if (rules.accent_modules.includes(item.module_type)) {
    memory.accent_count += 1;
  }

  if (item.module_type === "shadow_chevron") {
    memory.shadow_count += 1;
  }

  if (item.module_type === "empty_cell") {
    memory.empty_count += 1;
  }

  item.segment_plan.segments.forEach((segment) => {
    memory.color_usage[segment.stroke] = (memory.color_usage[segment.stroke] ?? 0) + 1;
  });

  memory.last_rotation = item.rotation;

  return memory;
}

function getAllowedModules(
  cell: ZigZagGridCell,
  rules: ZigZagGrammarRules,
  memory: ZigZagGrammarMemory,
  settings: Required<ZigZagGrammarSettings>,
): ZigZagGrammarModuleType[] {
  let candidates: ZigZagGrammarModuleType[] = [
    ...rules.base_modules,
    ...rules.accent_modules,
    ...rules.disruption_modules,
    ...rules.quiet_modules,
  ];

  if (memory.previous_item) {
    candidates = candidates.filter(
      (candidate) =>
        !rules.forbidden_neighbors.some(
          ([previousType, currentType]) =>
            memory.previous_item?.module_type === previousType && candidate === currentType,
        ),
    );
  }

  candidates = candidates.filter(
    (candidate) => (memory.row_counts[cell.row]?.[candidate] ?? 0) < settings.max_same_module_in_row,
  );

  if (memory.accent_count / Math.max(memory.total_count, 1) >= settings.max_accent_ratio) {
    candidates = candidates.filter((candidate) => !rules.accent_modules.includes(candidate));
  }

  if (memory.shadow_count / Math.max(memory.total_count, 1) >= settings.max_shadow_ratio) {
    candidates = candidates.filter((candidate) => candidate !== "shadow_chevron");
  }

  if (memory.empty_count / Math.max(memory.total_count, 1) >= settings.max_empty_ratio) {
    candidates = candidates.filter((candidate) => candidate !== "empty_cell");
  }

  return candidates.length > 0 ? candidates : ["full_white_stack"];
}

function scoreDensity(candidate: ZigZagGrammarModuleType, rules: ZigZagGrammarRules) {
  if (rules.density_logic === "high_density") {
    if (candidate === "empty_cell") {
      return -4;
    }

    if (rules.base_modules.includes(candidate)) {
      return 3;
    }
  }

  if (rules.density_logic === "medium_high_density") {
    if (candidate === "empty_cell") {
      return -1;
    }

    if (rules.base_modules.includes(candidate)) {
      return 2;
    }
  }

  if (rules.density_logic === "full_density" && candidate === "full_white_stack") {
    return 5;
  }

  return 0;
}

function scoreRhythm(
  candidate: ZigZagGrammarModuleType,
  rules: ZigZagGrammarRules,
  memory: ZigZagGrammarMemory,
) {
  if (!memory.previous_item) {
    return 0;
  }

  if (rules.rhythm === "dense_ordered") {
    return candidate !== memory.previous_item.module_type ? 1 : 0;
  }

  if (rules.rhythm === "ordered_with_interruptions") {
    if (rules.disruption_modules.includes(candidate)) {
      return 1;
    }

    if (rules.base_modules.includes(candidate)) {
      return 2;
    }
  }

  if (rules.rhythm === "strict_repeat" && candidate === "full_white_stack") {
    return 5;
  }

  return 0;
}

function scoreNeighbor(
  candidate: ZigZagGrammarModuleType,
  rules: ZigZagGrammarRules,
  memory: ZigZagGrammarMemory,
) {
  if (!memory.previous_item) {
    return 0;
  }

  return rules.preferred_neighbors.some(
    ([previousType, currentType]) =>
      memory.previous_item?.module_type === previousType && candidate === currentType,
  )
    ? 2
    : 0;
}

function scoreBalance(candidate: ZigZagGrammarModuleType, memory: ZigZagGrammarMemory) {
  return 1 / (1 + (memory.module_counts[candidate] ?? 0));
}

function scoreDisruption(
  candidate: ZigZagGrammarModuleType,
  rules: ZigZagGrammarRules,
) {
  if (!rules.disruption_modules.includes(candidate)) {
    return 0;
  }

  if (rules.disruption_logic === "none") {
    return -10;
  }

  if (rules.disruption_logic === "controlled") {
    return -1;
  }

  return 1;
}

function scoreWhiteStackPressure(
  candidate: ZigZagGrammarModuleType,
  memory: ZigZagGrammarMemory,
  settings: Required<ZigZagGrammarSettings>,
) {
  if (candidate !== "full_white_stack") {
    return 0;
  }

  const ratio = (memory.module_counts.full_white_stack ?? 0) / Math.max(memory.total_count, 1);
  return ratio < settings.min_white_stack_ratio ? 4 : 0;
}

function selectBestModule(
  cell: ZigZagGridCell,
  candidates: ZigZagGrammarModuleType[],
  rules: ZigZagGrammarRules,
  memory: ZigZagGrammarMemory,
  settings: Required<ZigZagGrammarSettings>,
) {
  return candidates
    .map((candidate) => ({
      module: candidate,
      score:
        scoreDensity(candidate, rules) +
        scoreRhythm(candidate, rules, memory) +
        scoreNeighbor(candidate, rules, memory) +
        scoreBalance(candidate, memory) +
        scoreDisruption(candidate, rules) +
        scoreWhiteStackPressure(candidate, memory, settings) -
        cell.row * 0.001 -
        cell.col * 0.0001,
    }))
    .sort((a, b) => b.score - a.score)[0]?.module ?? "full_white_stack";
}

function buildChevronSegments(
  center: { x: number; y: number },
  color: string,
  settings: Required<ZigZagGrammarSettings>,
): ZigZagSegment[] {
  const left = {
    x: center.x - settings.chevron_width / 2,
    y: center.y + settings.chevron_height / 2,
  };
  const peak = {
    x: center.x,
    y: center.y - settings.chevron_height / 2,
  };
  const right = {
    x: center.x + settings.chevron_width / 2,
    y: center.y + settings.chevron_height / 2,
  };

  return [
    {
      type: "line",
      segment_role: "left_arm",
      x1: left.x,
      y1: left.y,
      x2: peak.x,
      y2: peak.y,
      stroke: color,
      stroke_width: settings.stroke_width,
      stroke_linecap: "butt",
    },
    {
      type: "line",
      segment_role: "right_arm",
      x1: peak.x,
      y1: peak.y,
      x2: right.x,
      y2: right.y,
      stroke: color,
      stroke_width: settings.stroke_width,
      stroke_linecap: "butt",
    },
  ];
}

function buildBaseChevronSegments(
  cell: ZigZagGridCell,
  color: string,
  settings: Required<ZigZagGrammarSettings>,
) {
  return [
    ...buildChevronSegments(
      {
        x: cell.center.x,
        y: cell.center.y - settings.gap / 2,
      },
      color,
      settings,
    ),
    ...buildChevronSegments(
      {
        x: cell.center.x,
        y: cell.center.y + settings.gap / 2,
      },
      color,
      settings,
    ),
  ];
}

function leastUsedColor(colors: string[], memory: ZigZagGrammarMemory) {
  return [...colors].sort(
    (a, b) => (memory.color_usage[a] ?? 0) - (memory.color_usage[b] ?? 0),
  )[0] ?? colors[0] ?? "#FFFFFF";
}

function removeOneSegment(
  segments: ZigZagSegment[],
  cell: ZigZagGridCell,
): ZigZagSegment[] {
  const copy = segments.map((segment) => ({ ...segment }));
  const index = Math.abs(cell.row + cell.col) % copy.length;
  copy.splice(index, 1);
  return copy;
}

function recolorTargetSegment(
  segments: ZigZagSegment[],
  targetRole: "left_arm" | "right_arm",
  color: string,
  cell: ZigZagGridCell,
) {
  const copy = segments.map((segment) => ({ ...segment }));
  const candidates = copy.filter((segment) => segment.segment_role === targetRole);
  const target = candidates[Math.abs(cell.row + cell.col) % candidates.length];

  if (target) {
    target.stroke = color;
  }

  return copy;
}

function recolorOneSegment(
  segments: ZigZagSegment[],
  color: string,
  cell: ZigZagGridCell,
) {
  const copy = segments.map((segment) => ({ ...segment }));
  const target = copy[Math.abs(cell.row + cell.col) % copy.length];

  if (target) {
    target.stroke = color;
  }

  return copy;
}

function buildSegmentPlan(
  moduleType: ZigZagGrammarModuleType,
  cell: ZigZagGridCell,
  rules: ZigZagGrammarRules,
  memory: ZigZagGrammarMemory,
  settings: Required<ZigZagGrammarSettings>,
): ZigZagSegmentPlan {
  const baseSegments = buildBaseChevronSegments(cell, rules.base_color, settings);

  if (moduleType === "empty_cell") {
    return { segments: [] };
  }

  if (moduleType === "single_chevron") {
    return { segments: baseSegments.slice(0, 2) };
  }

  if (moduleType === "broken_chevron") {
    return { segments: removeOneSegment(baseSegments, cell) };
  }

  if (moduleType === "shadow_chevron") {
    return { segments: recolorOneSegment(baseSegments, leastUsedColor(rules.shadow_colors, memory), cell) };
  }

  if (moduleType === "accent_left_arm") {
    return { segments: recolorTargetSegment(baseSegments, "left_arm", leastUsedColor(rules.accent_colors, memory), cell) };
  }

  if (moduleType === "accent_right_arm") {
    return { segments: recolorTargetSegment(baseSegments, "right_arm", leastUsedColor(rules.accent_colors, memory), cell) };
  }

  return { segments: baseSegments };
}

function selectRotation(
  moduleType: ZigZagGrammarModuleType,
  rules: ZigZagGrammarRules,
  memory: ZigZagGrammarMemory,
): ZigZagGrammarItem["rotation"] {
  if (rules.rotation_logic === "static") {
    return 0;
  }

  if (
    (rules.rotation_logic === "mostly_static" || rules.rotation_logic === "controlled_variation") &&
    rules.disruption_modules.includes(moduleType)
  ) {
    return memory.last_rotation === 0 ? 180 : 0;
  }

  return 0;
}

export function runZigZagGrammarEngineV1(
  grid: ZigZagGrid,
  grammarProfile: ZigZagGrammarProfile = { name: "zigzag_control_flow" },
  palette: ZigZagPatternPalette,
  settings: ZigZagGrammarSettings = {},
): ZigZagGrammarItem[] {
  const resolvedSettings = defaultSettings(settings);
  const rules = loadRules(grammarProfile, palette);
  const plan: ZigZagGrammarItem[] = [];
  let memory = initMemory();

  [...grid.cells]
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .forEach((cell) => {
      const candidates = getAllowedModules(cell, rules, memory, resolvedSettings);
      const selectedModule = selectBestModule(cell, candidates, rules, memory, resolvedSettings);
      const segmentPlan = buildSegmentPlan(selectedModule, cell, rules, memory, resolvedSettings);
      const rotation = selectRotation(selectedModule, rules, memory);
      const item: ZigZagGrammarItem = {
        cell,
        module_type: selectedModule,
        segment_plan: segmentPlan,
        rotation,
      };

      plan.push(item);
      memory = updateMemory(memory, item, rules);
    });

  return plan;
}

export const RUN = runZigZagGrammarEngineV1;
