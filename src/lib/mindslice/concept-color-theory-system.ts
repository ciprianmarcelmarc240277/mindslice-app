import type {
  ColorPaletteState,
  CompositionStructureState,
  ColorTheoryRuntime,
  ColorTheoryScores,
  ColorTheoryThresholds,
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

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return null;
  }

  const value = Number.parseInt(normalized, 16);

  if (Number.isNaN(value)) {
    return null;
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return 0.5;
  }

  const normalize = (channel: number) => {
    const scaled = channel / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * normalize(rgb.r) + 0.7152 * normalize(rgb.g) + 0.0722 * normalize(rgb.b);
}

function defaultThresholds(): ColorTheoryThresholds {
  return {
    hueStructure: 0.7,
    valueBalance: 0.7,
    saturationControl: 0.7,
    colorRelations: 0.72,
    attentionImpact: 0.72,
  };
}

function mixHexColors(colorA: string, colorB: string, ratio: number) {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);

  if (!rgbA || !rgbB) {
    return colorA;
  }

  const clampedRatio = clamp(ratio, 0, 1);
  const channel = (left: number, right: number) =>
    Math.round(left + (right - left) * clampedRatio)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(rgbA.r, rgbB.r)}${channel(rgbA.g, rgbB.g)}${channel(rgbA.b, rgbB.b)}`;
}

export function computeHueFromCompositionLayout(layout: {
  balanceScore: number;
}) {
  return layout.balanceScore > 0.7 ? "calm_hue" as const : "contrast_hue" as const;
}

export function computeSaturationFromCompositionLayout(layout: {
  balanceScore: number;
}) {
  return clamp(0.32 + (1 - layout.balanceScore) * 0.56, 0, 1);
}

export function computeBrightnessFromCompositionLayout(layout: {
  layout: string;
}) {
  if (layout.layout.includes("phi_ratio") || layout.layout.includes("mirror")) {
    return 0.72;
  }

  if (layout.layout.includes("thirds")) {
    return 0.62;
  }

  return 0.52;
}

export function generatePaletteFromCompositionLayout(layout: {
  layout: string;
  balanceScore: number;
}) {
  const hue = computeHueFromCompositionLayout(layout);
  const saturation = computeSaturationFromCompositionLayout(layout);
  const brightness = computeBrightnessFromCompositionLayout(layout);

  return {
    hue,
    saturation,
    brightness,
  };
}

export function interpretColorIdea(current: ThoughtState) {
  return [
    `Ideea cromatică pornește din ${current.direction || "o direcție fără nume"}.`,
    `Dominanta afectivă este ${current.mood || "neutră"}, iar câmpul vizual lucrează în modul ${current.visual.mode}.`,
    `Paleta inițială circulă între ${current.palette.slice(0, 3).join(", ") || "tonuri încă nedefinite"}.`,
  ].join(" ");
}

function buildBasePalette(
  current: ThoughtState,
  interference: LiveInterference | null,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  const supportTones = unique(current.palette.slice(3));
  const memoryTone = thoughtMemory.find((entry) => entry.influence_mode)?.keywords[0] ?? null;
  const contaminationTrace = unique([
    interference ? `${interference.influenceMode}:${interference.title}` : null,
    memoryTone ? `memory:${memoryTone}` : null,
  ]);

  const hueMap = unique([
    current.palette[0],
    current.palette[1],
    current.palette[2],
    current.visual.accent,
  ]);

  const valueMap = [
    `background:${current.visual.background}`,
    `ink:${current.visual.ink}`,
    luminance(current.visual.background) - luminance(current.visual.ink) > 0.45
      ? "contrast:pronounced"
      : "contrast:measured",
  ];

  const saturationMap = unique([
    current.visual.accent,
    current.visual.fracture > 0.55 ? "accent:intensified" : "accent:controlled",
    current.visual.density > 1.35 ? "field:dense" : "field:breathing",
  ]);

  const attentionMap = unique([
    `focus:${current.palette[2] ?? current.visual.accent}`,
    `anchor:${current.palette[0] ?? current.visual.background}`,
    `periphery:${current.palette[1] ?? current.visual.ink}`,
  ]);

  return {
    dominant: current.palette[0] ?? current.visual.background,
    secondary: current.palette[1] ?? current.visual.ink,
    accent: current.palette[2] ?? current.visual.accent,
    supportTones,
    hueMap,
    valueMap,
    saturationMap,
    attentionMap,
    contaminationTrace,
  };
}

export function selectColorContamination(
  interference: LiveInterference | null,
  thoughtMemory: ThoughtMemoryEntry[],
): ContaminationType {
  if (interference) {
    return interference.influenceMode;
  }

  const memoryMode = thoughtMemory.find((entry) => entry.influence_mode)?.influence_mode;
  return memoryMode ?? "whisper";
}

export function applyColorContamination(
  palette: Omit<ColorPaletteState, "outputText" | "outputVisual" | "runtime">,
  contaminationType: ContaminationType,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  const next = {
    ...palette,
    supportTones: [...palette.supportTones],
    hueMap: [...palette.hueMap],
    valueMap: [...palette.valueMap],
    saturationMap: [...palette.saturationMap],
    attentionMap: [...palette.attentionMap],
    contaminationTrace: unique([...palette.contaminationTrace, `mode:${contaminationType}`]),
  };

  if (contaminationType === "whisper") {
    next.hueMap = unique([next.dominant, ...next.hueMap]);
    next.saturationMap = unique([...next.saturationMap, "contamination:subtle_shift"]);
  }

  if (contaminationType === "echo") {
    next.supportTones = unique([next.dominant, ...next.supportTones]);
    next.hueMap = unique([next.dominant, next.secondary, ...next.hueMap]);
    next.attentionMap = unique([...next.attentionMap, `echo:${next.dominant}`]);
  }

  if (contaminationType === "counterpoint") {
    const memoryAccent = thoughtMemory.flatMap((entry) => entry.keywords).find(Boolean) ?? "counterpoint";
    next.supportTones = unique([memoryAccent, ...next.supportTones]);
    next.hueMap = unique([next.accent, next.secondary, next.dominant, ...next.hueMap]);
    next.attentionMap = unique([`counterpoint:${next.accent}`, ...next.attentionMap]);
  }

  if (contaminationType === "stain") {
    const trace = thoughtMemory.flatMap((entry) => entry.fragments).find(Boolean) ?? "memory trace";
    next.contaminationTrace = unique([...next.contaminationTrace, `stain:${trace}`]);
    next.saturationMap = unique([...next.saturationMap, "memory:residue"]);
    next.supportTones = unique([trace, ...next.supportTones]);
  }

  return next;
}

export function rejectColorContamination(contaminationType: ContaminationType) {
  return contaminationType === "noise" ||
    contaminationType === "overload" ||
    contaminationType === "collapse" ||
    contaminationType === "fragment";
}

export function iterateColorSystem(
  palette: Omit<ColorPaletteState, "outputText" | "outputVisual" | "runtime">,
  iterationIndex: number,
) {
  const next = {
    ...palette,
    supportTones: [...palette.supportTones],
    hueMap: [...palette.hueMap],
    valueMap: [...palette.valueMap],
    saturationMap: [...palette.saturationMap],
    attentionMap: [...palette.attentionMap],
    contaminationTrace: [...palette.contaminationTrace],
  };

  if (!next.attentionMap.some((entry) => entry.startsWith("focal:"))) {
    next.attentionMap.push(`focal:${next.accent}`);
  }

  if (!next.valueMap.some((entry) => entry.startsWith("hierarchy:"))) {
    next.valueMap.push(iterationIndex === 0 ? "hierarchy:clarifying" : "hierarchy:stabilized");
  }

  if (!next.saturationMap.some((entry) => entry.startsWith("field:"))) {
    next.saturationMap.push("field:breathing");
  }

  return {
    ...next,
    hueMap: unique(next.hueMap),
    valueMap: unique(next.valueMap),
    saturationMap: unique(next.saturationMap),
    attentionMap: unique(next.attentionMap),
    contaminationTrace: unique(next.contaminationTrace),
    supportTones: unique(next.supportTones),
  };
}

export function buildColorConcept(
  palette: Omit<ColorPaletteState, "outputText" | "outputVisual" | "runtime">,
  runtime: ColorTheoryRuntime,
): ColorPaletteState {
  const outputText = [
    `Paleta este condusă de ${palette.dominant}, susținută de ${palette.secondary} și tensionată prin ${palette.accent}.`,
    runtime.acceptedContamination
      ? `Contaminarea ${runtime.contaminationMode} a fost integrată controlat după ${runtime.iterationCount} iterații.`
      : `Contaminarea ${runtime.contaminationMode} a fost respinsă, iar sistemul s-a repliat pe axa internă.`,
    runtime.lawNote,
  ].join(" ");

  const outputVisual = [
    `background ${palette.valueMap[0]?.replace("background:", "") ?? palette.dominant}`,
    `ink ${palette.valueMap[1]?.replace("ink:", "") ?? palette.secondary}`,
    `focus ${palette.accent}`,
    `attention ${palette.attentionMap[0] ?? "distributed"}`,
  ].join(" / ");

  return {
    ...palette,
    outputText,
    outputVisual,
    runtime,
  };
}

export function applyCompositionLayoutToPalette(
  palette: ColorPaletteState,
  structure: CompositionStructureState,
) {
  const compositionLayout = structure.runtime?.compositionLayout ?? structure.runtime?.generatedLayout;

  if (!compositionLayout) {
    return palette;
  }

  const generatedPalette = generatePaletteFromCompositionLayout(compositionLayout);
  const hueColor = generatedPalette.hue === "calm_hue" ? "#8fa7c4" : "#d96b43";
  const brightnessColor = generatedPalette.brightness >= 0.68 ? "#e7edf6" : generatedPalette.brightness >= 0.58 ? "#c2cfdf" : "#7b8798";
  const accentColor = mixHexColors(hueColor, brightnessColor, 1 - generatedPalette.saturation * 0.72);

  return {
    ...palette,
    dominant: mixHexColors(palette.dominant, hueColor, 0.34),
    secondary: mixHexColors(palette.secondary, brightnessColor, 0.28),
    accent: mixHexColors(palette.accent, accentColor, 0.42),
    supportTones: unique([
      ...palette.supportTones,
      `layout_hue:${generatedPalette.hue}`,
      `layout_saturation:${generatedPalette.saturation.toFixed(2)}`,
      `layout_brightness:${generatedPalette.brightness.toFixed(2)}`,
    ]).slice(0, 6),
    outputText: `${palette.outputText} Composition layout-ul recalibrează cromatica prin ${generatedPalette.hue}, cu saturație ${generatedPalette.saturation.toFixed(2)} și luminozitate ${generatedPalette.brightness.toFixed(2)}.`,
    runtime: {
      ...palette.runtime,
      colorPalette: generatedPalette,
      compositionPalette: generatedPalette,
      notes: [
        ...palette.runtime.notes,
        `composition palette ${generatedPalette.hue}`,
      ],
    },
  };
}

function buildVisualStateFromPalette(
  palette: Omit<ColorPaletteState, "outputText" | "outputVisual" | "runtime">,
  visual: VisualState,
): VisualState {
  return {
    ...visual,
    background: palette.valueMap[0]?.replace("background:", "") ?? visual.background,
    accent: palette.accent,
    ink: palette.valueMap[1]?.replace("ink:", "") ?? visual.ink,
  };
}

export function evaluateHueStructure(
  palette: ColorPaletteState,
  visual: VisualState,
  interference: LiveInterference | null,
) {
  return clamp(
    unique([palette.dominant, palette.secondary, palette.accent]).length * 0.2 +
      (palette.hueMap.length >= 3 ? 0.24 : 0.12) +
      Math.max(0, 1 - visual.fracture) * 0.24 +
      (interference?.influenceMode === "counterpoint" ? 0.08 : 0),
    0,
    1,
  );
}

export function evaluateValueBalance(palette: ColorPaletteState, visual: VisualState) {
  const valueContrast = Math.abs(luminance(visual.background) - luminance(visual.ink));

  return clamp(
    valueContrast * 0.7 +
      (visual.density <= 1.55 ? 0.16 : 0.08) +
      (palette.valueMap.some((entry) => entry.includes("pronounced")) ? 0.12 : 0.06),
    0,
    1,
  );
}

export function evaluateSaturationControl(
  palette: ColorPaletteState,
  visual: VisualState,
  triad: Triad,
) {
  return clamp(
    (visual.fracture <= 0.65 ? 0.36 : 0.18) +
      (palette.saturationMap.includes("accent:controlled") ? 0.28 : 0.14) +
      (palette.hueMap.length >= 3 ? 0.2 : 0.08) +
      triad.design.score * 0.16,
    0,
    1,
  );
}

export function evaluateColorRelations(
  palette: ColorPaletteState,
  visual: VisualState,
  interference: LiveInterference | null,
  hueStructure: number,
  valueBalance: number,
) {
  return clamp(
    hueStructure * 0.28 +
      valueBalance * 0.22 +
      (palette.contaminationTrace.length > 0 ? 0.12 : 0.06) +
      (interference?.influenceMode === "stain" || interference?.influenceMode === "echo" ? 0.14 : 0.08) +
      visual.convergence * 0.16,
    0,
    1,
  );
}

export function evaluateAttentionImpact(
  palette: ColorPaletteState,
  visual: VisualState,
  triad: Triad,
) {
  return clamp(
    triad.business.score * 0.34 +
      (palette.attentionMap.length >= 3 ? 0.18 : 0.08) +
      (palette.accent ? 0.14 : 0.04) +
      visual.wave * 0.12 +
      visual.density * 0.08,
    0,
    1,
  );
}

export function evaluateConceptPalette(
  input: {
    palette: ColorPaletteState;
    visual: VisualState;
    triad: Triad;
  },
  interference: LiveInterference | null,
): ColorTheoryScores {
  const { palette, visual, triad } = input;
  const runtimeScores = palette.runtime?.scores;

  if (runtimeScores) {
    return runtimeScores;
  }

  const hueStructure = evaluateHueStructure(palette, visual, interference);
  const valueBalance = evaluateValueBalance(palette, visual);
  const saturationControl = evaluateSaturationControl(palette, visual, triad);
  const colorRelations = evaluateColorRelations(
    palette,
    visual,
    interference,
    hueStructure,
    valueBalance,
  );
  const attentionImpact = evaluateAttentionImpact(palette, visual, triad);

  return {
    hueStructure,
    valueBalance,
    saturationControl,
    colorRelations,
    attentionImpact,
  };
}

export function validPalette(scores: ColorTheoryScores, thresholds: ColorTheoryThresholds) {
  return (
    scores.hueStructure >= thresholds.hueStructure &&
    scores.valueBalance >= thresholds.valueBalance &&
    scores.saturationControl >= thresholds.saturationControl &&
    scores.colorRelations >= thresholds.colorRelations &&
    scores.attentionImpact >= thresholds.attentionImpact
  );
}

export function evaluateTerminationCondition(input: {
  contaminationRejected: boolean;
  iterationCount: number;
  maxIterations: number;
  isValidPalette: boolean;
}) {
  const { contaminationRejected, iterationCount, maxIterations, isValidPalette } = input;

  return contaminationRejected ||
    (!isValidPalette && iterationCount >= maxIterations);
}

export function modifyPerceptionSystem(palette: ColorPaletteState | Omit<ColorPaletteState, "outputText" | "outputVisual" | "runtime">, scores: ColorTheoryScores) {
  const focusCount = palette.attentionMap.filter((entry) => entry.startsWith("focus:") || entry.startsWith("focal:")).length;
  const relationLift = scores.colorRelations * 0.44 + scores.attentionImpact * 0.36 + scores.hueStructure * 0.2;
  const hasPerceptualSpread = unique([palette.dominant, palette.secondary, palette.accent]).length >= 3;
  const modifiesSystem = relationLift >= 0.68 && hasPerceptualSpread && focusCount >= 1;

  return {
    modifiesSystem,
    note: modifiesSystem
      ? "Paleta schimbă distribuția atenției și introduce o memorie perceptivă activă."
      : "Paleta rămâne descriptivă, dar nu reconfigurează încă suficient sistemul percepției.",
  };
}

export function measureColorReuse(sourceIdeaCount: number) {
  return clamp(Math.min(sourceIdeaCount, 4) * 0.18, 0, 1);
}

export function measureAttentionInfluence(scores: ColorTheoryScores) {
  return clamp(
    scores.attentionImpact * 0.46 +
      scores.colorRelations * 0.26 +
      scores.hueStructure * 0.16,
    0,
    1,
  );
}

export function measureTimeStability(
  scores: ColorTheoryScores,
  stage: string,
) {
  return clamp(
    (stage === "canonical" ? 0.42 : 0.18) +
      scores.valueBalance * 0.22 +
      scores.saturationControl * 0.18,
    0,
    1,
  );
}

export function isColorCanonical(input: {
  palette: ColorPaletteState;
  validation: ColorTheoryScores;
  stage: string;
  sourceIdeaCanonCount: number;
}) {
  const { palette, validation, stage, sourceIdeaCanonCount } = input;

  if (!palette.runtime?.isValidPalette || !palette.runtime?.lawPassed) {
    return false;
  }

  const reuse = measureColorReuse(sourceIdeaCanonCount);
  const impact = measureAttentionInfluence(validation);
  const stability = measureTimeStability(validation, stage);

  return reuse >= 0.18 && impact >= 0.58 && stability >= 0.54;
}

export function updateColorSystemState(input: {
  palette: ColorPaletteState;
  validation: ColorTheoryScores;
}) {
  const { palette, validation } = input;
  const runtime = palette.runtime;
  const probabilities = {
    conceptReuseWeight: clamp(validation.hueStructure * 0.24 + validation.colorRelations * 0.18, 0, 1),
    semanticPriority: clamp(validation.valueBalance * 0.2 + validation.attentionImpact * 0.14, 0, 1),
    convergenceBias: clamp(validation.colorRelations * 0.2 + validation.saturationControl * 0.16, 0, 1),
  };
  const hierarchyRules = {
    anchorWeight: clamp(validation.valueBalance * 0.3 + validation.attentionImpact * 0.16, 0, 1),
    peripheralWeight: clamp(validation.saturationControl * 0.18 + validation.hueStructure * 0.1, 0, 1),
    hierarchyBias: clamp(runtime.iterationCount * 0.08 + validation.valueBalance * 0.22, 0, 1),
  };
  const attentionBehavior = {
    focusWeight: clamp(validation.attentionImpact * 0.34 + validation.colorRelations * 0.16, 0, 1),
    memoryFieldWeight: clamp(validation.colorRelations * 0.2 + validation.hueStructure * 0.14, 0, 1),
    contaminationLift: clamp(runtime.acceptedContamination ? 0.18 : 0.04, 0, 1),
  };

  return {
    probabilities,
    hierarchyRules,
    attentionBehavior,
    notes: [
      `probability bias ${probabilities.conceptReuseWeight.toFixed(2)}`,
      `hierarchy bias ${hierarchyRules.hierarchyBias.toFixed(2)}`,
      `attention bias ${attentionBehavior.focusWeight.toFixed(2)}`,
    ],
  };
}

export function integratePalette(input: {
  palette: ColorPaletteState;
  palettePool: ColorPaletteState[];
  colorMemory: ColorPaletteState[];
  colorCanon: ColorPaletteState[];
  validation: ColorTheoryScores;
  stage: string;
  sourceIdeaCanonCount: number;
}) {
  const {
    palette,
    palettePool,
    colorMemory,
    colorCanon,
    validation,
    stage,
    sourceIdeaCanonCount,
  } = input;

  const nextPool = [palette, ...palettePool.filter((entry) => entry.outputText !== palette.outputText)];
  const nextMemory = [palette, ...colorMemory.filter((entry) => entry.outputText !== palette.outputText)];
  const nextCanon = isColorCanonical({
    palette,
    validation,
    stage,
    sourceIdeaCanonCount,
  })
    ? [palette, ...colorCanon.filter((entry) => entry.outputText !== palette.outputText)]
    : colorCanon;

  return {
    palettePool: nextPool,
    colorMemory: nextMemory,
    colorCanon: nextCanon,
    systemStateUpdate: updateColorSystemState({ palette, validation }),
  };
}

export function processColorIdea(input: {
  current: ThoughtState;
  interference: LiveInterference | null;
  thoughtMemory: ThoughtMemoryEntry[];
  maxIterations?: number;
}) {
  const { current, interference, thoughtMemory, maxIterations = 3 } = input;
  const thresholds = defaultThresholds();
  const interpretation = interpretColorIdea(current);
  const contaminationMode = selectColorContamination(interference, thoughtMemory);
  const shouldRejectContamination = rejectColorContamination(contaminationMode);

  let working = buildBasePalette(current, interference, thoughtMemory);
  const notes = [interpretation];

  if (shouldRejectContamination) {
    const scores = evaluateConceptPalette(
      {
        palette: {
          ...buildColorConcept(working, {
            interpretation,
            contaminationMode,
            acceptedContamination: false,
            iterationCount: 1,
            terminated: true,
            terminationReason: "rejected_contamination",
            thresholds,
            scores: {
              hueStructure: 0,
              valueBalance: 0,
              saturationControl: 0,
              colorRelations: 0,
              attentionImpact: 0,
            },
            isValidPalette: false,
            lawPassed: false,
            lawNote: "Contaminarea a fost respinsă înainte de a intra în sistemul cromatic.",
            notes: ["contaminare respinsă explicit"],
          }),
        },
        visual: current.visual,
        triad: current.triad,
      },
      interference,
    );

    const runtime: ColorTheoryRuntime = {
      interpretation,
      contaminationMode,
      acceptedContamination: false,
      iterationCount: 1,
      terminated: true,
      terminationReason: "rejected_contamination",
      thresholds,
      scores,
      isValidPalette: false,
      lawPassed: false,
      lawNote: "Contaminarea a fost respinsă înainte de a intra în sistemul cromatic.",
      notes: [...notes, "Contaminarea negativă a fost respinsă de sistemul cromatic."],
    };

    return buildColorConcept(working, runtime);
  }

  working = applyColorContamination(working, contaminationMode, thoughtMemory);
  notes.push(`Contaminarea ${contaminationMode} a fost aplicată explicit în sistemul cromatic.`);

  let iterationCount = 0;
  let lastScores: ColorTheoryScores = {
    hueStructure: 0,
    valueBalance: 0,
    saturationControl: 0,
    colorRelations: 0,
    attentionImpact: 0,
  };
  let isValid = false;

  while (iterationCount < maxIterations) {
    iterationCount += 1;
    const visual = buildVisualStateFromPalette(working, current.visual);
    lastScores = evaluateConceptPalette(
      {
        palette: {
          ...working,
          outputText: "",
          outputVisual: "",
          runtime: {} as ColorTheoryRuntime,
        },
        visual,
        triad: current.triad,
      },
      interference,
    );
    isValid = validPalette(lastScores, thresholds);
    notes.push(
      `Iterația ${iterationCount}: h ${lastScores.hueStructure.toFixed(2)} / v ${lastScores.valueBalance.toFixed(2)} / s ${lastScores.saturationControl.toFixed(2)} / r ${lastScores.colorRelations.toFixed(2)} / a ${lastScores.attentionImpact.toFixed(2)}.`,
    );

    if (isValid) {
      break;
    }

    working = iterateColorSystem(working, iterationCount - 1);
  }

  const terminated = evaluateTerminationCondition({
    contaminationRejected: false,
    iterationCount,
    maxIterations,
    isValidPalette: isValid,
  });
  const law = modifyPerceptionSystem(working, lastScores);
  const runtime: ColorTheoryRuntime = {
    interpretation,
    contaminationMode,
    acceptedContamination: true,
    iterationCount,
    terminated,
    terminationReason: isValid ? "threshold_reached" : "iteration_limit",
    thresholds,
    scores: lastScores,
    isValidPalette: isValid,
    lawPassed: law.modifiesSystem,
    lawNote: law.note,
    notes,
  };

  return buildColorConcept(working, runtime);
}

export function runColorIdeaSetMainLoop(input: {
  colorIdeaSet: ThoughtState[];
  interference: LiveInterference | null;
  thoughtMemory: ThoughtMemoryEntry[];
}) {
  const palettePool: ColorPaletteState[] = [];
  const colorMemory: ColorPaletteState[] = [];
  const colorCanon: ColorPaletteState[] = [];
  const notes: string[] = [];
  const results = input.colorIdeaSet.map((colorIdea) => {
    const palette = processColorIdea({
      current: colorIdea,
      interference: input.interference,
      thoughtMemory: input.thoughtMemory,
    });

    if (palette.runtime.isValidPalette && palette.runtime.lawPassed) {
      const integrated = integratePalette({
        palette,
        palettePool,
        colorMemory,
        colorCanon,
        validation: palette.runtime.scores,
        stage: "resolved",
        sourceIdeaCanonCount: 1,
      });

      palettePool.splice(0, palettePool.length, ...integrated.palettePool);
      colorMemory.splice(0, colorMemory.length, ...integrated.colorMemory);
      colorCanon.splice(0, colorCanon.length, ...integrated.colorCanon);
      notes.push(...integrated.systemStateUpdate.notes);
    }

    return palette;
  });

  return {
    results,
    palettePool,
    colorMemory,
    colorCanon,
    notes,
  };
}

export function buildConceptPalette(
  current: ThoughtState,
  interference: LiveInterference | null,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  return processColorIdea({
    current,
    interference,
    thoughtMemory,
  });
}
