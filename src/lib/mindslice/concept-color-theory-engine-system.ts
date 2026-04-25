import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type { ScenarioEngineOutput } from "@/lib/mindslice/concept-scenario-engine-system";
import type {
  ColorPaletteStop,
  ColorVisualOutput,
  StructureVisualOutput,
} from "@/lib/mindslice/concept-visual-renderer-system";

export type ColorTheoryPalette = {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
};

export type ColorTheoryBackgroundRegion = {
  zone_id: string;
  fill: string;
  opacity: number;
};

export type ColorTheoryAccentTarget = {
  target_id: string;
  color: string;
  role: "tension_marker" | "focus_marker" | "sequence_marker";
};

export type ColorTheoryContrastRoles = {
  dominant_shape: string;
  secondary_shape: string;
  tension_line: string;
  conflict_marker: string;
};

export type ColorTheoryEngineOutput = {
  palette: ColorTheoryPalette;
  background_regions: ColorTheoryBackgroundRegion[];
  accent_targets: ColorTheoryAccentTarget[];
  contrast_roles: ColorTheoryContrastRoles;
  color_output: ColorVisualOutput;
};

function normalizeText(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolvePalette(parsedSlice: ParsedSliceObject, scenarioOutput: ScenarioEngineOutput) {
  const normalized = `${normalizeText(parsedSlice.content.text)} ${parsedSlice.metadata.tags
    .map(normalizeText)
    .join(" ")}`.trim();

  if (
    normalized.includes("conflict") ||
    normalized.includes("tension") ||
    scenarioOutput.dominant_concept?.label === "conflict"
  ) {
    return {
      background: "#F7F1EB",
      primary: "#1F1A17",
      secondary: "#7E756E",
      accent: "#C84C61",
    };
  }

  if (
    normalized.includes("growth") ||
    normalized.includes("evolve") ||
    scenarioOutput.dominant_concept?.label === "growth"
  ) {
    return {
      background: "#F4F3EA",
      primary: "#1C231B",
      secondary: "#7B8676",
      accent: "#4C8C68",
    };
  }

  if (
    normalized.includes("silence") ||
    normalized.includes("void") ||
    scenarioOutput.dominant_concept?.label === "silence"
  ) {
    return {
      background: "#F7F4EF",
      primary: "#23201D",
      secondary: "#96908A",
      accent: "#B78652",
    };
  }

  return {
    background: "#F7F3EC",
    primary: "#1E1E1E",
    secondary: "#8A8A8A",
    accent: "#D85A7F",
  };
}

function buildPaletteStops(palette: ColorTheoryPalette): ColorPaletteStop[] {
  return [
    { id: "palette_background", role: "background", color: palette.background, weight: 1 },
    { id: "palette_surface", role: "surface", color: "#FFFFFF", weight: 0.48 },
    { id: "palette_ink", role: "ink", color: palette.primary, weight: 0.92 },
    { id: "palette_accent", role: "accent", color: palette.accent, weight: 0.7 },
  ];
}

function buildBackgroundRegions(
  structureOutput: StructureVisualOutput,
  palette: ColorTheoryPalette,
): ColorTheoryBackgroundRegion[] {
  const focusZone = structureOutput.zones.find((zone) => zone.id === "focus");
  const tensionZone = structureOutput.zones.find((zone) => zone.id === "tension");

  return [
    ...(focusZone
      ? [
          {
            zone_id: focusZone.id,
            fill: palette.background,
            opacity: 1,
          },
        ]
      : []),
    ...(tensionZone
      ? [
          {
            zone_id: tensionZone.id,
            fill: palette.background,
            opacity: 1,
          },
        ]
      : []),
  ];
}

function buildAccentTargets(
  scenarioOutput: ScenarioEngineOutput,
  palette: ColorTheoryPalette,
): ColorTheoryAccentTarget[] {
  const primaryConflict = scenarioOutput.conflict_points[0];

  if (!primaryConflict) {
    return [];
  }

  return [
    {
      target_id: primaryConflict.id,
      color: palette.accent,
      role: "tension_marker",
    },
  ];
}

function buildContrastRoles(palette: ColorTheoryPalette): ColorTheoryContrastRoles {
  return {
    dominant_shape: palette.primary,
    secondary_shape: palette.secondary,
    tension_line: palette.primary,
    conflict_marker: palette.accent,
  };
}

export function runColorTheoryEngineV1(
  parsedSlice: ParsedSliceObject,
  structureOutput: StructureVisualOutput,
  scenarioOutput: ScenarioEngineOutput,
  colorBias?: string,
): ColorTheoryEngineOutput {
  const palette = resolvePalette(parsedSlice, scenarioOutput);
  const adjustedPalette =
    colorBias === "monochrome_plus_single_accent"
      ? { ...palette, secondary: "#6F6A65" }
      : colorBias === "accent_conflict_point"
        ? { ...palette, accent: "#E5486E" }
        : colorBias === "soft_contrast"
          ? { ...palette, secondary: "#9A938D", accent: "#BA8C62" }
          : colorBias === "strong_single_accent"
            ? { ...palette, accent: "#D63B5F", primary: "#171717" }
            : colorBias === "reduced_palette_with_unstable_accent"
              ? { ...palette, secondary: "#837870", accent: "#C16A3C" }
              : palette;
  const background_regions = buildBackgroundRegions(structureOutput, adjustedPalette);
  const accent_targets = buildAccentTargets(scenarioOutput, adjustedPalette);
  const contrast_roles = buildContrastRoles(adjustedPalette);

  const color_output: ColorVisualOutput = {
    palette: buildPaletteStops(adjustedPalette),
    accent_targets: accent_targets
      .map((target) => {
        const conflictPoint = scenarioOutput.conflict_points.find(
          (point) => point.id === target.target_id,
        );

        if (!conflictPoint) {
          return null;
        }

        return {
          id: target.target_id,
          point: conflictPoint.point,
          radius: 18 + conflictPoint.intensity * 18,
          color: target.color,
        };
      })
      .filter((target): target is NonNullable<typeof target> => target !== null),
    background_regions: background_regions
      .map((region) => {
        const zone = structureOutput.zones.find((entry) => entry.id === region.zone_id);

        if (!zone) {
          return null;
        }

        return {
          id: region.zone_id,
          center: zone.center,
          width: zone.width,
          height: zone.height,
          color: region.fill,
          opacity: region.opacity,
        };
      })
      .filter((region): region is NonNullable<typeof region> => region !== null),
  };

  return {
    palette: adjustedPalette,
    background_regions,
    accent_targets,
    contrast_roles,
    color_output,
  };
}
