import type {
  RetroGridCell,
  RetroGridPatternPalette,
} from "@/lib/mindslice/concept-retro-grid-pattern-engine-system";

export type ModularGrammarModuleType =
  | "triangle_split"
  | "quarter_circle"
  | "half_circle"
  | "diagonal_block"
  | "diamond_nested"
  | "stripe_block"
  | "empty_cell";

export type ModularGrammarProfile = {
  name?: "retro_geometric_control" | "control_calm" | string;
};

export type ModularGrammarSettings = {
  allow_random?: boolean;
  max_repetition?: number;
  min_contrast_distance?: number;
};

export type ModularGrammarRules = {
  rhythm: "balanced_variation" | "minimal";
  dominant_modules: ModularGrammarModuleType[];
  accent_modules: ModularGrammarModuleType[];
  quiet_modules: ModularGrammarModuleType[];
  forbidden_neighbors: Array<[ModularGrammarModuleType, ModularGrammarModuleType]>;
  preferred_neighbors: Array<[ModularGrammarModuleType, ModularGrammarModuleType]>;
  max_same_module_in_row: number;
  max_accent_modules_total_ratio: number;
  empty_cell_ratio: number;
  color_logic: "balanced_palette" | "low_noise_palette";
  rotation_logic: "grid_rotation_90" | "soft_grid_rotation";
};

export type ModularGrammarItem = {
  cell: RetroGridCell;
  module_type: ModularGrammarModuleType;
  colors: string[];
  rotation: 0 | 90 | 180 | 270;
};

export type ModularGrammarMemory = {
  previous_cell: ModularGrammarItem | null;
  row_module_counts: Record<number, Partial<Record<ModularGrammarModuleType, number>>>;
  total_module_counts: Partial<Record<ModularGrammarModuleType, number>>;
  accent_count: number;
  total_count: number;
  color_usage: Record<string, number>;
  last_rotation: ModularGrammarItem["rotation"] | null;
};

const MODULE_TYPES: ModularGrammarModuleType[] = [
  "triangle_split",
  "quarter_circle",
  "half_circle",
  "diagonal_block",
  "diamond_nested",
  "stripe_block",
  "empty_cell",
];

function defaultRules(): ModularGrammarRules {
  return {
    rhythm: "balanced_variation",
    dominant_modules: ["triangle_split", "quarter_circle"],
    accent_modules: ["diamond_nested"],
    quiet_modules: ["empty_cell"],
    forbidden_neighbors: [],
    preferred_neighbors: [],
    max_same_module_in_row: 2,
    max_accent_modules_total_ratio: 0.2,
    empty_cell_ratio: 0.05,
    color_logic: "balanced_palette",
    rotation_logic: "grid_rotation_90",
  };
}

function loadRules(grammarProfile: ModularGrammarProfile = {}): ModularGrammarRules {
  if (grammarProfile.name === "control_calm") {
    return {
      rhythm: "minimal",
      dominant_modules: ["half_circle", "quarter_circle"],
      accent_modules: ["diamond_nested"],
      quiet_modules: ["empty_cell"],
      forbidden_neighbors: [
        ["diamond_nested", "diamond_nested"],
        ["stripe_block", "stripe_block"],
        ["triangle_split", "triangle_split"],
      ],
      preferred_neighbors: [
        ["quarter_circle", "empty_cell"],
        ["half_circle", "quarter_circle"],
      ],
      max_same_module_in_row: 1,
      max_accent_modules_total_ratio: 0.15,
      empty_cell_ratio: 0.15,
      color_logic: "low_noise_palette",
      rotation_logic: "soft_grid_rotation",
    };
  }

  if (!grammarProfile.name || grammarProfile.name === "retro_geometric_control") {
    return {
      rhythm: "balanced_variation",
      dominant_modules: ["triangle_split", "quarter_circle", "half_circle"],
      accent_modules: ["diamond_nested", "stripe_block"],
      quiet_modules: ["empty_cell"],
      forbidden_neighbors: [
        ["diamond_nested", "diamond_nested"],
        ["stripe_block", "stripe_block"],
      ],
      preferred_neighbors: [
        ["triangle_split", "quarter_circle"],
        ["half_circle", "diagonal_block"],
        ["quarter_circle", "quarter_circle"],
      ],
      max_same_module_in_row: 2,
      max_accent_modules_total_ratio: 0.25,
      empty_cell_ratio: 0.05,
      color_logic: "balanced_palette",
      rotation_logic: "grid_rotation_90",
    };
  }

  return defaultRules();
}

function initGrammarMemory(): ModularGrammarMemory {
  return {
    previous_cell: null,
    row_module_counts: {},
    total_module_counts: {},
    accent_count: 0,
    total_count: 0,
    color_usage: {},
    last_rotation: null,
  };
}

function incrementRecord<T extends string | number>(
  record: Partial<Record<T, number>>,
  key: T,
) {
  record[key] = (record[key] ?? 0) + 1;
}

function updateMemory(
  memory: ModularGrammarMemory,
  grammarItem: ModularGrammarItem,
  rules: ModularGrammarRules,
): ModularGrammarMemory {
  memory.previous_cell = grammarItem;
  memory.total_count += 1;
  incrementRecord(memory.total_module_counts, grammarItem.module_type);

  memory.row_module_counts[grammarItem.cell.row] ??= {};
  incrementRecord(memory.row_module_counts[grammarItem.cell.row], grammarItem.module_type);

  if (rules.accent_modules.includes(grammarItem.module_type)) {
    memory.accent_count += 1;
  }

  grammarItem.colors.forEach((color) => {
    memory.color_usage[color] = (memory.color_usage[color] ?? 0) + 1;
  });

  memory.last_rotation = grammarItem.rotation;

  return memory;
}

function removeForbiddenByNeighbor(
  candidates: ModularGrammarModuleType[],
  previousCell: ModularGrammarItem | null,
  forbiddenPairs: ModularGrammarRules["forbidden_neighbors"],
) {
  if (!previousCell) {
    return candidates;
  }

  return candidates.filter(
    (candidate) =>
      !forbiddenPairs.some(
        ([previousType, currentType]) =>
          previousCell.module_type === previousType && candidate === currentType,
      ),
  );
}

function enforceRowRepetitionLimit(
  candidates: ModularGrammarModuleType[],
  cell: RetroGridCell,
  memory: ModularGrammarMemory,
  limit: number,
) {
  return candidates.filter(
    (moduleType) => (memory.row_module_counts[cell.row]?.[moduleType] ?? 0) < limit,
  );
}

function enforceAccentRatio(
  candidates: ModularGrammarModuleType[],
  memory: ModularGrammarMemory,
  rules: ModularGrammarRules,
) {
  const currentRatio = memory.accent_count / Math.max(memory.total_count, 1);

  if (currentRatio < rules.max_accent_modules_total_ratio) {
    return candidates;
  }

  return candidates.filter((candidate) => !rules.accent_modules.includes(candidate));
}

function getAllowedModules(
  cell: RetroGridCell,
  rules: ModularGrammarRules,
  memory: ModularGrammarMemory,
) {
  let candidates = [...MODULE_TYPES];

  candidates = removeForbiddenByNeighbor(
    candidates,
    memory.previous_cell,
    rules.forbidden_neighbors,
  );
  candidates = enforceRowRepetitionLimit(
    candidates,
    cell,
    memory,
    rules.max_same_module_in_row,
  );
  candidates = enforceAccentRatio(candidates, memory, rules);

  return candidates.length > 0 ? candidates : [...rules.dominant_modules];
}

function scoreRhythm(
  candidate: ModularGrammarModuleType,
  rules: ModularGrammarRules,
  memory: ModularGrammarMemory,
) {
  if (rules.rhythm === "balanced_variation") {
    return candidate !== memory.previous_cell?.module_type ? 2 : -1;
  }

  if (rules.rhythm === "minimal") {
    if (rules.dominant_modules.includes(candidate)) {
      return 2;
    }

    if (rules.accent_modules.includes(candidate)) {
      return -1;
    }
  }

  return 0;
}

function scoreNeighbor(
  candidate: ModularGrammarModuleType,
  rules: ModularGrammarRules,
  memory: ModularGrammarMemory,
) {
  if (!memory.previous_cell) {
    return 0;
  }

  return rules.preferred_neighbors.some(
    ([previousType, currentType]) =>
      memory.previous_cell?.module_type === previousType && candidate === currentType,
  )
    ? 2
    : 0;
}

function scoreBalance(candidate: ModularGrammarModuleType, memory: ModularGrammarMemory) {
  return 1 / (1 + (memory.total_module_counts[candidate] ?? 0));
}

function scoreAccent(
  candidate: ModularGrammarModuleType,
  rules: ModularGrammarRules,
  memory: ModularGrammarMemory,
) {
  if (!rules.accent_modules.includes(candidate)) {
    return 0;
  }

  const currentRatio = memory.accent_count / Math.max(memory.total_count, 1);
  return currentRatio < rules.max_accent_modules_total_ratio ? 1 : -4;
}

function scoreEmpty(
  candidate: ModularGrammarModuleType,
  rules: ModularGrammarRules,
  memory: ModularGrammarMemory,
) {
  if (candidate !== "empty_cell") {
    return 0;
  }

  const currentEmpty = memory.total_module_counts.empty_cell ?? 0;
  const currentRatio = currentEmpty / Math.max(memory.total_count, 1);
  return currentRatio < rules.empty_cell_ratio ? 2.5 : -2;
}

function selectBestModule(
  cell: RetroGridCell,
  candidates: ModularGrammarModuleType[],
  rules: ModularGrammarRules,
  memory: ModularGrammarMemory,
) {
  return candidates
    .map((candidate) => ({
      module: candidate,
      score:
        scoreRhythm(candidate, rules, memory) +
        scoreNeighbor(candidate, rules, memory) +
        scoreBalance(candidate, memory) +
        scoreAccent(candidate, rules, memory) +
        scoreEmpty(candidate, rules, memory) -
        cell.row * 0.001 -
        cell.col * 0.0001,
    }))
    .sort((a, b) => b.score - a.score)[0]?.module ?? candidates[0];
}

function colorCountForModule(moduleType: ModularGrammarModuleType) {
  if (
    moduleType === "triangle_split" ||
    moduleType === "stripe_block" ||
    moduleType === "diagonal_block"
  ) {
    return 2;
  }

  if (moduleType === "diamond_nested") {
    return 3;
  }

  return 1;
}

function selectBalancedColors(colors: string[], memory: ModularGrammarMemory, count: number) {
  return colors
    .map((color, index) => ({
      color,
      score: 1 / (1 + (memory.color_usage[color] ?? 0)) - index * 0.0001,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((entry) => entry.color);
}

function selectColorPlan(
  moduleType: ModularGrammarModuleType,
  palette: RetroGridPatternPalette,
  rules: ModularGrammarRules,
  memory: ModularGrammarMemory,
) {
  if (moduleType === "empty_cell") {
    return [palette.white];
  }

  const colors =
    rules.color_logic === "low_noise_palette"
      ? [palette.dark, palette.mint, palette.white]
      : [palette.dark, palette.coral, palette.orange, palette.mint, palette.white];

  return selectBalancedColors(colors, memory, colorCountForModule(moduleType));
}

function rotateBy90(rotation: ModularGrammarItem["rotation"]) {
  return ((rotation + 90) % 360) as ModularGrammarItem["rotation"];
}

function selectRotation(
  _moduleType: ModularGrammarModuleType,
  cell: RetroGridCell,
  rules: ModularGrammarRules,
  memory: ModularGrammarMemory,
): ModularGrammarItem["rotation"] {
  void _moduleType;

  const allowed = [0, 90, 180, 270] as const;

  if (rules.rotation_logic === "grid_rotation_90") {
    return allowed[(cell.row + cell.col) % allowed.length];
  }

  if (rules.rotation_logic === "soft_grid_rotation") {
    return memory.last_rotation === null ? 0 : rotateBy90(memory.last_rotation);
  }

  return 0;
}

export function runModularGrammarEngineV1(
  grid: RetroGridCell[],
  grammarProfile: ModularGrammarProfile = { name: "retro_geometric_control" },
  palette: RetroGridPatternPalette,
  _settings: ModularGrammarSettings = {},
): ModularGrammarItem[] {
  void _settings;

  const grammarRules = loadRules(grammarProfile);
  const grammarPlan: ModularGrammarItem[] = [];
  let memory = initGrammarMemory();

  [...grid]
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .forEach((cell) => {
      const candidates = getAllowedModules(cell, grammarRules, memory);
      const selectedModule = selectBestModule(cell, candidates, grammarRules, memory);
      const colorPlan = selectColorPlan(selectedModule, palette, grammarRules, memory);
      const rotation = selectRotation(selectedModule, cell, grammarRules, memory);
      const grammarItem: ModularGrammarItem = {
        cell,
        module_type: selectedModule,
        colors: colorPlan,
        rotation,
      };

      grammarPlan.push(grammarItem);
      memory = updateMemory(memory, grammarItem, grammarRules);
    });

  return grammarPlan;
}

export const RUN = runModularGrammarEngineV1;
