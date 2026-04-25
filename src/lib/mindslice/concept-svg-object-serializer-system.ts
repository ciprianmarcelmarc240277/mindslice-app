import type {
  VisualSvgCircle,
  VisualSvgGroup,
  VisualSvgLine,
  VisualSvgNode,
  VisualSvgPath,
  VisualSvgPolygon,
  VisualSvgRect,
  VisualSvgRoot,
  VisualSvgText,
  VisualSvgTextChild,
} from "@/lib/mindslice/concept-visual-renderer-v2-system";

type SvgPolylineNode = {
  type: "polyline";
  id?: string;
  points: string;
  fill?: string;
  stroke: string;
  stroke_width?: number;
  opacity?: number;
  stroke_linecap?: string;
  stroke_linejoin?: string;
  dasharray?: string;
};

type SvgClipPathNode = {
  type: "clipPath";
  id: string;
  child?: unknown;
  children?: unknown[];
};

type SvgDefsNode = {
  type: "defs";
  children: unknown[];
};

type SvgCircleOutlineNode = Omit<VisualSvgCircle, "type"> & {
  type: "circle_outline";
};

export type SvgSerializableNode =
  | VisualSvgNode
  | VisualSvgTextChild
  | SvgPolylineNode
  | SvgClipPathNode
  | SvgDefsNode
  | SvgCircleOutlineNode;

function failSvgObjectSerializer(message: string): never {
  throw new Error(`MindSlice_SVGObjectSerializer_v1: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function attribute(name: string, value: string | number | undefined) {
  if (value === undefined) {
    return "";
  }

  return ` ${name}="${escapeAttribute(value)}"`;
}

function requireString(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    failSvgObjectSerializer(`Missing or invalid required string field: ${fieldName}.`);
  }

  return value;
}

function requireNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    failSvgObjectSerializer(`Missing or invalid required numeric field: ${fieldName}.`);
  }

  return value;
}

function requireArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    failSvgObjectSerializer(`Missing or invalid required array field: ${fieldName}.`);
  }

  return value;
}

function requireNode(value: unknown): SvgSerializableNode {
  if (!isRecord(value) || typeof value.type !== "string") {
    failSvgObjectSerializer("Invalid SVG node.");
  }

  return value as SvgSerializableNode;
}

function serializeChildren(children: unknown[]) {
  return children.map((child) => serializeNode(requireNode(child))).join("");
}

function serializeClipPathContent(node: SvgClipPathNode) {
  const children = Array.isArray(node.children) ? node.children : [];
  const child = node.child === undefined ? [] : [node.child];

  return serializeChildren([...children, ...child]);
}

function serializeSvg(node: VisualSvgRoot) {
  const width = requireNumber(node.width, "svg.width");
  const height = requireNumber(node.height, "svg.height");
  const viewBox = requireString(node.viewBox, "svg.viewBox");
  const children = requireArray(node.children, "svg.children");
  const defs = Array.isArray(node.defs) ? node.defs : [];
  const defsMarkup = defs.length > 0 ? `<defs>${serializeChildren(defs)}</defs>` : "";

  return `<svg${attribute("width", width)}${attribute("height", height)}${attribute("viewBox", viewBox)} xmlns="http://www.w3.org/2000/svg">${defsMarkup}${serializeChildren(children)}</svg>`;
}

function serializeGroup(node: VisualSvgGroup) {
  const id = requireString(node.id, "g.id");
  const children = requireArray(node.children, "g.children");

  return `<g${attribute("id", id)}${attribute("opacity", node.opacity)}${attribute("data-expected-opacity", node.expected_opacity)}>${serializeChildren(children)}</g>`;
}

function serializeRect(node: VisualSvgRect) {
  return `<rect${attribute("id", node.id)}${attribute("x", requireNumber(node.x, "rect.x"))}${attribute("y", requireNumber(node.y, "rect.y"))}${attribute("width", requireNumber(node.width, "rect.width"))}${attribute("height", requireNumber(node.height, "rect.height"))}${attribute("fill", requireString(node.fill, "rect.fill"))}${attribute("stroke", node.stroke)}${attribute("stroke-width", node.stroke_width)}${attribute("opacity", node.opacity)}/>`;
}

function serializeCircle(node: VisualSvgCircle) {
  return `<circle${attribute("id", node.id)}${attribute("cx", requireNumber(node.cx, "circle.cx"))}${attribute("cy", requireNumber(node.cy, "circle.cy"))}${attribute("r", requireNumber(node.r, "circle.r"))}${attribute("fill", node.fill)}${attribute("stroke", node.stroke)}${attribute("stroke-width", node.stroke_width)}${attribute("opacity", node.opacity)}/>`;
}

function serializeLine(node: VisualSvgLine) {
  const lineNode = node as VisualSvgLine & {
    stroke_linecap?: string;
    stroke_linejoin?: string;
    stroke_dasharray?: string;
    dasharray?: string;
  };

  return `<line${attribute("id", lineNode.id)}${attribute("x1", requireNumber(lineNode.x1, "line.x1"))}${attribute("y1", requireNumber(lineNode.y1, "line.y1"))}${attribute("x2", requireNumber(lineNode.x2, "line.x2"))}${attribute("y2", requireNumber(lineNode.y2, "line.y2"))}${attribute("stroke", requireString(lineNode.stroke, "line.stroke"))}${attribute("stroke-width", requireNumber(lineNode.stroke_width, "line.stroke_width"))}${attribute("stroke-linecap", lineNode.stroke_linecap)}${attribute("stroke-linejoin", lineNode.stroke_linejoin)}${attribute("stroke-dasharray", lineNode.stroke_dasharray ?? lineNode.dasharray)}${attribute("opacity", lineNode.opacity)}/>`;
}

function serializePath(node: VisualSvgPath) {
  const pathNode = node as VisualSvgPath & {
    stroke_linecap?: string;
    stroke_linejoin?: string;
    stroke_dasharray?: string;
    dasharray?: string;
  };

  return `<path${attribute("id", pathNode.id)}${attribute("d", requireString(pathNode.d, "path.d"))}${attribute("fill", pathNode.fill)}${attribute("stroke", pathNode.stroke)}${attribute("stroke-width", pathNode.stroke_width)}${attribute("stroke-linecap", pathNode.stroke_linecap)}${attribute("stroke-linejoin", pathNode.stroke_linejoin)}${attribute("stroke-dasharray", pathNode.stroke_dasharray ?? pathNode.dasharray)}${attribute("opacity", pathNode.opacity)}/>`;
}

function serializePolygon(node: VisualSvgPolygon) {
  return `<polygon${attribute("id", node.id)}${attribute("points", requireString(node.points, "polygon.points"))}${attribute("fill", requireString(node.fill, "polygon.fill"))}${attribute("stroke", node.stroke)}${attribute("stroke-width", node.stroke_width)}${attribute("opacity", node.opacity)}/>`;
}

function serializeTextChild(node: VisualSvgTextChild) {
  return `<tspan${attribute("x", node.x)}${attribute("dy", node.dy)}>${escapeText(requireString(node.text, "tspan.text"))}</tspan>`;
}

function serializePolyline(node: SvgPolylineNode) {
  return `<polyline${attribute("id", node.id)}${attribute("points", requireString(node.points, "polyline.points"))}${attribute("fill", node.fill)}${attribute("stroke", requireString(node.stroke, "polyline.stroke"))}${attribute("stroke-width", node.stroke_width)}${attribute("stroke-linecap", node.stroke_linecap)}${attribute("stroke-linejoin", node.stroke_linejoin)}${attribute("stroke-dasharray", node.dasharray)}${attribute("opacity", node.opacity)}/>`;
}

function serializeClipPath(node: SvgClipPathNode) {
  return `<clipPath${attribute("id", requireString(node.id, "clipPath.id"))}>${serializeClipPathContent(node)}</clipPath>`;
}

function serializeDefs(node: SvgDefsNode) {
  return `<defs>${serializeChildren(requireArray(node.children, "defs.children"))}</defs>`;
}

function serializeText(node: VisualSvgText) {
  const content =
    Array.isArray(node.children) && node.children.length > 0
      ? node.children.map((child) => serializeTextChild(child)).join("")
      : escapeText(requireString(node.text, "text.text"));

  return `<text${attribute("id", node.id)}${attribute("x", requireNumber(node.x, "text.x"))}${attribute("y", requireNumber(node.y, "text.y"))}${attribute("fill", requireString(node.fill, "text.fill"))}${attribute("opacity", requireNumber(node.opacity, "text.opacity"))}${attribute("font-size", requireNumber(node.font_size, "text.font_size"))}${attribute("text-anchor", node.text_anchor ?? node.anchor)}${attribute("dominant-baseline", node.dominant_baseline ?? node.baseline)}${attribute("transform", node.transform)}${attribute("data-role", node.role)}${attribute("data-font-role", node.font_role)}${attribute("data-max-width", node.max_width)}>${content}</text>`;
}

export function serializeNode(node: SvgSerializableNode): string {
  switch (node.type) {
    case "svg":
      return serializeSvg(node);
    case "g":
      return serializeGroup(node);
    case "rect":
      return serializeRect(node);
    case "circle":
      return serializeCircle(node);
    case "circle_outline":
      return serializeCircle({
        ...node,
        type: "circle",
      });
    case "line":
      return serializeLine(node);
    case "path":
      return serializePath(node);
    case "polygon":
      return serializePolygon(node);
    case "polyline":
      return serializePolyline(node);
    case "text":
      return serializeText(node);
    case "tspan":
      return serializeTextChild(node);
    case "clipPath":
      return serializeClipPath(node);
    case "defs":
      return serializeDefs(node);
    default: {
      const unsupportedNode = node as { type: string };

      return failSvgObjectSerializer(`Unsupported SVG node type: ${unsupportedNode.type}.`);
    }
  }
}

export function runSvgObjectSerializerV1(svgTree: VisualSvgRoot): string {
  return serializeSvg(svgTree);
}

export const RUN = runSvgObjectSerializerV1;
