import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type {
  ScenarioConflictPoint,
  ScenarioSpatialSequence,
  ScenarioTensionPath,
  ScenarioVisualOutput,
  StructureVisualOutput,
} from "@/lib/mindslice/concept-visual-renderer-system";

export type ScenarioEngineConcept = {
  id: string;
  label: string;
  score: number;
};

export type ScenarioEngineProgressionFlow = {
  direction: "left_to_right" | "right_to_left" | "bottom_to_top" | "top_to_bottom";
  start: { x: number; y: number };
  middle: { x: number; y: number };
  end: { x: number; y: number };
};

export type ScenarioEngineSequenceRegion = {
  id: string;
  zone: string;
};

export type ScenarioEngineOutput = {
  dominant_concept: ScenarioEngineConcept | null;
  secondary_concept: ScenarioEngineConcept | null;
  tension_paths: Array<
    ScenarioTensionPath & {
      type: "influence" | "conflict" | "support";
    }
  >;
  conflict_points: Array<
    ScenarioConflictPoint & {
      intensity: number;
    }
  >;
  progression_flow: ScenarioEngineProgressionFlow;
  sequence_regions: ScenarioEngineSequenceRegion[];
  scenario_output: ScenarioVisualOutput;
};

const CONCEPT_TOKEN_WEIGHTS: Array<{
  label: string;
  tokens: string[];
}> = [
  { label: "identity", tokens: ["identity", "identitate", "self", "name", "author"] },
  { label: "structure", tokens: ["structure", "schema", "grid", "order", "architecture"] },
  { label: "tension", tokens: ["tension", "pressure", "strain", "friction"] },
  { label: "conflict", tokens: ["conflict", "rupture", "fracture", "collision"] },
  { label: "growth", tokens: ["growth", "expand", "evolve", "rise", "upward"] },
  { label: "collapse", tokens: ["collapse", "fall", "down", "drop", "erosion"] },
  { label: "control", tokens: ["control", "discipline", "logic", "precision"] },
  { label: "action", tokens: ["action", "move", "gesture", "direction", "push"] },
  { label: "silence", tokens: ["silence", "void", "pause", "quiet", "empty"] },
];

function normalizeText(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractConcepts(text: string, tags: string[]) {
  const normalized = `${normalizeText(text)} ${tags.map(normalizeText).join(" ")}`.trim();

  const concepts = CONCEPT_TOKEN_WEIGHTS.map((entry, index) => {
    const score = entry.tokens.reduce((total, token) => {
      return total + (normalized.includes(token) ? 1 : 0);
    }, 0);

    return {
      id: `concept_${index + 1}`,
      label: entry.label,
      score,
    };
  })
    .filter((concept) => concept.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));

  if (concepts.length === 0) {
    return [
      { id: "concept_1", label: "identity", score: 1 },
      { id: "concept_2", label: "structure", score: 1 },
    ];
  }

  if (concepts.length === 1) {
    return [...concepts, { id: "concept_fallback", label: "structure", score: 1 }];
  }

  return concepts;
}

function selectDominant(concepts: ScenarioEngineConcept[]) {
  return concepts[0] ?? null;
}

function selectSecondary(concepts: ScenarioEngineConcept[]) {
  return concepts[1] ?? null;
}

function midpoint(path: { start: { x: number; y: number }; end: { x: number; y: number } }) {
  return {
    x: (path.start.x + path.end.x) / 2,
    y: (path.start.y + path.end.y) / 2,
  };
}

function resolveProgressionDirection(
  dominant: ScenarioEngineConcept | null,
  secondary: ScenarioEngineConcept | null,
): ScenarioEngineProgressionFlow["direction"] {
  const labels = [dominant?.label, secondary?.label].filter(Boolean).join(" ");

  if (labels.includes("collapse")) {
    return "top_to_bottom";
  }

  if (labels.includes("growth")) {
    return "bottom_to_top";
  }

  if (labels.includes("conflict") || labels.includes("tension")) {
    return "right_to_left";
  }

  return "left_to_right";
}

function buildProgressionFlow(
  direction: ScenarioEngineProgressionFlow["direction"],
  structureOutput: StructureVisualOutput,
): ScenarioEngineProgressionFlow {
  const primary =
    structureOutput.centers.find((center) => center.id === "primary_center")?.point ??
    structureOutput.centers[0]?.point ?? { x: 540, y: 540 };
  const secondary =
    structureOutput.centers.find((center) => center.id === "secondary_center")?.point ??
    structureOutput.centers[1]?.point ?? { x: 712.8, y: 486 };
  const counterpoint =
    structureOutput.centers.find((center) => center.id === "counterpoint_center")?.point ??
    structureOutput.centers[2]?.point ?? { x: 356.4, y: 648 };

  if (direction === "right_to_left") {
    return {
      direction,
      start: secondary,
      middle: primary,
      end: counterpoint,
    };
  }

  if (direction === "bottom_to_top") {
    return {
      direction,
      start: counterpoint,
      middle: primary,
      end: secondary,
    };
  }

  if (direction === "top_to_bottom") {
    return {
      direction,
      start: secondary,
      middle: primary,
      end: counterpoint,
    };
  }

  return {
    direction,
    start: counterpoint,
    middle: primary,
    end: secondary,
  };
}

function buildSequenceRegions(
  dominant: ScenarioEngineConcept | null,
  secondary: ScenarioEngineConcept | null,
): ScenarioEngineSequenceRegion[] {
  const pressureZone =
    dominant?.label === "conflict" || secondary?.label === "conflict" ? "tension" : "focus";
  const releaseZone =
    dominant?.label === "silence" || secondary?.label === "silence" ? "silence" : "tension";

  return [
    { id: "origin", zone: "silence" },
    { id: "pressure", zone: pressureZone },
    { id: "release", zone: releaseZone },
  ];
}

function buildScenarioSpatialSequence(
  progressionFlow: ScenarioEngineProgressionFlow,
): ScenarioSpatialSequence[] {
  return [
    {
      id: "sequence_main",
      points: [
        progressionFlow.start,
        progressionFlow.middle,
        progressionFlow.end,
      ],
    },
  ];
}

export function runScenarioEngineV1(
  parsedSlice: ParsedSliceObject,
  structureOutput: StructureVisualOutput,
  scenarioBias?: string,
): ScenarioEngineOutput {
  const concepts = extractConcepts(parsedSlice.content.text, parsedSlice.metadata.tags);
  const dominant_concept = selectDominant(concepts);
  const secondary_concept = selectSecondary(concepts);

  const primary =
    structureOutput.centers.find((center) => center.id === "primary_center")?.point ??
    structureOutput.centers[0]?.point ?? { x: 540, y: 540 };
  const secondary =
    structureOutput.centers.find((center) => center.id === "secondary_center")?.point ??
    structureOutput.centers[1]?.point ?? { x: 712.8, y: 486 };
  const counterpoint =
    structureOutput.centers.find((center) => center.id === "counterpoint_center")?.point ??
    structureOutput.centers[2]?.point ?? { x: 356.4, y: 648 };

  const tensionType: "influence" | "conflict" | "support" =
    scenarioBias === "interrupted_relations" || scenarioBias === "visible_tension"
      ? "conflict"
      : dominant_concept?.label === "conflict" || secondary_concept?.label === "conflict"
      ? "conflict"
      : dominant_concept?.label === "silence"
        ? "support"
        : "influence";

  const tensionStrength =
    scenarioBias === "minimal_tension"
      ? 0.52
      : scenarioBias === "visible_tension"
        ? 0.9
        : scenarioBias === "network_relations" || scenarioBias === "charged_network_relations"
          ? 0.7
          : tensionType === "conflict"
            ? 0.88
            : tensionType === "support"
              ? 0.48
              : 0.75;

  const tension_paths: ScenarioEngineOutput["tension_paths"] = [
    {
      id: "tension_01",
      start: primary,
      end: secondary,
      strength: tensionStrength,
      type: tensionType,
    },
    {
      id: "tension_02",
      start: counterpoint,
      end: primary,
      strength: dominant_concept?.label === "growth" ? 0.7 : 0.56,
      type: "support",
    },
  ];

  const conflict_points: ScenarioEngineOutput["conflict_points"] = tension_paths.map((path, index) => {
    const point = midpoint(path);
    const intensity = Math.min(1, path.strength * (path.type === "conflict" ? 0.92 : 0.7));

    return {
      id: `conflict_${String(index + 1).padStart(2, "0")}`,
      point,
      strength: intensity,
      intensity,
    };
  });

  const progressionDirection = resolveProgressionDirection(
    dominant_concept,
    secondary_concept,
  );
  const progression_flow = buildProgressionFlow(progressionDirection, structureOutput);
  const sequence_regions = buildSequenceRegions(dominant_concept, secondary_concept);
  const adjustedSequenceRegions =
    scenarioBias === "directed_attention" || scenarioBias === "pressured_attention"
      ? [
          { id: "origin", zone: "silence" },
          { id: "pressure", zone: "focus" },
          { id: "release", zone: "focus" },
        ]
      : sequence_regions;

  const scenario_output: ScenarioVisualOutput = {
    tension_paths: tension_paths.map(({ type: _type, ...path }) => path),
    conflict_points: conflict_points.map(({ intensity: _intensity, ...point }) => point),
    progression_flow: buildScenarioSpatialSequence(progression_flow),
    spatial_sequence: buildScenarioSpatialSequence(progression_flow),
  };

  return {
    dominant_concept,
    secondary_concept,
    tension_paths,
    conflict_points,
    progression_flow,
    sequence_regions: adjustedSequenceRegions,
    scenario_output,
  };
}
