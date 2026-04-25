import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import { runArtCompositionEngineV1 } from "@/lib/mindslice/concept-art-composition-engine-system";
import { runColorTheoryEngineV1 } from "@/lib/mindslice/concept-color-theory-engine-system";
import { runScenarioEngineV1 } from "@/lib/mindslice/concept-scenario-engine-system";
import { runStructureEngineV1 } from "@/lib/mindslice/concept-structure-engine-system";
import { runSvgRendererV1 } from "@/lib/mindslice/concept-svg-renderer-system";
import type {
  ColorVisualOutput,
  CompositionVisualOutput,
  ScenarioVisualOutput,
  StructureVisualOutput,
  VisualRendererCanvasSettings,
  VisualRendererScene,
} from "@/lib/mindslice/concept-visual-renderer-system";

export type VisualPipelineV1Output = {
  structure_output: StructureVisualOutput;
  scenario_output: ScenarioVisualOutput;
  color_output: ColorVisualOutput;
  composition_output: CompositionVisualOutput;
  svg: VisualRendererScene;
};

export function runVisualPipelineV1(
  parsed_slice: ParsedSliceObject,
  canvas_settings: VisualRendererCanvasSettings = {},
): VisualPipelineV1Output {
  const structureEngineResult = runStructureEngineV1(parsed_slice, canvas_settings);
  const structure_output = structureEngineResult.structure_output;

  const scenarioEngineResult = runScenarioEngineV1(parsed_slice, structure_output);
  const scenario_output = scenarioEngineResult.scenario_output;

  const colorTheoryEngineResult = runColorTheoryEngineV1(
    parsed_slice,
    structure_output,
    scenarioEngineResult,
  );
  const color_output = colorTheoryEngineResult.color_output;

  const artCompositionEngineResult = runArtCompositionEngineV1(
    parsed_slice,
    structure_output,
    scenarioEngineResult,
    colorTheoryEngineResult,
  );
  const composition_output = artCompositionEngineResult.composition_output;

  const svg = runSvgRendererV1(
    structure_output,
    scenario_output,
    color_output,
    composition_output,
    canvas_settings,
  );

  return {
    structure_output,
    scenario_output,
    color_output,
    composition_output,
    svg,
  };
}
