import type {
  TextLayoutV2Canvas,
  TextLayoutV2Item,
  TextLayoutV2Output,
  TextLayoutV2Role,
} from "@/lib/mindslice/concept-text-layout-engine-v2-system";
import type { TextEchoConstellationItem } from "@/lib/mindslice/concept-text-echo-constellation-engine-system";
import type {
  CompositionVisualOutput,
  ScenarioVisualOutput,
  StructureVisualOutput,
} from "@/lib/mindslice/concept-visual-renderer-system";
import type { VisualGridPoint } from "@/lib/mindslice/concept-visual-composer-system";

export type TextLayoutCollisionResolverV2Settings = {
  enabled?: boolean;
  min_gap?: number;
  max_attempts_per_item?: number;
  keep_center_text_fixed?: boolean;
  allow_density_reduction?: boolean;
  allow_opacity_reduction?: boolean;
  allow_scale_reduction?: boolean;
  allow_edge_fallback?: boolean;
  allow_layer_relaxation?: boolean;
  max_total_text_items?: number;
  bounds_mode?: "estimated";
  placement_strategy?: "priority_spiral_zone" | "spiral_only" | "zone_only";
  report_level?: "summary" | "verbose";
  role_priority?: TextLayoutV2Role[];
  role_density_limits?: Partial<Record<TextLayoutV2Role, number>>;
  canvas_margin?: number;
  line_height_factor?: number;
};

export type TextLayoutCollisionResolverV2Report = {
  status: "ok" | "warning" | "skipped";
  severity: "none" | "clean" | "minor" | "moderate" | "critical";
  collision_score: number | null;
  overlaps_before: number | null;
  overlaps_after: number | null;
  resolved_overlap_count: number | null;
  moved_count: number;
  reduced_count: number;
  hidden_count: number;
  rejected_count: number;
  moved_items: Array<{
    id: string;
    role: TextLayoutV2Role;
    from: { x: number; y: number };
    to: { x: number; y: number };
    target_zone_id?: string | null;
  }>;
  reduced_items: Array<{
    id: string;
    role: TextLayoutV2Role;
    original_scale: number;
    resolved_scale: number;
    original_opacity: number;
    resolved_opacity: number;
    reduction_type: string;
  }>;
  hidden_items: Array<{ id: string; role: TextLayoutV2Role; reason: string }>;
  rejected_items: TextLayoutV2Item[];
  warnings: string[];
  repair_suggestions: string[];
  validation?: {
    status: "ok" | "warning";
    warnings: string[];
  };
  settings_snapshot?: {
    min_gap: number;
    max_attempts_per_item: number;
    placement_strategy: string;
    max_total_text_items: number;
  };
};

export type TextLayoutCollisionResolverV2Output = {
  resolved_text_layout_output: TextLayoutV2Output;
  collision_report: TextLayoutCollisionResolverV2Report;
};

type RequiredSettings = Required<TextLayoutCollisionResolverV2Settings>;
type Bounds = { x: number; y: number; w: number; h: number };
type BoundsCache = Record<string, Bounds>;
type CollisionRelation = "strict" | "normal" | "relaxed" | "loose";
type CollisionMatrix = Record<string, CollisionRelation>;
type RolePolicy = Record<
  TextLayoutV2Role,
  {
    fixed: boolean;
    can_hide: boolean;
    can_reduce_opacity: boolean;
    can_reduce_scale: boolean;
    min_opacity: number;
    min_scale: number;
  }
>;
type PlacementZone = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  center: VisualGridPoint;
  role: string;
  priority: number;
  source: string;
};
type ProtectedZone =
  | { id: string; type: "rect"; bounds: Bounds; strength: "hard" | "soft"; source: string }
  | { id: string; type: "circle"; cx: number; cy: number; r: number; strength: "hard" | "soft"; source: string }
  | { id: string; type: "safe_area"; area: { x: number; y: number; width: number; height: number }; strength: "hard"; source: string };
type ExtendedTextItem = TextLayoutV2Item & {
  scale?: number;
  font_size?: number;
  children?: Array<{ text?: string }>;
  target_zone_id?: string;
  fallback_zone?: string;
  reduction_type?: string;
  reduction_value?: number;
};

const ROLE_PRIORITY: TextLayoutV2Role[] = [
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

const ROLE_DENSITY_LIMITS: Record<TextLayoutV2Role, number> = {
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

const DEFAULT_ROLE_POLICY: RolePolicy = {
  center_text: {
    fixed: true,
    can_hide: false,
    can_reduce_opacity: false,
    can_reduce_scale: false,
    min_opacity: 0.85,
    min_scale: 1,
  },
  template_fragment: {
    fixed: false,
    can_hide: false,
    can_reduce_opacity: true,
    can_reduce_scale: true,
    min_opacity: 0.5,
    min_scale: 0.8,
  },
  sentence_fragment: {
    fixed: false,
    can_hide: false,
    can_reduce_opacity: true,
    can_reduce_scale: true,
    min_opacity: 0.52,
    min_scale: 0.78,
  },
  wandering_word: {
    fixed: false,
    can_hide: true,
    can_reduce_opacity: true,
    can_reduce_scale: true,
    min_opacity: 0.28,
    min_scale: 0.7,
  },
  wandering_letter: {
    fixed: false,
    can_hide: true,
    can_reduce_opacity: true,
    can_reduce_scale: true,
    min_opacity: 0.16,
    min_scale: 0.55,
  },
  peripheral_text: {
    fixed: false,
    can_hide: false,
    can_reduce_opacity: true,
    can_reduce_scale: true,
    min_opacity: 0.45,
    min_scale: 0.85,
  },
  text_constellation: {
    fixed: false,
    can_hide: true,
    can_reduce_opacity: true,
    can_reduce_scale: true,
    min_opacity: 0.3,
    min_scale: 0.75,
  },
  temporal_particle: {
    fixed: false,
    can_hide: true,
    can_reduce_opacity: true,
    can_reduce_scale: true,
    min_opacity: 0.22,
    min_scale: 0.7,
  },
  grammar_particle: {
    fixed: false,
    can_hide: true,
    can_reduce_opacity: true,
    can_reduce_scale: true,
    min_opacity: 0.18,
    min_scale: 0.7,
  },
  text_echo_constellation: {
    fixed: false,
    can_hide: true,
    can_reduce_opacity: true,
    can_reduce_scale: true,
    min_opacity: 0.12,
    min_scale: 0.65,
  },
  stray_letter: {
    fixed: false,
    can_hide: true,
    can_reduce_opacity: true,
    can_reduce_scale: true,
    min_opacity: 0.1,
    min_scale: 0.6,
  },
};

const DEFAULT_COLLISION_MATRIX: CollisionMatrix = {
  center_text_vs_peripheral_text: "strict",
  center_text_vs_template_fragment: "strict",
  center_text_vs_sentence_fragment: "strict",
  sentence_fragment_vs_wandering_word: "normal",
  sentence_fragment_vs_wandering_letter: "relaxed",
  wandering_word_vs_wandering_letter: "relaxed",
  template_fragment_vs_text_constellation: "normal",
  template_fragment_vs_text_echo_constellation: "relaxed",
  center_text_vs_text_constellation: "strict",
  center_text_vs_temporal_particle: "strict",
  center_text_vs_grammar_particle: "strict",
  center_text_vs_text_echo_constellation: "strict",
  center_text_vs_stray_letter: "strict",
  peripheral_text_vs_center_text: "strict",
  text_constellation_vs_text_constellation: "normal",
  text_constellation_vs_text_echo_constellation: "relaxed",
  text_echo_constellation_vs_text_echo_constellation: "relaxed",
  stray_letter_vs_text_echo_constellation: "loose",
  grammar_particle_vs_temporal_particle: "relaxed",
};

function normalizeSettings(settings: TextLayoutCollisionResolverV2Settings = {}): RequiredSettings {
  return {
    enabled: settings.enabled ?? true,
    min_gap: settings.min_gap ?? 10,
    max_attempts_per_item: settings.max_attempts_per_item ?? 32,
    keep_center_text_fixed: settings.keep_center_text_fixed ?? true,
    allow_density_reduction: settings.allow_density_reduction ?? true,
    allow_opacity_reduction: settings.allow_opacity_reduction ?? true,
    allow_scale_reduction: settings.allow_scale_reduction ?? true,
    allow_edge_fallback: settings.allow_edge_fallback ?? true,
    allow_layer_relaxation: settings.allow_layer_relaxation ?? true,
    max_total_text_items: settings.max_total_text_items ?? 48,
    bounds_mode: settings.bounds_mode ?? "estimated",
    placement_strategy: settings.placement_strategy ?? "priority_spiral_zone",
    report_level: settings.report_level ?? "verbose",
    role_priority: settings.role_priority ?? ROLE_PRIORITY,
    role_density_limits: {
      ...ROLE_DENSITY_LIMITS,
      ...(settings.role_density_limits ?? {}),
    },
    canvas_margin: settings.canvas_margin ?? 0,
    line_height_factor: settings.line_height_factor ?? 1.35,
  };
}

function buildRolePolicy(settings: RequiredSettings): RolePolicy {
  return {
    ...DEFAULT_ROLE_POLICY,
    center_text: {
      ...DEFAULT_ROLE_POLICY.center_text,
      fixed: settings.keep_center_text_fixed,
    },
  };
}

function buildCollisionMatrix(settings: RequiredSettings): CollisionMatrix {
  const matrix = { ...DEFAULT_COLLISION_MATRIX };

  if (!settings.allow_layer_relaxation) {
    matrix.text_constellation_vs_text_echo_constellation = "normal";
    matrix.text_echo_constellation_vs_text_echo_constellation = "normal";
    matrix.stray_letter_vs_text_echo_constellation = "normal";
    matrix.grammar_particle_vs_temporal_particle = "normal";
  }

  return matrix;
}

export function flattenTextItems(textLayoutOutput: TextLayoutV2Output): TextLayoutV2Item[] {
  return [
    ...(textLayoutOutput.center_text ? [textLayoutOutput.center_text] : []),
    ...(textLayoutOutput.sentence_fragments ?? []),
    ...(textLayoutOutput.wandering_words ?? []),
    ...(textLayoutOutput.wandering_letters ?? []),
    ...(textLayoutOutput.template_fragments ?? []),
    ...(textLayoutOutput.peripheral_text ?? []),
    ...(textLayoutOutput.text_constellation ?? []),
    ...(textLayoutOutput.text_echo_constellation ?? []),
    ...(textLayoutOutput.temporal_particles ?? []),
    ...(textLayoutOutput.grammar_particles ?? []),
    ...(textLayoutOutput.stray_letters ?? []),
  ];
}

function defaultOpacityForRole(role: TextLayoutV2Role) {
  return {
    center_text: 0.9,
    sentence_fragment: 0.68,
    wandering_word: 0.56,
    wandering_letter: 0.38,
    template_fragment: 0.68,
    peripheral_text: 0.55,
    text_constellation: 0.35,
    temporal_particle: 0.3,
    grammar_particle: 0.28,
    text_echo_constellation: 0.22,
    stray_letter: 0.18,
  }[role];
}

function defaultFontRoleForRole(role: TextLayoutV2Role): TextLayoutV2Item["font_role"] {
  if (role === "center_text") return "primary";
  if (role === "sentence_fragment") return "display";
  if (role === "wandering_word") return "micro_mono";
  if (role === "wandering_letter") return "display";
  if (role === "template_fragment") return "secondary";
  if (role === "peripheral_text") return "secondary";
  if (role === "stray_letter") return "stray";
  return "micro";
}

function normalizeTextItems(items: TextLayoutV2Item[]): ExtendedTextItem[] {
  return items.map((item, index) => ({
    ...item,
    id: item.id || `${item.role}_${index}`,
    type: "text",
    text: item.text ?? "",
    scale: (item as ExtendedTextItem).scale ?? 1,
    opacity: item.opacity ?? defaultOpacityForRole(item.role),
    rotation: item.rotation ?? 0,
    anchor: item.anchor ?? "middle",
    baseline: item.baseline ?? "middle",
    font_role: item.font_role ?? defaultFontRoleForRole(item.role),
  }));
}

function priorityIndex(role: TextLayoutV2Role, rolePriority: TextLayoutV2Role[]) {
  const index = rolePriority.indexOf(role);
  return index === -1 ? 999 : index;
}

function sortByRolePriority<T extends TextLayoutV2Item>(items: T[], rolePriority: TextLayoutV2Role[]) {
  return [...items].sort((first, second) => priorityIndex(first.role, rolePriority) - priorityIndex(second.role, rolePriority));
}

function applyGlobalTextLimit(items: ExtendedTextItem[], maxTotal: number, rolePolicy: RolePolicy, rolePriority: TextLayoutV2Role[]) {
  if (items.length <= maxTotal) {
    return items;
  }

  const sorted = sortByRolePriority(items, rolePriority);
  const protectedItems = sorted.filter((item) => !rolePolicy[item.role].can_hide);
  const removableItems = sorted.filter((item) => rolePolicy[item.role].can_hide);
  const remainingSlots = maxTotal - protectedItems.length;

  if (remainingSlots <= 0) {
    return protectedItems.slice(0, maxTotal);
  }

  return [...protectedItems, ...removableItems.slice(0, remainingSlots)];
}

function applyRoleDensityLimits(
  items: ExtendedTextItem[],
  roleDensityLimits: RequiredSettings["role_density_limits"],
  rolePolicy: RolePolicy,
) {
  const output: ExtendedTextItem[] = [];
  const roleCounts: Partial<Record<TextLayoutV2Role, number>> = {};

  items.forEach((item) => {
    const limit = roleDensityLimits[item.role] ?? Number.POSITIVE_INFINITY;
    const count = roleCounts[item.role] ?? 0;

    if (count >= limit && rolePolicy[item.role].can_hide) {
      return;
    }

    output.push(item);
    roleCounts[item.role] = count + 1;
  });

  return output;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapStructure(output?: unknown): StructureVisualOutput | undefined {
  if (!isRecord(output)) {
    return undefined;
  }

  if ("structure_output" in output) {
    return output.structure_output as StructureVisualOutput | undefined;
  }

  return output as StructureVisualOutput;
}

function unwrapScenario(output?: unknown): ScenarioVisualOutput | undefined {
  if (!isRecord(output)) {
    return undefined;
  }

  if ("scenario_output" in output) {
    return output.scenario_output as ScenarioVisualOutput | undefined;
  }

  return output as ScenarioVisualOutput;
}

function unwrapComposition(output?: unknown): CompositionVisualOutput | undefined {
  if (!isRecord(output)) {
    return undefined;
  }

  if ("composition_output" in output) {
    return output.composition_output as CompositionVisualOutput | undefined;
  }

  return output as CompositionVisualOutput;
}

function resolveFontSize(fontRole: TextLayoutV2Item["font_role"], explicitFontSize?: number) {
  if (explicitFontSize) return explicitFontSize;
  if (fontRole === "primary") return 42;
  if (fontRole === "display") return 28;
  if (fontRole === "secondary") return 22;
  if (fontRole === "micro") return 13;
  if (fontRole === "micro_mono") return 13;
  if (fontRole === "stray") return 18;
  return 14;
}

function averageCharacterWidthFactor(fontRole: TextLayoutV2Item["font_role"]) {
  if (fontRole === "primary") return 0.56;
  if (fontRole === "display") return 0.56;
  if (fontRole === "secondary") return 0.54;
  if (fontRole === "micro") return 0.52;
  if (fontRole === "micro_mono") return 0.52;
  if (fontRole === "stray") return 0.58;
  return 0.54;
}

export function estimateTextBounds(item: TextLayoutV2Item, settings: Partial<RequiredSettings> = {}): Bounds {
  const extended = item as ExtendedTextItem;
  const fontSize = resolveFontSize(item.font_role, extended.font_size);
  const scale = extended.scale ?? 1;
  const effectiveFontSize = fontSize * scale;
  const children = Array.isArray(extended.children) ? extended.children : [];
  const lineHeightFactor = settings.line_height_factor ?? 1.35;
  const childWidth = children.length > 0
    ? Math.max(...children.map((child) => String(child.text ?? "").length * effectiveFontSize * 0.54), 0)
    : 0;
  const width = item.max_width ?? (children.length > 0 ? childWidth : Math.max(8, item.text.length * effectiveFontSize * averageCharacterWidthFactor(item.font_role)));
  const height = children.length > 0 ? children.length * effectiveFontSize * lineHeightFactor : effectiveFontSize * lineHeightFactor;
  const x = item.anchor === "middle" ? item.x - width / 2 : item.anchor === "end" ? item.x - width : item.x;
  const y = item.y - height / 2;
  const bounds = { x, y, w: width, h: height };
  const rotation = Math.abs(item.rotation ?? 0);

  if (rotation === 0) {
    return bounds;
  }

  const angle = (rotation * Math.PI) / 180;
  const sinValue = Math.abs(Math.sin(angle));
  const cosValue = Math.abs(Math.cos(angle));
  const rotatedWidth = bounds.w * cosValue + bounds.h * sinValue;
  const rotatedHeight = bounds.w * sinValue + bounds.h * cosValue;
  const center = { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };

  return {
    x: center.x - rotatedWidth / 2,
    y: center.y - rotatedHeight / 2,
    w: rotatedWidth,
    h: rotatedHeight,
  };
}

function inflateBounds(bounds: Bounds, amount: number): Bounds {
  return {
    x: bounds.x - amount,
    y: bounds.y - amount,
    w: bounds.w + amount * 2,
    h: bounds.h + amount * 2,
  };
}

function boundsOverlap(a: Bounds, b: Bounds, gap: number) {
  return a.x - gap < b.x + b.w && a.x + a.w + gap > b.x && a.y - gap < b.y + b.h && a.y + a.h + gap > b.y;
}

function rectIntersectsCircle(rect: Bounds, circle: Extract<ProtectedZone, { type: "circle" }>) {
  const closestX = Math.min(Math.max(circle.cx, rect.x), rect.x + rect.w);
  const closestY = Math.min(Math.max(circle.cy, rect.y), rect.y + rect.h);
  const dx = circle.cx - closestX;
  const dy = circle.cy - closestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function buildProtectedZones(
  textLayoutOutput: TextLayoutV2Output,
  canvas: TextLayoutV2Canvas,
  structureOutput: unknown,
  compositionOutput: unknown,
  settings: RequiredSettings,
): ProtectedZone[] {
  const zones: ProtectedZone[] = [];
  const composition = unwrapComposition(compositionOutput as CompositionVisualOutput | { composition_output?: CompositionVisualOutput } | undefined);
  const structure = unwrapStructure(structureOutput as StructureVisualOutput | { structure_output?: StructureVisualOutput } | undefined);

  if (textLayoutOutput.center_text) {
    zones.push({
      id: "center_text_protected",
      type: "rect",
      bounds: inflateBounds(estimateTextBounds(textLayoutOutput.center_text, settings), settings.min_gap * 2),
      strength: "hard",
      source: "center_text",
    });
  }

  if (composition?.focus_field?.center) {
    zones.push({
      id: "focus_field_soft_protection",
      type: "circle",
      cx: composition.focus_field.center.x,
      cy: composition.focus_field.center.y,
      r: "radius" in composition.focus_field ? Number(composition.focus_field.radius ?? 120) : 120,
      strength: "soft",
      source: "focus_field",
    });
  }

  const safeArea = structure && "safe_area" in structure ? structure.safe_area : null;
  if (safeArea && typeof safeArea === "object") {
    zones.push({
      id: "outside_safe_area_protection",
      type: "safe_area",
      area: safeArea as { x: number; y: number; width: number; height: number },
      strength: "hard",
      source: "safe_area",
    });
  } else {
    zones.push({
      id: "canvas_safe_area",
      type: "safe_area",
      area: {
        x: canvas.margin ?? settings.canvas_margin,
        y: canvas.margin ?? settings.canvas_margin,
        width: canvas.width - (canvas.margin ?? settings.canvas_margin) * 2,
        height: canvas.height - (canvas.margin ?? settings.canvas_margin) * 2,
      },
      strength: "hard",
      source: "canvas_margin",
    });
  }

  return zones;
}

function defaultCanvasZones(canvas: TextLayoutV2Canvas): PlacementZone[] {
  const margin = canvas.margin ?? 80;
  const width = canvas.width;
  const height = canvas.height;
  const zoneW = width * 0.28;
  const zoneH = height * 0.28;

  return [
    { id: "top_left", x: margin, y: margin, w: zoneW, h: zoneH, center: { x: margin + zoneW / 2, y: margin + zoneH / 2 }, role: "edge_activity", priority: 1, source: "default_zone" },
    { id: "top_right", x: width - margin - zoneW, y: margin, w: zoneW, h: zoneH, center: { x: width - margin - zoneW / 2, y: margin + zoneH / 2 }, role: "edge_activity", priority: 1, source: "default_zone" },
    { id: "bottom_left", x: margin, y: height - margin - zoneH, w: zoneW, h: zoneH, center: { x: margin + zoneW / 2, y: height - margin - zoneH / 2 }, role: "edge_activity", priority: 1, source: "default_zone" },
    { id: "bottom_right", x: width - margin - zoneW, y: height - margin - zoneH, w: zoneW, h: zoneH, center: { x: width - margin - zoneW / 2, y: height - margin - zoneH / 2 }, role: "edge_activity", priority: 1, source: "default_zone" },
    { id: "center_soft", x: width * 0.34, y: height * 0.34, w: width * 0.32, h: height * 0.32, center: { x: width / 2, y: height / 2 }, role: "soft_center", priority: 0.45, source: "default_zone" },
  ];
}

function pathMidpoint(path: { start?: VisualGridPoint; end?: VisualGridPoint; points?: VisualGridPoint[]; center?: VisualGridPoint }) {
  if (path.start && path.end) {
    return { x: (path.start.x + path.end.x) / 2, y: (path.start.y + path.end.y) / 2 };
  }
  if (Array.isArray(path.points) && path.points.length > 0) {
    return path.points[Math.floor(path.points.length / 2)] ?? { x: 0, y: 0 };
  }
  return path.center ?? { x: 0, y: 0 };
}

function buildPlacementZones(
  canvas: TextLayoutV2Canvas,
  structureOutput: unknown,
  scenarioOutput: unknown,
  compositionOutput: unknown,
): PlacementZone[] {
  const structure = unwrapStructure(structureOutput as StructureVisualOutput | { structure_output?: StructureVisualOutput } | undefined);
  const scenario = unwrapScenario(scenarioOutput as ScenarioVisualOutput | { scenario_output?: ScenarioVisualOutput } | undefined);
  const composition = unwrapComposition(compositionOutput as CompositionVisualOutput | { composition_output?: CompositionVisualOutput } | undefined);
  const zones: PlacementZone[] = [];

  if (structure?.zones?.length) {
    structure.zones.forEach((zone) => {
      const x = "x" in zone ? Number(zone.x) : zone.center.x - zone.width / 2;
      const y = "y" in zone ? Number(zone.y) : zone.center.y - zone.height / 2;
      zones.push({
        id: zone.id,
        x,
        y,
        w: "w" in zone ? Number(zone.w) : zone.width,
        h: "h" in zone ? Number(zone.h) : zone.height,
        center: zone.center,
        role: zone.role ?? "neutral",
        priority: "priority" in zone ? Number(zone.priority ?? 1) : 1,
        source: "structure_zone",
      });
    });
  } else {
    zones.push(...defaultCanvasZones(canvas));
  }

  scenario?.tension_paths?.forEach((path, index) => {
    const midpoint = pathMidpoint(path);
    const size = 160;
    zones.push({
      id: `path_zone_${index}`,
      x: midpoint.x - size / 2,
      y: midpoint.y - size / 2,
      w: size,
      h: size,
      center: midpoint,
      role: "scenario_path",
      priority: 1.25,
      source: "tension_path",
    });
  });

  const rhythmPattern = composition && "rhythm_pattern" in composition ? composition.rhythm_pattern : null;
  if (rhythmPattern && typeof rhythmPattern === "object" && "beats" in rhythmPattern && Array.isArray(rhythmPattern.beats)) {
    rhythmPattern.beats.forEach((beat: { x?: number; y?: number; influence_radius?: number; weight?: number }, index: number) => {
      const size = beat.influence_radius ?? 120;
      const x = beat.x ?? canvas.width / 2;
      const y = beat.y ?? canvas.height / 2;
      zones.push({
        id: `rhythm_zone_${index}`,
        x: x - size / 2,
        y: y - size / 2,
        w: size,
        h: size,
        center: { x, y },
        role: "rhythm",
        priority: beat.weight ?? 1,
        source: "composition_rhythm",
      });
    });
  }

  return zones
    .filter((zone) => zone.w > 0 && zone.h > 0 && zone.x + zone.w >= 0 && zone.y + zone.h >= 0 && zone.x <= canvas.width && zone.y <= canvas.height)
    .map((zone) => {
      const x1 = Math.min(Math.max(zone.x, 0), canvas.width);
      const y1 = Math.min(Math.max(zone.y, 0), canvas.height);
      const x2 = Math.min(Math.max(zone.x + zone.w, 0), canvas.width);
      const y2 = Math.min(Math.max(zone.y + zone.h, 0), canvas.height);
      const w = Math.max(x2 - x1, 1);
      const h = Math.max(y2 - y1, 1);
      return { ...zone, x: x1, y: y1, w, h, center: { x: x1 + w / 2, y: y1 + h / 2 } };
    })
    .sort((a, b) => b.priority - a.priority);
}

function resolveGapBetweenRoles(roleA: TextLayoutV2Role, roleB: TextLayoutV2Role, matrix: CollisionMatrix, settings: RequiredSettings) {
  const relation = matrix[`${roleA}_vs_${roleB}`] ?? matrix[`${roleB}_vs_${roleA}`] ?? "normal";
  if (relation === "strict") return settings.min_gap * 2;
  if (relation === "relaxed") return settings.min_gap * 0.5;
  if (relation === "loose") return 0;
  return settings.min_gap;
}

function boundsOutsideArea(bounds: Bounds, area: { x: number; y: number; width: number; height: number }) {
  return bounds.x < area.x || bounds.y < area.y || bounds.x + bounds.w > area.x + area.width || bounds.y + bounds.h > area.y + area.height;
}

function violatesProtectedZones(item: TextLayoutV2Item, protectedZones: ProtectedZone[], settings: RequiredSettings) {
  const bounds = estimateTextBounds(item, settings);

  return protectedZones.some((zone) => {
    if (zone.type === "rect") {
      return zone.strength === "hard" && boundsOverlap(bounds, zone.bounds, 0);
    }
    if (zone.type === "circle") {
      const intersects = rectIntersectsCircle(bounds, zone);
      return zone.strength === "hard" ? intersects : ["text_echo_constellation", "stray_letter", "grammar_particle"].includes(item.role) && intersects;
    }
    return boundsOutsideArea(bounds, zone.area);
  });
}

function getCachedBounds(item: TextLayoutV2Item, boundsCache: BoundsCache, settings: RequiredSettings) {
  return boundsCache[item.id] ?? estimateTextBounds(item, settings);
}

function cacheItemBounds(boundsCache: BoundsCache, item: TextLayoutV2Item, settings: RequiredSettings) {
  boundsCache[item.id] = estimateTextBounds(item, settings);
  return boundsCache;
}

function overlapsWithPlacedItems(
  item: TextLayoutV2Item,
  placedItems: TextLayoutV2Item[],
  matrix: CollisionMatrix,
  boundsCache: BoundsCache,
  settings: RequiredSettings,
) {
  const bounds = getCachedBounds(item, boundsCache, settings);

  return placedItems.some((placed) => {
    const gap = resolveGapBetweenRoles(item.role, placed.role, matrix, settings);
    return boundsOverlap(bounds, getCachedBounds(placed, boundsCache, settings), gap);
  });
}

function canPlace(
  item: TextLayoutV2Item,
  placedItems: TextLayoutV2Item[],
  protectedZones: ProtectedZone[],
  matrix: CollisionMatrix,
  boundsCache: BoundsCache,
  settings: RequiredSettings,
) {
  return !violatesProtectedZones(item, protectedZones, settings) && !overlapsWithPlacedItems(item, placedItems, matrix, boundsCache, settings);
}

function clampItemToCanvas<T extends ExtendedTextItem>(item: T, canvas: TextLayoutV2Canvas, settings: RequiredSettings): T {
  const candidate = { ...item };
  let bounds = estimateTextBounds(candidate, settings);

  if (bounds.x < 0) candidate.x += Math.abs(bounds.x);
  if (bounds.y < 0) candidate.y += Math.abs(bounds.y);
  bounds = estimateTextBounds(candidate, settings);
  if (bounds.x + bounds.w > canvas.width) candidate.x -= bounds.x + bounds.w - canvas.width;
  if (bounds.y + bounds.h > canvas.height) candidate.y -= bounds.y + bounds.h - canvas.height;

  const margin = settings.canvas_margin || canvas.margin || 0;
  candidate.x = Math.min(Math.max(candidate.x, margin), canvas.width - margin);
  candidate.y = Math.min(Math.max(candidate.y, margin), canvas.height - margin);
  return candidate;
}

function offsetByGoldenSpiral<T extends ExtendedTextItem>(item: T, attempt: number, minGap: number): T {
  const angle = (attempt * 137.507764 * Math.PI) / 180;
  const distance = minGap + attempt * minGap * 0.85;
  return { ...item, x: item.x + Math.cos(angle) * distance, y: item.y + Math.sin(angle) * distance };
}

function zonesByRolePreference(zones: PlacementZone[], role: TextLayoutV2Role) {
  const score = (zone: PlacementZone) => {
    if (role === "peripheral_text") return (zone.role === "edge_activity" ? 10 : 0) + zone.priority;
    if (role === "sentence_fragment") return (zone.role === "edge_activity" ? 8 : 0) + zone.priority;
    if (role === "template_fragment") return (zone.role === "edge_activity" ? 8 : 0) + zone.priority;
    if (role === "wandering_word") return (zone.role === "scenario_path" ? 8 : 0) + zone.priority;
    if (role === "text_constellation") return (zone.role === "scenario_path" ? 10 : 0) + zone.priority;
    if (role === "temporal_particle") return (zone.role === "scenario_path" || zone.role === "rhythm" ? 10 : 0) + zone.priority;
    if (role === "grammar_particle") return (zone.role === "edge_activity" ? 10 : 0) + zone.priority;
    if (role === "text_echo_constellation") return (zone.role === "soft_center" ? 10 : 0) - zone.priority;
    if (role === "stray_letter" || role === "wandering_letter") return -zone.priority;
    return zone.priority;
  };
  return [...zones].sort((a, b) => score(b) - score(a));
}

function zoneAttractionStrength(itemRole: TextLayoutV2Role, zoneRole: string) {
  if (itemRole === "center_text") return 0;
  if (itemRole === "peripheral_text") return 0.4;
  if (itemRole === "sentence_fragment") return 0.28;
  if (itemRole === "template_fragment") return 0.35;
  if (itemRole === "wandering_word") return 0.3;
  if (itemRole === "wandering_letter") return 0.15;
  if (itemRole === "text_constellation" && zoneRole === "scenario_path") return 0.55;
  if (itemRole === "temporal_particle" && ["scenario_path", "rhythm"].includes(zoneRole)) return 0.5;
  if (itemRole === "text_echo_constellation") return 0.25;
  if (itemRole === "stray_letter") return 0.15;
  return 0.3;
}

function attractToZone<T extends ExtendedTextItem>(candidate: T, zones: PlacementZone[], attempt: number): T {
  const sortedZones = zonesByRolePreference(zones, candidate.role);
  const zone = sortedZones[attempt % Math.max(sortedZones.length, 1)];
  if (!zone) return candidate;
  const attraction = zoneAttractionStrength(candidate.role, zone.role);
  return {
    ...candidate,
    x: candidate.x + (zone.center.x - candidate.x) * attraction,
    y: candidate.y + (zone.center.y - candidate.y) * attraction,
    target_zone_id: zone.id,
  };
}

function zonePoint(zone: PlacementZone, role: TextLayoutV2Role, index = 0) {
  if (role === "peripheral_text") return zone.center;
  if (role === "sentence_fragment") return zone.center;
  if (role === "template_fragment") return zone.center;
  const padding = role === "text_echo_constellation" ? 36 : role === "stray_letter" || role === "wandering_letter" ? 16 : 24;
  const angle = (index * 137.507764 * Math.PI) / 180;
  const rx = Math.max(zone.w / 2 - padding, 0);
  const ry = Math.max(zone.h / 2 - padding, 0);
  return {
    x: zone.center.x + Math.cos(angle) * rx * 0.55,
    y: zone.center.y + Math.sin(angle) * ry * 0.55,
  };
}

function scaleCandidates(item: ExtendedTextItem, policy: RolePolicy[TextLayoutV2Role]) {
  const originalScale = item.scale ?? 1;
  return [0.9, 0.8, 0.7, 0.6]
    .map((step) => originalScale * step)
    .filter((scale) => scale >= policy.min_scale)
    .map((scale) => ({ ...item, scale, reduction_type: "scale", reduction_value: scale }));
}

function opacityCandidates(item: ExtendedTextItem, policy: RolePolicy[TextLayoutV2Role]) {
  const originalOpacity = item.opacity ?? 1;
  return [0.75, 0.55, 0.35]
    .map((step) => originalOpacity * step)
    .filter((opacity) => opacity >= policy.min_opacity)
    .map((opacity) => ({ ...item, opacity, reduction_type: "opacity", reduction_value: opacity }));
}

function edgeCandidates(item: ExtendedTextItem, canvas: TextLayoutV2Canvas, settings: RequiredSettings) {
  const margin = settings.canvas_margin || canvas.margin || 80;
  const base = [
    { x: margin, y: margin, anchor: "start" as const, fallback_zone: "top_left" },
    { x: canvas.width - margin, y: margin, anchor: "end" as const, fallback_zone: "top_right" },
    { x: margin, y: canvas.height - margin, anchor: "start" as const, fallback_zone: "bottom_left" },
    { x: canvas.width - margin, y: canvas.height - margin, anchor: "end" as const, fallback_zone: "bottom_right" },
  ];
  return base.map((position) => ({ ...item, ...position, reduction_type: "edge_fallback" }));
}

function roleSpecificFallbackCandidates(item: ExtendedTextItem, canvas: TextLayoutV2Canvas, settings: RequiredSettings) {
  const candidates = edgeCandidates(item, canvas, settings);
  if (item.role === "text_echo_constellation") {
    return candidates.map((candidate) => ({
      ...candidate,
      opacity: Math.max((item.opacity ?? 0.22) * 0.45, 0.08),
      scale: Math.max((item.scale ?? 1) * 0.75, 0.65),
      reduction_type: "low_opacity_echo_edge",
    }));
  }
  if (item.role === "stray_letter") {
    return candidates.map((candidate, index) => ({
      ...candidate,
      y: index < 2 ? settings.canvas_margin || canvas.margin || 80 : canvas.height - (settings.canvas_margin || canvas.margin || 80),
      scale: Math.max((item.scale ?? 1) * 0.65, 0.55),
      opacity: Math.max((item.opacity ?? 0.18) * 0.5, 0.08),
      reduction_type: "stray_edge",
    }));
  }
  if (item.role === "grammar_particle") {
    return candidates.map((candidate) => ({
      ...candidate,
      opacity: Math.max((item.opacity ?? 0.3) * 0.6, 0.12),
      scale: Math.max((item.scale ?? 1) * 0.8, 0.7),
      reduction_type: "corner_micro",
    }));
  }
  return candidates;
}

function fallbackCandidates(item: ExtendedTextItem, canvas: TextLayoutV2Canvas, policy: RolePolicy[TextLayoutV2Role], settings: RequiredSettings) {
  const candidates: ExtendedTextItem[] = [];
  if (settings.allow_edge_fallback) candidates.push(...roleSpecificFallbackCandidates(item, canvas, settings));
  if (settings.allow_scale_reduction && policy.can_reduce_scale) candidates.push(...scaleCandidates(item, policy));
  if (settings.allow_opacity_reduction && policy.can_reduce_opacity) candidates.push(...opacityCandidates(item, policy));
  if (settings.allow_scale_reduction && settings.allow_opacity_reduction && policy.can_reduce_scale && policy.can_reduce_opacity) {
    scaleCandidates(item, policy).forEach((scaled) => {
      opacityCandidates(scaled, policy).forEach((candidate) => candidates.push({ ...candidate, reduction_type: "scale_opacity" }));
    });
  }
  return candidates.sort((a, b) => (a.reduction_type ?? "").localeCompare(b.reduction_type ?? ""));
}

function tryReducedVersions(
  item: ExtendedTextItem,
  placedItems: TextLayoutV2Item[],
  canvas: TextLayoutV2Canvas,
  protectedZones: ProtectedZone[],
  matrix: CollisionMatrix,
  rolePolicy: RolePolicy,
  boundsCache: BoundsCache,
  settings: RequiredSettings,
) {
  const candidates = fallbackCandidates(item, canvas, rolePolicy[item.role], settings);
  for (const candidate of candidates) {
    const clamped = clampItemToCanvas(candidate, canvas, settings);
    if (canPlace(clamped, placedItems, protectedZones, matrix, boundsCache, settings)) {
      return { status: "placed" as const, item: clamped, moved: item.x !== clamped.x || item.y !== clamped.y, reduced: true };
    }
  }
  return { status: "failed" as const, reason: "no_reduced_candidate_placeable" };
}

function placeBySpiralAndZones(
  item: ExtendedTextItem,
  placedItems: TextLayoutV2Item[],
  canvas: TextLayoutV2Canvas,
  placementZones: PlacementZone[],
  protectedZones: ProtectedZone[],
  matrix: CollisionMatrix,
  rolePolicy: RolePolicy,
  boundsCache: BoundsCache,
  settings: RequiredSettings,
) {
  for (let attempt = 1; attempt <= settings.max_attempts_per_item; attempt += 1) {
    const candidate = clampItemToCanvas(attractToZone(offsetByGoldenSpiral(item, attempt, settings.min_gap), placementZones, attempt), canvas, settings);
    if (canPlace(candidate, placedItems, protectedZones, matrix, boundsCache, settings)) {
      return { status: "placed" as const, item: candidate, moved: true, reduced: false };
    }
  }
  return tryReducedVersions(item, placedItems, canvas, protectedZones, matrix, rolePolicy, boundsCache, settings);
}

function placeBySpiralOnly(
  item: ExtendedTextItem,
  placedItems: TextLayoutV2Item[],
  canvas: TextLayoutV2Canvas,
  protectedZones: ProtectedZone[],
  matrix: CollisionMatrix,
  rolePolicy: RolePolicy,
  boundsCache: BoundsCache,
  settings: RequiredSettings,
) {
  for (let attempt = 1; attempt <= settings.max_attempts_per_item; attempt += 1) {
    const candidate = clampItemToCanvas(offsetByGoldenSpiral(item, attempt, settings.min_gap), canvas, settings);
    if (canPlace(candidate, placedItems, protectedZones, matrix, boundsCache, settings)) {
      return { status: "placed" as const, item: candidate, moved: true, reduced: false };
    }
  }
  return tryReducedVersions(item, placedItems, canvas, protectedZones, matrix, rolePolicy, boundsCache, settings);
}

function placeByZonesOnly(
  item: ExtendedTextItem,
  placedItems: TextLayoutV2Item[],
  canvas: TextLayoutV2Canvas,
  placementZones: PlacementZone[],
  protectedZones: ProtectedZone[],
  matrix: CollisionMatrix,
  rolePolicy: RolePolicy,
  boundsCache: BoundsCache,
  settings: RequiredSettings,
) {
  const zones = zonesByRolePreference(placementZones, item.role);
  for (let index = 0; index < zones.length; index += 1) {
    const zone = zones[index];
    if (!zone) continue;
    const point = zonePoint(zone, item.role, index);
    const candidate = clampItemToCanvas({ ...item, ...point, target_zone_id: zone.id }, canvas, settings);
    if (canPlace(candidate, placedItems, protectedZones, matrix, boundsCache, settings)) {
      return { status: "placed" as const, item: candidate, moved: true, reduced: false };
    }
  }
  return tryReducedVersions(item, placedItems, canvas, protectedZones, matrix, rolePolicy, boundsCache, settings);
}

function placeItem(
  item: ExtendedTextItem,
  placedItems: TextLayoutV2Item[],
  canvas: TextLayoutV2Canvas,
  placementZones: PlacementZone[],
  protectedZones: ProtectedZone[],
  matrix: CollisionMatrix,
  rolePolicy: RolePolicy,
  boundsCache: BoundsCache,
  settings: RequiredSettings,
) {
  if (canPlace(item, placedItems, protectedZones, matrix, boundsCache, settings)) {
    return { status: "placed" as const, item, moved: false, reduced: false };
  }
  if (settings.placement_strategy === "spiral_only") {
    return placeBySpiralOnly(item, placedItems, canvas, protectedZones, matrix, rolePolicy, boundsCache, settings);
  }
  if (settings.placement_strategy === "zone_only") {
    return placeByZonesOnly(item, placedItems, canvas, placementZones, protectedZones, matrix, rolePolicy, boundsCache, settings);
  }
  return placeBySpiralAndZones(item, placedItems, canvas, placementZones, protectedZones, matrix, rolePolicy, boundsCache, settings);
}

function fallbackUnplaceableItem(
  item: ExtendedTextItem,
  placedItems: TextLayoutV2Item[],
  canvas: TextLayoutV2Canvas,
  protectedZones: ProtectedZone[],
  matrix: CollisionMatrix,
  rolePolicy: RolePolicy,
  boundsCache: BoundsCache,
  settings: RequiredSettings,
) {
  const reduced = tryReducedVersions(item, placedItems, canvas, protectedZones, matrix, rolePolicy, boundsCache, settings);
  if (reduced.status === "placed") return reduced;
  const policy = rolePolicy[item.role];
  if (settings.allow_density_reduction && policy.can_hide) return { status: "hidden" as const, item, reason: "density_reduction" };
  if (settings.allow_opacity_reduction && policy.can_reduce_opacity) {
    return {
      status: "placed" as const,
      item: { ...item, opacity: Math.max((item.opacity ?? 1) * 0.25, policy.min_opacity), reduction_type: "final_opacity_reduction" },
      moved: false,
      reduced: true,
    };
  }
  return { status: "failed" as const, item, reason: "unplaceable_no_allowed_fallback" };
}

function countOverlaps(items: TextLayoutV2Item[], matrix: CollisionMatrix, settings: RequiredSettings) {
  let total = 0;
  const cache: BoundsCache = {};
  for (let index = 0; index < items.length; index += 1) {
    for (let pairIndex = index + 1; pairIndex < items.length; pairIndex += 1) {
      const first = items[index];
      const second = items[pairIndex];
      if (!first || !second) continue;
      const gap = resolveGapBetweenRoles(first.role, second.role, matrix, settings);
      if (boundsOverlap(getCachedBounds(first, cache, settings), getCachedBounds(second, cache, settings), gap)) total += 1;
    }
  }
  return total;
}

function itemsByRole<T extends TextLayoutV2Item>(items: TextLayoutV2Item[], role: T["role"]): T[] {
  return items.filter((item): item is T => item.role === role);
}

function rebuildTextLayoutOutput(original: TextLayoutV2Output, placedItems: TextLayoutV2Item[]): TextLayoutV2Output {
  return {
    ...original,
    center_text: itemsByRole<TextLayoutV2Item>(placedItems, "center_text")[0] ?? null,
    sentence_fragments: itemsByRole<TextLayoutV2Item>(placedItems, "sentence_fragment"),
    wandering_words: itemsByRole<TextLayoutV2Item>(placedItems, "wandering_word"),
    wandering_letters: itemsByRole<TextLayoutV2Item>(placedItems, "wandering_letter"),
    peripheral_text: itemsByRole<TextLayoutV2Item>(placedItems, "peripheral_text"),
    template_fragments: itemsByRole<TextLayoutV2Item>(placedItems, "template_fragment"),
    text_constellation: itemsByRole<TextLayoutV2Item>(placedItems, "text_constellation"),
    text_echo_constellation: itemsByRole<TextEchoConstellationItem>(placedItems, "text_echo_constellation"),
    temporal_particles: itemsByRole<TextLayoutV2Item>(placedItems, "temporal_particle"),
    grammar_particles: itemsByRole<TextLayoutV2Item>(placedItems, "grammar_particle"),
    stray_letters: itemsByRole<TextLayoutV2Item>(placedItems, "stray_letter"),
    all_text: placedItems,
  };
}

function collisionSeverity(overlapsAfter: number, hiddenItems: unknown[], rejectedItems: unknown[]) {
  if (overlapsAfter === 0 && hiddenItems.length === 0 && rejectedItems.length === 0) return "clean" as const;
  if (overlapsAfter <= 2 && rejectedItems.length === 0) return "minor" as const;
  if (overlapsAfter <= 6) return "moderate" as const;
  return "critical" as const;
}

function collisionScore(overlapsBefore: number, overlapsAfter: number, movedCount: number, reducedCount: number, hiddenCount: number, rejectedCount: number) {
  const score = 100 - overlapsAfter * 12 - hiddenCount * 5 - rejectedCount * 10 - reducedCount * 2 - movedCount + (overlapsBefore > 0 && overlapsAfter === 0 ? 8 : 0);
  return Math.min(Math.max(score, 0), 100);
}

function repairSuggestions(report: Pick<TextLayoutCollisionResolverV2Report, "overlaps_after" | "hidden_count" | "rejected_count" | "moved_count" | "resolved_overlap_count" | "severity">) {
  const suggestions: string[] = [];
  if ((report.overlaps_after ?? 0) > 0) suggestions.push("increase_collision_min_gap_or_reduce_text_density");
  if (report.hidden_count > 0) suggestions.push("lower_text_layer_density_limits");
  if (report.rejected_count > 0) suggestions.push("enable_scale_or_opacity_reduction");
  if (report.resolved_overlap_count !== null && report.moved_count > report.resolved_overlap_count * 2) suggestions.push("improve_initial_text_layout_positions");
  if (report.severity === "critical") {
    suggestions.push("disable_low_priority_text_layers", "rerun_TextLayoutEngine_with_fewer_particles");
  }
  return [...new Set(suggestions)];
}

function skippedReport(): TextLayoutCollisionResolverV2Report {
  return {
    status: "skipped",
    severity: "none",
    collision_score: null,
    overlaps_before: null,
    overlaps_after: null,
    resolved_overlap_count: null,
    moved_count: 0,
    reduced_count: 0,
    hidden_count: 0,
    rejected_count: 0,
    moved_items: [],
    reduced_items: [],
    hidden_items: [],
    rejected_items: [],
    warnings: [],
    repair_suggestions: [],
  };
}

function validateResolvedOutput(output: TextLayoutV2Output, canvas: TextLayoutV2Canvas, settings: RequiredSettings) {
  const warnings: string[] = [];
  flattenTextItems(output).forEach((item) => {
    const bounds = estimateTextBounds(item, settings);
    if (bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.w > canvas.width || bounds.y + bounds.h > canvas.height) warnings.push(`RESOLVED_ITEM_OUTSIDE_CANVAS:${item.id}`);
    if (item.opacity < 0 || item.opacity > 1) warnings.push(`INVALID_TEXT_OPACITY:${item.id}`);
    if (((item as ExtendedTextItem).scale ?? 1) <= 0) warnings.push(`INVALID_TEXT_SCALE:${item.id}`);
  });
  return { status: warnings.length === 0 ? "ok" as const : "warning" as const, warnings };
}

export function runTextLayoutCollisionResolverV2(
  textLayoutOutput: TextLayoutV2Output,
  canvas: TextLayoutV2Canvas,
  structureOutput?: unknown,
  scenarioOutput?: unknown,
  compositionOutput?: unknown,
  collisionSettings: TextLayoutCollisionResolverV2Settings = {},
): TextLayoutCollisionResolverV2Output {
  const settings = normalizeSettings(collisionSettings);
  if (!settings.enabled) {
    return { resolved_text_layout_output: textLayoutOutput, collision_report: skippedReport() };
  }

  const rolePolicy = buildRolePolicy(settings);
  const matrix = buildCollisionMatrix(settings);
  const protectedZones = buildProtectedZones(textLayoutOutput, canvas, structureOutput, compositionOutput, settings);
  const placementZones = buildPlacementZones(canvas, structureOutput, scenarioOutput, compositionOutput);
  const allItems = normalizeTextItems(flattenTextItems(textLayoutOutput));
  const limitedItems = applyRoleDensityLimits(applyGlobalTextLimit(allItems, settings.max_total_text_items, rolePolicy, settings.role_priority), settings.role_density_limits, rolePolicy);
  const sortedItems = sortByRolePriority(limitedItems, settings.role_priority);
  const boundsCache: BoundsCache = {};
  const placedItems: TextLayoutV2Item[] = [];
  const movedItems: TextLayoutCollisionResolverV2Report["moved_items"] = [];
  const reducedItems: TextLayoutCollisionResolverV2Report["reduced_items"] = [];
  const hiddenItems: TextLayoutCollisionResolverV2Report["hidden_items"] = [];
  const rejectedItems: TextLayoutV2Item[] = [];
  const warnings: string[] = [];
  const overlapsBefore = countOverlaps(sortedItems, matrix, settings);

  sortedItems.forEach((item) => {
    const candidate = clampItemToCanvas(item, canvas, settings);
    const policy = rolePolicy[item.role];

    if (policy.fixed) {
      placedItems.push(candidate);
      cacheItemBounds(boundsCache, candidate, settings);
      return;
    }

    const placement = placeItem(candidate, placedItems, canvas, placementZones, protectedZones, matrix, rolePolicy, boundsCache, settings);

    if (placement.status === "placed") {
      placedItems.push(placement.item);
      cacheItemBounds(boundsCache, placement.item, settings);
      if (placement.moved) {
        movedItems.push({ id: item.id, role: item.role, from: { x: item.x, y: item.y }, to: { x: placement.item.x, y: placement.item.y }, target_zone_id: (placement.item as ExtendedTextItem).target_zone_id ?? (placement.item as ExtendedTextItem).fallback_zone ?? null });
      }
      if (placement.reduced) {
        reducedItems.push({ id: item.id, role: item.role, original_scale: item.scale ?? 1, resolved_scale: (placement.item as ExtendedTextItem).scale ?? 1, original_opacity: item.opacity ?? 1, resolved_opacity: placement.item.opacity ?? 1, reduction_type: (placement.item as ExtendedTextItem).reduction_type ?? "unknown" });
      }
      return;
    }

    const fallback = fallbackUnplaceableItem(candidate, placedItems, canvas, protectedZones, matrix, rolePolicy, boundsCache, settings);
    if (fallback.status === "placed") {
      placedItems.push(fallback.item);
      cacheItemBounds(boundsCache, fallback.item, settings);
      reducedItems.push({ id: item.id, role: item.role, original_scale: item.scale ?? 1, resolved_scale: (fallback.item as ExtendedTextItem).scale ?? 1, original_opacity: item.opacity ?? 1, resolved_opacity: fallback.item.opacity ?? 1, reduction_type: (fallback.item as ExtendedTextItem).reduction_type ?? "unknown" });
      return;
    }
    if (fallback.status === "hidden") {
      hiddenItems.push({ id: item.id, role: item.role, reason: fallback.reason });
      rejectedItems.push(item);
      return;
    }
    warnings.push(`UNRESOLVED_TEXT_ITEM:${item.id}`);
    rejectedItems.push(item);
  });

  const resolvedTextLayoutOutput = rebuildTextLayoutOutput(textLayoutOutput, placedItems);
  const overlapsAfter = countOverlaps(placedItems, matrix, settings);
  const severity = collisionSeverity(overlapsAfter, hiddenItems, rejectedItems);
  const resolvedOverlapCount = Math.max(overlapsBefore - overlapsAfter, 0);
  const report: TextLayoutCollisionResolverV2Report = {
    status: overlapsAfter === 0 ? "ok" : "warning",
    severity,
    collision_score: collisionScore(overlapsBefore, overlapsAfter, movedItems.length, reducedItems.length, hiddenItems.length, rejectedItems.length),
    overlaps_before: overlapsBefore,
    overlaps_after: overlapsAfter,
    resolved_overlap_count: resolvedOverlapCount,
    moved_count: movedItems.length,
    reduced_count: reducedItems.length,
    hidden_count: hiddenItems.length,
    rejected_count: rejectedItems.length,
    moved_items: movedItems,
    reduced_items: reducedItems,
    hidden_items: hiddenItems,
    rejected_items: rejectedItems,
    warnings,
    settings_snapshot: {
      min_gap: settings.min_gap,
      max_attempts_per_item: settings.max_attempts_per_item,
      placement_strategy: settings.placement_strategy,
      max_total_text_items: settings.max_total_text_items,
    },
    repair_suggestions: [],
  };
  report.repair_suggestions = repairSuggestions(report);
  report.validation = validateResolvedOutput(resolvedTextLayoutOutput, canvas, settings);

  return {
    resolved_text_layout_output: {
      ...resolvedTextLayoutOutput,
      collision_report: report,
    },
    collision_report: report,
  };
}

export const RUN = runTextLayoutCollisionResolverV2;
