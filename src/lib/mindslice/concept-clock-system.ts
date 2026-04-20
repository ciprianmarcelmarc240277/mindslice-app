"use client";

import type {
  ClockDisplayState,
  ClockRuntime,
  ClockScores,
  ClockThresholds,
  ContaminationType,
  InfluenceMode,
  ThoughtState,
} from "@/lib/mindslice/mindslice-types";

type ClockUserState = {
  current: ThoughtState;
  isActive: boolean;
  influenceMode: InfluenceMode | null;
};

type ClockThought = {
  hours: string;
  minutes: string;
  seconds: string;
  format: "24h" | "12h";
  visualStyle: string;
  attentionAnchor: string;
  transition: string;
  outputVisual: string;
  rhythm: string;
  interpretation: string;
  notes: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function defaultThresholds(): ClockThresholds {
  return {
    readability: 0.72,
    attention: 0.66,
    stability: 0.74,
    perception: 0.62,
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function readSystemTime(now = new Date()) {
  return {
    hours24: pad(now.getHours()),
    hours12: pad(((now.getHours() + 11) % 12) + 1),
    minutes: pad(now.getMinutes()),
    seconds: pad(now.getSeconds()),
    milliseconds: now.getMilliseconds(),
  };
}

export function interpretTime(now: Date, userState: ClockUserState): ClockThought {
  const time = readSystemTime(now);
  const format = userState.current.visual.convergence >= 0.7 ? "24h" : "12h";
  const hours = format === "24h" ? time.hours24 : time.hours12;
  const visualStyle =
    userState.current.visual.mode.includes("fract") || userState.current.visual.fracture > 0.42
      ? "fractured_precision"
      : userState.current.visual.convergence > 0.76
        ? "anchored_field"
        : "soft_orbit";
  const attentionAnchor =
    userState.current.triad.business.score >= userState.current.triad.art.score
      ? "hours_minutes"
      : "seconds_pulse";
  const transition =
    userState.current.visual.wave > 0.9 ? "liquid_step" : "stable_tick";

  return {
    hours,
    minutes: time.minutes,
    seconds: time.seconds,
    format,
    visualStyle,
    attentionAnchor,
    transition,
    outputVisual: `${visualStyle} / ${attentionAnchor} / ${transition}`,
    rhythm: `${hours}:${time.minutes}:${time.seconds}`,
    interpretation: `Timpul intră în scenă prin ${visualStyle}, cu focus pe ${attentionAnchor} și un ritm ${transition}.`,
    notes: [
      `ora este citită prin ${format}`,
      `stilul vizual urmează modul ${userState.current.visual.mode}`,
      `atenția este atrasă spre ${attentionAnchor}`,
    ],
  };
}

function normalizeTimeContamination(influenceMode: InfluenceMode | null): ContaminationType {
  if (!influenceMode) {
    return "whisper";
  }

  if (influenceMode === "rupture") {
    return "counterpoint";
  }

  return influenceMode;
}

export function selectTimeBehavior(userState: ClockUserState): ContaminationType {
  return normalizeTimeContamination(userState.influenceMode);
}

export function rejectTimeDistortion(contaminationType: ContaminationType) {
  return contaminationType === "noise" ||
    contaminationType === "overload" ||
    contaminationType === "fragment";
}

export function applyTimeContamination(
  thought: ClockThought,
  contaminationType: ContaminationType,
) {
  const next = {
    ...thought,
    notes: [...thought.notes],
  };

  if (contaminationType === "whisper") {
    next.transition = "subtle_fade";
    next.notes.push("tranziția devine aproape imperceptibilă");
  }

  if (contaminationType === "echo") {
    next.attentionAnchor = "hours_minutes_seconds";
    next.outputVisual = `${next.visualStyle} / reinforced_rhythm / ${next.transition}`;
    next.notes.push("ritmul secundelor este întărit prin repetiție");
  }

  if (contaminationType === "counterpoint") {
    next.visualStyle = `${next.visualStyle}_offset`;
    next.notes.push("este introdusă o variație controlată în câmpul vizual");
  }

  if (contaminationType === "stain") {
    next.transition = "memory_trail";
    next.notes.push("timpul lasă o urmă vizibilă între două secunde");
  }

  next.outputVisual = `${next.visualStyle} / ${next.attentionAnchor} / ${next.transition}`;
  return next;
}

export function evaluateReadability(thought: ClockThought, userState: ClockUserState) {
  return clamp(
    0.38 +
      (thought.format === "24h" ? 0.16 : 0.1) +
      (thought.attentionAnchor === "hours_minutes" ? 0.14 : 0.08) +
      userState.current.triad.design.score * 0.18,
    0,
    1,
  );
}

export function evaluateAttention(thought: ClockThought, userState: ClockUserState) {
  return clamp(
    0.32 +
      (thought.attentionAnchor === "hours_minutes" ? 0.2 : 0.14) +
      userState.current.triad.business.score * 0.24 +
      (userState.isActive ? 0.08 : 0.04),
    0,
    1,
  );
}

export function evaluateStability(thought: ClockThought, userState: ClockUserState) {
  return clamp(
    0.34 +
      (thought.transition === "stable_tick" || thought.transition === "subtle_fade" ? 0.22 : 0.14) +
      (1 - clamp(userState.current.visual.fracture, 0, 1)) * 0.18 +
      userState.current.triad.design.score * 0.14,
    0,
    1,
  );
}

export function evaluatePerception(thought: ClockThought, userState: ClockUserState) {
  return clamp(
    0.34 +
      (thought.transition === "memory_trail" ? 0.16 : 0.08) +
      (thought.visualStyle.includes("anchored") ? 0.12 : 0.08) +
      userState.current.triad.art.score * 0.24 +
      userState.current.visual.wave * 0.06,
    0,
    1,
  );
}

export function validClockState(scores: ClockScores, thresholds: ClockThresholds) {
  return scores.readability >= thresholds.readability &&
    scores.attention >= thresholds.attention &&
    scores.stability >= thresholds.stability &&
    scores.perception >= thresholds.perception;
}

export function iterateTimeState(thought: ClockThought, iterationIndex: number) {
  return {
    ...thought,
    visualStyle: iterationIndex === 0 ? "anchored_field" : thought.visualStyle,
    attentionAnchor: "hours_minutes",
    transition: iterationIndex === 0 ? "stable_tick" : "subtle_fade",
    outputVisual:
      iterationIndex === 0
        ? "anchored_field / hours_minutes / stable_tick"
        : `${thought.visualStyle} / hours_minutes / subtle_fade`,
    notes: [...thought.notes, `iterația ${iterationIndex + 1} reduce ambiguitatea și stabilizează ritmul`],
  };
}

export function evaluateClockTerminationCondition(iterationIndex: number) {
  return iterationIndex >= 2;
}

export function synchronizePerceptionAndTime(display: ClockDisplayState) {
  return display.runtime.scores.readability >= 0.72 && display.runtime.scores.stability >= 0.7;
}

export function buildTimeDisplay(thought: ClockThought, runtime: ClockRuntime): ClockDisplayState {
  return {
    hours: thought.hours,
    minutes: thought.minutes,
    seconds: thought.seconds,
    format: thought.format,
    visualStyle: thought.visualStyle,
    attentionAnchor: thought.attentionAnchor,
    transition: thought.transition,
    outputVisual: thought.outputVisual,
    runtime,
  };
}

export function updateClockSystem(display: ClockDisplayState) {
  return {
    visualBehavior: {
      emphasisWeight: display.runtime.scores.attention,
      legibilityWeight: display.runtime.scores.readability,
    },
    transitionLogic: {
      smoothnessWeight: display.runtime.scores.stability,
      transitionMode: display.transition,
    },
    attentionPattern: {
      anchor: display.attentionAnchor,
      perceptionWeight: display.runtime.scores.perception,
    },
    notes: [
      `stil activ: ${display.visualStyle}`,
      `ancoră de atenție: ${display.attentionAnchor}`,
      `tranziție: ${display.transition}`,
    ],
  };
}

export function processTime(input: {
  now: Date;
  userState: ClockUserState;
}): ClockDisplayState {
  const thresholds = defaultThresholds();
  let thought = interpretTime(input.now, input.userState);
  const contaminationMode = selectTimeBehavior(input.userState);
  let acceptedContamination = !rejectTimeDistortion(contaminationMode);
  let iterationCount = 0;
  let terminated = false;
  let terminationReason: ClockRuntime["terminationReason"] = "threshold_reached";

  if (acceptedContamination) {
    thought = applyTimeContamination(thought, contaminationMode);
  } else {
    terminationReason = "rejected_contamination";
  }

  let scores: ClockScores = {
    readability: evaluateReadability(thought, input.userState),
    attention: evaluateAttention(thought, input.userState),
    stability: evaluateStability(thought, input.userState),
    perception: evaluatePerception(thought, input.userState),
  };

  while (!validClockState(scores, thresholds) && !terminated) {
    if (evaluateClockTerminationCondition(iterationCount)) {
      terminated = true;
      terminationReason = "iteration_limit";
      break;
    }

    thought = iterateTimeState(thought, iterationCount);
    iterationCount += 1;
    scores = {
      readability: evaluateReadability(thought, input.userState),
      attention: evaluateAttention(thought, input.userState),
      stability: evaluateStability(thought, input.userState),
      perception: evaluatePerception(thought, input.userState),
    };
  }

  const isValidClockState = validClockState(scores, thresholds) && !terminated && acceptedContamination;
  const runtime: ClockRuntime = {
    interpretation: thought.interpretation,
    contaminationMode,
    acceptedContamination,
    iterationCount,
    terminated,
    terminationReason,
    thresholds,
    scores,
    isValidClockState,
    lawPassed: false,
    lawNote: "",
    notes: thought.notes,
  };
  const display = buildTimeDisplay(thought, runtime);
  const lawPassed = synchronizePerceptionAndTime(display);
  display.runtime.lawPassed = lawPassed;
  display.runtime.lawNote = lawPassed
    ? "display-ul sincronizează percepția și timpul"
    : isValidClockState
      ? "display-ul citește timpul, dar nu-l face încă perceptiv coerent"
      : "display-ul rămâne vizibil ca fallback, chiar dacă validarea nu este încă completă";

  return display;
}
