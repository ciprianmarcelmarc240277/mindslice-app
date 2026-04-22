import type {
  ArtCompositionRuntime,
  ArtCompositionScores,
  ArtCompositionThresholds,
  ColorPaletteState,
  ContaminationType,
  LiveInterference,
  ThoughtMemoryEntry,
  ThoughtState,
  Triad,
  VisualState,
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

function defaultThresholds(): ArtCompositionThresholds {
  return {
    unity: 0.7,
    balance: 0.68,
    rhythm: 0.66,
    movement: 0.68,
    contrast: 0.7,
    proportion: 0.67,
    focus: 0.72,
  };
}

export function interpretCompositionIdea(current: ThoughtState) {
  return [
    `Compoziția pornește din ${current.direction || "o direcție fără nume"}.`,
    `Sistemul vizual rulează în modul ${current.visual.mode} cu mișcare ${current.motion}.`,
    `Atenția caută un centru prin ${current.fragments[0] ?? current.keywords[0] ?? "un nod încă instabil"}.`,
  ].join(" ");
}

function buildBaseComposition(
  current: ThoughtState,
  palette: ColorPaletteState,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  const memoryTrace = thoughtMemory.flatMap((entry) => entry.fragments).slice(0, 2);
  const focusNode = current.fragments[0] ?? current.keywords[0] ?? current.direction;

  return {
    unityMap: unique([
      current.visual.mode,
      current.materials[0],
      current.direction,
      ...memoryTrace,
    ]),
    balanceMap: unique([
      current.visual.convergence >= 0.62 ? "balanced:centered_tension" : "balanced:offset_tension",
      current.visual.drift > 0.55 ? "weight:asymmetric_controlled" : "weight:measured",
      `density:${current.visual.density.toFixed(2)}`,
    ]),
    rhythmMap: unique([
      ...current.fragments.slice(0, 3),
      ...current.keywords.slice(0, 3),
      current.motion,
    ]),
    movementMap: unique([
      current.motion,
      `wave:${current.visual.wave.toFixed(2)}`,
      `drift:${current.visual.drift.toFixed(2)}`,
      `focus:${focusNode}`,
    ]),
    contrastMap: unique([
      `fracture:${current.visual.fracture.toFixed(2)}`,
      `accent:${palette.accent}`,
      current.visual.density > 1.3 ? "tension:dense" : "tension:breathing",
    ]),
    proportionMap: unique([
      `entity_scale:${current.fragments.length}/${current.keywords.length}`,
      current.visual.convergence >= 0.72 ? "hierarchy:compressed" : "hierarchy:distributed",
      `focus_weight:${current.triad.business.score.toFixed(2)}`,
    ]),
    focusNode,
  };
}

export function selectArtContamination(
  interference: LiveInterference | null,
  thoughtMemory: ThoughtMemoryEntry[],
): ContaminationType {
  if (interference) {
    return interference.influenceMode;
  }

  return thoughtMemory.find((entry) => entry.influence_mode)?.influence_mode ?? "whisper";
}

export function applyArtContamination(
  composition: Omit<ThoughtState["visual"], never> & {
    unityMap: string[];
    balanceMap: string[];
    rhythmMap: string[];
    movementMap: string[];
    contrastMap: string[];
    proportionMap: string[];
    focusNode: string;
  },
  contaminationType: ContaminationType,
  current: ThoughtState,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  const next = {
    ...composition,
    unityMap: [...composition.unityMap],
    balanceMap: [...composition.balanceMap],
    rhythmMap: [...composition.rhythmMap],
    movementMap: [...composition.movementMap],
    contrastMap: [...composition.contrastMap],
    proportionMap: [...composition.proportionMap],
  };

  if (contaminationType === "whisper") {
    next.unityMap = unique([current.visual.mode, ...next.unityMap]);
    next.balanceMap = unique([...next.balanceMap, "shift:subtle"]);
  }

  if (contaminationType === "echo") {
    next.rhythmMap = unique([current.fragments[0], ...next.rhythmMap]);
    next.movementMap = unique([...next.movementMap, "echo:return_path"]);
  }

  if (contaminationType === "counterpoint") {
    next.contrastMap = unique([...next.contrastMap, "opposition:active"]);
    next.balanceMap = unique([...next.balanceMap, "weight:counterforce"]);
  }

  if (contaminationType === "stain") {
    const trace = thoughtMemory.flatMap((entry) => entry.keywords).find(Boolean) ?? "memory trace";
    next.unityMap = unique([...next.unityMap, `memory:${trace}`]);
    next.proportionMap = unique([...next.proportionMap, "scale:residue"]);
  }

  return next;
}

export function rejectArtContamination(contaminationType: ContaminationType) {
  return contaminationType === "noise" ||
    contaminationType === "overload" ||
    contaminationType === "collapse" ||
    contaminationType === "fragment";
}

export function iterateArtSystem(
  composition: {
    unityMap: string[];
    balanceMap: string[];
    rhythmMap: string[];
    movementMap: string[];
    contrastMap: string[];
    proportionMap: string[];
    focusNode: string;
  },
  iterationIndex: number,
) {
  return {
    ...composition,
    unityMap: unique([...composition.unityMap, iterationIndex === 0 ? "unity:repair" : "unity:stabilized"]),
    balanceMap: unique([...composition.balanceMap, "balance:redistributed"]),
    rhythmMap: unique([...composition.rhythmMap, `rhythm:modulation_${iterationIndex + 1}`]),
    movementMap: unique([...composition.movementMap, "movement:guided_path"]),
    contrastMap: unique([...composition.contrastMap, "contrast:readable"]),
    proportionMap: unique([...composition.proportionMap, "proportion:hierarchy_refined"]),
  };
}

export function evaluateUnity(composition: ThoughtState["visual"] & {
  unityMap: string[];
  balanceMap: string[];
  rhythmMap: string[];
  movementMap: string[];
  contrastMap: string[];
  proportionMap: string[];
  focusNode: string;
}) {
  return clamp(
    composition.unityMap.length >= 3 ? 0.38 : 0.18 +
      composition.convergence * 0.28 +
      Math.max(0, 1 - composition.fracture) * 0.18,
    0,
    1,
  );
}

export function evaluateBalance(composition: VisualState & {
  balanceMap: string[];
}) {
  return clamp(
    (composition.drift <= 0.7 ? 0.34 : 0.18) +
      composition.convergence * 0.22 +
      (composition.balanceMap.some((entry) => entry.includes("controlled")) ? 0.18 : 0.08) +
      Math.max(0, 1 - Math.abs(composition.density - 1.2)) * 0.18,
    0,
    1,
  );
}

export function evaluateRhythm(composition: { rhythmMap: string[] }, triad: Triad) {
  return clamp(
    Math.min(composition.rhythmMap.length, 5) * 0.12 +
      triad.design.score * 0.24 +
      triad.art.score * 0.12,
    0,
    1,
  );
}

export function evaluateMovement(composition: VisualState & { movementMap: string[] }) {
  return clamp(
    composition.wave * 0.28 +
      composition.drift * 0.18 +
      composition.convergence * 0.14 +
      (composition.movementMap.length >= 3 ? 0.18 : 0.08),
    0,
    1,
  );
}

export function evaluateContrast(composition: VisualState & { contrastMap: string[] }) {
  return clamp(
    composition.fracture * 0.3 +
      composition.density * 0.16 +
      (composition.contrastMap.some((entry) => entry.includes("readable")) ? 0.2 : 0.1),
    0,
    1,
  );
}

export function evaluateProportion(composition: { proportionMap: string[] }, triad: Triad) {
  return clamp(
    (composition.proportionMap.length >= 3 ? 0.28 : 0.14) +
      triad.design.score * 0.2 +
      triad.business.score * 0.12,
    0,
    1,
  );
}

export function evaluateFocus(composition: { focusNode: string; movementMap: string[] }, triad: Triad) {
  return clamp(
    (composition.focusNode ? 0.34 : 0) +
      triad.business.score * 0.26 +
      (composition.movementMap.some((entry) => entry.startsWith("focus:")) ? 0.18 : 0.08),
    0,
    1,
  );
}

export function evaluateArtComposition(input: {
  composition: {
    unityMap: string[];
    balanceMap: string[];
    rhythmMap: string[];
    movementMap: string[];
    contrastMap: string[];
    proportionMap: string[];
    focusNode: string;
  };
  visual: VisualState;
  triad: Triad;
}): ArtCompositionScores {
  const compositionVisual = { ...input.visual, ...input.composition };
  const unity = evaluateUnity(compositionVisual);
  const balance = evaluateBalance(compositionVisual);
  const rhythm = evaluateRhythm(input.composition, input.triad);
  const movement = evaluateMovement({ ...input.visual, movementMap: input.composition.movementMap });
  const contrast = evaluateContrast({ ...input.visual, contrastMap: input.composition.contrastMap });
  const proportion = evaluateProportion(input.composition, input.triad);
  const focus = evaluateFocus(input.composition, input.triad);

  return {
    unity,
    balance,
    rhythm,
    movement,
    contrast,
    proportion,
    focus,
  };
}

export function validArtComposition(scores: ArtCompositionScores, thresholds: ArtCompositionThresholds) {
  return scores.unity >= thresholds.unity &&
    scores.balance >= thresholds.balance &&
    scores.rhythm >= thresholds.rhythm &&
    scores.movement >= thresholds.movement &&
    scores.contrast >= thresholds.contrast &&
    scores.proportion >= thresholds.proportion &&
    scores.focus >= thresholds.focus;
}

export function evaluateArtTerminationCondition(input: {
  contaminationRejected: boolean;
  iterationCount: number;
  maxIterations: number;
  isValidComposition: boolean;
}) {
  return input.contaminationRejected ||
    (!input.isValidComposition && input.iterationCount >= input.maxIterations);
}

export function modifyArtPerceptionSystem(
  scores: ArtCompositionScores,
  composition: { focusNode: string; contrastMap: string[] },
) {
  const impact = scores.focus * 0.28 + scores.movement * 0.18 + scores.contrast * 0.18 + scores.unity * 0.16;
  const modifiesSystem = Boolean(composition.focusNode) && composition.contrastMap.length >= 2 && impact >= 0.68;

  return {
    modifiesSystem,
    note: modifiesSystem
      ? "Compoziția schimbă traseul privirii și reorganizează câmpul perceptiv."
      : "Compoziția rămâne lizibilă, dar nu modifică încă suficient traseul percepției.",
  };
}

export function buildArtConcept(
  composition: {
    unityMap: string[];
    balanceMap: string[];
    rhythmMap: string[];
    movementMap: string[];
    contrastMap: string[];
    proportionMap: string[];
    focusNode: string;
  },
  runtime: ArtCompositionRuntime,
) {
  return {
    ...composition,
    outputText: [
      `Compoziția unește ${composition.focusNode} cu un câmp de relații controlate.`,
      runtime.acceptedContamination
        ? `Contaminarea ${runtime.contaminationMode} a fost metabolizată compozițional după ${runtime.iterationCount} iterații.`
        : `Contaminarea ${runtime.contaminationMode} a fost respinsă înainte de a perturba structura.`,
      runtime.lawNote,
    ].join(" "),
    outputVisual: [
      `focus ${composition.focusNode}`,
      `balance ${composition.balanceMap[0] ?? "unset"}`,
      `rhythm ${composition.rhythmMap[0] ?? "unset"}`,
      `movement ${composition.movementMap[0] ?? "unset"}`,
    ].join(" / "),
    runtime,
  };
}

export function mergeVisualSystems(input: {
  generatedForm: {
    base: {
      type: "POINT" | "LINE" | "PLANE" | "VOLUME";
      complexity: number;
      orientation: string;
    };
    evolved: "POINT" | "LINE" | "PLANE" | "VOLUME";
  };
  compositionLayout: {
    layout: string;
    balanceScore: number;
  };
  colorPalette: {
    hue: "calm_hue" | "contrast_hue";
    saturation: number;
    brightness: number;
  };
}) {
  return {
    geometry: input.generatedForm,
    composition: input.compositionLayout,
    color: input.colorPalette,
  };
}

export function computeVisualCoherence(visual: ReturnType<typeof mergeVisualSystems>) {
  const geometryWeight =
    (visual.geometry.base.complexity * 0.26) +
    (visual.geometry.evolved === "VOLUME" ? 0.18 : visual.geometry.evolved === "PLANE" ? 0.12 : 0.08);
  const compositionWeight = visual.composition.balanceScore * 0.34;
  const colorWeight =
    (visual.color.hue === "calm_hue" ? 0.16 : 0.12) +
    visual.color.saturation * 0.12 +
    visual.color.brightness * 0.1;

  return clamp(geometryWeight + compositionWeight + colorWeight, 0, 1);
}

export function refineVisualOutput(
  composition: ReturnType<typeof buildArtConcept>,
  visual: ReturnType<typeof mergeVisualSystems>,
) {
  return {
    ...composition,
    balanceMap: unique([...composition.balanceMap, "visual:refined_balance"]),
    unityMap: unique([...composition.unityMap, `visual:${visual.geometry.evolved.toLowerCase()}_integration`]),
    contrastMap: unique([...composition.contrastMap, `color:${visual.color.hue}`]),
    outputText: `${composition.outputText} Visual output-ul a fost rafinat pentru a ridica coerența internă.`,
  };
}

export function applyMergedVisualOutputToArtComposition(
  composition: ReturnType<typeof buildArtConcept>,
  input: {
    generatedForm: {
      base: {
        type: "POINT" | "LINE" | "PLANE" | "VOLUME";
        complexity: number;
        orientation: string;
      };
      evolved: "POINT" | "LINE" | "PLANE" | "VOLUME";
    };
    compositionLayout: {
      layout: string;
      balanceScore: number;
    };
    colorPalette: {
      hue: "calm_hue" | "contrast_hue";
      saturation: number;
      brightness: number;
    };
  },
) {
  const visualOutput = mergeVisualSystems(input);
  const visualScore = computeVisualCoherence(visualOutput);
  const threshold = 0.7;
  const refinedComposition = visualScore < threshold
    ? refineVisualOutput(composition, visualOutput)
    : composition;

  return {
    ...refinedComposition,
    runtime: {
      ...refinedComposition.runtime,
      visualOutput,
      visualScore,
      visualRefined: visualScore < threshold,
      notes: [
        ...refinedComposition.runtime.notes,
        `visual score ${visualScore.toFixed(2)}`,
        visualScore < threshold ? "visual refinement applied" : "visual refinement not required",
      ],
    },
  };
}

export function updateArtSystemState(input: {
  composition: ReturnType<typeof buildArtConcept>;
  validation: ArtCompositionScores;
}) {
  const { validation } = input;

  return {
    unityPatterns: {
      cohesionWeight: clamp(validation.unity * 0.26 + validation.proportion * 0.12, 0, 1),
    },
    balanceLogic: {
      redistributionWeight: clamp(validation.balance * 0.3 + validation.contrast * 0.1, 0, 1),
    },
    attentionBehavior: {
      focusWeight: clamp(validation.focus * 0.34 + validation.movement * 0.12, 0, 1),
      pathWeight: clamp(validation.movement * 0.28 + validation.rhythm * 0.14, 0, 1),
    },
    proportionRules: {
      hierarchyWeight: clamp(validation.proportion * 0.3 + validation.unity * 0.12, 0, 1),
    },
    notes: [
      `unity bias ${validation.unity.toFixed(2)}`,
      `balance bias ${validation.balance.toFixed(2)}`,
      `focus bias ${validation.focus.toFixed(2)}`,
    ],
  };
}

export function isArtCanonical(input: {
  composition: ReturnType<typeof buildArtConcept>;
  validation: ArtCompositionScores;
  stage: string;
  sourceIdeaCanonCount: number;
}) {
  const reuse = clamp(
    input.sourceIdeaCanonCount >= 2 ? 0.74 : 0.46 + input.sourceIdeaCanonCount * 0.12,
    0,
    1,
  );
  const impact = clamp(
    input.validation.focus * 0.34 +
      input.validation.movement * 0.22 +
      input.validation.contrast * 0.16 +
      input.validation.unity * 0.12,
    0,
    1,
  );
  const stability = clamp(
    (input.stage === "canonical" ? 0.42 : input.stage === "resolved" ? 0.32 : 0.16) +
      input.validation.balance * 0.18 +
      input.validation.proportion * 0.18 +
      input.validation.unity * 0.14,
    0,
    1,
  );

  return reuse >= 0.6 && impact >= 0.66 && stability >= 0.68;
}

export function processCompositionIdea(input: {
  current: ThoughtState;
  palette: ColorPaletteState;
  interference: LiveInterference | null;
  thoughtMemory: ThoughtMemoryEntry[];
  maxIterations?: number;
}) {
  const { current, palette, interference, thoughtMemory, maxIterations = 3 } = input;
  const thresholds = defaultThresholds();
  const interpretation = interpretCompositionIdea(current);
  const contaminationMode = selectArtContamination(interference, thoughtMemory);
  const contaminationRejected = rejectArtContamination(contaminationMode);
  let working = buildBaseComposition(current, palette, thoughtMemory);
  const notes = [interpretation];

  if (contaminationRejected) {
    const runtime: ArtCompositionRuntime = {
      interpretation,
      contaminationMode,
      acceptedContamination: false,
      iterationCount: 1,
      terminated: true,
      terminationReason: "rejected_contamination",
      thresholds,
      scores: {
        unity: 0,
        balance: 0,
        rhythm: 0,
        movement: 0,
        contrast: 0,
        proportion: 0,
        focus: 0,
      },
      isValidComposition: false,
      lawPassed: false,
      lawNote: "Contaminarea a fost respinsă înainte de a intra în sistemul compozițional.",
      notes: [...notes, "Contaminarea negativă a fost respinsă de sistemul compozițional."],
    };

    return buildArtConcept(working, runtime);
  }

  working = applyArtContamination(
    { ...current.visual, ...working },
    contaminationMode,
    current,
    thoughtMemory,
  );

  let iterationCount = 0;
  let lastScores: ArtCompositionScores = {
    unity: 0,
    balance: 0,
    rhythm: 0,
    movement: 0,
    contrast: 0,
    proportion: 0,
    focus: 0,
  };
  let isValid = false;

  while (iterationCount < maxIterations) {
    iterationCount += 1;
    lastScores = evaluateArtComposition({
      composition: working,
      visual: current.visual,
      triad: current.triad,
    });
    isValid = validArtComposition(lastScores, thresholds);
    notes.push(
      `Iterația ${iterationCount}: u ${lastScores.unity.toFixed(2)} / b ${lastScores.balance.toFixed(2)} / r ${lastScores.rhythm.toFixed(2)} / m ${lastScores.movement.toFixed(2)} / c ${lastScores.contrast.toFixed(2)} / p ${lastScores.proportion.toFixed(2)} / f ${lastScores.focus.toFixed(2)}.`,
    );

    if (isValid) {
      break;
    }

    working = iterateArtSystem(working, iterationCount - 1);
  }

  const terminated = evaluateArtTerminationCondition({
    contaminationRejected: false,
    iterationCount,
    maxIterations,
    isValidComposition: isValid,
  });
  const law = modifyArtPerceptionSystem(lastScores, working);
  const runtime: ArtCompositionRuntime = {
    interpretation,
    contaminationMode,
    acceptedContamination: true,
    iterationCount,
    terminated,
    terminationReason: isValid ? "threshold_reached" : "iteration_limit",
    thresholds,
    scores: lastScores,
    isValidComposition: isValid,
    lawPassed: law.modifiesSystem,
    lawNote: law.note,
    notes,
  };

  return buildArtConcept(working, runtime);
}
