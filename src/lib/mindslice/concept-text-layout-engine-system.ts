import type { InfluenceMode } from "@/lib/mindslice/mindslice-types";
import type { ThoughtSceneEngineState } from "@/lib/mindslice/thought-scene-engine";

export type TextLayoutCanvas = {
  width: number;
  height: number;
};

export type TextLayoutPoint = {
  x: number;
  y: number;
};

export type TextLayoutPeripheralText = TextLayoutPoint & {
  id: string;
  text: string;
  role: "fragment" | "keyword" | "stray_letter" | "grammar_particle" | "temporal_particle";
  rotation: number;
  font_size: number;
  opacity: number;
  anchor: "start" | "middle" | "end";
};

export type TextLayoutCenter = TextLayoutPoint & {
  width: number;
  height: number;
  rotation: number;
  title: string;
  fragment: string;
  lines: string[];
};

export type TextLayoutResult = {
  center: TextLayoutCenter;
  peripheral_text: TextLayoutPeripheralText[];
};

export type RunTextLayoutEngineInput = {
  thought_scene: ThoughtSceneEngineState;
  canvas: TextLayoutCanvas;
  title: string;
  fragments: string[];
  keywords: string[];
  stray_letters?: string[];
  grammar_rules?: string[];
  temporal_tokens?: string[];
  influence_mode: InfluenceMode | null;
};

function parsePercent(value: string, fallback: number) {
  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed / 100 : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointFromAnchor(
  anchor: { left: string; top: string },
  canvas: TextLayoutCanvas,
): TextLayoutPoint {
  return {
    x: canvas.width * parsePercent(anchor.left, 0.5),
    y: canvas.height * parsePercent(anchor.top, 0.5),
  };
}

function influenceRotation(influenceMode: InfluenceMode | null) {
  if (influenceMode === "rupture") {
    return -1.2;
  }

  if (influenceMode === "counterpoint") {
    return 0.8;
  }

  return 0;
}

function buildPeripheralText(input: RunTextLayoutEngineInput, center: TextLayoutPoint) {
  const fragmentOffsets = [
    { x: -330, y: -250, rotation: -8, anchor: "middle" as const },
    { x: 330, y: -210, rotation: 7, anchor: "middle" as const },
    { x: -310, y: 280, rotation: -5, anchor: "middle" as const },
    { x: 330, y: 310, rotation: 9, anchor: "middle" as const },
    { x: -40, y: -370, rotation: -2, anchor: "middle" as const },
    { x: 80, y: 382, rotation: 2, anchor: "middle" as const },
  ];
  const keywordOffsets = [
    { x: -112, y: -380, rotation: 0, anchor: "middle" as const },
    { x: -410, y: -30, rotation: -90, anchor: "middle" as const },
    { x: 412, y: 0, rotation: 90, anchor: "middle" as const },
    { x: 48, y: 420, rotation: 0, anchor: "middle" as const },
    { x: -350, y: 420, rotation: -4, anchor: "middle" as const },
    { x: 372, y: 392, rotation: 4, anchor: "middle" as const },
  ];
  const strayLetterOffsets = [
    { x: -164, y: -456, rotation: -12 },
    { x: 284, y: -386, rotation: 7 },
    { x: -446, y: -126, rotation: -4 },
    { x: 462, y: 142, rotation: 10 },
    { x: -84, y: 374, rotation: -8 },
    { x: 182, y: 456, rotation: 4 },
    { x: -404, y: 332, rotation: 9 },
    { x: 410, y: -308, rotation: -6 },
  ];
  const grammarParticleOffsets = [
    { x: -286, y: -332, rotation: -10 },
    { x: 286, y: -302, rotation: 9 },
    { x: -278, y: 356, rotation: -7 },
    { x: 286, y: 344, rotation: 7 },
  ];
  const temporalParticleOffsets = [
    { x: 238, y: -366, rotation: 0 },
    { x: 404, y: -96, rotation: 90 },
    { x: 318, y: 368, rotation: 0 },
    { x: -404, y: 82, rotation: -90 },
  ];
  const ruptureShift = input.influence_mode === "rupture" ? 26 : 0;
  const echoOpacity = input.influence_mode === "echo" ? 0.74 : 0.58;
  const fragmentText = input.fragments.map((fragment, index) => {
    const offset = fragmentOffsets[index % fragmentOffsets.length];

    return {
      id: `fragment:${index}`,
      text: fragment,
      role: "fragment" as const,
      x: clamp(center.x + offset.x, 82, input.canvas.width - 82),
      y: clamp(center.y + offset.y + (index % 2 === 0 ? -ruptureShift : ruptureShift), 82, input.canvas.height - 82),
      rotation: offset.rotation + (input.influence_mode === "rupture" ? index % 2 === 0 ? -6 : 6 : 0),
      font_size: 28,
      opacity: input.influence_mode === "whisper" ? 0.34 : echoOpacity,
      anchor: offset.anchor,
    };
  });
  const keywordText = input.keywords.slice(0, 6).map((keyword, index) => {
    const offset = keywordOffsets[index % keywordOffsets.length];

    return {
      id: `keyword:${index}`,
      text: keyword,
      role: "keyword" as const,
      x: clamp(center.x + offset.x, 70, input.canvas.width - 70),
      y: clamp(center.y + offset.y, 70, input.canvas.height - 70),
      rotation: offset.rotation,
      font_size: 15,
      opacity: input.influence_mode === "stain" ? 0.38 : 0.52,
      anchor: offset.anchor,
    };
  });
  const strayLetterText = (input.stray_letters ?? []).slice(0, 8).map((letter, index) => {
    const offset = strayLetterOffsets[index % strayLetterOffsets.length];

    return {
      id: `stray-letter:${index}`,
      text: letter,
      role: "stray_letter" as const,
      x: clamp(center.x + offset.x, 56, input.canvas.width - 56),
      y: clamp(center.y + offset.y, 56, input.canvas.height - 56),
      rotation: offset.rotation,
      font_size: index % 3 === 0 ? 31 : index % 3 === 1 ? 24 : 18,
      opacity: input.influence_mode === "rupture" ? 0.46 : 0.32,
      anchor: "middle" as const,
    };
  });
  const grammarParticleText = (input.grammar_rules ?? []).slice(0, 4).map((rule, index) => {
    const offset = grammarParticleOffsets[index % grammarParticleOffsets.length];

    return {
      id: `grammar-particle:${index}`,
      text: rule,
      role: "grammar_particle" as const,
      x: clamp(center.x + offset.x, 86, input.canvas.width - 86),
      y: clamp(center.y + offset.y, 86, input.canvas.height - 86),
      rotation: offset.rotation,
      font_size: 13,
      opacity: 0.5,
      anchor: "middle" as const,
    };
  });
  const temporalParticleText = (input.temporal_tokens ?? []).slice(0, 4).map((token, index) => {
    const offset = temporalParticleOffsets[index % temporalParticleOffsets.length];

    return {
      id: `temporal-particle:${index}`,
      text: token,
      role: "temporal_particle" as const,
      x: clamp(center.x + offset.x, 74, input.canvas.width - 74),
      y: clamp(center.y + offset.y, 74, input.canvas.height - 74),
      rotation: offset.rotation,
      font_size: index === 3 ? 12 : 18,
      opacity: 0.42,
      anchor: "middle" as const,
    };
  });

  return [
    ...fragmentText,
    ...keywordText,
    ...strayLetterText,
    ...grammarParticleText,
    ...temporalParticleText,
  ];
}

export function runTextLayoutEngineV1(input: RunTextLayoutEngineInput): TextLayoutResult {
  const anchorPoint = pointFromAnchor(
    input.thought_scene.sceneGraph.thoughtCenterAnchor,
    input.canvas,
  );
  const center: TextLayoutCenter = {
    ...anchorPoint,
    width: 238,
    height: 238,
    rotation: influenceRotation(input.influence_mode),
    title: input.title,
    fragment: input.thought_scene.sceneGraph.thoughtCenterFragment,
    lines: input.thought_scene.sceneGraph.thoughtLines.slice(0, 5),
  };

  return {
    center,
    peripheral_text: buildPeripheralText(input, center),
  };
}

export const RUN = runTextLayoutEngineV1;
