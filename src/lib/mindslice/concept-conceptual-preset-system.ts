import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import {
  runArtMovementsSystem,
  type ArtMovement,
} from "@/lib/mindslice/concept-art-movements-system";
import {
  runLiteraryMovementsSystem,
  type LiteraryMovement,
} from "@/lib/mindslice/concept-literary-movements-system";

export type ConceptualPresetName =
  | "CONTROL_CALM"
  | "DEVIATION_OF_THOUGHT"
  | "FRAGMENTED_MEANING"
  | "CONSTELLATION_MEMORY"
  | "ATTENTION_FOCUS";

export type ConceptualPresetStyleMode =
  | "CONTROL_CALM"
  | "DEVIATION"
  | "FRAGMENT"
  | "CONSTELLATION";

export type ConceptualPresetDefinition = {
  conceptual_modes: string[];
  style_mode: ConceptualPresetStyleMode;
  structure_bias: string;
  scenario_bias: string;
  color_bias: string;
  composition_bias: string;
};

export type ConceptualPresetOutput = {
  conceptual_modes: string[];
  style_mode: ConceptualPresetStyleMode;
  structure_bias: string;
  scenario_bias: string;
  color_bias: string;
  composition_bias: string;
  literary_movement: LiteraryMovement;
  art_movement: ArtMovement;
};

const PRESETS: Record<ConceptualPresetName, ConceptualPresetDefinition> = {
  CONTROL_CALM: {
    conceptual_modes: ["Swiss Typography", "Conceptual Art"],
    style_mode: "CONTROL_CALM",
    structure_bias: "strict_soft_grid",
    scenario_bias: "minimal_tension",
    color_bias: "monochrome_plus_single_accent",
    composition_bias: "centered_with_micro_offset",
  },
  DEVIATION_OF_THOUGHT: {
    conceptual_modes: ["Duchamp", "Derrida"],
    style_mode: "DEVIATION",
    structure_bias: "displaced_center",
    scenario_bias: "visible_tension",
    color_bias: "accent_conflict_point",
    composition_bias: "controlled_asymmetry",
  },
  FRAGMENTED_MEANING: {
    conceptual_modes: ["Derrida", "Barthes"],
    style_mode: "FRAGMENT",
    structure_bias: "broken_grid",
    scenario_bias: "interrupted_relations",
    color_bias: "reduced_palette_with_unstable_accent",
    composition_bias: "incomplete_forms",
  },
  CONSTELLATION_MEMORY: {
    conceptual_modes: ["Warburg", "Benjamin"],
    style_mode: "CONSTELLATION",
    structure_bias: "distributed_zones",
    scenario_bias: "network_relations",
    color_bias: "soft_contrast",
    composition_bias: "atlas_layout",
  },
  ATTENTION_FOCUS: {
    conceptual_modes: ["Crary", "Stiegler"],
    style_mode: "CONTROL_CALM",
    structure_bias: "single_focus_zone",
    scenario_bias: "directed_attention",
    color_bias: "strong_single_accent",
    composition_bias: "dominant_focus_field",
  },
};

function clonePreset(preset: ConceptualPresetDefinition): ConceptualPresetDefinition {
  return {
    conceptual_modes: [...preset.conceptual_modes],
    style_mode: preset.style_mode,
    structure_bias: preset.structure_bias,
    scenario_bias: preset.scenario_bias,
    color_bias: preset.color_bias,
    composition_bias: preset.composition_bias,
  };
}

function resolvePreset(preset_name: ConceptualPresetName | null | undefined) {
  if (preset_name && preset_name in PRESETS) {
    return clonePreset(PRESETS[preset_name]);
  }

  return clonePreset(PRESETS.CONTROL_CALM);
}

function increaseTension(scenario_bias: string) {
  if (scenario_bias === "minimal_tension") {
    return "visible_tension";
  }

  if (scenario_bias === "network_relations") {
    return "charged_network_relations";
  }

  if (scenario_bias === "directed_attention") {
    return "pressured_attention";
  }

  return scenario_bias;
}

function strengthenStructure(structure_bias: string) {
  if (structure_bias === "strict_soft_grid") {
    return "strict_grid";
  }

  if (structure_bias === "displaced_center") {
    return "structured_displacement";
  }

  if (structure_bias === "distributed_zones") {
    return "structured_distributed_zones";
  }

  return structure_bias;
}

function strengthenFocus(composition_bias: string) {
  if (composition_bias === "centered_with_micro_offset") {
    return "centered_focus_lock";
  }

  if (composition_bias === "controlled_asymmetry") {
    return "asymmetry_with_focus_lock";
  }

  if (composition_bias === "atlas_layout") {
    return "atlas_with_focus_lock";
  }

  return composition_bias;
}

function adaptToSlice(
  preset: ConceptualPresetDefinition,
  slice_context: ParsedSliceObject,
): ConceptualPresetDefinition {
  const adapted = clonePreset(preset);
  const tags = new Set(slice_context.metadata.tags.map((tag) => tag.toLowerCase()));
  const literaryMovement = runLiteraryMovementsSystem({
    dominant_values: [...slice_context.metadata.tags],
    author_intention: slice_context.content.text,
    literary_form: slice_context.content.type,
    language_style: slice_context.metadata.language,
    themes: slice_context.metadata.tags,
    reality_model: slice_context.content.text,
  }).movement_identification;
  const artMovement = runArtMovementsSystem({
    philosophy: slice_context.metadata.language,
    social_tension: slice_context.process.pipeline.join(" "),
    artist_intention: slice_context.content.text,
    visual_language: slice_context.metadata.tags,
  }).movement_identification;

  if (slice_context.metadata.intensity >= 0.85) {
    adapted.scenario_bias = increaseTension(adapted.scenario_bias);
  }

  if (tags.has("structure")) {
    adapted.structure_bias = strengthenStructure(adapted.structure_bias);
  }

  if (tags.has("perception")) {
    adapted.composition_bias = strengthenFocus(adapted.composition_bias);
  }

  if (literaryMovement === "SYMBOLISM") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Symbolism"])];
    adapted.color_bias = "soft_contrast";
    adapted.scenario_bias = increaseTension(adapted.scenario_bias);
  }

  if (literaryMovement === "AVANT_GARDE") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Avant-Garde"])];
    adapted.style_mode = "DEVIATION";
    adapted.structure_bias = "displaced_center";
    adapted.composition_bias = "controlled_asymmetry";
  }

  if (literaryMovement === "MODERNISM") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Modernism"])];
    adapted.style_mode = adapted.style_mode === "CONSTELLATION" ? "CONSTELLATION" : "FRAGMENT";
    adapted.composition_bias = "incomplete_forms";
  }

  if (literaryMovement === "POSTMODERNISM") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Postmodernism"])];
    adapted.style_mode = "CONSTELLATION";
    adapted.structure_bias = "distributed_zones";
    adapted.scenario_bias = "network_relations";
    adapted.composition_bias = "atlas_layout";
  }

  if (artMovement === "CUBISM") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Cubism"])];
    adapted.style_mode = "DEVIATION";
    adapted.structure_bias = "structured_distributed_zones";
    adapted.composition_bias = "controlled_asymmetry";
  }

  if (artMovement === "IMPRESSIONISM") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Impressionism"])];
    adapted.color_bias = "soft_contrast";
    adapted.scenario_bias = "minimal_tension";
  }

  if (artMovement === "EXPRESSIONISM") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Expressionism"])];
    adapted.style_mode = "DEVIATION";
    adapted.color_bias = "strong_single_accent";
    adapted.scenario_bias = "visible_tension";
  }

  if (artMovement === "SURREALISM") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Surrealism"])];
    adapted.style_mode = "FRAGMENT";
    adapted.scenario_bias = "interrupted_relations";
    adapted.composition_bias = "incomplete_forms";
  }

  if (artMovement === "DADAISM") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Dada"])];
    adapted.style_mode = "FRAGMENT";
    adapted.structure_bias = "broken_grid";
    adapted.scenario_bias = "interrupted_relations";
  }

  if (artMovement === "MODERNISM") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Modernist Form"])];
    adapted.structure_bias = strengthenStructure(adapted.structure_bias);
    adapted.color_bias = "monochrome_plus_single_accent";
  }

  if (artMovement === "POSTMODERNISM") {
    adapted.conceptual_modes = [...new Set([...adapted.conceptual_modes, "Postmodern Art"])];
    adapted.style_mode = "CONSTELLATION";
    adapted.structure_bias = "distributed_zones";
    adapted.composition_bias = "atlas_layout";
  }

  return adapted;
}

function buildConceptualPreset(
  preset: ConceptualPresetDefinition,
  slice_context: ParsedSliceObject,
): ConceptualPresetOutput {
  const literary = runLiteraryMovementsSystem({
    dominant_values: [...slice_context.metadata.tags],
    author_intention: slice_context.content.text,
    literary_form: slice_context.content.type,
    language_style: slice_context.metadata.language,
    themes: slice_context.metadata.tags,
    reality_model: slice_context.content.text,
  });
  const art = runArtMovementsSystem({
    philosophy: slice_context.metadata.language,
    social_tension: slice_context.process.pipeline.join(" "),
    artist_intention: slice_context.content.text,
    visual_language: slice_context.metadata.tags,
  });

  return {
    conceptual_modes: [...preset.conceptual_modes],
    style_mode: preset.style_mode,
    structure_bias: preset.structure_bias,
    scenario_bias: preset.scenario_bias,
    color_bias: preset.color_bias,
    composition_bias: preset.composition_bias,
    literary_movement: literary.movement_identification,
    art_movement: art.movement_identification,
  };
}

export function runConceptualPresetSystemV1(
  preset_name: ConceptualPresetName | null | undefined,
  slice_context: ParsedSliceObject,
): ConceptualPresetOutput {
  let preset = resolvePreset(preset_name);
  preset = adaptToSlice(preset, slice_context);
  return buildConceptualPreset(preset, slice_context);
}
