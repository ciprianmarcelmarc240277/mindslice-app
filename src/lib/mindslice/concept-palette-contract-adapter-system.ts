import type { ColorPaletteStop } from "@/lib/mindslice/concept-visual-renderer-system";

export type CanonicalPalette = {
  background: string;
  surface: string;
  ink: string;
  accent: string;
  primary: string;
  secondary: string;
  stops: string[];
};

type PaletteRecord = Record<string, unknown>;

const DEFAULT_PALETTE: CanonicalPalette = {
  background: "#F6F4EF",
  surface: "#FFFFFF",
  ink: "#1C1C1C",
  accent: "#D94F70",
  primary: "#1C1C1C",
  secondary: "#8A8A8A",
  stops: ["#F6F4EF", "#FFFFFF", "#1C1C1C", "#D94F70", "#8A8A8A"],
};

function isRecord(value: unknown): value is PaletteRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isColor(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim()) ||
      /^rgba?\(/i.test(value.trim()) ||
      /^hsla?\(/i.test(value.trim()))
  );
}

function asColor(value: unknown, fallback: string) {
  return isColor(value) ? value : fallback;
}

function arrayColor(value: unknown) {
  if (isColor(value)) {
    return value;
  }

  if (isRecord(value) && isColor(value.color)) {
    return value.color;
  }

  return null;
}

function uniqueColors(colors: string[]) {
  return [...new Set(colors.filter(isColor))];
}

export function defaultPalette(): CanonicalPalette {
  return {
    ...DEFAULT_PALETTE,
    stops: [...DEFAULT_PALETTE.stops],
  };
}

export function extractPaletteStops(palette: PaletteRecord): string[] {
  const directStops = palette.stops;

  if (Array.isArray(directStops)) {
    return uniqueColors(directStops.map(arrayColor).filter((color): color is string => color !== null));
  }

  return uniqueColors(
    Object.values(palette)
      .map((value) => {
        if (isColor(value)) {
          return value;
        }

        if (isRecord(value) && isColor(value.color)) {
          return value.color;
        }

        return null;
      })
      .filter((color): color is string => color !== null),
  );
}

export function fromPaletteArray(colors: unknown[]): CanonicalPalette {
  const stops = uniqueColors(colors.map(arrayColor).filter((color): color is string => color !== null));
  const fallback = defaultPalette();

  return {
    background: stops[0] ?? fallback.background,
    surface: stops[1] ?? stops[0] ?? fallback.surface,
    ink: stops[2] ?? fallback.ink,
    accent: stops[3] ?? stops[1] ?? fallback.accent,
    primary: stops[4] ?? stops[2] ?? fallback.primary,
    secondary: stops[5] ?? stops[1] ?? fallback.secondary,
    stops: stops.length > 0 ? stops : fallback.stops,
  };
}

export function fromPaletteObject(palette: PaletteRecord): CanonicalPalette {
  const fallback = defaultPalette();
  const stops = extractPaletteStops(palette);

  return {
    background: asColor(palette.background, asColor(palette.bg, fallback.background)),
    surface: asColor(
      palette.surface,
      asColor(palette.light, asColor(palette.background, fallback.surface)),
    ),
    ink: asColor(
      palette.ink,
      asColor(palette.dark, asColor(palette.primary, fallback.ink)),
    ),
    accent: asColor(palette.accent, asColor(palette.highlight, fallback.accent)),
    primary: asColor(palette.primary, asColor(palette.dark, fallback.primary)),
    secondary: asColor(palette.secondary, asColor(palette.mid, fallback.secondary)),
    stops: stops.length > 0 ? stops : fallback.stops,
  };
}

export function canonicalPaletteToStops(palette: CanonicalPalette): ColorPaletteStop[] {
  return [
    { id: "canonical_background", role: "background", color: palette.background, weight: 1 },
    { id: "canonical_surface", role: "surface", color: palette.surface, weight: 0.55 },
    { id: "canonical_ink", role: "ink", color: palette.ink, weight: 0.92 },
    { id: "canonical_accent", role: "accent", color: palette.accent, weight: 0.7 },
  ];
}

export function runPaletteContractAdapterV1(paletteInput: unknown): CanonicalPalette {
  if (Array.isArray(paletteInput)) {
    return fromPaletteArray(paletteInput);
  }

  if (!isRecord(paletteInput)) {
    return defaultPalette();
  }

  if ("palette" in paletteInput) {
    return runPaletteContractAdapterV1(paletteInput.palette);
  }

  if (
    "background" in paletteInput ||
    "primary" in paletteInput ||
    "accent" in paletteInput ||
    "bg" in paletteInput ||
    "ink" in paletteInput
  ) {
    return fromPaletteObject(paletteInput);
  }

  return defaultPalette();
}

export const RUN = runPaletteContractAdapterV1;
