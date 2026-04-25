import type { VisualSvgRoot } from "@/lib/mindslice/concept-visual-renderer-v2-system";

export type VisualAuditEngineStatus = "pass" | "fail";

export type VisualAuditEngineRules = {
  allow_unknown_svg_node_types?: boolean;
};

export type VisualAuditEngineReport = {
  status: VisualAuditEngineStatus;
  errors: string[];
  warnings: string[];
  checked_nodes_count: number;
  renderer_law_preserved: boolean;
};

type SvgRecord = Record<string, unknown>;

const VALID_SVG_NODE_TYPES = new Set([
  "svg",
  "defs",
  "clipPath",
  "g",
  "rect",
  "circle",
  "circle_outline",
  "ellipse",
  "line",
  "path",
  "polygon",
  "polyline",
  "text",
  "tspan",
  "linearGradient",
  "radialGradient",
  "stop",
  "pattern",
  "mask",
  "filter",
]);

const SEMANTIC_DECISION_FIELDS = new Set([
  "semantic_decision",
  "layout_decision",
  "hierarchy_decision",
  "density_decision",
  "relationship_decision",
  "meaning",
  "interpreted_meaning",
  "can_decide_logic",
  "decision_authority",
]);

const ENGINE_RENDERING_FIELDS = new Set([
  "engine_rendering",
  "render_command_from_engine",
  "engine_svg_output",
  "engine_draw_command",
]);

const TEXT_REQUIRED_FIELDS = ["x", "y", "text", "fill", "font_size"];

const GEOMETRY_NUMERIC_FIELDS: Record<string, string[]> = {
  rect: ["x", "y", "width", "height"],
  circle: ["cx", "cy", "r"],
  circle_outline: ["cx", "cy", "r"],
  ellipse: ["cx", "cy", "rx", "ry"],
  line: ["x1", "y1", "x2", "y2"],
};

function isRecord(value: unknown): value is SvgRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasField(node: SvgRecord, field: string) {
  return Object.prototype.hasOwnProperty.call(node, field);
}

function isFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function childrenOf(node: SvgRecord) {
  const children = node.children;

  return Array.isArray(children) ? children : [];
}

function walkSvgNodes(node: unknown): SvgRecord[] {
  if (!isRecord(node)) {
    return [];
  }

  return [node, ...childrenOf(node).flatMap((child) => walkSvgNodes(child))];
}

function addMissingFieldErrors(
  errors: string[],
  nodeType: string,
  node: SvgRecord,
  fields: string[],
) {
  fields.forEach((field) => {
    if (!hasField(node, field) || node[field] === null || node[field] === undefined) {
      errors.push(`MISSING_${nodeType.toUpperCase()}_${field.toUpperCase()}`);
    }
  });
}

function addNumericFieldErrors(
  errors: string[],
  nodeType: string,
  node: SvgRecord,
  fields: string[],
) {
  fields.forEach((field) => {
    if (!isFiniteNumber(node[field])) {
      errors.push(`INVALID_${nodeType.toUpperCase()}_${field.toUpperCase()}`);
    }
  });
}

function validateSvgRoot(svgTree: unknown, errors: string[]) {
  if (!isRecord(svgTree)) {
    errors.push("SVG_TREE_MUST_BE_OBJECT");
    return;
  }

  if (svgTree.type !== "svg") {
    errors.push("ROOT_TYPE_MUST_BE_SVG");
  }

  if (!isFiniteNumber(svgTree.width)) {
    errors.push("ROOT_WIDTH_MUST_BE_FINITE_NUMBER");
  }

  if (!isFiniteNumber(svgTree.height)) {
    errors.push("ROOT_HEIGHT_MUST_BE_FINITE_NUMBER");
  }

  if (typeof svgTree.viewBox !== "string" || svgTree.viewBox.trim().length === 0) {
    errors.push("ROOT_VIEWBOX_MISSING");
  }

  if (!Array.isArray(svgTree.children)) {
    errors.push("ROOT_CHILDREN_MUST_BE_ARRAY");
  }
}

function validateNodeTypes(
  nodes: SvgRecord[],
  errors: string[],
  warnings: string[],
  auditRules: VisualAuditEngineRules,
) {
  nodes.forEach((node) => {
    const type = node.type;

    if (typeof type !== "string" || type.trim().length === 0) {
      errors.push("NODE_TYPE_MISSING");
      return;
    }

    if (!VALID_SVG_NODE_TYPES.has(type)) {
      if (auditRules.allow_unknown_svg_node_types) {
        warnings.push(`UNKNOWN_SVG_NODE_TYPE:${type}`);
      } else {
        errors.push(`INVALID_SVG_NODE_TYPE:${type}`);
      }
    }
  });
}

function validateGroupNodes(nodes: SvgRecord[], errors: string[]) {
  nodes.forEach((node) => {
    if (node.type !== "g") {
      return;
    }

    if (!Array.isArray(node.children)) {
      errors.push("GROUP_CHILDREN_MUST_BE_ARRAY");
    }
  });
}

function validateTextNodes(nodes: SvgRecord[], errors: string[]) {
  nodes.forEach((node) => {
    if (node.type !== "text") {
      return;
    }

    addMissingFieldErrors(errors, "text", node, TEXT_REQUIRED_FIELDS);

    if (!isFiniteNumber(node.x)) {
      errors.push("INVALID_TEXT_X");
    }

    if (!isFiniteNumber(node.y)) {
      errors.push("INVALID_TEXT_Y");
    }

    if (!isFiniteNumber(node.font_size)) {
      errors.push("INVALID_TEXT_FONT_SIZE");
    }

    if (typeof node.text !== "string") {
      errors.push("INVALID_TEXT_VALUE");
    }
  });
}

function validateGeometryNodes(nodes: SvgRecord[], errors: string[]) {
  nodes.forEach((node) => {
    const type = typeof node.type === "string" ? node.type : "";
    const numericFields = GEOMETRY_NUMERIC_FIELDS[type];

    if (!numericFields) {
      return;
    }

    addMissingFieldErrors(errors, type, node, numericFields);
    addNumericFieldErrors(errors, type, node, numericFields);
  });
}

function validateRendererLaw(nodes: SvgRecord[], errors: string[]) {
  nodes.forEach((node) => {
    Object.keys(node).forEach((field) => {
      if (SEMANTIC_DECISION_FIELDS.has(field)) {
        errors.push(`RENDERER_SEMANTIC_DECISION_FIELD:${field}`);
      }

      if (ENGINE_RENDERING_FIELDS.has(field)) {
        errors.push(`ENGINE_RENDERING_BOUNDARY_FIELD:${field}`);
      }
    });
  });
}

export function runVisualAuditEngineV1(input: {
  svg_tree: VisualSvgRoot;
  audit_rules?: VisualAuditEngineRules;
}): VisualAuditEngineReport {
  if (!input || !input.svg_tree) {
    throw new Error("MindSlice_VisualAuditEngine: missing svg_tree");
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const auditRules = input.audit_rules ?? {};
  const nodes = walkSvgNodes(input.svg_tree);

  validateSvgRoot(input.svg_tree, errors);
  validateNodeTypes(nodes, errors, warnings, auditRules);
  validateGroupNodes(nodes, errors);
  validateTextNodes(nodes, errors);
  validateGeometryNodes(nodes, errors);
  validateRendererLaw(nodes, errors);

  const rendererLawPreserved = !errors.some((error) => {
    return error.startsWith("RENDERER_") || error.startsWith("ENGINE_RENDERING_");
  });

  return {
    status: errors.length === 0 ? "pass" : "fail",
    errors,
    warnings,
    checked_nodes_count: nodes.length,
    renderer_law_preserved: rendererLawPreserved,
  };
}

export const RUN = runVisualAuditEngineV1;
