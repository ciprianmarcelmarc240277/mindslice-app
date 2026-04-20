import type {
  HistoryEntry,
  IdeaInterpretationResult,
  LiveInterference,
  ThoughtMemoryEntry,
  ThoughtState,
} from "@/lib/mindslice/mindslice-types";

type InterpretIdeaInput = {
  current: ThoughtState;
  currentIndex: number;
  history: HistoryEntry[];
  thoughtMemory: ThoughtMemoryEntry[];
  interference: LiveInterference | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

export function interpretIdea(input: InterpretIdeaInput): IdeaInterpretationResult {
  const { current, currentIndex, history, thoughtMemory, interference } = input;
  const memoryPressure = clamp(
    Math.min(history.length, 6) * 0.08 + Math.min(thoughtMemory.length, 8) * 0.03,
    0,
    1,
  );
  const contaminationPressure = clamp(
    interference
      ? interference.senseWeight * 0.18 +
          interference.structureWeight * 0.16 +
          interference.attentionWeight * 0.16
      : 0,
    0,
    1,
  );

  const notes = [
    `idea ${current.direction} is interpreted as active thought cycle ${currentIndex + 1}`,
    interference
      ? `live interference ${interference.influenceMode} participates in interpretation`
      : "interpretation runs without external contamination",
    `memory pressure ${memoryPressure.toFixed(2)} / contamination pressure ${contaminationPressure.toFixed(2)}`,
  ];

  return {
    sourceIdeaId: `idea:${slugify(current.direction)}`,
    thoughtId: `thought:${slugify(current.direction)}:${currentIndex + 1}`,
    activeThought: current,
    memoryPressure,
    contaminationPressure,
    notes,
  };
}
