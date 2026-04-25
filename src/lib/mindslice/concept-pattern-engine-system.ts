import {
  clamp_point_to_area,
  distance,
  point_on_circle,
  safe_area,
} from "@/lib/mindslice/concept-geometry-engine-system";
import type { VisualGridPoint } from "@/lib/mindslice/concept-visual-composer-system";
import type {
  ColorPaletteStop,
  StructureVisualZone,
  VisualRendererCanvasSettings,
} from "@/lib/mindslice/concept-visual-renderer-system";
import type { ConceptualPresetOutput } from "@/lib/mindslice/concept-conceptual-preset-system";

export type PatternCanvas = {
  width: number;
  height: number;
};

export type PatternSettings = VisualRendererCanvasSettings & {
  dot_grid_count?: number;
  dot_rows?: number;
  dot_cols?: number;
  dot_spacing?: number;
  dot_radius?: number;
  dot_opacity?: number;
  striped_circle_count?: number;
  striped_radius?: number;
  stripe_count?: number;
  stripe_height?: number;
  burst_count?: number;
  burst_inner?: number;
  burst_outer?: number;
  burst_rays?: number;
  burst_stroke?: number;
  micro_glyph_count?: number;
  pattern_seed?: string;
};

export type PatternCircle = {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity: number;
};

export type PatternLine = {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  stroke_width: number;
  opacity: number;
  stroke_linecap: "round";
};

export type PatternPolyline = {
  type: "polyline";
  points: VisualGridPoint[];
  stroke: string;
  stroke_width: number;
  fill: "none";
  opacity: number;
  stroke_linecap: "round";
  stroke_linejoin: "round";
};

export type PatternPrimitive = PatternCircle | PatternLine | PatternPolyline;

export type DotGridPattern = {
  type: "dot_grid";
  center: VisualGridPoint;
  rows: number;
  cols: number;
  spacing: number;
  dots: PatternCircle[];
};

export type StripedCirclePattern = {
  type: "striped_circle";
  center: VisualGridPoint;
  radius: number;
  stripes: PatternLine[];
};

export type RadialBurstPattern = {
  type: "radial_burst";
  center: VisualGridPoint;
  radius_inner: number;
  radius_outer: number;
  rays: PatternLine[];
};

export type PatternOutput = {
  dot_grids: DotGridPattern[];
  stripes: StripedCirclePattern[];
  radial_bursts: RadialBurstPattern[];
  micro_glyphs: PatternPrimitive[];
  all_patterns: PatternPrimitive[];
};

export type PatternConstraintContext = {
  canvas: PatternCanvas & {
    margin?: number;
  };
  primary_center: VisualGridPoint;
  style_mode: ConceptualPresetOutput["style_mode"];
};

function hashSeed(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededUnit(seed: string, salt: string) {
  const hash = hashSeed(`${seed}:${salt}`);
  const normalized = Math.sin(hash * 12.9898) * 43758.5453;

  return normalized - Math.floor(normalized);
}

function seededRange(seed: string, salt: string, min: number, max: number) {
  return min + seededUnit(seed, salt) * (max - min);
}

function seededChoice<T>(seed: string, salt: string, values: T[]) {
  return values[Math.floor(seededUnit(seed, salt) * values.length) % values.length];
}

function paletteColor(
  palette: ColorPaletteStop[],
  role: ColorPaletteStop["role"],
  fallback: string,
) {
  return palette.find((entry) => entry.role === role)?.color ?? fallback;
}

function choosePatternColor(palette: ColorPaletteStop[], seed: string, salt: string) {
  return seededChoice(seed, salt, [
    paletteColor(palette, "surface", "#DDEAF2"),
    paletteColor(palette, "accent", "#D85A7F"),
    paletteColor(palette, "ink", "#181411"),
  ]);
}

function chooseAccentOrSecondary(palette: ColorPaletteStop[], seed: string, salt: string) {
  return seededChoice(seed, salt, [
    paletteColor(palette, "accent", "#D85A7F"),
    paletteColor(palette, "surface", "#DDEAF2"),
  ]);
}

function offsetPoint(point: VisualGridPoint, dx: number, dy: number) {
  return {
    x: point.x + dx,
    y: point.y + dy,
  };
}

function selectPatternZones(zones: StructureVisualZone[], count: number) {
  return [...zones]
    .sort((left, right) => {
      const leftArea = left.width * left.height;
      const rightArea = right.width * right.height;
      const roleWeight = (zone: StructureVisualZone) =>
        zone.role === "void" ? 2 : zone.role === "support" ? 1 : 0;

      return rightArea + roleWeight(right) * 20000 - (leftArea + roleWeight(left) * 20000);
    })
    .slice(0, count);
}

function randomSafePosition(canvas: PatternCanvas, margin: number, seed: string, salt: string) {
  return {
    x: seededRange(seed, `${salt}:x`, margin, canvas.width - margin),
    y: seededRange(seed, `${salt}:y`, margin, canvas.height - margin),
  };
}

function extractPatternCenter(pattern: PatternPrimitive): VisualGridPoint {
  if (pattern.type === "circle") {
    return {
      x: pattern.cx,
      y: pattern.cy,
    };
  }

  if (pattern.type === "line") {
    return {
      x: (pattern.x1 + pattern.x2) / 2,
      y: (pattern.y1 + pattern.y2) / 2,
    };
  }

  const total = pattern.points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / Math.max(pattern.points.length, 1),
    y: total.y / Math.max(pattern.points.length, 1),
  };
}

function scalePatternOpacity(pattern: PatternPrimitive, scale: number): PatternPrimitive {
  return {
    ...pattern,
    opacity: pattern.opacity * scale,
  };
}

function clampPatternToSafeArea(pattern: PatternPrimitive, area: ReturnType<typeof safe_area>): PatternPrimitive {
  if (pattern.type === "circle") {
    const clamped = clamp_point_to_area({ x: pattern.cx, y: pattern.cy }, area);

    return {
      ...pattern,
      cx: clamped.x,
      cy: clamped.y,
    };
  }

  if (pattern.type === "line") {
    const start = clamp_point_to_area({ x: pattern.x1, y: pattern.y1 }, area);
    const end = clamp_point_to_area({ x: pattern.x2, y: pattern.y2 }, area);

    return {
      ...pattern,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
    };
  }

  return {
    ...pattern,
    points: pattern.points.map((point) => clamp_point_to_area(point, area)),
  };
}

function preventPatternFromOverpoweringFocus(
  pattern: PatternPrimitive,
  primaryCenter: VisualGridPoint,
  styleMode: ConceptualPresetOutput["style_mode"],
): PatternPrimitive {
  const distanceToFocus = distance(extractPatternCenter(pattern), primaryCenter);

  if (styleMode === "CONTROL_CALM" && distanceToFocus < 180) {
    return scalePatternOpacity(pattern, 0.45);
  }

  if (styleMode === "DEVIATION" && distanceToFocus < 120) {
    return scalePatternOpacity(pattern, 0.65);
  }

  return pattern;
}

function constrainPrimitive(
  pattern: PatternPrimitive,
  context: PatternConstraintContext,
): PatternPrimitive {
  const area = safe_area(context.canvas, context.canvas.margin ?? 80);
  const clamped = clampPatternToSafeArea(pattern, area);

  return preventPatternFromOverpoweringFocus(
    clamped,
    context.primary_center,
    context.style_mode,
  );
}

function rebuildAllPatterns(output: Omit<PatternOutput, "all_patterns">): PatternPrimitive[] {
  return [
    ...output.dot_grids.flatMap((pattern) => pattern.dots),
    ...output.stripes.flatMap((pattern) => pattern.stripes),
    ...output.radial_bursts.flatMap((pattern) => pattern.rays),
    ...output.micro_glyphs,
  ];
}

export function applyPatternConstraints(
  patternOutput: PatternOutput,
  context: PatternConstraintContext,
): PatternOutput {
  const dot_grids = patternOutput.dot_grids.map((pattern) => ({
    ...pattern,
    dots: pattern.dots.map((dot) => constrainPrimitive(dot, context) as PatternCircle),
  }));
  const stripes = patternOutput.stripes.map((pattern) => ({
    ...pattern,
    stripes: pattern.stripes.map((stripe) => constrainPrimitive(stripe, context) as PatternLine),
  }));
  const radial_bursts = patternOutput.radial_bursts.map((pattern) => ({
    ...pattern,
    rays: pattern.rays.map((ray) => constrainPrimitive(ray, context) as PatternLine),
  }));
  const micro_glyphs = patternOutput.micro_glyphs.map((glyph) =>
    constrainPrimitive(glyph, context),
  );
  const constrained = {
    dot_grids,
    stripes,
    radial_bursts,
    micro_glyphs,
  };

  return {
    ...constrained,
    all_patterns: rebuildAllPatterns(constrained),
  };
}

export function rebalancePatternOutput(
  patternOutput: PatternOutput,
  context: PatternConstraintContext,
): PatternOutput {
  const soften = (pattern: PatternPrimitive) => scalePatternOpacity(pattern, 0.76);
  const softened = {
    dot_grids: patternOutput.dot_grids.map((pattern) => ({
      ...pattern,
      dots: pattern.dots.map((dot) => soften(dot) as PatternCircle),
    })),
    stripes: patternOutput.stripes.map((pattern) => ({
      ...pattern,
      stripes: pattern.stripes.map((stripe) => soften(stripe) as PatternLine),
    })),
    radial_bursts: patternOutput.radial_bursts.map((pattern) => ({
      ...pattern,
      rays: pattern.rays.map((ray) => soften(ray) as PatternLine),
    })),
    micro_glyphs: patternOutput.micro_glyphs.map(soften),
  };

  return applyPatternConstraints(
    {
      ...softened,
      all_patterns: rebuildAllPatterns(softened),
    },
    context,
  );
}

export function generateDotGrid(
  center: VisualGridPoint,
  rows: number,
  cols: number,
  spacing: number,
  radius: number,
  color: string,
  opacity: number,
): DotGridPattern {
  const dots: PatternCircle[] = [];
  const startX = center.x - ((cols - 1) * spacing) / 2;
  const startY = center.y - ((rows - 1) * spacing) / 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      dots.push({
        type: "circle",
        cx: startX + col * spacing,
        cy: startY + row * spacing,
        r: radius,
        fill: color,
        opacity,
      });
    }
  }

  return {
    type: "dot_grid",
    center,
    rows,
    cols,
    spacing,
    dots,
  };
}

function generateDotGrids(
  zones: StructureVisualZone[],
  palette: ColorPaletteStop[],
  settings: PatternSettings,
) {
  const seed = settings.pattern_seed ?? "pattern";
  const targetZones = selectPatternZones(zones, settings.dot_grid_count ?? 3);

  return targetZones.map((zone, index) =>
    generateDotGrid(
      offsetPoint(
        zone.center,
        seededRange(seed, `dot-grid-${index}:dx`, -24, 24),
        seededRange(seed, `dot-grid-${index}:dy`, -24, 24),
      ),
      settings.dot_rows ?? 7,
      settings.dot_cols ?? 7,
      settings.dot_spacing ?? 18,
      settings.dot_radius ?? 4,
      choosePatternColor(palette, seed, `dot-grid-${index}:color`),
      settings.dot_opacity ?? 0.44,
    ),
  );
}

export function generateStripedCircle(
  center: VisualGridPoint,
  radius: number,
  stripeCount: number,
  stripeHeight: number,
  color: string,
  opacity: number,
): StripedCirclePattern {
  const stripes: PatternLine[] = [];
  const top = center.y - radius;
  const spacing = (radius * 2) / stripeCount;

  for (let index = 0; index < stripeCount; index += 1) {
    const y = top + index * spacing;
    const dy = Math.abs(center.y - y);
    const halfWidth = Math.sqrt(Math.max(0, radius * radius - dy * dy));

    stripes.push({
      type: "line",
      x1: center.x - halfWidth,
      y1: y,
      x2: center.x + halfWidth,
      y2: y,
      stroke: color,
      stroke_width: stripeHeight,
      opacity,
      stroke_linecap: "round",
    });
  }

  return {
    type: "striped_circle",
    center,
    radius,
    stripes,
  };
}

function generateStripedCircles(
  zones: StructureVisualZone[],
  palette: ColorPaletteStop[],
  settings: PatternSettings,
) {
  const seed = settings.pattern_seed ?? "pattern";
  const targetZones = selectPatternZones(zones, settings.striped_circle_count ?? 2);

  return targetZones.map((zone, index) =>
    generateStripedCircle(
      offsetPoint(
        zone.center,
        seededRange(seed, `stripe-${index}:dx`, -30, 30),
        seededRange(seed, `stripe-${index}:dy`, -30, 30),
      ),
      settings.striped_radius ?? 70,
      settings.stripe_count ?? 8,
      settings.stripe_height ?? 7,
      paletteColor(palette, "surface", "#DDEAF2"),
      0.42,
    ),
  );
}

export function generateRadialBurst(
  center: VisualGridPoint,
  radiusInner: number,
  radiusOuter: number,
  count: number,
  color: string,
  strokeWidth: number,
  opacity: number,
): RadialBurstPattern {
  const rays: PatternLine[] = [];

  for (let index = 0; index < count; index += 1) {
    const angle = index * (360 / count);
    const start = point_on_circle(center, radiusInner, angle);
    const end = point_on_circle(center, radiusOuter, angle);

    rays.push({
      type: "line",
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      stroke: color,
      stroke_width: strokeWidth,
      opacity,
      stroke_linecap: "round",
    });
  }

  return {
    type: "radial_burst",
    center,
    radius_inner: radiusInner,
    radius_outer: radiusOuter,
    rays,
  };
}

function generateRadialBursts(
  zones: StructureVisualZone[],
  palette: ColorPaletteStop[],
  settings: PatternSettings,
) {
  const seed = settings.pattern_seed ?? "pattern";
  const targetZones = selectPatternZones(zones, settings.burst_count ?? 3);

  return targetZones.map((zone, index) =>
    generateRadialBurst(
      offsetPoint(
        zone.center,
        seededRange(seed, `burst-${index}:dx`, -40, 40),
        seededRange(seed, `burst-${index}:dy`, -40, 40),
      ),
      settings.burst_inner ?? 18,
      settings.burst_outer ?? 42,
      settings.burst_rays ?? 16,
      chooseAccentOrSecondary(palette, seed, `burst-${index}:color`),
      settings.burst_stroke ?? 5,
      0.38,
    ),
  );
}

export function generateChevron(
  position: VisualGridPoint,
  size: number,
  color: string,
  opacity: number,
): PatternPolyline {
  return {
    type: "polyline",
    points: [
      { x: position.x - size, y: position.y + size / 2 },
      { x: position.x, y: position.y - size / 2 },
      { x: position.x + size, y: position.y + size / 2 },
    ],
    stroke: color,
    stroke_width: 5,
    fill: "none",
    opacity,
    stroke_linecap: "round",
    stroke_linejoin: "round",
  };
}

export function generateDash(
  position: VisualGridPoint,
  length: number,
  color: string,
  opacity: number,
): PatternLine {
  return {
    type: "line",
    x1: position.x - length / 2,
    y1: position.y,
    x2: position.x + length / 2,
    y2: position.y,
    stroke: color,
    stroke_width: 6,
    opacity,
    stroke_linecap: "round",
  };
}

export function generateTinyDot(
  position: VisualGridPoint,
  radius: number,
  color: string,
  opacity: number,
): PatternCircle {
  return {
    type: "circle",
    cx: position.x,
    cy: position.y,
    r: radius,
    fill: color,
    opacity,
  };
}

function generateMicroGlyphs(
  canvas: PatternCanvas,
  palette: ColorPaletteStop[],
  settings: PatternSettings,
) {
  const seed = settings.pattern_seed ?? "pattern";
  const count = settings.micro_glyph_count ?? 24;
  const glyphs: PatternPrimitive[] = [];

  for (let index = 0; index < count; index += 1) {
    const position = randomSafePosition(canvas, 40, seed, `glyph-${index}`);
    const glyphType = seededChoice(seed, `glyph-type-${index}`, ["chevron", "dash", "dot"] as const);
    const color = choosePatternColor(palette, seed, `glyph-color-${index}`);
    const opacity = seededRange(seed, `glyph-opacity-${index}`, 0.24, 0.58);

    if (glyphType === "chevron") {
      glyphs.push(
        generateChevron(position, seededRange(seed, `glyph-size-${index}`, 8, 16), color, opacity),
      );
    }

    if (glyphType === "dash") {
      glyphs.push(
        generateDash(position, seededRange(seed, `glyph-length-${index}`, 28, 70), color, opacity),
      );
    }

    if (glyphType === "dot") {
      glyphs.push(
        generateTinyDot(position, seededRange(seed, `glyph-radius-${index}`, 2, 5), color, opacity),
      );
    }
  }

  return glyphs;
}

export function runPatternEngineV1(
  canvas: PatternCanvas,
  structure_output: { zones: StructureVisualZone[] },
  color_output: { palette: ColorPaletteStop[] },
  pattern_settings: PatternSettings = {},
): PatternOutput {
  const dot_grids = generateDotGrids(
    structure_output.zones,
    color_output.palette,
    pattern_settings,
  );
  const stripes = generateStripedCircles(
    structure_output.zones,
    color_output.palette,
    pattern_settings,
  );
  const radial_bursts = generateRadialBursts(
    structure_output.zones,
    color_output.palette,
    pattern_settings,
  );
  const micro_glyphs = generateMicroGlyphs(
    canvas,
    color_output.palette,
    pattern_settings,
  );

  return {
    dot_grids,
    stripes,
    radial_bursts,
    micro_glyphs,
    all_patterns: [
      ...dot_grids.flatMap((pattern) => pattern.dots),
      ...stripes.flatMap((pattern) => pattern.stripes),
      ...radial_bursts.flatMap((pattern) => pattern.rays),
      ...micro_glyphs,
    ],
  };
}

export const RUN = runPatternEngineV1;
