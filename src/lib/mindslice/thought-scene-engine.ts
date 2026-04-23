import type { InfluenceMode } from "@/lib/mindslice/mindslice-types";

const THOUGHT_OVERLAY_HOLD_MS = 8000;
const THOUGHT_STAGE_REST_MS = 15000;
const THOUGHT_SLICE_DURATION_MS = 30 * 1000;
export type { InfluenceMode } from "@/lib/mindslice/mindslice-types";

type ThoughtTriad = {
  art: {
    score: number;
    label: string;
  };
  design: {
    score: number;
    label: string;
  };
  business: {
    score: number;
    label: string;
  };
};

type ThoughtVisualState = {
  density: number;
  wave: number;
  fracture: number;
  drift: number;
  convergence: number;
};

type ThoughtSceneSlice = {
  direction: string;
  thought: string;
  fragments: string[];
  keywords: string[];
  motion: string;
  triad: ThoughtTriad;
  visual: ThoughtVisualState;
};

type ThoughtSceneInput = {
  current: ThoughtSceneSlice;
  currentIndex: number;
  influenceMode: InfluenceMode | null;
  animatedThought: string;
  isThoughtOverlayVisible: boolean;
  aiResponseLines: string[];
};

type Position = {
  left: string;
  top: string;
};

type BoxShape = Position & {
  width: string;
  height: string;
  marginLeft?: string;
  marginTop?: string;
  transform: string;
};

type LineShape = Position & {
  width: string;
  transform: string;
  opacity: number;
};

type WorldState = {
  direction: string;
  thought: string;
  fragments: string[];
  keywords: string[];
  motion: string;
  contamination: {
    active: boolean;
    influenceMode: InfluenceMode | null;
  };
  overlay: {
    visible: boolean;
    text: string;
  };
};

type SceneGraph = {
  thoughtCenterAnchor: Position;
  thoughtCenterFragment: string;
  thoughtLines: string[];
  focalHalos: {
    primary: BoxShape;
    secondary: BoxShape;
  };
  leadingLines: LineShape[];
  negativeSpace: {
    primary: BoxShape;
    secondary: BoxShape;
  };
  entityCount: number;
};

type TimelineState = {
  drawDuration: number;
  holdDuration: number;
  restDuration: number;
  cycleDuration: number;
};

type SystemsState = {
  composition: "active";
  attention: "active";
  contamination: "active" | "idle";
  typography: "active";
  animation: "active";
};

export type ThoughtSceneEngineState = {
  world: WorldState;
  sceneGraph: SceneGraph;
  systems: SystemsState;
  timeline: TimelineState;
  render: {
    aiResponseLines: string[];
  };
};

function getTypewriterDelay(character: string, influenceMode: InfluenceMode | null) {
  if (character === "," || character === ";") {
    return influenceMode === "stain" ? 150 : 110;
  }

  if (character === "." || character === ":" || character === "!") {
    return influenceMode === "rupture" ? 240 : 180;
  }

  if (influenceMode === "echo") {
    return 28;
  }

  if (influenceMode === "rupture") {
    return 16;
  }

  return 22;
}

function getThoughtDrawDuration(text: string, influenceMode: InfluenceMode | null) {
  if (!text.length) {
    return 0;
  }

  let duration = 160;

  for (let index = 0; index < text.length - 1; index += 1) {
    duration += getTypewriterDelay(text[index], influenceMode);
  }

  return duration;
}

function getThoughtCycleDuration(text: string, influenceMode: InfluenceMode | null) {
  return THOUGHT_SLICE_DURATION_MS;
}

function getThoughtCenterAnchor(current: ThoughtSceneSlice, currentIndex: number) {
  const intersections = [
    { left: "33.333%", top: "33.333%" },
    { left: "66.666%", top: "33.333%" },
    { left: "33.333%", top: "66.666%" },
    { left: "66.666%", top: "66.666%" },
  ] as const;

  const seed = `${current.direction}|${current.thought}|${currentIndex}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
  }

  return intersections[hash % intersections.length];
}

function splitThoughtIntoLines(text: string, seedSource: string) {
  if (!text.trim()) {
    return [];
  }

  let seed = 0;
  for (let index = 0; index < seedSource.length; index += 1) {
    seed = (seed * 33 + seedSource.charCodeAt(index)) % 2147483647;
  }

  const lineTargets = [
    20 + (seed % 5),
    28 + (seed % 4),
    24 + ((seed >> 2) % 5),
    30 + ((seed >> 3) % 4),
  ];

  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  let targetIndex = 0;

  words.forEach((word) => {
    const maxChars = lineTargets[targetIndex % lineTargets.length];
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxChars || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
    targetIndex += 1;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function getFocalHaloShapes(
  current: ThoughtSceneSlice,
  anchor: Position,
  influenceMode: InfluenceMode | null,
) {
  const fragmentFactor = Math.min(current.fragments.length, 5);
  const keywordFactor = Math.min(current.keywords.length, 8);
  const primaryWidth = 128 + current.triad.business.score * 68 + current.visual.convergence * 54;
  const primaryHeight = 128 + current.triad.art.score * 54 + current.visual.wave * 22;
  const secondaryWidth =
    primaryWidth + 56 + current.visual.density * 24 + fragmentFactor * 6 + keywordFactor * 2;
  const secondaryHeight =
    primaryHeight + 44 + current.visual.drift * 26 + fragmentFactor * 4;
  const offsetX = Math.round((current.visual.drift - 0.5) * 28);
  const offsetY = Math.round((current.visual.wave - 0.7) * 18);
  const primaryRotation = `${Math.round((current.visual.fracture - 0.35) * 10)}deg`;
  const secondaryRotation = `${
    Math.round((current.visual.drift - 0.45) * 12 + (current.triad.design.score - 0.5) * 10)
  }deg`;
  const secondaryLeft = anchor.left === "33.333%" ? "84%" : "16%";
  const secondaryTop = anchor.top === "33.333%" ? "84%" : "16%";
  const secondaryOffsetX =
    Math.round((current.visual.drift - 0.5) * 16) +
    (influenceMode === "counterpoint" ? 10 : 0);
  const secondaryOffsetY =
    Math.round((current.visual.wave - 0.7) * 12) +
    (influenceMode === "stain" ? 8 : 0);

  return {
    primary: {
      left: anchor.left,
      top: anchor.top,
      width: `${primaryWidth}px`,
      height: `${primaryHeight}px`,
      marginLeft: `${offsetX}px`,
      marginTop: `${offsetY}px`,
      transform: `translate(-50%, -50%) rotate(${primaryRotation})`,
    },
    secondary: {
      left: secondaryLeft,
      top: secondaryTop,
      width: `${secondaryWidth}px`,
      height: `${secondaryHeight}px`,
      marginLeft: `${secondaryOffsetX}px`,
      marginTop: `${secondaryOffsetY}px`,
      transform: `translate(-50%, -50%) rotate(${secondaryRotation})`,
    },
  };
}

function getLeadingLineShapes(
  current: ThoughtSceneSlice,
  anchor: Position,
  influenceMode: InfluenceMode | null,
) {
  const anchorX = Number(anchor.left.replace("%", ""));
  const anchorY = Number(anchor.top.replace("%", ""));
  const structurePull = current.triad.design.score;
  const attentionPull = current.triad.business.score;
  const artPull = current.triad.art.score;

  const startPoints = [
    {
      x: 6 + current.visual.drift * 7,
      y: 79 - current.visual.wave * 8,
      reach: 0.94,
    },
    {
      x: 92 - current.visual.convergence * 10,
      y: 14 + current.visual.fracture * 18,
      reach: 0.88,
    },
    {
      x: 82 - attentionPull * 10,
      y: 88 - structurePull * 14,
      reach: 0.82,
    },
  ];

  const modeScale =
    influenceMode === "rupture"
      ? 1.08
      : influenceMode === "counterpoint"
        ? 0.92
        : influenceMode === "echo"
          ? 0.98
          : 1;

  return startPoints.map((point, index) => {
    const targetX =
      anchorX +
      (index === 1 ? (artPull - 0.5) * 6 : 0) +
      (influenceMode === "counterpoint" && index === 2 ? -8 : 0);
    const targetY =
      anchorY +
      (index === 0 ? (attentionPull - 0.5) * 5 : 0) +
      (influenceMode === "stain" ? 3 : 0);
    const dx = targetX - point.x;
    const dy = targetY - point.y;
    const length = Math.sqrt(dx * dx + dy * dy) * point.reach * modeScale;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return {
      left: `${point.x}%`,
      top: `${point.y}%`,
      width: `${length}%`,
      transform: `rotate(${angle}deg)`,
      opacity: 0.6 + structurePull * 0.16 + (index === 1 ? artPull * 0.08 : 0),
    };
  });
}

function getNegativeSpaceShapes(
  current: ThoughtSceneSlice,
  anchor: Position,
  influenceMode: InfluenceMode | null,
) {
  const anchorX = Number(anchor.left.replace("%", ""));
  const anchorY = Number(anchor.top.replace("%", ""));
  const centerOnLeft = anchorX < 50;
  const centerOnTop = anchorY < 50;
  const density = current.visual.density;
  const structure = current.triad.design.score;
  const attention = current.triad.business.score;
  const fracture = current.visual.fracture;

  const safeWidth = 14 + (1 - structure) * 10 + (1 - attention) * 6;
  const safeHeight = 10 + (1 - density / 2) * 8 + (1 - fracture) * 4;
  const secondaryWidth = safeWidth - 3 + current.visual.drift * 4;
  const secondaryHeight = safeHeight - 1 + current.visual.wave * 3;

  return {
    primary: {
      left: centerOnLeft ? "72%" : "7%",
      top: centerOnTop ? "70%" : "8%",
      width: `${Math.max(12, safeWidth)}%`,
      height: `${Math.max(8, safeHeight)}%`,
      transform: `rotate(${Math.round((current.visual.drift - 0.5) * 8)}deg)`,
    },
    secondary: {
      left: centerOnLeft ? "8%" : "70%",
      top: centerOnTop ? "10%" : "74%",
      width: `${Math.max(10, secondaryWidth)}%`,
      height: `${Math.max(7, secondaryHeight)}%`,
      transform: `rotate(${
        Math.round((current.visual.fracture - 0.4) * 10) +
        (influenceMode === "counterpoint" ? -4 : 0)
      }deg)`,
    },
  };
}

export function buildThoughtSceneEngine(input: ThoughtSceneInput): ThoughtSceneEngineState {
  const { current, currentIndex, influenceMode, animatedThought, isThoughtOverlayVisible } = input;
  const thoughtCenterAnchor = getThoughtCenterAnchor(current, currentIndex);
  const thoughtCenterFragment = current.fragments[0] ?? current.keywords[0] ?? "anchor";
  const thoughtLines = splitThoughtIntoLines(
    animatedThought,
    `${current.direction}|${current.thought}|${currentIndex}`,
  );
  const focalHalos = getFocalHaloShapes(current, thoughtCenterAnchor, influenceMode);
  const leadingLines = getLeadingLineShapes(current, thoughtCenterAnchor, influenceMode);
  const negativeSpace = getNegativeSpaceShapes(current, thoughtCenterAnchor, influenceMode);
  const drawDuration = getThoughtDrawDuration(current.thought, influenceMode);

  return {
    world: {
      direction: current.direction,
      thought: current.thought,
      fragments: current.fragments,
      keywords: current.keywords,
      motion: current.motion,
      contamination: {
        active: Boolean(influenceMode),
        influenceMode,
      },
      overlay: {
        visible: isThoughtOverlayVisible,
        text: animatedThought,
      },
    },
    sceneGraph: {
      thoughtCenterAnchor,
      thoughtCenterFragment,
      thoughtLines,
      focalHalos,
      leadingLines,
      negativeSpace,
      entityCount:
        1 +
        current.fragments.length +
        current.keywords.slice(0, 6).length +
        leadingLines.length +
        2 +
        2 +
        input.aiResponseLines.length,
    },
    systems: {
      composition: "active",
      attention: "active",
      contamination: influenceMode ? "active" : "idle",
      typography: "active",
      animation: "active",
    },
    timeline: {
      drawDuration,
      holdDuration: THOUGHT_OVERLAY_HOLD_MS,
      restDuration: THOUGHT_STAGE_REST_MS,
      cycleDuration: getThoughtCycleDuration(current.thought, influenceMode),
    },
    render: {
      aiResponseLines: input.aiResponseLines,
    },
  };
}

export {
  getThoughtCycleDuration,
  getThoughtDrawDuration,
  getTypewriterDelay,
  THOUGHT_OVERLAY_HOLD_MS,
  THOUGHT_STAGE_REST_MS,
};
