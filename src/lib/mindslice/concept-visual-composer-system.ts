import type {
  VisualBlueprint,
  VisualMappedForm,
  VisualTensionLink,
} from "@/lib/mindslice/concept-visual-mapping-rules-system";
import type { ConceptualPresetOutput } from "@/lib/mindslice/concept-conceptual-preset-system";
import { runSnapEngineV1 } from "@/lib/mindslice/concept-snap-engine-system";

export type VisualCanvasSettings = {
  width?: number;
  height?: number;
  margin?: number;
  background?: string;
  style?: "minimal_elegant" | "minimal" | "structural";
  conceptual_preset?: Pick<ConceptualPresetOutput, "style_mode" | "conceptual_modes">;
};

export type VisualCanvas = {
  width: number;
  height: number;
  margin: number;
  background: string;
  style: "minimal_elegant" | "minimal" | "structural";
};

export type VisualGridPoint = {
  x: number;
  y: number;
};

export type VisualSafeArea = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type VisualLayoutGrid = {
  center: VisualGridPoint;
  thirds: VisualGridPoint[];
  golden_points: VisualGridPoint[];
  safe_area: VisualSafeArea;
};

export type VisualComposerForm = {
  concept: string;
  type: VisualMappedForm["form"];
  weight: VisualMappedForm["weight"];
  priority: VisualMappedForm["priority"];
  direction: VisualMappedForm["direction"] | null;
  relation: VisualMappedForm["position"] | null;
  x: number;
  y: number;
  size: number;
  fill: "none";
  stroke: string;
  stroke_width: number;
  opacity: number;
};

export type VisualComposerRelation =
  | {
      type: "thin_line";
      from: string;
      to: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      stroke_width: number;
      opacity: number;
    }
  | {
      type: "intersection_marker";
      at: VisualGridPoint;
      stroke: string;
      stroke_width: number;
      opacity: number;
    };

export type VisualRenderComposition = {
  canvas: VisualCanvas;
  elements: Array<VisualComposerRelation | VisualComposerForm>;
  style: {
    minimal: true;
    negative_space: "dominant";
    palette: "limited";
    texture: "none_or_subtle";
  };
};

export type VisualComposerResult = {
  canvas: VisualCanvas;
  forms: VisualComposerForm[];
  layout_grid: VisualLayoutGrid;
  visual_balance: number;
  final_elements: Array<VisualComposerRelation | VisualComposerForm>;
  render_composition: VisualRenderComposition;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function interpolate(value: number, target: number, factor: number) {
  return value + (target - value) * factor;
}

function computeThirds(canvas: VisualCanvas) {
  return [
    { x: canvas.width / 3, y: canvas.height / 3 },
    { x: (canvas.width / 3) * 2, y: canvas.height / 3 },
    { x: canvas.width / 3, y: (canvas.height / 3) * 2 },
    { x: (canvas.width / 3) * 2, y: (canvas.height / 3) * 2 },
  ];
}

function computeGoldenPoints(canvas: VisualCanvas) {
  const phi = 0.618;

  return [
    { x: canvas.width * phi, y: canvas.height * phi },
    { x: canvas.width * (1 - phi), y: canvas.height * phi },
    { x: canvas.width * phi, y: canvas.height * (1 - phi) },
    { x: canvas.width * (1 - phi), y: canvas.height * (1 - phi) },
  ];
}

function computeSafeArea(canvas: VisualCanvas) {
  return {
    left: canvas.margin,
    top: canvas.margin,
    right: canvas.width - canvas.margin,
    bottom: canvas.height - canvas.margin,
  };
}

export function initCanvas(canvasSettings: VisualCanvasSettings = {}): VisualCanvas {
  return {
    width: canvasSettings.width ?? 1080,
    height: canvasSettings.height ?? 1080,
    margin: canvasSettings.margin ?? 120,
    background: canvasSettings.background ?? "warm_white",
    style: canvasSettings.style ?? "minimal_elegant",
  };
}

export function buildGrid(canvas: VisualCanvas): VisualLayoutGrid {
  return {
    center: {
      x: canvas.width / 2,
      y: canvas.height / 2,
    },
    thirds: computeThirds(canvas),
    golden_points: computeGoldenPoints(canvas),
    safe_area: computeSafeArea(canvas),
  };
}

export function normalizeForms(visualBlueprint: VisualBlueprint) {
  return visualBlueprint.mapped_forms.map((item): VisualComposerForm => ({
    concept: item.concept,
    type: item.form,
    weight: item.weight,
    priority: item.priority,
    direction: item.direction ?? null,
    relation: item.position ?? null,
    x: 0,
    y: 0,
    size: 0,
    fill: "none" as const,
    stroke: "charcoal",
    stroke_width: 1,
    opacity: 0.92,
  }));
}

export function assignSize(forms: VisualComposerForm[], canvas: VisualCanvas) {
  return forms.map((form) => ({
    ...form,
    size:
      form.weight === "high"
        ? canvas.width *
          (form.type === "central_shape" || form.type === "square"
            ? 0.24
            : form.type === "intersection"
              ? 0.2
              : 0.22)
        : canvas.width *
          (form.type === "vector_line" || form.type === "straight_line" ? 0.11 : 0.08),
  }));
}

function findHighestPriority(forms: VisualComposerForm[]) {
  return [...forms].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    return (right.weight === "high" ? 1 : 0) - (left.weight === "high" ? 1 : 0);
  })[0];
}

function findTension(
  visualBlueprint: VisualBlueprint,
  leftConcept: string,
  rightConcept: string,
) {
  const link = visualBlueprint.tension_map.find(
    (entry) =>
      (entry.pair[0] === leftConcept && entry.pair[1] === rightConcept) ||
      (entry.pair[0] === rightConcept && entry.pair[1] === leftConcept),
  );

  return link?.tension ?? "low";
}

function seededPoint(grid: VisualLayoutGrid, seed: number, offset = 0) {
  const pointBank = [
    grid.center,
    ...grid.thirds,
    ...grid.golden_points,
    { x: grid.safe_area.left, y: grid.safe_area.top },
    { x: grid.safe_area.right, y: grid.safe_area.top },
    { x: grid.safe_area.left, y: grid.safe_area.bottom },
    { x: grid.safe_area.right, y: grid.safe_area.bottom },
  ];

  return pointBank[(seed + offset) % pointBank.length];
}

function dominantAnchor(
  dominant: VisualComposerForm,
  grid: VisualLayoutGrid,
  seed: number,
) {
  if (dominant.type === "central_shape" || dominant.relation === "center") {
    return grid.center;
  }

  if (dominant.type === "square") {
    return seededPoint(grid, seed, 1);
  }

  if (dominant.type === "intersection") {
    return seededPoint(grid, seed, 3);
  }

  if (dominant.type === "offset_position" || dominant.type === "vector_line") {
    return seededPoint(grid, seed, 5);
  }

  return seededPoint(grid, seed, 2);
}

export function assignPosition(
  forms: VisualComposerForm[],
  grid: VisualLayoutGrid,
  visualBlueprint: VisualBlueprint,
) {
  const dominant = findHighestPriority(forms);
  const seed = visualBlueprint.layout_seed % 17;
  const anchor = dominantAnchor(dominant, grid, seed);

  return forms.map((form, index) => {
    if (form.concept === dominant.concept) {
      return {
        ...form,
        x: anchor.x,
        y: anchor.y,
      };
    }

    const tension = findTension(visualBlueprint, dominant.concept, form.concept);
    const diagonalSign = (seed + index) % 2 === 0 ? 1 : -1;
    const lateralSign = (seed + index) % 3 === 0 ? -1 : 1;
    const radial = dominant.size * (form.weight === "high" ? 1.05 : 1.45);

    if (tension === "high") {
      return {
        ...form,
        x: anchor.x + radial * 0.68 * lateralSign,
        y: anchor.y + radial * 0.22 * diagonalSign,
      };
    }

    if (form.direction === "right") {
      return {
        ...form,
        x: anchor.x + radial * 1.18,
        y: anchor.y + radial * 0.1 * diagonalSign,
      };
    }

    if (form.direction === "left") {
      return {
        ...form,
        x: anchor.x - radial * 1.18,
        y: anchor.y + radial * 0.14 * diagonalSign,
      };
    }

    if (form.direction === "up") {
      return {
        ...form,
        x: anchor.x + radial * 0.12 * lateralSign,
        y: anchor.y - radial * 1.08,
      };
    }

    if (form.direction === "down") {
      return {
        ...form,
        x: anchor.x + radial * 0.1 * lateralSign,
        y: anchor.y + radial * 1.08,
      };
    }

    if (form.type === "close_proximity") {
      return {
        ...form,
        x: anchor.x + radial * 0.45 * lateralSign,
        y: anchor.y - radial * 0.18 * diagonalSign,
      };
    }

    if (form.type === "incomplete_shape") {
      const unstablePoint = seededPoint(grid, seed, index + 4);
      return {
        ...form,
        x: interpolate(unstablePoint.x, anchor.x, 0.22),
        y: interpolate(unstablePoint.y, anchor.y, 0.22),
      };
    }

    const fallbackPoint = seededPoint(grid, seed, index + 6);

    return {
      ...form,
      x: fallbackPoint.x,
      y: fallbackPoint.y,
    };
  });
}

function applySnapLayout(
  forms: VisualComposerForm[],
  grid: VisualLayoutGrid,
  visualBlueprint: VisualBlueprint,
  conceptualPreset?: Pick<ConceptualPresetOutput, "style_mode" | "conceptual_modes">,
) {
  const styleMode =
    conceptualPreset?.style_mode ??
    (visualBlueprint.semantic_axis === "conflict" || visualBlueprint.semantic_axis === "collapse"
      ? "FRAGMENT"
      : visualBlueprint.semantic_axis === "tension" ||
          visualBlueprint.semantic_axis === "action" ||
          visualBlueprint.semantic_axis === "will"
        ? "DEVIATION"
        : visualBlueprint.semantic_axis === "structure" && visualBlueprint.tension_map.every((entry) => entry.tension === "low")
          ? "STRICT_GRID"
          : "CONTROL_CALM");
  const conceptualModes =
    conceptualPreset?.conceptual_modes ??
    [
    ...(visualBlueprint.semantic_axis === "structure" ? ["Swiss Typography"] : []),
    ...(visualBlueprint.semantic_axis === "conflict" ? ["Derrida"] : []),
    ...(visualBlueprint.semantic_axis === "action" ? ["Duchamp"] : []),
    ...(visualBlueprint.semantic_axis === "identity" ? ["Attention"] : []),
    ...(visualBlueprint.semantic_axis === "general" || visualBlueprint.semantic_axis === "growth"
      ? ["Warburg"]
      : []),
    ];
  const snappedElements = runSnapEngineV1({
    elements: forms.map((form) => ({
      id: form.concept,
      role:
        form.weight === "high"
          ? "primary"
          : form.type === "intersection" || form.type === "incomplete_shape"
            ? "accent"
          : form.priority <= 2
            ? "secondary"
            : "tertiary",
      position: {
        x: form.x,
        y: form.y,
      },
    })),
    grid,
    conceptual_preset: {
      style_mode: styleMode,
      conceptual_modes: conceptualModes,
    },
  });

  return forms.map((form) => {
    const snapped = snappedElements.find((element) => element.id === form.concept);

    if (!snapped) {
      return form;
    }

    return {
      ...form,
      x: snapped.position.x,
      y: snapped.position.y,
    };
  });
}

function midpoint(left: VisualComposerForm, right: VisualComposerForm): VisualGridPoint {
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };
}

function pairHasConflict(
  visualBlueprint: VisualBlueprint,
  left: VisualComposerForm,
  right: VisualComposerForm,
) {
  const source = visualBlueprint.mapped_forms.find((entry) => entry.concept === left.concept);
  const target = visualBlueprint.mapped_forms.find((entry) => entry.concept === right.concept);

  return source?.concept_type === "conflict" || target?.concept_type === "conflict";
}

export function applyRelations(
  forms: VisualComposerForm[],
  visualBlueprint: VisualBlueprint,
) {
  const relations: VisualComposerRelation[] = [];

  for (let index = 0; index < forms.length; index += 1) {
    for (let offset = index + 1; offset < forms.length; offset += 1) {
      const left = forms[index];
      const right = forms[offset];
      const tension = findTension(visualBlueprint, left.concept, right.concept);

      if (tension === "high") {
        relations.push({
          type: "thin_line",
          from: left.concept,
          to: right.concept,
          x1: left.x,
          y1: left.y,
          x2: right.x,
          y2: right.y,
          stroke: "charcoal",
          stroke_width: 1,
          opacity: 0.55,
        });
      }

      if (pairHasConflict(visualBlueprint, left, right)) {
        relations.push({
          type: "intersection_marker",
          at: midpoint(left, right),
          stroke: "charcoal",
          stroke_width: 1,
          opacity: 0.75,
        });
      }
    }
  }

  return relations;
}

function mapWeightToStroke(weight: VisualComposerForm["weight"]) {
  return weight === "high" ? 2.2 : 1.2;
}

export function applyStyle(
  forms: VisualComposerForm[],
  relations: VisualComposerRelation[],
) {
  const styledForms = forms.map((form) => ({
    ...form,
    fill: "none" as const,
    stroke: "charcoal",
    stroke_width:
      mapWeightToStroke(form.weight) +
      (form.type === "intersection" ? 0.5 : form.type === "square" ? 0.25 : 0),
    opacity: form.type === "incomplete_shape" ? 0.78 : 0.92,
  }));

  const styledRelations = relations.map((relation) => ({
    ...relation,
    stroke: "charcoal",
    stroke_width: 1,
  }));

  return {
    forms: styledForms,
    relations: styledRelations,
  };
}

function computeCenterOfMass(forms: VisualComposerForm[]) {
  if (!forms.length) {
    return { x: 0, y: 0 };
  }

  const totalMass = forms.reduce((sum, form) => sum + form.size, 0);

  if (totalMass <= 0) {
    return { x: 0, y: 0 };
  }

  return forms.reduce(
    (accumulator, form) => ({
      x: accumulator.x + form.x * (form.size / totalMass),
      y: accumulator.y + form.y * (form.size / totalMass),
    }),
    { x: 0, y: 0 },
  );
}

function distance(left: VisualGridPoint, right: VisualGridPoint) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function normalizeDistance(value: number, width: number) {
  return clamp(value / Math.max(width, 1), 0, 1);
}

export function evaluateBalance(forms: VisualComposerForm[], canvas: VisualCanvas) {
  const centerOfMass = computeCenterOfMass(forms);
  const distanceFromCenter = distance(centerOfMass, {
    x: canvas.width / 2,
    y: canvas.height / 2,
  });

  return 1 - normalizeDistance(distanceFromCenter, canvas.width);
}

export function correctBalance(
  forms: VisualComposerForm[],
  visualBalance: number,
  canvas: VisualCanvas,
) {
  if (visualBalance >= 0.65) {
    return forms;
  }

  return forms.map((form) => ({
    ...form,
    x: interpolate(form.x, canvas.width / 2, 0.15),
    y: interpolate(form.y, canvas.height / 2, 0.15),
  }));
}

export function buildRenderElements(
  forms: VisualComposerForm[],
  relations: VisualComposerRelation[],
  canvas: VisualCanvas,
): VisualRenderComposition {
  const finalElements: Array<VisualComposerRelation | VisualComposerForm> = [];

  relations.forEach((relation) => {
    finalElements.push(relation);
  });

  forms.forEach((form) => {
    finalElements.push(form);
  });

  return {
    canvas,
    elements: finalElements,
    style: {
      minimal: true,
      negative_space: "dominant",
      palette: "limited",
      texture: "none_or_subtle",
    },
  };
}

export function runVisualComposerV1(
  visualBlueprint: VisualBlueprint,
  canvasSettings: VisualCanvasSettings = {},
): VisualComposerResult {
  const canvas = initCanvas(canvasSettings);
  const layoutGrid = buildGrid(canvas);

  let forms = normalizeForms(visualBlueprint);
  forms = assignSize(forms, canvas);
  forms = assignPosition(forms, layoutGrid, visualBlueprint);
  forms = applySnapLayout(
    forms,
    layoutGrid,
    visualBlueprint,
    canvasSettings.conceptual_preset,
  );

  let relations = applyRelations(forms, visualBlueprint);
  const styled = applyStyle(forms, relations);
  forms = styled.forms;
  relations = styled.relations;

  const visualBalance = evaluateBalance(forms, canvas);
  forms = correctBalance(forms, visualBalance, canvas);

  const renderComposition = buildRenderElements(forms, relations, canvas);

  return {
    canvas,
    forms,
    layout_grid: layoutGrid,
    visual_balance: visualBalance,
    final_elements: renderComposition.elements,
    render_composition: renderComposition,
  };
}
