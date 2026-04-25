import type {
  TextLayoutV2Canvas,
  TextLayoutV2Item,
  TextLayoutV2Output,
  TextLayoutV2Role,
} from "@/lib/mindslice/concept-text-layout-engine-v2-system";
import type { TextEchoConstellationItem } from "@/lib/mindslice/concept-text-echo-constellation-engine-system";

export type TextLayoutCollisionSettings = {
  enabled?: boolean;
  min_gap?: number;
  max_attempts_per_item?: number;
  allow_density_reduction?: boolean;
  allow_opacity_reduction?: boolean;
  keep_center_text_fixed?: boolean;
  role_priority?: TextLayoutV2Role[];
  role_density_limits?: Partial<Record<TextLayoutV2Role, number>>;
};

export type TextLayoutCollisionReport = {
  status: "ok" | "warning" | "skipped";
  overlaps_before: number | null;
  overlaps_after: number | null;
  moved_items: Array<{
    id: string;
    role: TextLayoutV2Role;
    from: { x: number; y: number };
    to: { x: number; y: number };
  }>;
  hidden_items: string[];
};

export type TextLayoutCollisionResolverOutput = {
  resolved_text_layout_output: TextLayoutV2Output;
  collision_report: TextLayoutCollisionReport;
};

type RequiredCollisionSettings = Required<TextLayoutCollisionSettings>;

const DEFAULT_ROLE_PRIORITY: TextLayoutV2Role[] = [
  "center_text",
  "sentence_fragment",
  "wandering_word",
  "wandering_letter",
  "template_fragment",
  "peripheral_text",
  "text_constellation",
  "temporal_particle",
  "grammar_particle",
  "text_echo_constellation",
  "stray_letter",
];

const DEFAULT_ROLE_DENSITY_LIMITS: Record<TextLayoutV2Role, number> = {
  center_text: 1,
  sentence_fragment: 4,
  wandering_word: 8,
  wandering_letter: 8,
  template_fragment: 4,
  peripheral_text: 8,
  text_constellation: 12,
  temporal_particle: 8,
  grammar_particle: 4,
  text_echo_constellation: 12,
  stray_letter: 8,
};

function normalizeSettings(settings: TextLayoutCollisionSettings = {}): RequiredCollisionSettings {
  return {
    enabled: settings.enabled ?? true,
    min_gap: settings.min_gap ?? 10,
    max_attempts_per_item: settings.max_attempts_per_item ?? 24,
    allow_density_reduction: settings.allow_density_reduction ?? true,
    allow_opacity_reduction: settings.allow_opacity_reduction ?? true,
    keep_center_text_fixed: settings.keep_center_text_fixed ?? true,
    role_priority: settings.role_priority ?? DEFAULT_ROLE_PRIORITY,
    role_density_limits: {
      ...DEFAULT_ROLE_DENSITY_LIMITS,
      ...(settings.role_density_limits ?? {}),
    },
  };
}

export function flattenTextItems(textLayoutOutput: TextLayoutV2Output): TextLayoutV2Item[] {
  return [
    ...(textLayoutOutput.center_text ? [textLayoutOutput.center_text] : []),
    ...textLayoutOutput.sentence_fragments,
    ...textLayoutOutput.wandering_words,
    ...textLayoutOutput.wandering_letters,
    ...textLayoutOutput.template_fragments,
    ...textLayoutOutput.peripheral_text,
    ...textLayoutOutput.text_constellation,
    ...textLayoutOutput.text_echo_constellation,
    ...textLayoutOutput.temporal_particles,
    ...textLayoutOutput.grammar_particles,
    ...textLayoutOutput.stray_letters,
  ];
}

function resolveFontSize(fontRole: TextLayoutV2Item["font_role"]) {
  return fontRole === "primary" ? 24 : fontRole === "secondary" ? 16 : fontRole === "stray" ? 18 : 12;
}

export function estimateTextBounds(item: TextLayoutV2Item) {
  const fontSize = resolveFontSize(item.font_role);
  const width = item.max_width ?? Math.max(8, item.text.length * fontSize * 0.58);
  const height = fontSize * 1.35;
  const x = item.anchor === "middle" ? item.x - width / 2 : item.anchor === "end" ? item.x - width : item.x;

  return {
    x,
    y: item.y - height / 2,
    w: width,
    h: height,
  };
}

export function boundsOverlap(
  first: ReturnType<typeof estimateTextBounds>,
  second: ReturnType<typeof estimateTextBounds>,
  gap: number,
) {
  return (
    first.x - gap < second.x + second.w &&
    first.x + first.w + gap > second.x &&
    first.y - gap < second.y + second.h &&
    first.y + first.h + gap > second.y
  );
}

function itemDoesNotOverlap(item: TextLayoutV2Item, placedItems: TextLayoutV2Item[], minGap: number) {
  const bounds = estimateTextBounds(item);

  return placedItems.every((placed) => !boundsOverlap(bounds, estimateTextBounds(placed), minGap));
}

function clampItemToCanvas(item: TextLayoutV2Item, canvas: TextLayoutV2Canvas) {
  const margin = canvas.margin ?? 48;
  const bounds = estimateTextBounds(item);
  const minX = item.x - bounds.x + margin;
  const maxX = canvas.width - (bounds.x + bounds.w - item.x) - margin;
  const minY = item.y - bounds.y + margin;
  const maxY = canvas.height - (bounds.y + bounds.h - item.y) - margin;

  return {
    ...item,
    x: Math.min(Math.max(item.x, minX), Math.max(minX, maxX)),
    y: Math.min(Math.max(item.y, minY), Math.max(minY, maxY)),
  };
}

function offsetItemByGoldenSpiral(item: TextLayoutV2Item, attempt: number, minGap: number) {
  const angle = (attempt * 137.507764 * Math.PI) / 180;
  const distance = minGap + attempt * minGap * 0.75;

  return {
    ...item,
    x: item.x + Math.cos(angle) * distance,
    y: item.y + Math.sin(angle) * distance,
  };
}

function findNonOverlappingPosition(
  item: TextLayoutV2Item,
  placedItems: TextLayoutV2Item[],
  canvas: TextLayoutV2Canvas,
  settings: RequiredCollisionSettings,
) {
  if (itemDoesNotOverlap(item, placedItems, settings.min_gap)) {
    return {
      status: "placed" as const,
      item,
      moved: false,
    };
  }

  for (let attempt = 1; attempt <= settings.max_attempts_per_item; attempt += 1) {
    const candidate = clampItemToCanvas(
      offsetItemByGoldenSpiral(item, attempt, settings.min_gap),
      canvas,
    );

    if (itemDoesNotOverlap(candidate, placedItems, settings.min_gap)) {
      return {
        status: "placed" as const,
        item: candidate,
        moved: true,
      };
    }
  }

  return {
    status: "failed" as const,
  };
}

function applyRoleDensityLimits(
  items: TextLayoutV2Item[],
  roleDensityLimits: RequiredCollisionSettings["role_density_limits"],
) {
  const output: TextLayoutV2Item[] = [];
  const roleCounts: Partial<Record<TextLayoutV2Role, number>> = {};

  items.forEach((item) => {
    const limit = roleDensityLimits[item.role] ?? Number.POSITIVE_INFINITY;
    const count = roleCounts[item.role] ?? 0;

    if (count >= limit) {
      return;
    }

    output.push(item);
    roleCounts[item.role] = count + 1;
  });

  return output;
}

function sortByRolePriority(items: TextLayoutV2Item[], rolePriority: TextLayoutV2Role[]) {
  const priority = new Map(rolePriority.map((role, index) => [role, index]));

  return [...items].sort((first, second) => {
    return (priority.get(first.role) ?? 999) - (priority.get(second.role) ?? 999);
  });
}

function handleUnplaceableItem(item: TextLayoutV2Item, settings: RequiredCollisionSettings) {
  if (settings.allow_density_reduction) {
    return {
      action: "hide" as const,
      item,
    };
  }

  if (settings.allow_opacity_reduction) {
    return {
      action: "reduce_opacity" as const,
      item: {
        ...item,
        opacity: item.opacity * 0.35,
      },
    };
  }

  return {
    action: "hide" as const,
    item,
  };
}

function countOverlaps(items: TextLayoutV2Item[], minGap: number) {
  let count = 0;

  for (let index = 0; index < items.length; index += 1) {
    for (let pairIndex = index + 1; pairIndex < items.length; pairIndex += 1) {
      const first = items[index];
      const second = items[pairIndex];

      if (!first || !second) {
        continue;
      }

      if (boundsOverlap(estimateTextBounds(first), estimateTextBounds(second), minGap)) {
        count += 1;
      }
    }
  }

  return count;
}

function itemsByRole<T extends TextLayoutV2Item>(items: TextLayoutV2Item[], role: T["role"]): T[] {
  return items.filter((item): item is T => item.role === role);
}

function rebuildTextLayoutOutput(originalOutput: TextLayoutV2Output, placedItems: TextLayoutV2Item[]): TextLayoutV2Output {
  const centerText = itemsByRole<TextLayoutV2Item>(placedItems, "center_text")[0] ?? null;

  return {
    ...originalOutput,
    center_text: centerText,
    sentence_fragments: itemsByRole<TextLayoutV2Item>(placedItems, "sentence_fragment"),
    wandering_words: itemsByRole<TextLayoutV2Item>(placedItems, "wandering_word"),
    wandering_letters: itemsByRole<TextLayoutV2Item>(placedItems, "wandering_letter"),
    template_fragments: itemsByRole<TextLayoutV2Item>(placedItems, "template_fragment"),
    peripheral_text: itemsByRole<TextLayoutV2Item>(placedItems, "peripheral_text"),
    text_constellation: itemsByRole<TextLayoutV2Item>(placedItems, "text_constellation"),
    text_echo_constellation: itemsByRole<TextEchoConstellationItem>(placedItems, "text_echo_constellation"),
    temporal_particles: itemsByRole<TextLayoutV2Item>(placedItems, "temporal_particle"),
    grammar_particles: itemsByRole<TextLayoutV2Item>(placedItems, "grammar_particle"),
    stray_letters: itemsByRole<TextLayoutV2Item>(placedItems, "stray_letter"),
    all_text: placedItems,
  };
}

export function runTextLayoutCollisionResolverV1(
  textLayoutOutput: TextLayoutV2Output,
  canvas: TextLayoutV2Canvas,
  collisionSettings: TextLayoutCollisionSettings = {},
): TextLayoutCollisionResolverOutput {
  const settings = normalizeSettings(collisionSettings);

  if (!settings.enabled) {
    return {
      resolved_text_layout_output: textLayoutOutput,
      collision_report: {
        status: "skipped",
        overlaps_before: null,
        overlaps_after: null,
        moved_items: [],
        hidden_items: [],
      },
    };
  }

  const allItems = flattenTextItems(textLayoutOutput);
  const densityLimitedItems = applyRoleDensityLimits(allItems, settings.role_density_limits);
  const sortedItems = sortByRolePriority(densityLimitedItems, settings.role_priority);
  const placedItems: TextLayoutV2Item[] = [];
  const movedItems: TextLayoutCollisionReport["moved_items"] = [];
  const hiddenItems: string[] = [];

  sortedItems.forEach((item) => {
    const candidate = clampItemToCanvas(item, canvas);

    if (settings.keep_center_text_fixed && item.role === "center_text") {
      placedItems.push(candidate);
      return;
    }

    const placementResult = findNonOverlappingPosition(candidate, placedItems, canvas, settings);

    if (placementResult.status === "placed") {
      placedItems.push(placementResult.item);

      if (placementResult.moved) {
        movedItems.push({
          id: item.id,
          role: item.role,
          from: { x: item.x, y: item.y },
          to: { x: placementResult.item.x, y: placementResult.item.y },
        });
      }

      return;
    }

    const fallbackResult = handleUnplaceableItem(item, settings);

    if (fallbackResult.action === "hide") {
      hiddenItems.push(item.id);
      return;
    }

    placedItems.push(fallbackResult.item);
  });

  const overlapsBefore = countOverlaps(allItems, settings.min_gap);
  const overlapsAfter = countOverlaps(placedItems, settings.min_gap);
  const resolvedTextLayoutOutput = rebuildTextLayoutOutput(textLayoutOutput, placedItems);

  return {
    resolved_text_layout_output: resolvedTextLayoutOutput,
    collision_report: {
      status: overlapsAfter === 0 ? "ok" : "warning",
      overlaps_before: overlapsBefore,
      overlaps_after: overlapsAfter,
      moved_items: movedItems,
      hidden_items: hiddenItems,
    },
  };
}

export const RUN = runTextLayoutCollisionResolverV1;
