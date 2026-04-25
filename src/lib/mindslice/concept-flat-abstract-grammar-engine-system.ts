import type { VisualGridPoint } from "@/lib/mindslice/concept-visual-composer-system";
import type {
  FlatAbstractPatternCanvas,
  FlatAbstractPatternPalette,
  FlatAbstractPatternSettings,
} from "@/lib/mindslice/concept-flat-abstract-pattern-engine-system";

export type FlatAbstractGrammarProfile = {
  name?:
    | "flat_abstract_balanced_play"
    | "flat_abstract_control_calm"
    | "flat_abstract_playful_dense"
    | string;
};

export type FlatAbstractZoneId =
  | "top_left"
  | "top"
  | "top_right"
  | "left"
  | "center"
  | "right"
  | "bottom_left"
  | "bottom"
  | "bottom_right";

export type FlatAbstractZone = {
  id: FlatAbstractZoneId;
  x: number;
  y: number;
  w: number;
  h: number;
  role: "edge_activity" | "soft_activity" | "breathing_space" | "secondary_activity";
};

export type FlatAbstractGrammarSettings = FlatAbstractPatternSettings & {
  max_blob_count?: number;
  max_dot_grid_count?: number;
  max_striped_circle_count?: number;
  max_radial_burst_count?: number;
  max_curved_path_count?: number;
  max_dashed_path_count?: number;
  max_micro_glyph_count?: number;
};

export type FlatAbstractGrammarRules = {
  density: "medium" | "medium_high" | "high";
  center_policy: "keep_open" | "mostly_open" | "semi_open";
  composition_logic:
    | "edge_weighted_center_breathing"
    | "calm_edge_structure"
    | "distributed_activity";
  blob_zones: FlatAbstractZoneId[];
  texture_zones: FlatAbstractZoneId[];
  curve_logic: "edge_to_edge_flow" | "few_soft_paths" | "many_flowing_paths";
  micro_glyph_logic: "distributed_edges" | "sparse_edges" | "distributed_all_edges";
  allowed_blobs: Array<"yellow_blob" | "dark_blob">;
  allowed_textures: Array<"dot_grid" | "striped_circle" | "radial_burst">;
  allowed_paths: Array<"curved_path" | "dashed_path">;
  allowed_micro_glyphs: Array<"dot" | "chevron" | "dash" | "circle_outline" | "tiny_triangle">;
  max_same_module_per_zone: number;
  max_same_color_cluster: number;
  max_micro_glyphs_per_zone: number;
  negative_space_ratio: number;
  min_distance_between_large_forms: number;
  min_distance_from_center_for_large_forms: number;
  color_logic: "dark_base_yellow_teal_light" | "reduced_palette" | "strong_yellow_teal_light";
  accent_logic: "teal_yellow_alternation" | "single_teal_or_yellow" | "multiple_accents";
};

export type FlatAbstractBlobPlan = {
  id: string;
  type: "blob";
  subtype: "corner_blob" | "edge_blob" | "band_blob";
  zone_id: FlatAbstractZoneId;
  anchor: "top_left" | "top" | "right" | "bottom_left" | "bottom";
  fill: string;
  opacity: number;
  center: VisualGridPoint;
  is_large_form: true;
};

export type FlatAbstractDotGridPlan = {
  id: string;
  type: "dot_grid";
  zone_id: FlatAbstractZoneId;
  center: VisualGridPoint;
  rows: number;
  cols: number;
  spacing: number;
  radius: number;
  color: string;
  opacity: number;
};

export type FlatAbstractStripedCirclePlan = {
  id: string;
  type: "striped_circle";
  zone_id: FlatAbstractZoneId;
  center: VisualGridPoint;
  radius: number;
  stripe_count: number;
  stripe_height: number;
  color: string;
  opacity: number;
};

export type FlatAbstractRadialBurstPlan = {
  id: string;
  type: "radial_burst";
  zone_id: FlatAbstractZoneId;
  center: VisualGridPoint;
  radius_inner: number;
  radius_outer: number;
  ray_count: number;
  color: string;
  stroke_width: number;
  opacity: number;
};

export type FlatAbstractPathPlan = {
  id: string;
  type: "curved_path" | "dashed_path";
  start: VisualGridPoint;
  end: VisualGridPoint;
  curvature: number;
  stroke: string;
  stroke_width: number;
  fill: "none";
  opacity: number;
  dasharray?: string;
};

export type FlatAbstractMicroGlyphPlan = {
  id: string;
  type: "dot" | "chevron" | "dash" | "circle_outline" | "tiny_triangle";
  zone_id: FlatAbstractZoneId;
  position: VisualGridPoint;
  color: string;
  opacity: number;
  is_micro: true;
};

export type FlatAbstractGrammarPlan = {
  canvas: FlatAbstractPatternCanvas;
  palette: FlatAbstractPatternPalette;
  profile: string;
  rules: FlatAbstractGrammarRules;
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>;
  blobs: FlatAbstractBlobPlan[];
  dot_grids: FlatAbstractDotGridPlan[];
  striped_circles: FlatAbstractStripedCirclePlan[];
  radial_bursts: FlatAbstractRadialBurstPlan[];
  curved_paths: FlatAbstractPathPlan[];
  dashed_paths: FlatAbstractPathPlan[];
  micro_glyphs: FlatAbstractMicroGlyphPlan[];
};

type FlatAbstractMemory = {
  total_items: number;
  module_counts: Record<string, number>;
  zone_counts: Partial<Record<FlatAbstractZoneId, number>>;
  color_counts: Record<string, number>;
  large_form_centers: VisualGridPoint[];
  micro_glyphs_per_zone: Partial<Record<FlatAbstractZoneId, number>>;
};

let uniqueNumber = 0;

function generateId(prefix: string) {
  uniqueNumber += 1;
  return `${prefix}_${uniqueNumber}`;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRange(seed: string, min: number, max: number) {
  const value = hashString(seed) / 4294967295;
  return min + (max - min) * value;
}

function defaultSettings(settings: FlatAbstractGrammarSettings = {}): Required<FlatAbstractGrammarSettings> {
  return {
    blob_count: 6,
    dot_grid_count: 4,
    striped_circle_count: 2,
    radial_burst_count: 6,
    curve_count: 3,
    dashed_curve_count: 2,
    micro_glyph_count: 40,
    seed: "flat-abstract-pattern",
    grammar_profile: { name: "flat_abstract_balanced_play" },
    max_blob_count: settings.max_blob_count ?? settings.blob_count ?? 6,
    max_dot_grid_count: settings.max_dot_grid_count ?? settings.dot_grid_count ?? 4,
    max_striped_circle_count:
      settings.max_striped_circle_count ?? settings.striped_circle_count ?? 2,
    max_radial_burst_count: settings.max_radial_burst_count ?? settings.radial_burst_count ?? 6,
    max_curved_path_count: settings.max_curved_path_count ?? settings.curve_count ?? 3,
    max_dashed_path_count: settings.max_dashed_path_count ?? settings.dashed_curve_count ?? 2,
    max_micro_glyph_count: settings.max_micro_glyph_count ?? settings.micro_glyph_count ?? 40,
    ...settings,
  };
}

function loadRules(
  grammarProfile: FlatAbstractGrammarProfile = { name: "flat_abstract_balanced_play" },
): FlatAbstractGrammarRules {
  if (grammarProfile.name === "flat_abstract_control_calm") {
    return {
      density: "medium",
      center_policy: "mostly_open",
      composition_logic: "calm_edge_structure",
      blob_zones: ["top_left", "bottom_right"],
      texture_zones: ["left", "right"],
      curve_logic: "few_soft_paths",
      micro_glyph_logic: "sparse_edges",
      allowed_blobs: ["dark_blob", "yellow_blob"],
      allowed_textures: ["dot_grid", "striped_circle"],
      allowed_paths: ["curved_path"],
      allowed_micro_glyphs: ["dot", "chevron"],
      max_same_module_per_zone: 1,
      max_same_color_cluster: 1,
      max_micro_glyphs_per_zone: 4,
      negative_space_ratio: 0.45,
      min_distance_between_large_forms: 220,
      min_distance_from_center_for_large_forms: 180,
      color_logic: "reduced_palette",
      accent_logic: "single_teal_or_yellow",
    };
  }

  if (grammarProfile.name === "flat_abstract_playful_dense") {
    return {
      density: "high",
      center_policy: "semi_open",
      composition_logic: "distributed_activity",
      blob_zones: ["top_left", "top_right", "bottom_left", "bottom_right", "left", "right"],
      texture_zones: ["left", "right", "bottom", "top", "top_right", "bottom_left"],
      curve_logic: "many_flowing_paths",
      micro_glyph_logic: "distributed_all_edges",
      allowed_blobs: ["yellow_blob", "dark_blob"],
      allowed_textures: ["dot_grid", "striped_circle", "radial_burst"],
      allowed_paths: ["curved_path", "dashed_path"],
      allowed_micro_glyphs: ["dot", "chevron", "dash", "circle_outline", "tiny_triangle"],
      max_same_module_per_zone: 3,
      max_same_color_cluster: 3,
      max_micro_glyphs_per_zone: 12,
      negative_space_ratio: 0.25,
      min_distance_between_large_forms: 120,
      min_distance_from_center_for_large_forms: 80,
      color_logic: "strong_yellow_teal_light",
      accent_logic: "multiple_accents",
    };
  }

  return {
    density: "medium_high",
    center_policy: "keep_open",
    composition_logic: "edge_weighted_center_breathing",
    blob_zones: ["top_left", "top_right", "bottom_left", "bottom_right"],
    texture_zones: ["left", "right", "bottom", "top_right"],
    curve_logic: "edge_to_edge_flow",
    micro_glyph_logic: "distributed_edges",
    allowed_blobs: ["yellow_blob", "dark_blob"],
    allowed_textures: ["dot_grid", "striped_circle", "radial_burst"],
    allowed_paths: ["curved_path", "dashed_path"],
    allowed_micro_glyphs: ["dot", "chevron", "dash", "circle_outline", "tiny_triangle"],
    max_same_module_per_zone: 2,
    max_same_color_cluster: 2,
    max_micro_glyphs_per_zone: 8,
    negative_space_ratio: 0.35,
    min_distance_between_large_forms: 160,
    min_distance_from_center_for_large_forms: 120,
    color_logic: "dark_base_yellow_teal_light",
    accent_logic: "teal_yellow_alternation",
  };
}

function buildZones(canvas: FlatAbstractPatternCanvas): Record<FlatAbstractZoneId, FlatAbstractZone> {
  return {
    top_left: { id: "top_left", x: 0, y: 0, w: canvas.width * 0.33, h: canvas.height * 0.33, role: "edge_activity" },
    top: { id: "top", x: canvas.width * 0.33, y: 0, w: canvas.width * 0.34, h: canvas.height * 0.25, role: "soft_activity" },
    top_right: { id: "top_right", x: canvas.width * 0.67, y: 0, w: canvas.width * 0.33, h: canvas.height * 0.33, role: "edge_activity" },
    left: { id: "left", x: 0, y: canvas.height * 0.33, w: canvas.width * 0.28, h: canvas.height * 0.34, role: "edge_activity" },
    center: { id: "center", x: canvas.width * 0.28, y: canvas.height * 0.28, w: canvas.width * 0.44, h: canvas.height * 0.44, role: "breathing_space" },
    right: { id: "right", x: canvas.width * 0.72, y: canvas.height * 0.33, w: canvas.width * 0.28, h: canvas.height * 0.34, role: "edge_activity" },
    bottom_left: { id: "bottom_left", x: 0, y: canvas.height * 0.67, w: canvas.width * 0.35, h: canvas.height * 0.33, role: "edge_activity" },
    bottom: { id: "bottom", x: canvas.width * 0.35, y: canvas.height * 0.7, w: canvas.width * 0.3, h: canvas.height * 0.3, role: "secondary_activity" },
    bottom_right: { id: "bottom_right", x: canvas.width * 0.65, y: canvas.height * 0.67, w: canvas.width * 0.35, h: canvas.height * 0.33, role: "edge_activity" },
  };
}

function initMemory(): FlatAbstractMemory {
  return {
    total_items: 0,
    module_counts: {},
    zone_counts: {},
    color_counts: {},
    large_form_centers: [],
    micro_glyphs_per_zone: {},
  };
}

function updateMemory<T extends { type: string; zone_id?: FlatAbstractZoneId; color?: string; fill?: string; center?: VisualGridPoint; is_large_form?: boolean; is_micro?: boolean }>(
  memory: FlatAbstractMemory,
  planItems: T[],
) {
  planItems.forEach((item) => {
    memory.total_items += 1;
    memory.module_counts[item.type] = (memory.module_counts[item.type] ?? 0) + 1;

    if (item.zone_id) {
      memory.zone_counts[item.zone_id] = (memory.zone_counts[item.zone_id] ?? 0) + 1;
    }

    if (item.color) {
      memory.color_counts[item.color] = (memory.color_counts[item.color] ?? 0) + 1;
    }

    if (item.fill) {
      memory.color_counts[item.fill] = (memory.color_counts[item.fill] ?? 0) + 1;
    }

    if (item.is_large_form && item.center) {
      memory.large_form_centers.push(item.center);
    }

    if (item.is_micro && item.zone_id) {
      memory.micro_glyphs_per_zone[item.zone_id] =
        (memory.micro_glyphs_per_zone[item.zone_id] ?? 0) + 1;
    }
  });

  return memory;
}

function zoneCenter(zone: FlatAbstractZone): VisualGridPoint {
  return {
    x: zone.x + zone.w / 2,
    y: zone.y + zone.h / 2,
  };
}

function zonePoint(zone: FlatAbstractZone, padding: number, seed: string): VisualGridPoint {
  const maxX = Math.max(zone.x + padding, zone.x + zone.w - padding);
  const maxY = Math.max(zone.y + padding, zone.y + zone.h - padding);

  return {
    x: seededRange(`${seed}:x`, zone.x + padding, maxX),
    y: seededRange(`${seed}:y`, zone.y + padding, maxY),
  };
}

function distance(a: VisualGridPoint, b: VisualGridPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function tooCloseToCenter(point: VisualGridPoint, centerZone: FlatAbstractZone, minDistance: number) {
  return distance(point, zoneCenter(centerZone)) < minDistance;
}

function tooCloseToLargeForms(
  point: VisualGridPoint,
  existingCenters: VisualGridPoint[],
  minDistance: number,
) {
  return existingCenters.some((center) => distance(point, center) < minDistance);
}

function densityValue(
  density: FlatAbstractGrammarRules["density"],
  values: { medium: number; medium_high: number; high: number },
) {
  return values[density];
}

function leastUsedColor(colors: string[], colorCounts: Record<string, number>) {
  return [...colors].sort((a, b) => (colorCounts[a] ?? 0) - (colorCounts[b] ?? 0))[0] ?? colors[0];
}

function leastUsedZones(zones: FlatAbstractZone[], memory: FlatAbstractMemory, count: number) {
  return [...zones]
    .sort((a, b) => (memory.zone_counts[a.id] ?? 0) - (memory.zone_counts[b.id] ?? 0))
    .slice(0, count);
}

function selectTextureColor(
  palette: FlatAbstractPatternPalette,
  rules: FlatAbstractGrammarRules,
  memory: FlatAbstractMemory,
) {
  const candidates =
    rules.color_logic === "reduced_palette"
      ? [palette.light, palette.teal]
      : [palette.light, palette.teal, palette.yellow];

  return leastUsedColor(candidates, memory.color_counts);
}

function selectAccentColor(
  palette: FlatAbstractPatternPalette,
  rules: FlatAbstractGrammarRules,
  memory: FlatAbstractMemory,
) {
  const candidates =
    rules.accent_logic === "single_teal_or_yellow"
      ? [palette.teal, palette.yellow]
      : [palette.teal, palette.yellow, palette.light];

  return leastUsedColor(candidates, memory.color_counts);
}

function selectTextureZones(
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>,
  rules: FlatAbstractGrammarRules,
  memory: FlatAbstractMemory,
  count: number,
) {
  const candidates = Object.values(zones).filter((zone) => {
    if (zone.id === "center" && rules.center_policy === "keep_open") {
      return false;
    }

    return rules.texture_zones.includes(zone.id) || zone.role === "edge_activity";
  });

  return leastUsedZones(candidates, memory, count);
}

function selectActivityZones(
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>,
  rules: FlatAbstractGrammarRules,
  memory: FlatAbstractMemory,
  count: number,
) {
  const candidates = Object.values(zones).filter((zone) => {
    if (zone.id === "center" && rules.center_policy === "keep_open") {
      return false;
    }

    return zone.role !== "breathing_space";
  });

  return leastUsedZones(candidates, memory, count);
}

function selectMicroZone(
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>,
  rules: FlatAbstractGrammarRules,
  memory: FlatAbstractMemory,
) {
  const candidates = Object.values(zones).filter((zone) => {
    if (zone.id === "center" && rules.center_policy === "keep_open") {
      return false;
    }

    return (memory.micro_glyphs_per_zone[zone.id] ?? 0) < rules.max_micro_glyphs_per_zone;
  });

  return leastUsedZones(candidates, memory, 1)[0] ?? zones.left;
}

function selectMicroType(rules: FlatAbstractGrammarRules, memory: FlatAbstractMemory) {
  return [...rules.allowed_micro_glyphs].sort(
    (a, b) => (memory.module_counts[a] ?? 0) - (memory.module_counts[b] ?? 0),
  )[0] ?? "dot";
}

function planBlobs(
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>,
  palette: FlatAbstractPatternPalette,
  rules: FlatAbstractGrammarRules,
  settings: Required<FlatAbstractGrammarSettings>,
  memory: FlatAbstractMemory,
): FlatAbstractBlobPlan[] {
  const candidateSpecs = [
    { type: "yellow_blob" as const, subtype: "corner_blob" as const, zone_id: "top_left" as const, anchor: "top_left" as const, fill: palette.yellow },
    { type: "yellow_blob" as const, subtype: "edge_blob" as const, zone_id: "right" as const, anchor: "right" as const, fill: palette.yellow },
    { type: "yellow_blob" as const, subtype: "corner_blob" as const, zone_id: "bottom_left" as const, anchor: "bottom_left" as const, fill: palette.yellow },
    { type: "dark_blob" as const, subtype: "band_blob" as const, zone_id: "top_left" as const, anchor: "top" as const, fill: palette.dark_blob },
    { type: "dark_blob" as const, subtype: "band_blob" as const, zone_id: "right" as const, anchor: "right" as const, fill: palette.dark_blob },
    { type: "dark_blob" as const, subtype: "band_blob" as const, zone_id: "bottom" as const, anchor: "bottom" as const, fill: palette.dark_blob },
  ];
  const plan: FlatAbstractBlobPlan[] = [];

  candidateSpecs.forEach((spec) => {
    if (!rules.allowed_blobs.includes(spec.type)) {
      return;
    }

    if (!rules.blob_zones.includes(spec.zone_id) && !["left", "right", "bottom"].includes(spec.zone_id)) {
      return;
    }

    const center = zoneCenter(zones[spec.zone_id]);

    if (tooCloseToCenter(center, zones.center, rules.min_distance_from_center_for_large_forms)) {
      return;
    }

    if (tooCloseToLargeForms(center, memory.large_form_centers, rules.min_distance_between_large_forms)) {
      return;
    }

    plan.push({
      id: generateId("blob_plan"),
      type: "blob",
      subtype: spec.subtype,
      zone_id: spec.zone_id,
      anchor: spec.anchor,
      fill: spec.fill,
      opacity: spec.type === "dark_blob" ? 0.92 : 1,
      center,
      is_large_form: true,
    });
  });

  return plan.slice(0, settings.max_blob_count);
}

function planDotGrids(
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>,
  palette: FlatAbstractPatternPalette,
  rules: FlatAbstractGrammarRules,
  settings: Required<FlatAbstractGrammarSettings>,
  memory: FlatAbstractMemory,
): FlatAbstractDotGridPlan[] {
  if (!rules.allowed_textures.includes("dot_grid")) {
    return [];
  }

  return selectTextureZones(zones, rules, memory, settings.max_dot_grid_count).map((zone, index) => ({
    id: generateId("dot_grid_plan"),
    type: "dot_grid",
    zone_id: zone.id,
    center: zonePoint(zone, 40, `${settings.seed}:dot-grid:${index}:${zone.id}`),
    rows: densityValue(rules.density, { medium: 6, medium_high: 8, high: 9 }),
    cols: densityValue(rules.density, { medium: 6, medium_high: 9, high: 10 }),
    spacing: densityValue(rules.density, { medium: 18, medium_high: 16, high: 14 }),
    radius: 4,
    color: selectTextureColor(palette, rules, memory),
    opacity: 0.9,
  }));
}

function planStripedCircles(
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>,
  palette: FlatAbstractPatternPalette,
  rules: FlatAbstractGrammarRules,
  settings: Required<FlatAbstractGrammarSettings>,
  memory: FlatAbstractMemory,
): FlatAbstractStripedCirclePlan[] {
  if (!rules.allowed_textures.includes("striped_circle")) {
    return [];
  }

  return selectTextureZones(zones, rules, memory, settings.max_striped_circle_count).map((zone, index) => ({
    id: generateId("striped_circle_plan"),
    type: "striped_circle",
    zone_id: zone.id,
    center: zonePoint(zone, 70, `${settings.seed}:striped:${index}:${zone.id}`),
    radius: densityValue(rules.density, { medium: 58, medium_high: 68, high: 76 }),
    stripe_count: densityValue(rules.density, { medium: 6, medium_high: 7, high: 8 }),
    stripe_height: densityValue(rules.density, { medium: 7, medium_high: 8, high: 9 }),
    color: palette.light,
    opacity: 0.95,
  }));
}

function planRadialBursts(
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>,
  palette: FlatAbstractPatternPalette,
  rules: FlatAbstractGrammarRules,
  settings: Required<FlatAbstractGrammarSettings>,
  memory: FlatAbstractMemory,
): FlatAbstractRadialBurstPlan[] {
  if (!rules.allowed_textures.includes("radial_burst")) {
    return [];
  }

  return selectActivityZones(zones, rules, memory, settings.max_radial_burst_count).map((zone, index) => ({
    id: generateId("radial_burst_plan"),
    type: "radial_burst",
    zone_id: zone.id,
    center: zonePoint(zone, 35, `${settings.seed}:burst:${index}:${zone.id}`),
    radius_inner: densityValue(rules.density, { medium: 14, medium_high: 16, high: 18 }),
    radius_outer: densityValue(rules.density, { medium: 32, medium_high: 38, high: 44 }),
    ray_count: densityValue(rules.density, { medium: 16, medium_high: 18, high: 22 }),
    color: selectAccentColor(palette, rules, memory),
    stroke_width: densityValue(rules.density, { medium: 4, medium_high: 5, high: 5 }),
    opacity: 0.9,
  }));
}

function planCurvedPaths(
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>,
  palette: FlatAbstractPatternPalette,
  rules: FlatAbstractGrammarRules,
  settings: Required<FlatAbstractGrammarSettings>,
): FlatAbstractPathPlan[] {
  if (!rules.allowed_paths.includes("curved_path")) {
    return [];
  }

  const specs = [
    { id: "curve_left", start_zone: "bottom_left" as const, end_zone: "top" as const },
    { id: "curve_right", start_zone: "top_right" as const, end_zone: "bottom_right" as const },
    { id: "curve_bottom", start_zone: "bottom_left" as const, end_zone: "bottom" as const },
  ];

  return specs.slice(0, settings.max_curved_path_count).map((spec, index) => ({
    id: spec.id,
    type: "curved_path",
    start: zonePoint(zones[spec.start_zone], 25, `${settings.seed}:curve:start:${index}`),
    end: zonePoint(zones[spec.end_zone], 25, `${settings.seed}:curve:end:${index}`),
    curvature: 0.35,
    stroke: palette.yellow,
    stroke_width: 1.4,
    fill: "none",
    opacity: 0.85,
  }));
}

function planDashedPaths(
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>,
  palette: FlatAbstractPatternPalette,
  rules: FlatAbstractGrammarRules,
  settings: Required<FlatAbstractGrammarSettings>,
): FlatAbstractPathPlan[] {
  if (!rules.allowed_paths.includes("dashed_path")) {
    return [];
  }

  const specs = [
    { id: "dash_left", start_zone: "left" as const, end_zone: "center" as const },
    { id: "dash_bottom", start_zone: "bottom" as const, end_zone: "center" as const },
  ];

  return specs.slice(0, settings.max_dashed_path_count).map((spec, index) => ({
    id: spec.id,
    type: "dashed_path",
    start: zonePoint(zones[spec.start_zone], 40, `${settings.seed}:dash:start:${index}`),
    end: zonePoint(zones[spec.end_zone], 60, `${settings.seed}:dash:end:${index}`),
    curvature: 0.25,
    stroke: palette.light,
    stroke_width: 2,
    fill: "none",
    opacity: 0.8,
    dasharray: "10 10",
  }));
}

function planMicroGlyphs(
  zones: Record<FlatAbstractZoneId, FlatAbstractZone>,
  palette: FlatAbstractPatternPalette,
  rules: FlatAbstractGrammarRules,
  settings: Required<FlatAbstractGrammarSettings>,
  memory: FlatAbstractMemory,
): FlatAbstractMicroGlyphPlan[] {
  const plan: FlatAbstractMicroGlyphPlan[] = [];
  const localMemory: FlatAbstractMemory = {
    ...memory,
    module_counts: { ...memory.module_counts },
    zone_counts: { ...memory.zone_counts },
    color_counts: { ...memory.color_counts },
    large_form_centers: [...memory.large_form_centers],
    micro_glyphs_per_zone: { ...memory.micro_glyphs_per_zone },
  };

  for (let index = 0; index < settings.max_micro_glyph_count; index += 1) {
    const zone = selectMicroZone(zones, rules, localMemory);
    const glyphType = selectMicroType(rules, localMemory);
    const item: FlatAbstractMicroGlyphPlan = {
      id: generateId("micro_glyph_plan"),
      type: glyphType,
      zone_id: zone.id,
      position: zonePoint(zone, 25, `${settings.seed}:micro:${index}:${zone.id}`),
      color: leastUsedColor([palette.light, palette.teal, palette.yellow], localMemory.color_counts),
      opacity: seededRange(`${settings.seed}:micro-opacity:${index}`, 0.55, 0.95),
      is_micro: true,
    };

    plan.push(item);
    updateMemory(localMemory, [item]);
  }

  return plan;
}

export function runFlatAbstractGrammarEngineV1(
  canvas: FlatAbstractPatternCanvas,
  grammarProfile: FlatAbstractGrammarProfile = { name: "flat_abstract_balanced_play" },
  palette: FlatAbstractPatternPalette,
  settings: FlatAbstractGrammarSettings = {},
): FlatAbstractGrammarPlan {
  uniqueNumber = 0;

  const resolvedSettings = defaultSettings(settings);
  const rules = loadRules(grammarProfile);
  const zones = buildZones(canvas);
  let memory = initMemory();
  const blobs = planBlobs(zones, palette, rules, resolvedSettings, memory);
  memory = updateMemory(memory, blobs);
  const dotGrids = planDotGrids(zones, palette, rules, resolvedSettings, memory);
  memory = updateMemory(memory, dotGrids);
  const stripedCircles = planStripedCircles(zones, palette, rules, resolvedSettings, memory);
  memory = updateMemory(memory, stripedCircles);
  const radialBursts = planRadialBursts(zones, palette, rules, resolvedSettings, memory);
  memory = updateMemory(memory, radialBursts);
  const curvedPaths = planCurvedPaths(zones, palette, rules, resolvedSettings);
  memory = updateMemory(memory, curvedPaths);
  const dashedPaths = planDashedPaths(zones, palette, rules, resolvedSettings);
  memory = updateMemory(memory, dashedPaths);
  const microGlyphs = planMicroGlyphs(zones, palette, rules, resolvedSettings, memory);

  return {
    canvas,
    palette,
    profile: grammarProfile.name ?? "flat_abstract_balanced_play",
    rules,
    zones,
    blobs,
    dot_grids: dotGrids,
    striped_circles: stripedCircles,
    radial_bursts: radialBursts,
    curved_paths: curvedPaths,
    dashed_paths: dashedPaths,
    micro_glyphs: microGlyphs,
  };
}

export const RUN = runFlatAbstractGrammarEngineV1;
