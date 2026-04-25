import * as React from "react";

type SvgRecord = {
  type?: unknown;
  children?: unknown;
  defs?: unknown;
  child?: unknown;
  text?: unknown;
  [key: string]: unknown;
};

export type SafeSvgMountRenderMode = "object_tree" | "string";

export type SafeSvgMountResult =
  | {
      status: "ok";
      render_mode: "object_tree";
      react_svg_output: React.ReactNode;
    }
  | {
      status: "ok";
      render_mode: "string";
      sanitized_svg_string: string;
    }
  | {
      status: "fail";
      message: string;
      details: unknown;
    };

const ALLOWED_SVG_NODES = new Set([
  "svg",
  "defs",
  "clipPath",
  "g",
  "rect",
  "circle",
  "line",
  "path",
  "polygon",
  "polyline",
  "text",
  "tspan",
]);

const FORBIDDEN_NODES = ["script", "foreignObject", "iframe", "object", "embed"];

const ATTRIBUTE_MAP: Record<string, string> = {
  "clip-path": "clipPath",
  clip_path: "clipPath",
  "data-expected-opacity": "data-expected-opacity",
  dominant_baseline: "dominantBaseline",
  expected_opacity: "data-expected-opacity",
  fill_rule: "fillRule",
  font_family: "fontFamily",
  font_size: "fontSize",
  font_weight: "fontWeight",
  letter_spacing: "letterSpacing",
  stroke_dasharray: "strokeDasharray",
  stroke_linecap: "strokeLinecap",
  stroke_linejoin: "strokeLinejoin",
  stroke_width: "strokeWidth",
  text_anchor: "textAnchor",
};

const SAFE_ATTRIBUTES = new Set([
  "id",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "d",
  "dx",
  "dy",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeLinecap",
  "strokeLinejoin",
  "strokeDasharray",
  "fillRule",
  "opacity",
  "points",
  "width",
  "height",
  "viewBox",
  "xmlns",
  "transform",
  "clipPath",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "letterSpacing",
  "textAnchor",
  "dominantBaseline",
  "data-role",
  "data-font-role",
  "data-max-width",
  "data-expected-opacity",
]);

function fail(message: string, details: unknown): Extract<SafeSvgMountResult, { status: "fail" }> {
  return {
    status: "fail",
    message,
    details,
  };
}

function isRecord(value: unknown): value is SvgRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function childrenOf(node: SvgRecord) {
  const children = Array.isArray(node.children) ? node.children : [];
  const defs = Array.isArray(node.defs) ? node.defs : [];
  const child = node.child ? [node.child] : [];

  return [...defs, ...children, ...child];
}

function validateAllowedSvgNodes(svgTree: unknown) {
  const stack = [svgTree];

  while (stack.length > 0) {
    const node = stack.pop();

    if (!isRecord(node)) {
      return fail("INVALID_SVG_NODE_SHAPE", node);
    }

    const type = typeof node.type === "string" ? node.type : "";

    if (FORBIDDEN_NODES.includes(type)) {
      return fail(`FORBIDDEN_NODE:${type}`, node);
    }

    if (!ALLOWED_SVG_NODES.has(type)) {
      return fail(`UNKNOWN_SVG_NODE:${type}`, node);
    }

    stack.push(...childrenOf(node));
  }

  return { status: "ok" as const };
}

function validateNoScriptNodes(svgString: string) {
  const lowered = svgString.toLowerCase();

  if (/<\s*script\b/i.test(lowered)) {
    return fail("SCRIPT_NODE_DETECTED", null);
  }

  if (/\bjavascript\s*:/i.test(lowered)) {
    return fail("JAVASCRIPT_URL_DETECTED", null);
  }

  if (/<\s*foreignobject\b/i.test(lowered)) {
    return fail("FOREIGN_OBJECT_DETECTED", null);
  }

  return { status: "ok" as const };
}

function removeForbiddenNodes(svgString: string) {
  return FORBIDDEN_NODES.reduce((current, nodeName) => {
    const pairPattern = new RegExp(`<\\s*${nodeName}\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*${nodeName}\\s*>`, "gi");
    const selfClosingPattern = new RegExp(`<\\s*${nodeName}\\b[^>]*\\/\\s*>`, "gi");
    const openPattern = new RegExp(`<\\s*${nodeName}\\b[^>]*>`, "gi");
    const closePattern = new RegExp(`<\\s*\\/\\s*${nodeName}\\s*>`, "gi");

    return current
      .replace(pairPattern, "")
      .replace(selfClosingPattern, "")
      .replace(openPattern, "")
      .replace(closePattern, "");
  }, svgString);
}

export function sanitizeSvgString(svgString: string) {
  return removeForbiddenNodes(svgString)
    .replace(/\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\s+(href|xlink:href)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/\burl\s*\(\s*(['"]?)\s*javascript:[\s\S]*?\1\s*\)/gi, "url(#)");
}

function safePropName(name: string) {
  return ATTRIBUTE_MAP[name] ?? name;
}

function safeProps(node: SvgRecord, key: string) {
  const props: Record<string, unknown> = { key };

  Object.entries(node).forEach(([rawName, value]) => {
    if (["type", "children", "defs", "child", "text"].includes(rawName)) {
      return;
    }

    if (value === null || value === undefined || value === false) {
      return;
    }

    const name = safePropName(rawName);

    if (!SAFE_ATTRIBUTES.has(name) || /^on/i.test(name)) {
      return;
    }

    if (typeof value === "string" && /\bjavascript\s*:/i.test(value)) {
      return;
    }

    props[name] = value;
  });

  return props;
}

export function renderSvgTreeToReact(svgTree: unknown, key = "safe-svg-root"): React.ReactNode {
  if (!isRecord(svgTree) || typeof svgTree.type !== "string") {
    return null;
  }

  const nodeChildren = childrenOf(svgTree).map((child, index) =>
    renderSvgTreeToReact(child, `${key}-${index}`),
  );
  const textContent = typeof svgTree.text === "string" ? svgTree.text : null;

  return React.createElement(
    svgTree.type,
    safeProps(svgTree, key),
    textContent ?? nodeChildren,
  );
}

export function runSafeSvgMountV1(svgInput: unknown, renderMode: SafeSvgMountRenderMode): SafeSvgMountResult {
  if (renderMode === "object_tree") {
    const validation = validateAllowedSvgNodes(svgInput);

    if (validation.status === "fail") {
      return fail("UNSAFE_SVG_TREE", validation);
    }

    return {
      status: "ok",
      render_mode: "object_tree",
      react_svg_output: renderSvgTreeToReact(svgInput),
    };
  }

  if (renderMode === "string") {
    if (typeof svgInput !== "string") {
      return fail("SVG_STRING_EXPECTED", svgInput);
    }

    const validation = validateNoScriptNodes(svgInput);

    if (validation.status === "fail") {
      return fail("UNSAFE_SVG_STRING", validation);
    }

    return {
      status: "ok",
      render_mode: "string",
      sanitized_svg_string: sanitizeSvgString(svgInput),
    };
  }

  return fail("UNKNOWN_RENDER_MODE", renderMode);
}

export const RUN = runSafeSvgMountV1;
