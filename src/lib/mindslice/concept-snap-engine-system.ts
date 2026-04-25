import type {
  VisualGridPoint,
  VisualLayoutGrid,
} from "@/lib/mindslice/concept-visual-composer-system";
import type { ConceptualPresetOutput } from "@/lib/mindslice/concept-conceptual-preset-system";
import {
  runSnapProfileSystemV1,
  type SnapProfileElementRole,
  type SnapProfileStyleMode,
} from "@/lib/mindslice/concept-snap-profile-system";

export type SnapEngineElementRole = "primary" | "secondary" | "accent" | "tertiary";

export type SnapEngineElement = {
  id: string;
  role: SnapEngineElementRole;
  position: VisualGridPoint;
};

export type SnapEngineOffsetRange = {
  min: number;
  mid: number;
  max: number;
};

export type SnapEngineRunInput = {
  elements: SnapEngineElement[];
  grid: VisualLayoutGrid;
  snap_strength?: number;
  offset_range?: SnapEngineOffsetRange;
  style_mode?: SnapProfileStyleMode;
  conceptual_modes?: string[];
  conceptual_preset?: {
    style_mode: ConceptualPresetOutput["style_mode"] | SnapProfileStyleMode;
    conceptual_modes: string[];
  };
};

function resolveSnapStyleMode(
  value: SnapProfileStyleMode | ConceptualPresetOutput["style_mode"] | null | undefined,
): SnapProfileStyleMode {
  if (value === "CONSTELLATION") {
    return "DEVIATION";
  }

  return value ?? "CONTROL_CALM";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: VisualGridPoint, b: VisualGridPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function interpolate(
  point: VisualGridPoint,
  target: VisualGridPoint,
  factor: number,
): VisualGridPoint {
  return {
    x: point.x + (target.x - point.x) * factor,
    y: point.y + (target.y - point.y) * factor,
  };
}

function deterministicSeed(value: string) {
  return Array.from(value).reduce((total, char, index) => {
    return total + char.charCodeAt(0) * (index + 1);
  }, 0);
}

function deterministicOffset(seed: number, amplitude: number) {
  const normalized = Math.sin(seed * 12.9898) * 43758.5453;
  const fraction = normalized - Math.floor(normalized);
  return (fraction * 2 - 1) * amplitude;
}

export function getSnapPoints(grid: VisualLayoutGrid) {
  const intersections = grid.thirds;

  return [
    ...intersections,
    grid.center,
    ...grid.thirds,
    ...grid.golden_points,
  ];
}

export function findClosest(point: VisualGridPoint, snapPoints: VisualGridPoint[]) {
  return snapPoints.reduce((closest, candidate) => {
    if (!closest) {
      return candidate;
    }

    return distance(point, candidate) < distance(point, closest) ? candidate : closest;
  }, null as VisualGridPoint | null);
}

function threshold(snapStrength: number) {
  return 48 + snapStrength * 96;
}

export function applySnap(
  element: SnapEngineElement,
  snapPoints: VisualGridPoint[],
  snapStrength: number,
): SnapEngineElement {
  const closest = findClosest(element.position, snapPoints);

  if (!closest) {
    return element;
  }

  const measuredDistance = distance(element.position, closest);

  if (measuredDistance < threshold(snapStrength)) {
    return {
      ...element,
      position: interpolate(element.position, closest, snapStrength),
    };
  }

  return element;
}

export function applyOffset(
  element: SnapEngineElement,
  offsetRange: SnapEngineOffsetRange,
): SnapEngineElement {
  const amplitude =
    element.role === "primary"
      ? offsetRange.max
      : element.role === "secondary"
        ? offsetRange.mid
        : element.role === "accent"
          ? offsetRange.min
          : offsetRange.mid;

  const xOffset = deterministicOffset(deterministicSeed(`${element.id}:x:${element.role}`), amplitude);
  const yOffset = deterministicOffset(deterministicSeed(`${element.id}:y:${element.role}`), amplitude);

  return {
    ...element,
    position: {
      x: element.position.x + xOffset,
      y: element.position.y + yOffset,
    },
  };
}

export function runSnapEngineV1(input: SnapEngineRunInput) {
  const resolvedStyleMode = resolveSnapStyleMode(
    input.conceptual_preset?.style_mode ?? input.style_mode ?? "CONTROL_CALM",
  );
  const resolvedConceptualModes =
    input.conceptual_preset?.conceptual_modes ?? input.conceptual_modes ?? [];
  const baseProfile = runSnapProfileSystemV1(
    resolvedStyleMode,
    resolvedConceptualModes,
    "secondary",
  );
  const snapStrength = clamp(input.snap_strength ?? baseProfile.snap_strength, 0, 1);
  const fallbackOffsetRange = input.offset_range ?? {
    min: runSnapProfileSystemV1(
      resolvedStyleMode,
      resolvedConceptualModes,
      "accent",
    ).offset_range,
    mid: runSnapProfileSystemV1(
      resolvedStyleMode,
      resolvedConceptualModes,
      "secondary",
    ).offset_range,
    max: runSnapProfileSystemV1(
      resolvedStyleMode,
      resolvedConceptualModes,
      "primary",
    ).offset_range,
  };

  const snapPoints = getSnapPoints(input.grid);

  return input.elements.map((element) => {
    const snapped = applySnap(element, snapPoints, snapStrength);
    const resolvedRole: SnapProfileElementRole =
      element.role === "tertiary" ? "secondary" : element.role;

    const roleProfile = runSnapProfileSystemV1(
      resolvedStyleMode,
      resolvedConceptualModes,
      resolvedRole,
    );

    return applyOffset(snapped, {
      min:
        resolvedRole === "accent"
          ? roleProfile.offset_range
          : fallbackOffsetRange.min,
      mid:
        resolvedRole === "secondary"
          ? roleProfile.offset_range
          : fallbackOffsetRange.mid,
      max:
        resolvedRole === "primary"
          ? roleProfile.offset_range
          : fallbackOffsetRange.max,
    });
  });
}
