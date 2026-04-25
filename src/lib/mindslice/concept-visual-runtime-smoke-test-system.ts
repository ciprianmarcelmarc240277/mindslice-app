import { runSvgObjectSerializerV1 } from "@/lib/mindslice/concept-svg-object-serializer-system";
import { runVisualAuditEngineV1 } from "@/lib/mindslice/concept-visual-audit-engine-system";
import {
  runVisualRendererV2,
  type VisualRendererV2Input,
} from "@/lib/mindslice/concept-visual-renderer-v2-system";

export type VisualRuntimeSmokeTestReport = {
  status: "pass" | "fail";
  renderer_output_exists: boolean;
  audit_status: "pass" | "fail";
  renderer_law_preserved: boolean;
  serializer_returns_svg_string: boolean;
  svg_string_starts_with_svg: boolean;
  svg_tree_mutated: boolean;
  errors: string[];
  svg_string_preview?: string;
};

function createSmokeInput(): VisualRendererV2Input {
  const canvas = { width: 120, height: 80 };

  return {
    canvas,
    palette_ready: {
      ink: "#000000",
      surface: "#ffffff",
    },
    background_layer_ready: {
      type: "rect",
      id: "smoke-background",
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      fill: "#ffffff",
    },
    structure_layer_ready: {
      type: "line",
      id: "smoke-structure-axis",
      x1: 0,
      y1: 0,
      x2: canvas.width,
      y2: canvas.height,
      stroke: "#000000",
      stroke_width: 1,
    },
    scenario_layer_ready: {
      type: "circle",
      id: "smoke-scenario-point",
      cx: canvas.width / 2,
      cy: canvas.height / 2,
      r: 10,
      fill: "none",
      stroke: "#000000",
      stroke_width: 1,
    },
    composition_layer_ready: {
      type: "path",
      id: "smoke-composition-path",
      d: "M 10 10 L 110 70",
      fill: "none",
      stroke: "#000000",
      stroke_width: 1,
    },
    wrapped_text_ready: {
      type: "text",
      id: "smoke-label",
      x: 20,
      y: 24,
      text: "MindSlice",
      fill: "#000000",
      opacity: 1,
      font_size: 12,
    },
  };
}

function collectErrors(result: {
  renderer_output_exists: boolean;
  audit_status: "pass" | "fail";
  renderer_law_preserved: boolean;
  serializer_returns_svg_string: boolean;
  svg_string_starts_with_svg: boolean;
  svg_tree_mutated: boolean;
}) {
  const errors: string[] = [];

  if (!result.renderer_output_exists) {
    errors.push("RENDERER_OUTPUT_MISSING");
  }

  if (result.audit_status !== "pass") {
    errors.push("AUDIT_STATUS_NOT_PASS");
  }

  if (!result.renderer_law_preserved) {
    errors.push("RENDERER_LAW_NOT_PRESERVED");
  }

  if (!result.serializer_returns_svg_string) {
    errors.push("SERIALIZER_DID_NOT_RETURN_SVG_STRING");
  }

  if (!result.svg_string_starts_with_svg) {
    errors.push("SVG_STRING_DOES_NOT_START_WITH_SVG");
  }

  if (result.svg_tree_mutated) {
    errors.push("SVG_TREE_MUTATED");
  }

  return errors;
}

export function runVisualRuntimeSmokeTestV1(): VisualRuntimeSmokeTestReport {
  const visualScene = runVisualRendererV2(createSmokeInput());
  const before = JSON.stringify(visualScene.svg_tree);
  const auditReport = runVisualAuditEngineV1({
    svg_tree: visualScene.svg_tree,
  });
  const svgString = runSvgObjectSerializerV1(visualScene.svg_tree);
  const after = JSON.stringify(visualScene.svg_tree);
  const result = {
    renderer_output_exists: Boolean(visualScene.svg_tree),
    audit_status: auditReport.status,
    renderer_law_preserved: auditReport.renderer_law_preserved,
    serializer_returns_svg_string: typeof svgString === "string" && svgString.length > 0,
    svg_string_starts_with_svg: svgString.startsWith("<svg"),
    svg_tree_mutated: before !== after,
  };
  const errors = collectErrors(result);

  return {
    status: errors.length === 0 ? "pass" : "fail",
    ...result,
    errors,
    svg_string_preview: svgString.slice(0, 120),
  };
}

export const RUN = runVisualRuntimeSmokeTestV1;
