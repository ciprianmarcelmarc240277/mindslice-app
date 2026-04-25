import type {
  ColorVisualOutput,
  CompositionVisualOutput,
  ScenarioVisualOutput,
  StructureVisualOutput,
  VisualRendererCanvasSettings,
  VisualRendererScene,
} from "@/lib/mindslice/concept-visual-renderer-system";
import { runVisualRendererV1 } from "@/lib/mindslice/concept-visual-renderer-system";

export function runSvgRendererV1(
  structure_output: StructureVisualOutput,
  scenario_output: ScenarioVisualOutput,
  color_output: ColorVisualOutput,
  composition_output: CompositionVisualOutput,
  canvas_settings: VisualRendererCanvasSettings = {},
): VisualRendererScene {
  return runVisualRendererV1({
    structure_output,
    scenario_output,
    color_output,
    composition_output,
    canvas_settings,
  });
}
