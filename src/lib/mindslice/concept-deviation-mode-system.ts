import type { VisualPipelineControllerOutputs } from "@/lib/mindslice/concept-visual-pipeline-controller-system";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function runDeviationModeV2(
  structure: VisualPipelineControllerOutputs["structure"],
  scenario: VisualPipelineControllerOutputs["scenario"],
  color: VisualPipelineControllerOutputs["color"],
  composition: VisualPipelineControllerOutputs["composition"],
): VisualPipelineControllerOutputs {
  const shiftedZones = structure.zones.map((zone, index) => ({
    ...zone,
    x: zone.x + (index % 2 === 0 ? -18 : 24),
    y: zone.y + (index % 2 === 0 ? 14 : -12),
  }));

  const shiftedStructure = {
    ...structure,
    zones: shiftedZones,
    balance_map: {
      ...structure.balance_map,
      symmetry: "decentered" as const,
      left_weight: clamp(structure.balance_map.left_weight + 0.04, 0, 1),
      right_weight: clamp(structure.balance_map.right_weight + 0.06, 0, 1),
    },
    structure_output: {
      ...structure.structure_output,
      zones: structure.structure_output.zones.map((zone, index) => ({
        ...zone,
        center: {
          x: zone.center.x + (index % 2 === 0 ? -18 : 24),
          y: zone.center.y + (index % 2 === 0 ? 14 : -12),
        },
        role: index === 1 ? "dominant" : zone.role,
      })),
      balance_map: {
        ...structure.structure_output.balance_map,
        center_of_mass: {
          x: structure.structure_output.balance_map.center_of_mass.x + 24,
          y: structure.structure_output.balance_map.center_of_mass.y - 12,
        },
        drift: clamp(structure.structure_output.balance_map.drift + 0.08, 0, 1),
      },
    },
  };

  const intensifiedScenario = {
    ...scenario,
    tension_paths: scenario.tension_paths.map((path, index) => ({
      ...path,
      strength: clamp(path.strength + (index === 0 ? 0.18 : 0.1), 0, 1),
      type: index === 0 ? "conflict" : path.type,
    })),
    conflict_points: scenario.conflict_points.map((point, index) => ({
      ...point,
      point: {
        x: point.point.x + (index % 2 === 0 ? 12 : -10),
        y: point.point.y + (index % 2 === 0 ? -8 : 10),
      },
      strength: clamp(point.strength + 0.14, 0, 1),
      intensity: clamp(point.intensity + 0.14, 0, 1),
    })),
    scenario_output: {
      ...scenario.scenario_output,
      tension_paths: scenario.scenario_output.tension_paths.map((path, index) => ({
        ...path,
        strength: clamp(path.strength + (index === 0 ? 0.18 : 0.1), 0, 1),
      })),
      conflict_points: scenario.scenario_output.conflict_points.map((point, index) => ({
        ...point,
        point: {
          x: point.point.x + (index % 2 === 0 ? 12 : -10),
          y: point.point.y + (index % 2 === 0 ? -8 : 10),
        },
        strength: clamp(point.strength + 0.14, 0, 1),
      })),
    },
  };

  const intensifiedColor = {
    ...color,
    palette: {
      ...color.palette,
      accent: "#E5486E",
      secondary: "#72675F",
    },
    accent_targets: color.accent_targets.map((target) => ({
      ...target,
      color: "#E5486E",
    })),
    contrast_roles: {
      ...color.contrast_roles,
      conflict_marker: "#E5486E",
      tension_line: "#2A1F1B",
    },
    color_output: {
      ...color.color_output,
      palette: color.color_output.palette.map((entry) =>
        entry.role === "accent"
          ? { ...entry, color: "#E5486E", weight: clamp(entry.weight + 0.12, 0, 1) }
          : entry.role === "ink"
            ? { ...entry, color: "#2A1F1B" }
            : entry,
      ),
      accent_targets: color.color_output.accent_targets.map((target) => ({
        ...target,
        color: "#E5486E",
        radius: target.radius + 8,
      })),
    },
  };

  const intensifiedComposition = {
    ...composition,
    focus_field: {
      ...composition.focus_field,
      radius: Math.max(120, composition.focus_field.radius - 24),
      intensity: clamp(composition.focus_field.intensity + 0.12, 0, 1),
    },
    movement_field: {
      ...composition.movement_field,
      strength: clamp(composition.movement_field.strength + 0.16, 0, 1),
    },
    rhythm_pattern: composition.rhythm_pattern.map((pattern, index) => ({
      ...pattern,
      spacing: index === 0 ? "compressed" : pattern.spacing,
    })),
    composition_output: {
      ...composition.composition_output,
      focus_field: {
        ...composition.composition_output.focus_field,
        radius: Math.max(120, composition.composition_output.focus_field.radius - 24),
        strength: clamp(composition.composition_output.focus_field.strength + 0.12, 0, 1),
      },
      movement_field: composition.composition_output.movement_field.map((vector, index) => ({
        ...vector,
        start: {
          x: vector.start.x + (index % 2 === 0 ? -10 : 10),
          y: vector.start.y + (index % 2 === 0 ? 8 : -8),
        },
        end: {
          x: vector.end.x + (index % 2 === 0 ? 18 : -14),
          y: vector.end.y + (index % 2 === 0 ? -12 : 12),
        },
        strength: clamp(vector.strength + 0.16, 0, 1),
      })),
      proportion_guides: composition.composition_output.proportion_guides.map((guide, index) => ({
        ...guide,
        start: {
          x: guide.start.x + (index % 2 === 0 ? -8 : 8),
          y: guide.start.y,
        },
        end: {
          x: guide.end.x + (index % 2 === 0 ? 10 : -10),
          y: guide.end.y,
        },
      })),
    },
  };

  return {
    structure: shiftedStructure,
    scenario: intensifiedScenario,
    color: intensifiedColor,
    composition: intensifiedComposition,
  };
}
