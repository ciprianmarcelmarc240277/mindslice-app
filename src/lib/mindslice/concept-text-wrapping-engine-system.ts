export type TextWrappingInputItem = {
  type?: "text";
  text?: string;
  x?: number;
  y?: number;
  anchor?: "start" | "middle" | "end";
  text_anchor?: "start" | "middle" | "end";
  baseline?: string;
  dominant_baseline?: string;
  transform?: string | null;
  rotation?: number;
  font_role?: string;
  font_size?: number;
  font_weight?: string | number;
  opacity?: number;
  fill?: string;
  role?: string;
  id?: string;
  max_width?: number;
};

export type FontMetricsProfile = {
  font_size?: number;
  avg_char_width?: number;
  line_height?: number;
};

export type TextTspanNode = {
  type: "tspan";
  text: string;
  x: number;
  dy: number;
  font_size: number;
  font_weight?: string | number;
  opacity?: number;
};

export type WrappedTextNode = {
  type: "text";
  id?: string;
  role?: string;
  x: number;
  y: number;
  text_anchor: "start" | "middle" | "end";
  dominant_baseline: string;
  transform: string | null;
  font_role?: string;
  font_size: number;
  font_weight?: string | number;
  fill?: string;
  opacity?: number;
  max_width?: number;
  children: TextTspanNode[];
};

function estimateLineWidth(line: string, fontMetricsProfile: FontMetricsProfile = {}) {
  const fontSize = fontMetricsProfile.font_size ?? 14;
  const avgCharWidth = fontMetricsProfile.avg_char_width ?? fontSize * 0.52;

  return line.length * avgCharWidth;
}

function splitLongWord(word: string, fontMetricsProfile: FontMetricsProfile, maxWidth: number) {
  const charsPerLine = Math.max(
    1,
    Math.floor(maxWidth / (fontMetricsProfile.avg_char_width ?? (fontMetricsProfile.font_size ?? 14) * 0.52)),
  );
  const chunks: string[] = [];

  for (let index = 0; index < word.length; index += charsPerLine) {
    chunks.push(word.slice(index, index + charsPerLine));
  }

  return chunks;
}

export function splitTextIntoLines(
  text: string,
  fontMetricsProfile: FontMetricsProfile = {},
  maxWidth = Number.POSITIVE_INFINITY,
) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
    return [normalized];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (estimateLineWidth(candidate, fontMetricsProfile) <= maxWidth) {
      currentLine = candidate;
      return;
    }

    if (currentLine) {
      lines.push(currentLine.trim());
    }

    if (estimateLineWidth(word, fontMetricsProfile) > maxWidth) {
      const chunks = splitLongWord(word, fontMetricsProfile, maxWidth);
      lines.push(...chunks.slice(0, -1));
      currentLine = chunks.at(-1) ?? "";
      return;
    }

    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine.trim());
  }

  return lines;
}

function preserveAnchor(textItem: TextWrappingInputItem): "start" | "middle" | "end" {
  return textItem.anchor ?? textItem.text_anchor ?? "start";
}

function preserveBaseline(textItem: TextWrappingInputItem) {
  return textItem.baseline ?? textItem.dominant_baseline ?? "middle";
}

function preserveRotation(textItem: TextWrappingInputItem) {
  if (
    textItem.rotation !== undefined &&
    Number.isFinite(textItem.rotation) &&
    textItem.x !== undefined &&
    textItem.y !== undefined
  ) {
    return `rotate(${textItem.rotation} ${textItem.x} ${textItem.y})`;
  }

  return textItem.transform ?? null;
}

export function runTextWrappingEngineV1(
  textItem: TextWrappingInputItem,
  fontMetricsProfile: FontMetricsProfile = {},
  maxWidth = textItem.max_width ?? Number.POSITIVE_INFINITY,
): WrappedTextNode {
  const x = textItem.x ?? 0;
  const y = textItem.y ?? 0;
  const fontSize = textItem.font_size ?? fontMetricsProfile.font_size ?? 14;
  const lineHeight = fontMetricsProfile.line_height ?? fontSize * 1.22;
  const metrics = {
    ...fontMetricsProfile,
    font_size: fontSize,
  };
  const lines = splitTextIntoLines(textItem.text ?? "", metrics, maxWidth);
  const tspans = lines.map((line, lineIndex): TextTspanNode => ({
    type: "tspan",
    text: line,
    x,
    dy: lineIndex === 0 ? 0 : lineHeight,
    font_size: fontSize,
    font_weight: textItem.font_weight,
    opacity: textItem.opacity,
  }));

  return {
    type: "text",
    id: textItem.id,
    role: textItem.role,
    x,
    y,
    text_anchor: preserveAnchor(textItem),
    dominant_baseline: preserveBaseline(textItem),
    transform: preserveRotation(textItem),
    font_role: textItem.font_role,
    font_size: fontSize,
    font_weight: textItem.font_weight,
    fill: textItem.fill,
    opacity: textItem.opacity,
    max_width: maxWidth,
    children: tspans,
  };
}

export const RUN = runTextWrappingEngineV1;
