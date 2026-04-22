import type {
  ContaminationType,
  HistoryEntry,
  LiveInterference,
  NarrativeScenarioRuntime,
  NarrativeScenarioScores,
  NarrativeScenarioThresholds,
  ThoughtMemoryEntry,
  ThoughtState,
  Triad,
} from "@/lib/mindslice/mindslice-types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unique(values: Array<string | null | undefined>) {
  return values.filter((value, index, array): value is string => {
    if (!value?.trim()) {
      return false;
    }

    return array.findIndex((candidate) => candidate?.trim() === value.trim()) === index;
  });
}

function defaultThresholds(): NarrativeScenarioThresholds {
  return {
    conflict: 0.68,
    tension: 0.7,
    progression: 0.66,
    meaning: 0.68,
    attention: 0.7,
  };
}

export function interpretNarrativeIdea(current: ThoughtState) {
  return [
    `Narațiunea pornește din ${current.direction || "o direcție fără nume"}.`,
    `Conflictul se adună în jurul lui ${current.fragments[0] ?? current.keywords[0] ?? "un nucleu instabil"}.`,
    `Atenția trebuie să traverseze ${current.motion} fără să piardă sensul simbolic.`,
  ].join(" ");
}

function buildBaseScenario(
  current: ThoughtState,
  history: HistoryEntry[],
  thoughtMemory: ThoughtMemoryEntry[],
  interference: LiveInterference | null,
) {
  const memoryEvent =
    thoughtMemory.flatMap((entry) => entry.fragments).find(Boolean) ??
    current.fragments[1] ??
    "memorie latentă";
  const conflictSeed = current.fragments[0] ?? current.keywords[0] ?? current.direction;
  const externalForce = interference?.title ?? memoryEvent;

  return {
    coreConflict: `${conflictSeed} se lovește de ${externalForce}`,
    characterDrive:
      current.keywords[0] ??
      current.fragments[0] ??
      "a obține control asupra unui câmp instabil",
    stakes: unique([
      current.mood,
      current.direction,
      interference ? `pierdere prin ${interference.influenceMode}` : "pierdere de centru",
    ]).join(" / "),
    turningPoints: unique([
      current.fragments[0],
      history[history.length - 1]?.text.slice(0, 48),
      memoryEvent,
      interference ? interference.influenceMode : "internal_shift",
    ]).slice(0, 4),
    tensionCurve: unique([
      `entry:${current.direction}`,
      `pressure:${current.visual.fracture.toFixed(2)}`,
      `drift:${current.visual.drift.toFixed(2)}`,
    ]),
    progression: unique([
      `phase_1:${current.fragments[0] ?? current.direction}`,
      `phase_2:${memoryEvent}`,
      `phase_3:${current.keywords[0] ?? "return"}`,
    ]),
    resolution:
      interference
        ? `Rezolvarea rămâne provizorie prin metabolizarea ${interference.influenceMode}.`
        : "Rezolvarea rămâne deschisă, dar sistemul începe să-și fixeze consecințele.",
    attentionFlow: unique([
      `entry:${current.direction}`,
      `retention:${current.motion}`,
      `transition:${current.visual.mode}`,
      `anchor:${conflictSeed}`,
    ]),
  };
}

export function selectNarrativeContamination(
  interference: LiveInterference | null,
  thoughtMemory: ThoughtMemoryEntry[],
): ContaminationType {
  if (interference) {
    return interference.influenceMode;
  }

  return thoughtMemory.find((entry) => entry.influence_mode)?.influence_mode ?? "whisper";
}

export function rejectNarrativeContamination(contaminationType: ContaminationType) {
  return contaminationType === "noise" ||
    contaminationType === "overload" ||
    contaminationType === "collapse" ||
    contaminationType === "fragment";
}

export function applyNarrativeContamination(
  scenario: ReturnType<typeof buildBaseScenario>,
  contaminationType: ContaminationType,
  current: ThoughtState,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  const next = {
    ...scenario,
    turningPoints: [...scenario.turningPoints],
    tensionCurve: [...scenario.tensionCurve],
    progression: [...scenario.progression],
    attentionFlow: [...scenario.attentionFlow],
  };

  if (contaminationType === "whisper") {
    next.characterDrive = `${next.characterDrive} cu o deviație subtilă`;
    next.attentionFlow = unique([...next.attentionFlow, "shift:subtle_intention"]);
  }

  if (contaminationType === "echo") {
    next.coreConflict = `${next.coreConflict} și se amplifică`;
    next.tensionCurve = unique([...next.tensionCurve, "echo:conflict_return"]);
  }

  if (contaminationType === "counterpoint") {
    next.turningPoints = unique([...next.turningPoints, "opposing_force"]).slice(0, 5);
    next.progression = unique([...next.progression, "phase_4:counterforce"]);
  }

  if (contaminationType === "stain") {
    const event = thoughtMemory.flatMap((entry) => entry.keywords).find(Boolean) ?? "memory_event";
    next.turningPoints = unique([...next.turningPoints, `memory:${event}`]).slice(0, 5);
    next.resolution = `${next.resolution} O urmă de memorie refuză să dispară.`;
  }

  next.stakes = unique([next.stakes, current.mood, contaminationType]).join(" / ");

  return next;
}

export function iterateNarrativeSystem(
  scenario: ReturnType<typeof buildBaseScenario>,
  iterationIndex: number,
) {
  return {
    ...scenario,
    turningPoints: unique([...scenario.turningPoints, `turn_${iterationIndex + 2}`]).slice(0, 6),
    tensionCurve: unique([...scenario.tensionCurve, `escalation_${iterationIndex + 1}`]),
    progression: unique([...scenario.progression, `phase_${iterationIndex + 4}:irreversible_change`]),
    attentionFlow: unique([...scenario.attentionFlow, `transition_${iterationIndex + 1}:guided`]),
    resolution:
      iterationIndex >= 1
        ? `${scenario.resolution} Sensul începe să se stabilizeze prin consecințe ireversibile.`
        : scenario.resolution,
  };
}

export function evaluateConflict(scenario: ReturnType<typeof buildBaseScenario>) {
  return clamp(
    (scenario.coreConflict.includes("se lovește de") ? 0.34 : 0.18) +
      (scenario.stakes.includes("/") ? 0.18 : 0.08) +
      Math.min(scenario.turningPoints.length, 4) * 0.1,
    0,
    1,
  );
}

export function evaluateTension(
  scenario: ReturnType<typeof buildBaseScenario>,
  triad: Triad,
) {
  return clamp(
    Math.min(scenario.tensionCurve.length, 5) * 0.11 +
      triad.art.score * 0.22 +
      triad.business.score * 0.14,
    0,
    1,
  );
}

export function evaluateProgression(
  scenario: ReturnType<typeof buildBaseScenario>,
  history: HistoryEntry[],
) {
  return clamp(
    Math.min(scenario.progression.length, 5) * 0.12 +
      Math.min(history.length, 4) * 0.06 +
      (scenario.progression.some((entry) => entry.includes("irreversible")) ? 0.18 : 0.08),
    0,
    1,
  );
}

export function evaluateMeaning(
  scenario: ReturnType<typeof buildBaseScenario>,
  current: ThoughtState,
) {
  return clamp(
    (scenario.resolution.includes("sens") || scenario.resolution.includes("memorie") ? 0.24 : 0.1) +
      current.triad.art.score * 0.26 +
      current.keywords.length * 0.03,
    0,
    1,
  );
}

export function evaluateAttentionFlow(
  scenario: ReturnType<typeof buildBaseScenario>,
  current: ThoughtState,
) {
  return clamp(
    Math.min(scenario.attentionFlow.length, 5) * 0.11 +
      current.triad.business.score * 0.26 +
      current.visual.convergence * 0.16,
    0,
    1,
  );
}

export function evaluateScenario(input: {
  scenario: ReturnType<typeof buildBaseScenario>;
  current: ThoughtState;
  history: HistoryEntry[];
}): NarrativeScenarioScores {
  return {
    conflict: evaluateConflict(input.scenario),
    tension: evaluateTension(input.scenario, input.current.triad),
    progression: evaluateProgression(input.scenario, input.history),
    meaning: evaluateMeaning(input.scenario, input.current),
    attention: evaluateAttentionFlow(input.scenario, input.current),
  };
}

export function validScenario(
  scores: NarrativeScenarioScores,
  thresholds: NarrativeScenarioThresholds,
) {
  return scores.conflict >= thresholds.conflict &&
    scores.tension >= thresholds.tension &&
    scores.progression >= thresholds.progression &&
    scores.meaning >= thresholds.meaning &&
    scores.attention >= thresholds.attention;
}

export function evaluateNarrativeTerminationCondition(input: {
  contaminationRejected: boolean;
  iterationCount: number;
  maxIterations: number;
  isValidScenario: boolean;
}) {
  return input.contaminationRejected ||
    (!input.isValidScenario && input.iterationCount >= input.maxIterations);
}

export function extractScenarioTension(input: {
  concept: {
    title?: string;
    tension?: string;
    thesis?: string;
    oneLineDefinition?: string;
  };
}) {
  return input.concept.tension ??
    input.concept.thesis ??
    input.concept.oneLineDefinition ??
    input.concept.title ??
    "conflict latent";
}

export function buildIntroduction(input: {
  visualOutput: {
    geometry: {
      evolved: "POINT" | "LINE" | "PLANE" | "VOLUME";
    };
    composition: {
      layout: string;
    };
  };
}) {
  return `introduction:${input.visualOutput.geometry.evolved}:${input.visualOutput.composition.layout}`;
}

export function buildUp(input: {
  tension: string;
}) {
  return `build_up:${input.tension}`;
}

export function buildClimax(input: {
  tension: string;
}) {
  return `climax:${input.tension}`;
}

export function buildResolution(input: {
  visualOutput: {
    color: {
      hue: "calm_hue" | "contrast_hue";
    };
  };
}) {
  return `resolution:${input.visualOutput.color.hue}`;
}

export function buildNarrativeSequenceFromVisual(input: {
  tension: string;
  visualOutput: {
    geometry: {
      evolved: "POINT" | "LINE" | "PLANE" | "VOLUME";
    };
    composition: {
      layout: string;
    };
    color: {
      hue: "calm_hue" | "contrast_hue";
    };
  };
}) {
  return [
    buildIntroduction({
      visualOutput: {
        geometry: input.visualOutput.geometry,
        composition: input.visualOutput.composition,
      },
    }),
    buildUp({
      tension: input.tension,
    }),
    buildClimax({
      tension: input.tension,
    }),
    buildResolution({
      visualOutput: {
        color: input.visualOutput.color,
      },
    }),
  ];
}

export function applyVisualOutputToScenario(
  scenario: ReturnType<typeof buildScenarioConcept>,
  input: {
    concept: {
      title?: string;
      tension?: string;
      thesis?: string;
      oneLineDefinition?: string;
    };
    visualOutput: {
      geometry: {
        evolved: "POINT" | "LINE" | "PLANE" | "VOLUME";
      };
      composition: {
        layout: string;
      };
      color: {
        hue: "calm_hue" | "contrast_hue";
      };
    };
  },
) {
  const extractedTension = extractScenarioTension({
    concept: input.concept,
  });
  const narrativeSequence = buildNarrativeSequenceFromVisual({
    tension: extractedTension,
    visualOutput: input.visualOutput,
  });

  return {
    ...scenario,
    progression: unique([...scenario.progression, ...narrativeSequence]).slice(0, 6),
    attentionFlow: unique([
      ...scenario.attentionFlow,
      `visual:${input.visualOutput.geometry.evolved.toLowerCase()}`,
      `color:${input.visualOutput.color.hue}`,
    ]).slice(0, 6),
    outputText: `${scenario.outputText} Secvența narativă simplă se ordonează prin ${narrativeSequence.join(" -> ")}.`,
    runtime: {
      ...scenario.runtime,
      extractedTension,
      narrativeSequence,
      notes: [
        ...scenario.runtime.notes,
        `scenario tension ${extractedTension}`,
        `narrative sequence ${narrativeSequence.join(" | ")}`,
      ],
    },
  };
}

export function modifyNarrativeSystem(
  scores: NarrativeScenarioScores,
  scenario: ReturnType<typeof buildBaseScenario>,
) {
  const structuralInfluence =
    scores.conflict * 0.22 +
    scores.tension * 0.24 +
    scores.progression * 0.18 +
    scores.attention * 0.18;
  const modifiesSystem =
    scenario.turningPoints.length >= 3 &&
    scenario.attentionFlow.length >= 3 &&
    structuralInfluence >= 0.68;

  return {
    modifiesSystem,
    note: modifiesSystem
      ? "Scenariul schimbă arhitectura internă a conflictului și reorientează retenția atenției."
      : "Scenariul rămâne lizibil, dar nu schimbă încă suficient sistemul narativ.",
  };
}

export function buildScenarioConcept(
  scenario: ReturnType<typeof buildBaseScenario>,
  runtime: NarrativeScenarioRuntime,
) {
  return {
    ...scenario,
    outputText: [
      `Scenariul organizează conflictul ${scenario.coreConflict}.`,
      runtime.acceptedContamination
        ? `Contaminarea ${runtime.contaminationMode} a fost metabolizată narativ după ${runtime.iterationCount} iterații.`
        : `Contaminarea ${runtime.contaminationMode} a fost respinsă înainte să fractureze scena.`,
      runtime.lawNote,
    ].join(" "),
    outputStructure: [
      `conflict ${scenario.coreConflict}`,
      `drive ${scenario.characterDrive}`,
      `turn ${scenario.turningPoints[0] ?? "unset"}`,
      `resolution ${scenario.resolution}`,
    ].join(" / "),
    runtime,
  };
}

export function updateNarrativeSystemState(input: {
  scenario: ReturnType<typeof buildScenarioConcept>;
  validation: NarrativeScenarioScores;
}) {
  const { validation } = input;

  return {
    conflictPatterns: {
      escalationWeight: clamp(validation.conflict * 0.28 + validation.tension * 0.12, 0, 1),
    },
    tensionBehavior: {
      suspenseWeight: clamp(validation.tension * 0.32 + validation.attention * 0.1, 0, 1),
      retentionWeight: clamp(validation.attention * 0.28 + validation.progression * 0.12, 0, 1),
    },
    storyProbabilities: {
      irreversibilityBias: clamp(validation.progression * 0.3 + validation.conflict * 0.08, 0, 1),
      symbolicDepth: clamp(validation.meaning * 0.34 + validation.tension * 0.06, 0, 1),
      sequenceBias: clamp(validation.progression * 0.24 + validation.attention * 0.14, 0, 1),
    },
    notes: [
      `conflict bias ${validation.conflict.toFixed(2)}`,
      `tension bias ${validation.tension.toFixed(2)}`,
      `meaning bias ${validation.meaning.toFixed(2)}`,
    ],
  };
}

export function isNarrativeCanonical(input: {
  scenario: ReturnType<typeof buildScenarioConcept>;
  validation: NarrativeScenarioScores;
  stage: string;
  sourceIdeaCanonCount: number;
}) {
  const reuse = clamp(
    input.sourceIdeaCanonCount >= 2 ? 0.74 : 0.46 + input.sourceIdeaCanonCount * 0.12,
    0,
    1,
  );
  const impact = clamp(
    input.validation.tension * 0.28 +
      input.validation.progression * 0.24 +
      input.validation.meaning * 0.18 +
      input.validation.attention * 0.14,
    0,
    1,
  );
  const stability = clamp(
    (input.stage === "canonical" ? 0.4 : input.stage === "resolved" ? 0.3 : 0.16) +
      input.validation.conflict * 0.16 +
      input.validation.progression * 0.18 +
      input.validation.meaning * 0.14,
    0,
    1,
  );

  return reuse >= 0.6 && impact >= 0.66 && stability >= 0.68;
}

export function processNarrativeIdea(input: {
  current: ThoughtState;
  history: HistoryEntry[];
  interference: LiveInterference | null;
  thoughtMemory: ThoughtMemoryEntry[];
  maxIterations?: number;
}) {
  const { current, history, interference, thoughtMemory, maxIterations = 3 } = input;
  const thresholds = defaultThresholds();
  const interpretation = interpretNarrativeIdea(current);
  const contaminationMode = selectNarrativeContamination(interference, thoughtMemory);
  const contaminationRejected = rejectNarrativeContamination(contaminationMode);
  let working = buildBaseScenario(current, history, thoughtMemory, interference);
  const notes = [interpretation];

  if (contaminationRejected) {
    const runtime: NarrativeScenarioRuntime = {
      interpretation,
      contaminationMode,
      acceptedContamination: false,
      iterationCount: 1,
      terminated: true,
      terminationReason: "rejected_contamination",
      thresholds,
      scores: {
        conflict: 0,
        tension: 0,
        progression: 0,
        meaning: 0,
        attention: 0,
      },
      isValidScenario: false,
      lawPassed: false,
      lawNote: "Contaminarea a fost respinsă înainte să intre în sistemul narativ.",
      notes: [...notes, "Contaminarea negativă a fost respinsă de sistemul narativ."],
    };

    return buildScenarioConcept(working, runtime);
  }

  working = applyNarrativeContamination(working, contaminationMode, current, thoughtMemory);

  let iterationCount = 0;
  let lastScores: NarrativeScenarioScores = {
    conflict: 0,
    tension: 0,
    progression: 0,
    meaning: 0,
    attention: 0,
  };
  let isValid = false;

  while (iterationCount < maxIterations) {
    iterationCount += 1;
    lastScores = evaluateScenario({
      scenario: working,
      current,
      history,
    });
    isValid = validScenario(lastScores, thresholds);
    notes.push(
      `Iterația ${iterationCount}: c ${lastScores.conflict.toFixed(2)} / t ${lastScores.tension.toFixed(2)} / p ${lastScores.progression.toFixed(2)} / m ${lastScores.meaning.toFixed(2)} / a ${lastScores.attention.toFixed(2)}.`,
    );

    if (isValid) {
      break;
    }

    working = iterateNarrativeSystem(working, iterationCount - 1);
  }

  const terminated = evaluateNarrativeTerminationCondition({
    contaminationRejected: false,
    iterationCount,
    maxIterations,
    isValidScenario: isValid,
  });
  const law = modifyNarrativeSystem(lastScores, working);
  const runtime: NarrativeScenarioRuntime = {
    interpretation,
    contaminationMode,
    acceptedContamination: true,
    iterationCount,
    terminated,
    terminationReason: isValid ? "threshold_reached" : "iteration_limit",
    thresholds,
    scores: lastScores,
    isValidScenario: isValid,
    lawPassed: law.modifiesSystem,
    lawNote: law.note,
    notes,
  };

  return buildScenarioConcept(working, runtime);
}
