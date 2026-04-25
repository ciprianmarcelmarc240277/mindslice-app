import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type { ColorTheoryEngineOutput } from "@/lib/mindslice/concept-color-theory-engine-system";
import type { ScenarioEngineOutput } from "@/lib/mindslice/concept-scenario-engine-system";
import type {
  CompositionFocusField,
  CompositionMovementVector,
  CompositionProportionGuide,
  CompositionVisualOutput,
  StructureVisualOutput,
} from "@/lib/mindslice/concept-visual-renderer-system";

export type ArtCompositionRhythmPattern = {
  type: "repeat" | "pulse" | "stagger";
  count: number;
  scale_sequence: number[];
  spacing: "measured" | "compressed" | "expanded";
};

export type ArtCompositionMovementField = {
  direction: "left_to_right" | "right_to_left" | "bottom_to_top" | "top_to_bottom";
  vector: {
    from: { x: number; y: number };
    to: { x: number; y: number };
  };
  strength: number;
};

export type ArtCompositionProportionGuides = {
  primary_size: number;
  secondary_size: number;
  marker_size: number;
  stroke_primary: number;
  stroke_secondary: number;
};

export type ArtCompositionEngineOutput = {
  focus_field: {
    center: { x: number; y: number };
    radius: number;
    intensity: number;
  };
  rhythm_pattern: ArtCompositionRhythmPattern[];
  movement_field: ArtCompositionMovementField;
  proportion_guides: ArtCompositionProportionGuides;
  composition_output: CompositionVisualOutput;
};

function normalizeText(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveFocusRadius(parsedSlice: ParsedSliceObject, scenarioOutput: ScenarioEngineOutput) {
  const normalized = `${normalizeText(parsedSlice.content.text)} ${parsedSlice.metadata.tags
    .map(normalizeText)
    .join(" ")}`.trim();

  if (
    normalized.includes("silence") ||
    normalized.includes("void") ||
    scenarioOutput.dominant_concept?.label === "silence"
  ) {
    return 220;
  }

  if (
    normalized.includes("conflict") ||
    normalized.includes("tension") ||
    scenarioOutput.dominant_concept?.label === "conflict"
  ) {
    return 160;
  }

  return 180;
}

function resolveFocusIntensity(
  scenarioOutput: ScenarioEngineOutput,
  colorOutput: ColorTheoryEngineOutput,
) {
  const hasAccentTargets = colorOutput.accent_targets.length > 0;
  const dominantConflict = scenarioOutput.dominant_concept?.label === "conflict";

  if (dominantConflict) {
    return 0.92;
  }

  if (hasAccentTargets) {
    return 0.88;
  }

  return 0.85;
}

function buildRhythmPattern(
  scenarioOutput: ScenarioEngineOutput,
): ArtCompositionRhythmPattern[] {
  if (scenarioOutput.progression_flow.direction === "right_to_left") {
    return [
      {
        type: "stagger",
        count: 3,
        scale_sequence: [1, 0.72, 0.44],
        spacing: "compressed",
      },
    ];
  }

  if (scenarioOutput.progression_flow.direction === "bottom_to_top") {
    return [
      {
        type: "pulse",
        count: 3,
        scale_sequence: [0.56, 0.82, 1],
        spacing: "measured",
      },
    ];
  }

  return [
    {
      type: "repeat",
      count: 3,
      scale_sequence: [1, 0.62, 0.38],
      spacing: "measured",
    },
  ];
}

function buildMovementField(
  scenarioOutput: ScenarioEngineOutput,
): ArtCompositionMovementField {
  return {
    direction: scenarioOutput.progression_flow.direction,
    vector: {
      from: scenarioOutput.progression_flow.start,
      to: scenarioOutput.progression_flow.end,
    },
    strength:
      scenarioOutput.tension_paths.reduce((sum, path) => sum + path.strength, 0) /
        Math.max(scenarioOutput.tension_paths.length, 1) || 0.7,
  };
}

function buildProportionGuides(
  structureOutput: StructureVisualOutput,
  scenarioOutput: ScenarioEngineOutput,
): ArtCompositionProportionGuides {
  const focusZone = structureOutput.zones.find((zone) => zone.id === "focus");
  const tensionDriven =
    scenarioOutput.dominant_concept?.label === "conflict" ||
    scenarioOutput.dominant_concept?.label === "tension";

  const primarySize = Math.round((focusZone?.width ?? 360) * (tensionDriven ? 0.6 : 0.67));

  return {
    primary_size: primarySize,
    secondary_size: tensionDriven ? 96 : 90,
    marker_size: tensionDriven ? 22 : 18,
    stroke_primary: tensionDriven ? 3.4 : 3,
    stroke_secondary: tensionDriven ? 1.8 : 1.5,
  };
}

function buildCompositionProportionGuides(
  structureOutput: StructureVisualOutput,
  progressionFlow: ArtCompositionMovementField,
): CompositionProportionGuide[] {
  const primary =
    structureOutput.centers.find((center) => center.id === "primary_center")?.point ??
    structureOutput.centers[0]?.point ?? { x: 540, y: 540 };

  return [
    {
      id: "proportion_axis_main",
      start: progressionFlow.vector.from,
      end: progressionFlow.vector.to,
    },
    {
      id: "proportion_axis_cross",
      start: { x: primary.x - 120, y: primary.y },
      end: { x: primary.x + 120, y: primary.y },
    },
  ];
}

function buildCompositionFocusField(
  focusField: ArtCompositionEngineOutput["focus_field"],
): CompositionFocusField {
  return {
    center: focusField.center,
    radius: focusField.radius,
    strength: focusField.intensity,
  };
}

function buildCompositionMovementField(
  movementField: ArtCompositionMovementField,
): CompositionMovementVector[] {
  return [
    {
      id: "movement_main",
      start: movementField.vector.from,
      end: movementField.vector.to,
      strength: movementField.strength,
    },
  ];
}

export function runArtCompositionEngineV1(
  parsedSlice: ParsedSliceObject,
  structureOutput: StructureVisualOutput,
  scenarioOutput: ScenarioEngineOutput,
  colorOutput: ColorTheoryEngineOutput,
  compositionBias?: string,
): ArtCompositionEngineOutput {
  const primaryCenter =
    structureOutput.centers.find((center) => center.id === "primary_center")?.point ??
    structureOutput.centers[0]?.point ?? { x: 540, y: 540 };

  const focus_field = {
    center: primaryCenter,
    radius:
      compositionBias === "dominant_focus_field"
        ? 220
        : compositionBias === "atlas_layout"
          ? 150
          : compositionBias === "incomplete_forms"
            ? 160
            : resolveFocusRadius(parsedSlice, scenarioOutput),
    intensity: resolveFocusIntensity(scenarioOutput, colorOutput),
  };

  const rhythm_pattern =
    compositionBias === "atlas_layout"
      ? [
          {
            type: "stagger" as const,
            count: 4,
            scale_sequence: [1, 0.82, 0.64, 0.46],
            spacing: "expanded" as const,
          },
        ]
      : buildRhythmPattern(scenarioOutput);
  const movement_field = buildMovementField(scenarioOutput);
  const proportion_guides =
    compositionBias === "incomplete_forms"
      ? {
          ...buildProportionGuides(structureOutput, scenarioOutput),
          primary_size: 210,
          secondary_size: 80,
          marker_size: 16,
        }
      : buildProportionGuides(structureOutput, scenarioOutput);

  const composition_output: CompositionVisualOutput = {
    proportion_guides: buildCompositionProportionGuides(
      structureOutput,
      movement_field,
    ),
    focus_field: buildCompositionFocusField(focus_field),
    movement_field: buildCompositionMovementField(movement_field),
  };

  return {
    focus_field,
    rhythm_pattern,
    movement_field,
    proportion_guides,
    composition_output,
  };
}
