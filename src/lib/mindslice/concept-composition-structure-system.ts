"use client";

import type {
  ColorPaletteState,
  CompositionStructureRuntime,
  CompositionStructureScores,
  CompositionStructureThresholds,
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

function defaultThresholds(): CompositionStructureThresholds {
  return {
    thirds: 0.66,
    golden: 0.64,
    symmetry: 0.66,
    center: 0.66,
    attention: 0.7,
  };
}

export function interpretStructureIdea(current: ThoughtState) {
  return [
    `Structura de ecran pornește din ${current.direction || "o idee fără nume"}.`,
    `Suprafața caută o grilă pentru ${current.fragments[0] ?? current.keywords[0] ?? "un centru încă latent"}.`,
    `Poziționarea încearcă să țină împreună ${current.visual.mode} și ${current.motion}.`,
  ].join(" ");
}

function deriveGrid(current: ThoughtState, triad: Triad) {
  if (triad.design.score >= 0.72 || current.visual.convergence >= 0.72) {
    return "golden";
  }

  if (current.visual.drift >= 0.54 || current.fragments.length >= 3) {
    return "thirds";
  }

  return "custom";
}

function deriveSubjectPosition(current: ThoughtState) {
  if (current.visual.drift >= 0.62) {
    return "upper-right-third";
  }

  if (current.visual.convergence >= 0.76) {
    return "center-lock";
  }

  if (current.visual.wave >= 0.68) {
    return "left-third-entry";
  }

  return "offset-center";
}

function deriveSymmetryState(current: ThoughtState) {
  if (current.visual.convergence >= 0.76 && current.visual.fracture <= 0.34) {
    return "symmetry_precise";
  }

  if (current.visual.drift >= 0.5) {
    return "asymmetry_controlled";
  }

  return "near_symmetry";
}

function deriveCenterState(current: ThoughtState) {
  if (current.visual.convergence >= 0.78) {
    return "centered_intentional";
  }

  if (current.visual.drift >= 0.52) {
    return "decentered_tension";
  }

  return "soft_center";
}

function buildBaseStructure(
  current: ThoughtState,
  palette: ColorPaletteState,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  const memoryTrace = thoughtMemory.flatMap((entry) => entry.keywords).slice(0, 3);
  const grid = deriveGrid(current, current.triad);
  const subjectPosition = deriveSubjectPosition(current);
  const symmetryState = deriveSymmetryState(current);
  const centerState = deriveCenterState(current);

  return {
    grid,
    subjectPosition,
    symmetryState,
    centerState,
    tensionZones: unique([
      `focus:${current.fragments[0] ?? current.direction}`,
      `accent:${palette.accent}`,
      current.visual.drift >= 0.52 ? "edge-pressure:right" : "edge-pressure:balanced",
      ...memoryTrace.map((trace) => `memory:${trace}`),
    ]),
    attentionMap: unique([
      `entry:${subjectPosition}`,
      `grid:${grid}`,
      `motion:${current.motion}`,
      `mode:${current.visual.mode}`,
    ]),
  };
}

export function selectStructureContamination(
  interference: LiveInterference | null,
  thoughtMemory: ThoughtMemoryEntry[],
): ContaminationType {
  if (interference) {
    return interference.influenceMode;
  }

  return thoughtMemory.find((entry) => entry.influence_mode)?.influence_mode ?? "whisper";
}

export function rejectStructureContamination(contaminationType: ContaminationType) {
  return contaminationType === "noise" ||
    contaminationType === "collapse" ||
    contaminationType === "fragment";
}

export function applyStructureContamination(
  structure: ReturnType<typeof buildBaseStructure>,
  contaminationType: ContaminationType,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  const next = {
    ...structure,
    tensionZones: [...structure.tensionZones],
    attentionMap: [...structure.attentionMap],
  };

  if (contaminationType === "whisper") {
    next.subjectPosition = next.subjectPosition === "center-lock"
      ? "offset-center"
      : next.subjectPosition;
    next.attentionMap = unique([...next.attentionMap, "shift:subtle"]);
  }

  if (contaminationType === "echo") {
    next.attentionMap = unique([next.attentionMap[0], ...next.attentionMap, "grid:reinforced"]);
  }

  if (contaminationType === "counterpoint") {
    next.symmetryState = next.symmetryState.includes("symmetry")
      ? "asymmetry_controlled"
      : "symmetry_precise";
    next.tensionZones = unique([...next.tensionZones, "alignment:counterforce"]);
  }

  if (contaminationType === "stain") {
    const trace = thoughtMemory.flatMap((entry) => entry.fragments).find(Boolean) ?? "trace";
    next.tensionZones = unique([...next.tensionZones, `residue:${trace}`]);
    next.attentionMap = unique([...next.attentionMap, "memory:structural"]);
  }

  return next;
}

export function iterateStructureSystem(
  structure: ReturnType<typeof buildBaseStructure>,
  iterationIndex: number,
) {
  return {
    ...structure,
    grid: structure.grid === "custom" ? "thirds" : structure.grid,
    subjectPosition: iterationIndex === 0 && structure.subjectPosition === "offset-center"
      ? "left-third-entry"
      : structure.subjectPosition,
    tensionZones: unique([...structure.tensionZones, "tension:refined"]),
    attentionMap: unique([...structure.attentionMap, `path:repair_${iterationIndex + 1}`]),
  };
}

export function evaluateRuleOfThirds(
  structure: ReturnType<typeof buildBaseStructure>,
  visual: VisualState,
) {
  return clamp(
    (structure.grid === "thirds" ? 0.38 : structure.subjectPosition.includes("third") ? 0.28 : 0.12) +
      visual.drift * 0.18 +
      Math.max(0, 1 - visual.fracture) * 0.16,
    0,
    1,
  );
}

export function evaluateGoldenRatio(
  structure: ReturnType<typeof buildBaseStructure>,
  visual: VisualState,
  triad: Triad,
) {
  return clamp(
    (structure.grid === "golden" ? 0.4 : structure.attentionMap.some((entry) => entry.includes("motion")) ? 0.18 : 0.08) +
      triad.design.score * 0.2 +
      visual.wave * 0.16 +
      visual.convergence * 0.12,
    0,
    1,
  );
}

export function evaluateSymmetry(
  structure: ReturnType<typeof buildBaseStructure>,
  visual: VisualState,
) {
  return clamp(
    (structure.symmetryState === "symmetry_precise" ? 0.38 : structure.symmetryState === "asymmetry_controlled" ? 0.34 : 0.24) +
      visual.convergence * 0.18 +
      Math.max(0, 1 - Math.abs(visual.drift - 0.5)) * 0.14,
    0,
    1,
  );
}

export function evaluateCenterPosition(
  structure: ReturnType<typeof buildBaseStructure>,
  visual: VisualState,
) {
  return clamp(
    (structure.centerState === "centered_intentional" ? 0.38 : structure.centerState === "decentered_tension" ? 0.34 : 0.22) +
      visual.convergence * 0.16 +
      visual.drift * 0.12,
    0,
    1,
  );
}

export function evaluateStructuralAttention(
  structure: ReturnType<typeof buildBaseStructure>,
  triad: Triad,
) {
  return clamp(
    Math.min(structure.attentionMap.length, 5) * 0.11 +
      Math.min(structure.tensionZones.length, 4) * 0.07 +
      triad.business.score * 0.22 +
      triad.design.score * 0.18,
    0,
    1,
  );
}

export function evaluateCompositionStructure(input: {
  structure: ReturnType<typeof buildBaseStructure>;
  visual: VisualState;
  triad: Triad;
}): CompositionStructureScores {
  return {
    thirds: evaluateRuleOfThirds(input.structure, input.visual),
    golden: evaluateGoldenRatio(input.structure, input.visual, input.triad),
    symmetry: evaluateSymmetry(input.structure, input.visual),
    center: evaluateCenterPosition(input.structure, input.visual),
    attention: evaluateStructuralAttention(input.structure, input.triad),
  };
}

export function validCompositionStructure(
  scores: CompositionStructureScores,
  thresholds: CompositionStructureThresholds,
) {
  return scores.thirds >= thresholds.thirds &&
    scores.golden >= thresholds.golden &&
    scores.symmetry >= thresholds.symmetry &&
    scores.center >= thresholds.center &&
    scores.attention >= thresholds.attention;
}

export function buildStructureConcept(
  structure: ReturnType<typeof buildBaseStructure>,
  runtime: CompositionStructureRuntime,
) {
  return {
    ...structure,
    outputVisual: [
      `grid ${structure.grid}`,
      `subject ${structure.subjectPosition}`,
      `symmetry ${structure.symmetryState}`,
      `center ${structure.centerState}`,
    ].join(" / "),
    outputText: [
      `Suprafața ecranului organizează atenția prin grila ${structure.grid} și poziția ${structure.subjectPosition}.`,
      `Starea ${structure.symmetryState} lucrează împreună cu ${structure.centerState}.`,
      runtime.lawNote,
    ].join(" "),
    runtime,
  };
}

export function updateStructureSystemState(input: {
  structure: ReturnType<typeof buildStructureConcept>;
  validation: CompositionStructureScores;
}) {
  const { validation } = input;

  return {
    gridPreferences: {
      thirdsWeight: clamp(validation.thirds * 0.34 + validation.attention * 0.12, 0, 1),
      goldenWeight: clamp(validation.golden * 0.34 + validation.center * 0.1, 0, 1),
    },
    alignmentLogic: {
      symmetryWeight: clamp(validation.symmetry * 0.32 + validation.center * 0.12, 0, 1),
      centerWeight: clamp(validation.center * 0.34 + validation.thirds * 0.08, 0, 1),
    },
    attentionFlow: {
      anchorWeight: clamp(validation.attention * 0.36 + validation.center * 0.12, 0, 1),
      tensionWeight: clamp(validation.attention * 0.22 + validation.symmetry * 0.14, 0, 1),
    },
    notes: [
      `thirds bias ${validation.thirds.toFixed(2)}`,
      `golden bias ${validation.golden.toFixed(2)}`,
      `attention bias ${validation.attention.toFixed(2)}`,
    ],
  };
}

export function organizeAttentionThroughPosition(
  scores: CompositionStructureScores,
  structure: ReturnType<typeof buildBaseStructure>,
) {
  const organizes = Boolean(structure.subjectPosition) &&
    structure.attentionMap.length >= 3 &&
    (scores.attention * 0.42 + scores.center * 0.18 + scores.symmetry * 0.12) >= 0.62;

  return {
    organizes,
    note: organizes
      ? "Structura conduce atenția prin poziționare și distribuția tensiunii."
      : "Structura rămâne lizibilă, dar nu organizează încă suficient traseul privirii.",
  };
}

export function isStructureCanonical(input: {
  structure: ReturnType<typeof buildStructureConcept>;
  validation: CompositionStructureScores;
  stage: string;
  sourceIdeaCanonCount: number;
}) {
  const reuse = clamp(
    input.sourceIdeaCanonCount >= 2 ? 0.74 : 0.44 + input.sourceIdeaCanonCount * 0.14,
    0,
    1,
  );
  const impact = clamp(
    input.validation.attention * 0.36 +
      input.validation.center * 0.18 +
      input.validation.symmetry * 0.16 +
      input.validation.thirds * 0.12,
    0,
    1,
  );
  const stability = clamp(
    (input.stage === "canonical" ? 0.42 : input.stage === "resolved" ? 0.32 : 0.16) +
      input.validation.golden * 0.16 +
      input.validation.symmetry * 0.16 +
      input.validation.center * 0.16,
    0,
    1,
  );

  return reuse >= 0.6 && impact >= 0.64 && stability >= 0.66;
}

export function processStructureIdea(input: {
  current: ThoughtState;
  palette: ColorPaletteState;
  interference: LiveInterference | null;
  thoughtMemory: ThoughtMemoryEntry[];
  maxIterations?: number;
}) {
  const { current, palette, interference, thoughtMemory, maxIterations = 3 } = input;
  const thresholds = defaultThresholds();
  const interpretation = interpretStructureIdea(current);
  const contaminationMode = selectStructureContamination(interference, thoughtMemory);
  const contaminationRejected = rejectStructureContamination(contaminationMode);
  let working = buildBaseStructure(current, palette, thoughtMemory);
  const notes = [interpretation];

  if (contaminationRejected) {
    const runtime: CompositionStructureRuntime = {
      interpretation,
      contaminationMode,
      acceptedContamination: false,
      iterationCount: 1,
      terminated: true,
      terminationReason: "rejected_contamination",
      thresholds,
      scores: { thirds: 0, golden: 0, symmetry: 0, center: 0, attention: 0 },
      isValidStructure: false,
      lawPassed: false,
      lawNote: "Contaminarea a fost respinsă înainte să rupă structura de suprafață.",
      notes: [...notes, "Distorsiunea structurală a fost refuzată de sistem."],
    };

    return buildStructureConcept(working, runtime);
  }

  working = applyStructureContamination(working, contaminationMode, thoughtMemory);

  let iterationCount = 0;
  let lastScores: CompositionStructureScores = {
    thirds: 0,
    golden: 0,
    symmetry: 0,
    center: 0,
    attention: 0,
  };
  let isValid = false;

  while (iterationCount < maxIterations) {
    iterationCount += 1;
    lastScores = evaluateCompositionStructure({
      structure: working,
      visual: current.visual,
      triad: current.triad,
    });
    isValid = validCompositionStructure(lastScores, thresholds);
    notes.push(
      `Iterația ${iterationCount}: thirds ${lastScores.thirds.toFixed(2)} / golden ${lastScores.golden.toFixed(2)} / symmetry ${lastScores.symmetry.toFixed(2)} / center ${lastScores.center.toFixed(2)} / attention ${lastScores.attention.toFixed(2)}.`,
    );

    if (isValid) {
      break;
    }

    working = iterateStructureSystem(working, iterationCount - 1);
  }

  const law = organizeAttentionThroughPosition(lastScores, working);
  const runtime: CompositionStructureRuntime = {
    interpretation,
    contaminationMode,
    acceptedContamination: true,
    iterationCount,
    terminated: !isValid && iterationCount >= maxIterations,
    terminationReason: isValid ? "threshold_reached" : "iteration_limit",
    thresholds,
    scores: lastScores,
    isValidStructure: isValid,
    lawPassed: law.organizes,
    lawNote: law.note,
    notes,
  };

  return buildStructureConcept(working, runtime);
}
