export type VisualSvgNode =
  | VisualSvgRoot
  | VisualSvgGroup
  | VisualSvgRect
  | VisualSvgCircle
  | VisualSvgLine
  | VisualSvgPath
  | VisualSvgPolygon
  | VisualSvgText;

export type VisualSvgRoot = {
  type: "svg";
  width: number;
  height: number;
  viewBox: string;
  defs: unknown[];
  children: VisualSvgNode[];
};

export type VisualSvgGroup = {
  type: "g";
  id: string;
  opacity?: number;
  expected_opacity?: number;
  children: VisualSvgNode[];
};

export type VisualSvgRect = {
  type: "rect";
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  stroke_width?: number;
  opacity?: number;
};

export type VisualSvgCircle = {
  type: "circle";
  id?: string;
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke?: string;
  stroke_width?: number;
  opacity?: number;
};

export type VisualSvgLine = {
  type: "line";
  id?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  stroke_width: number;
  opacity?: number;
};

export type VisualSvgPath = {
  type: "path";
  id?: string;
  d: string;
  fill?: string;
  stroke?: string;
  stroke_width?: number;
  opacity?: number;
};

export type VisualSvgPolygon = {
  type: "polygon";
  id?: string;
  points: string;
  fill: string;
  stroke?: string;
  stroke_width?: number;
  opacity?: number;
};

export type VisualSvgTextChild = {
  type: "tspan";
  x?: number;
  dy?: string | number;
  text: string;
};

export type VisualSvgText = {
  type: "text";
  id: string;
  role?: string;
  x: number;
  y: number;
  text: string;
  fill: string;
  opacity: number;
  font_size: number;
  rotation?: number;
  anchor?: "start" | "middle" | "end";
  baseline?: "auto" | "middle" | "hanging" | "baseline";
  font_role?: string;
  max_width?: number;
  scale?: number;
  text_anchor?: "start" | "middle" | "end";
  dominant_baseline?: "auto" | "middle" | "hanging" | "baseline";
  transform?: string;
  children?: VisualSvgTextChild[];
};

export type VisualRendererV2Canvas = {
  width: number;
  height: number;
};

export type VisualRendererV2ReadyLayer = VisualSvgNode | VisualSvgNode[];

export type VisualRendererV2PaletteReady = Record<string, string>;

export type VisualRendererV2BackgroundSelection = {
  active_kind: string;
  canvas?: VisualRendererV2Canvas;
  opacity?: number;
};

export type VisualRendererV2BackgroundResult = {
  layer: VisualRendererV2ReadyLayer;
  grammar_plan: unknown | null;
  pattern_output: unknown;
  fallback_used: boolean;
  warnings: string[];
};

export type VisualRendererV2Input = {
  canvas: VisualRendererV2Canvas;
  background_layer_ready: VisualRendererV2ReadyLayer;
  palette_ready: VisualRendererV2PaletteReady;
  structure_layer_ready: VisualRendererV2ReadyLayer;
  scenario_layer_ready: VisualRendererV2ReadyLayer;
  composition_layer_ready: VisualRendererV2ReadyLayer;
  wrapped_text_ready?: VisualRendererV2ReadyLayer | null;
};

export type VisualSvgScene = {
  svg_tree: VisualSvgRoot;
  background_layer_output: VisualRendererV2BackgroundResult;
  structure_layer: VisualSvgGroup;
  scenario_layer: VisualSvgGroup;
  composition_layer: VisualSvgGroup;
  text_layer: VisualSvgGroup | null;
};

function failVisualRendererV2(message: string): never {
  throw new Error(`MindSlice_VisualRenderer_v2: ${message}`);
}

function assertFiniteNumber(value: number, fieldName: string) {
  if (!Number.isFinite(value)) {
    failVisualRendererV2(`Missing or invalid required field: ${fieldName}.`);
  }
}

function assertCanvas(canvas: VisualRendererV2Canvas) {
  if (!canvas) {
    failVisualRendererV2("Missing required canvas.");
  }

  assertFiniteNumber(canvas.width, "canvas.width");
  assertFiniteNumber(canvas.height, "canvas.height");
}

function createSvgRoot(canvas: VisualRendererV2Canvas): VisualSvgRoot {
  assertCanvas(canvas);

  return {
    type: "svg",
    width: canvas.width,
    height: canvas.height,
    viewBox: `0 0 ${canvas.width} ${canvas.height}`,
    defs: [],
    children: [],
  };
}

function isVisualSvgNode(value: unknown): value is VisualSvgNode {
  return typeof value === "object" && value !== null && "type" in value;
}

function normalizeReadyLayer(layer: VisualRendererV2ReadyLayer, fieldName: string): VisualSvgNode[] {
  if (Array.isArray(layer)) {
    if (layer.some((node) => !isVisualSvgNode(node))) {
      failVisualRendererV2(`Invalid SVG node in ${fieldName}.`);
    }

    return layer;
  }

  if (!isVisualSvgNode(layer)) {
    failVisualRendererV2(`Missing or invalid required layer: ${fieldName}.`);
  }

  return [layer];
}

function group(id: string, layer: VisualRendererV2ReadyLayer): VisualSvgGroup {
  return {
    type: "g",
    id,
    children: normalizeReadyLayer(layer, id),
  };
}

function requireReadyLayer(
  layer: VisualRendererV2ReadyLayer | null | undefined,
  fieldName: string,
): VisualRendererV2ReadyLayer {
  if (layer === null || layer === undefined) {
    failVisualRendererV2(`Missing required layer: ${fieldName}.`);
  }

  return layer;
}

function requirePaletteReady(palette: VisualRendererV2PaletteReady) {
  if (!palette || typeof palette !== "object") {
    failVisualRendererV2("Missing required palette_ready.");
  }
}

function buildBackgroundOutput(layer: VisualRendererV2ReadyLayer): VisualRendererV2BackgroundResult {
  return {
    layer,
    grammar_plan: null,
    pattern_output: null,
    fallback_used: false,
    warnings: [],
  };
}

export function runVisualRendererV2(input: VisualRendererV2Input): VisualSvgScene {
  assertCanvas(input.canvas);
  requirePaletteReady(input.palette_ready);

  const backgroundLayer = requireReadyLayer(input.background_layer_ready, "background_layer_ready");
  const structureLayer = requireReadyLayer(input.structure_layer_ready, "structure_layer_ready");
  const scenarioLayer = requireReadyLayer(input.scenario_layer_ready, "scenario_layer_ready");
  const compositionLayer = requireReadyLayer(input.composition_layer_ready, "composition_layer_ready");
  const svgRoot = createSvgRoot(input.canvas);
  const backgroundOutput = buildBackgroundOutput(backgroundLayer);
  const backgroundGroup = group("background_layer", backgroundLayer);
  const structureGroup = group("structure_layer", structureLayer);
  const scenarioGroup = group("scenario_layer", scenarioLayer);
  const compositionGroup = group("composition_layer", compositionLayer);
  const textGroup =
    input.wrapped_text_ready === null || input.wrapped_text_ready === undefined
      ? null
      : group("text_layer", input.wrapped_text_ready);

  svgRoot.children.push(backgroundGroup);
  svgRoot.children.push(structureGroup);
  svgRoot.children.push(scenarioGroup);
  svgRoot.children.push(compositionGroup);

  if (textGroup) {
    svgRoot.children.push(textGroup);
  }

  return {
    svg_tree: svgRoot,
    background_layer_output: backgroundOutput,
    structure_layer: structureGroup,
    scenario_layer: scenarioGroup,
    composition_layer: compositionGroup,
    text_layer: textGroup,
  };
}

export const RUN = runVisualRendererV2;
