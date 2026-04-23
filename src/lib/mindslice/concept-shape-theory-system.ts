import type {
  ArtCompositionState,
  ColorPaletteState,
  CompositionStructureState,
  ContaminationType,
  LiveInterference,
  ShapeTheoryRuntime,
  ShapeTheoryScores,
  ShapeTheoryThresholds,
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

function defaultThresholds(): ShapeTheoryThresholds {
  return {
    identity: 0.68,
    relation: 0.66,
    tension: 0.68,
    attention: 0.7,
  };
}

export function buildShapeIdeaSet(
  current: ThoughtState,
  structure: CompositionStructureState,
  artComposition: ArtCompositionState,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  return unique([
    current.direction,
    current.fragments[0],
    current.fragments[1],
    current.keywords[0],
    current.keywords[1],
    structure.grid,
    structure.subjectPosition,
    structure.centerState,
    artComposition.focusNode,
    thoughtMemory[0]?.fragments[0],
    thoughtMemory[0]?.keywords[0],
  ]).slice(0, 10);
}

export function interpretShapeIdea(current: ThoughtState) {
  return [
    `Forma pornește din ${current.direction || "o intenție fără nume"}.`,
    `Conturul caută să țină împreună ${current.fragments[0] ?? current.keywords[0] ?? "un nucleu latent"}.`,
    `Presiunea vizuală este distribuită prin ${current.visual.mode} și mișcarea ${current.motion}.`,
  ].join(" ");
}

export function detectShape(conceptData: {
  current: ThoughtState;
  structure: CompositionStructureState;
}) {
  const haystack = [
    conceptData.current.direction,
    conceptData.current.thought,
    ...conceptData.current.fragments,
    ...conceptData.current.keywords,
    conceptData.structure.grid,
    conceptData.structure.subjectPosition,
    conceptData.structure.centerState,
  ]
    .join(" ")
    .toLowerCase();

  const hasPointLikeSignal = /(point|punct|nucleu|seed|core|dot|singular)/.test(haystack);
  const hasDirectionSignal = Boolean(conceptData.current.direction?.trim()) ||
    /(direction|linie|line|axis|vector|drift|flow|motion|trajectory)/.test(haystack);
  const hasAreaSignal = /(area|surface|plane|field|grid|suprafa|câmp|camp|zonă|zona)/.test(haystack);

  if (hasPointLikeSignal) {
    return "POINT" as const;
  }

  if (hasDirectionSignal) {
    return "LINE" as const;
  }

  if (hasAreaSignal) {
    return "PLANE" as const;
  }

  return "VOLUME" as const;
}

function computePrimitiveShapeComplexity(
  shape: "POINT" | "LINE" | "PLANE" | "VOLUME",
  current: ThoughtState,
) {
  const base =
    shape === "POINT" ? 0.22 :
    shape === "LINE" ? 0.4 :
    shape === "PLANE" ? 0.62 :
    0.8;

  return clamp(
    base + current.visual.density * 0.08 + current.visual.fracture * 0.04,
    0,
    1,
  );
}

function computePrimitiveShapeOrientation(
  shape: "POINT" | "LINE" | "PLANE" | "VOLUME",
  structure: CompositionStructureState,
  current: ThoughtState,
) {
  if (shape === "POINT") {
    return structure.centerState === "centered_intentional" ? "centered" : "displaced";
  }

  if (shape === "LINE") {
    if (current.motion.includes("spiral") || current.motion.includes("arc")) {
      return "curvilinear";
    }

    if (structure.subjectPosition.includes("third")) {
      return "diagonal";
    }

    return "axial";
  }

  if (shape === "PLANE") {
    return structure.symmetryState === "symmetry_precise" ? "planar-symmetric" : "planar-open";
  }

  return current.visual.convergence >= 0.72 ? "volumetric-centered" : "volumetric-diffuse";
}

export function buildPrimitiveShapeStructure(input: {
  shape: "POINT" | "LINE" | "PLANE" | "VOLUME";
  current: ThoughtState;
  structure: CompositionStructureState;
}) {
  return {
    type: input.shape,
    complexity: computePrimitiveShapeComplexity(input.shape, input.current),
    orientation: computePrimitiveShapeOrientation(input.shape, input.structure, input.current),
  };
}

function detectShapeType(current: ThoughtState, structure: CompositionStructureState) {
  if (current.visual.fracture >= 0.7) {
    return "fragment";
  }

  if (structure.centerState === "decentered_tension" && current.visual.density >= 1.3) {
    return "mass";
  }

  if (current.visual.wave >= 0.72 && current.visual.fracture <= 0.42) {
    return "organic";
  }

  if (current.visual.convergence >= 0.74 || structure.symmetryState === "symmetry_precise") {
    return "geometric";
  }

  if (current.visual.drift >= 0.6) {
    return "void";
  }

  return "hybrid";
}

function deriveShapeBehavior(current: ThoughtState, structure: CompositionStructureState) {
  if (current.visual.convergence >= 0.76) {
    return "stable";
  }

  if (structure.centerState === "decentered_tension" || current.visual.fracture >= 0.68) {
    return "unstable";
  }

  if (current.visual.wave >= 0.7 || current.visual.drift >= 0.58) {
    return "expanding";
  }

  return "contracting";
}

function derivePositionTendency(current: ThoughtState, structure: CompositionStructureState) {
  if (structure.centerState === "centered_intentional") {
    return "center";
  }

  if (current.visual.drift >= 0.64) {
    return "drift";
  }

  if (structure.subjectPosition.includes("third")) {
    return "edge";
  }

  return "scatter";
}

function buildBaseShape(
  current: ThoughtState,
  palette: ColorPaletteState,
  structure: CompositionStructureState,
  artComposition: ArtCompositionState,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  const type = detectShapeType(current, structure);
  const behavior = deriveShapeBehavior(current, structure);
  const positionTendency = derivePositionTendency(current, structure);
  const memoryTrace = thoughtMemory.flatMap((entry) => entry.fragments).slice(0, 2);

  return {
    type,
    structure: unique([
      structure.grid,
      structure.subjectPosition,
      artComposition.focusNode,
      current.fragments[0],
      ...memoryTrace,
    ]),
    edges: unique([
      current.visual.fracture >= 0.62 ? "edge:fractured" : "edge:held",
      current.visual.wave >= 0.66 ? "edge:porous" : "edge:defined",
      current.visual.drift >= 0.56 ? "edge:dragged" : "edge:contained",
    ]),
    mass: current.visual.density >= 1.28 ? "dense_mass" : current.visual.convergence >= 0.72 ? "weighted_core" : "light_mass",
    voidRelation: unique([
      structure.centerState === "decentered_tension" ? "void:compressed" : "void:breathing",
      positionTendency === "edge" ? "void:counterweight" : "void:field_linked",
      `accent:${palette.accent}`,
    ]),
    behavior,
    positionTendency,
    tensionVectors: unique([
      current.visual.drift >= 0.56 ? "vector:lateral_pull" : "vector:center_pull",
      current.visual.wave >= 0.68 ? "vector:expansion" : "vector:compression",
      current.visual.fracture >= 0.62 ? "vector:edge_pressure" : "vector:internal_hold",
      `motion:${current.motion}`,
    ]),
    attentionProfile: unique([
      `focus:${artComposition.focusNode}`,
      `position:${positionTendency}`,
      current.keywords[0],
      structure.attentionMap[0],
    ]),
  };
}

export function selectShapeContamination(
  interference: LiveInterference | null,
  thoughtMemory: ThoughtMemoryEntry[],
): ContaminationType {
  if (interference) {
    return interference.influenceMode;
  }

  return thoughtMemory.find((entry) => entry.influence_mode)?.influence_mode ?? "whisper";
}

export function rejectShapeContamination(contaminationType: ContaminationType) {
  return contaminationType === "noise" ||
    contaminationType === "collapse" ||
    contaminationType === "fragment";
}

export function applyShapeContamination(
  shape: ReturnType<typeof buildBaseShape>,
  contaminationType: ContaminationType,
  thoughtMemory: ThoughtMemoryEntry[],
) {
  const next = {
    ...shape,
    structure: [...shape.structure],
    edges: [...shape.edges],
    voidRelation: [...shape.voidRelation],
    tensionVectors: [...shape.tensionVectors],
    attentionProfile: [...shape.attentionProfile],
  };

  if (contaminationType === "whisper") {
    next.edges = unique([...next.edges, "edge:subtle_shift"]);
  }

  if (contaminationType === "echo") {
    next.structure = unique([next.structure[0], ...next.structure, "form:repeated"]);
    next.attentionProfile = unique([...next.attentionProfile, "attention:echo_return"]);
  }

  if (contaminationType === "counterpoint") {
    next.tensionVectors = unique([...next.tensionVectors, "vector:opposing_form"]);
    next.voidRelation = unique([...next.voidRelation, "void:counter-form"]);
  }

  if (contaminationType === "stain") {
    const trace = thoughtMemory.flatMap((entry) => entry.keywords).find(Boolean) ?? "residue";
    next.edges = unique([...next.edges, `memory:${trace}`]);
    next.voidRelation = unique([...next.voidRelation, "void:memory_trace"]);
  }

  return next;
}

export function iterateShapeSystem(
  shape: ReturnType<typeof buildBaseShape>,
  iterationIndex: number,
) {
  return {
    ...shape,
    structure: unique([...shape.structure, `form:repair_${iterationIndex + 1}`]),
    edges: unique([...shape.edges, "edge:clarified"]),
    tensionVectors: unique([...shape.tensionVectors, "vector:stabilized_pressure"]),
    attentionProfile: unique([...shape.attentionProfile, `attention:repair_${iterationIndex + 1}`]),
  };
}

export function evaluateIdentity(shape: ReturnType<typeof buildBaseShape>, visual: VisualState) {
  return clamp(
    (shape.type !== "hybrid" ? 0.26 : 0.14) +
      (shape.edges.some((entry) => entry.includes("defined") || entry.includes("clarified")) ? 0.22 : 0.08) +
      Math.max(0, 1 - visual.fracture) * 0.18 +
      visual.convergence * 0.16,
    0,
    1,
  );
}

export function evaluateRelations(shape: ReturnType<typeof buildBaseShape>, structure: CompositionStructureState) {
  return clamp(
    Math.min(shape.voidRelation.length, 3) * 0.14 +
      Math.min(shape.attentionProfile.length, 4) * 0.1 +
      (structure.attentionMap.length >= 3 ? 0.18 : 0.08) +
      (shape.positionTendency === "scatter" ? 0.12 : 0.2),
    0,
    1,
  );
}

export function evaluateShapeTension(shape: ReturnType<typeof buildBaseShape>, visual: VisualState) {
  return clamp(
    Math.min(shape.tensionVectors.length, 4) * 0.14 +
      visual.fracture * 0.22 +
      visual.drift * 0.14 +
      (shape.behavior === "unstable" || shape.behavior === "expanding" ? 0.18 : 0.08),
    0,
    1,
  );
}

export function evaluateShapeAttention(shape: ReturnType<typeof buildBaseShape>, triad: Triad) {
  return clamp(
    Math.min(shape.attentionProfile.length, 4) * 0.12 +
      triad.design.score * 0.18 +
      triad.business.score * 0.18 +
      (shape.positionTendency === "center" || shape.positionTendency === "edge" ? 0.18 : 0.1),
    0,
    1,
  );
}

export function evaluateShapeTheory(input: {
  shape: ReturnType<typeof buildBaseShape>;
  visual: VisualState;
  triad: Triad;
  structure: CompositionStructureState;
}): ShapeTheoryScores {
  return {
    identity: evaluateIdentity(input.shape, input.visual),
    relation: evaluateRelations(input.shape, input.structure),
    tension: evaluateShapeTension(input.shape, input.visual),
    attention: evaluateShapeAttention(input.shape, input.triad),
  };
}

export function validShape(scores: ShapeTheoryScores, thresholds: ShapeTheoryThresholds) {
  return scores.identity >= thresholds.identity &&
    scores.relation >= thresholds.relation &&
    scores.tension >= thresholds.tension &&
    scores.attention >= thresholds.attention;
}

export function evaluateShapeTerminationCondition(input: {
  contaminationRejected: boolean;
  iterationCount: number;
  maxIterations: number;
  isValidShape: boolean;
}) {
  return input.contaminationRejected ||
    (!input.isValidShape && input.iterationCount >= input.maxIterations);
}

export function modifySpatialPerception(
  scores: ShapeTheoryScores,
  shape: ReturnType<typeof buildBaseShape>,
) {
  const modifiesSystem = Boolean(shape.type) &&
    shape.attentionProfile.length >= 3 &&
    (scores.identity * 0.24 + scores.relation * 0.2 + scores.tension * 0.18 + scores.attention * 0.22) >= 0.66;

  return {
    modifiesSystem,
    note: modifiesSystem
      ? "Forma schimbă percepția spațiului și redistribuie greutatea vizuală."
      : "Forma rămâne lizibilă, dar nu modifică încă suficient percepția spațială.",
  };
}

export function buildShapeConcept(
  shape: ReturnType<typeof buildBaseShape>,
  runtime: ShapeTheoryRuntime,
) {
  return {
    ...shape,
    outputVisual: [
      `type ${shape.type}`,
      `mass ${shape.mass}`,
      `behavior ${shape.behavior}`,
      `position ${shape.positionTendency}`,
    ].join(" / "),
    outputText: [
      `Forma se fixează ca ${shape.type}, cu masă ${shape.mass} și comportament ${shape.behavior}.`,
      runtime.primitiveShapeStructure
        ? `În lectura primară, forma funcționează ca ${runtime.primitiveShapeStructure.type.toLowerCase()}, cu orientare ${runtime.primitiveShapeStructure.orientation} și complexitate ${runtime.primitiveShapeStructure.complexity.toFixed(2)}.`
        : null,
      `Conturul lucrează prin ${shape.edges[0] ?? "edge:unset"} și se raportează la gol prin ${shape.voidRelation[0] ?? "void:unset"}.`,
      runtime.lawNote,
    ].filter(Boolean).join(" "),
    runtime,
  };
}

export function updateShapeSystemState(input: {
  shape: ReturnType<typeof buildShapeConcept>;
  validation: ShapeTheoryScores;
}) {
  const { validation } = input;

  return {
    formPatterns: {
      identityWeight: clamp(validation.identity * 0.34 + validation.relation * 0.1, 0, 1),
    },
    edgeLogic: {
      pressureWeight: clamp(validation.tension * 0.28 + validation.identity * 0.12, 0, 1),
    },
    tensionBehavior: {
      expansionWeight: clamp(validation.tension * 0.3 + validation.attention * 0.1, 0, 1),
      containmentWeight: clamp(validation.identity * 0.24 + validation.relation * 0.1, 0, 1),
    },
    attentionDistribution: {
      focusWeight: clamp(validation.attention * 0.34 + validation.identity * 0.08, 0, 1),
      fieldWeight: clamp(validation.relation * 0.26 + validation.tension * 0.1, 0, 1),
    },
    notes: [
      `shape identity ${validation.identity.toFixed(2)}`,
      `shape relation ${validation.relation.toFixed(2)}`,
      `shape tension ${validation.tension.toFixed(2)}`,
    ],
  };
}

export function measureShapeReuse(input: {
  sourceIdeaCanonCount: number;
}) {
  return clamp(
    input.sourceIdeaCanonCount >= 2 ? 0.74 : 0.44 + input.sourceIdeaCanonCount * 0.14,
    0,
    1,
  );
}

export function measureShapeAttentionImpact(input: {
  validation: ShapeTheoryScores;
}) {
  return clamp(
    input.validation.attention * 0.3 +
      input.validation.tension * 0.24 +
      input.validation.identity * 0.16,
    0,
    1,
  );
}

export function measureShapeTimeStability(input: {
  stage: string;
  validation: ShapeTheoryScores;
}) {
  return clamp(
    (input.stage === "canonical" ? 0.42 : input.stage === "resolved" ? 0.32 : 0.16) +
      input.validation.identity * 0.16 +
      input.validation.relation * 0.14 +
      input.validation.attention * 0.1,
    0,
    1,
  );
}

export function isShapeCanonical(input: {
  shape: ReturnType<typeof buildShapeConcept>;
  validation: ShapeTheoryScores;
  stage: string;
  sourceIdeaCanonCount: number;
}) {
  const reuse = measureShapeReuse({
    sourceIdeaCanonCount: input.sourceIdeaCanonCount,
  });
  const impact = measureShapeAttentionImpact({
    validation: input.validation,
  });
  const stability = measureShapeTimeStability({
    stage: input.stage,
    validation: input.validation,
  });

  return reuse >= 0.6 && impact >= 0.64 && stability >= 0.66;
}

export function processShapeIdea(input: {
  current: ThoughtState;
  palette: ColorPaletteState;
  structure: CompositionStructureState;
  artComposition: ArtCompositionState;
  interference: LiveInterference | null;
  thoughtMemory: ThoughtMemoryEntry[];
  maxIterations?: number;
  hardFailureMode?: "soft" | "controlled";
}) {
  const {
    current,
    palette,
    structure,
    artComposition,
    interference,
    thoughtMemory,
    maxIterations = 3,
    hardFailureMode = "soft",
  } = input;
  const thresholds = defaultThresholds();
  const shapeIdeaSet = buildShapeIdeaSet(current, structure, artComposition, thoughtMemory);
  const interpretation = interpretShapeIdea(current);
  const detectedPrimitiveShape = detectShape({ current, structure });
  const primitiveShapeStructure = buildPrimitiveShapeStructure({
    shape: detectedPrimitiveShape,
    current,
    structure,
  });
  const contaminationMode = selectShapeContamination(interference, thoughtMemory);
  const contaminationRejected = rejectShapeContamination(contaminationMode);
  let working = buildBaseShape(current, palette, structure, artComposition, thoughtMemory);
  const notes = [
    interpretation,
    `shape idea set: ${shapeIdeaSet.join(" | ")}`,
    `primitive shape: ${detectedPrimitiveShape} / orientation ${primitiveShapeStructure.orientation} / complexity ${primitiveShapeStructure.complexity.toFixed(2)}`,
  ];

  working = {
    ...working,
    structure: unique([
      `primitive:${detectedPrimitiveShape.toLowerCase()}`,
      `orientation:${primitiveShapeStructure.orientation}`,
      ...working.structure,
    ]),
  };

  if (contaminationRejected) {
    const runtime: ShapeTheoryRuntime = {
      interpretation,
      shapeIdeaSet,
      detectedPrimitiveShape,
      primitiveShapeStructure,
      contaminationMode,
      acceptedContamination: false,
      hardFailureMode,
      hardFailureTriggered: hardFailureMode === "controlled",
      iterationCount: 1,
      terminated: true,
      terminationReason: "rejected_contamination",
      failed: true,
      failureReason: "negative_contamination",
      thresholds,
      scores: { identity: 0, relation: 0, tension: 0, attention: 0 },
      isValidShape: false,
      lawPassed: false,
      lawNote: "Contaminarea a fost respinsă înainte să deterioreze logica formei.",
      notes: [...notes, "Distorsiunea negativă a fost respinsă de sistemul formelor."],
    };

    return buildShapeConcept(working, runtime);
  }

  working = applyShapeContamination(working, contaminationMode, thoughtMemory);

  let iterationCount = 0;
  let isValid = false;
  let lastScores: ShapeTheoryScores = {
    identity: 0,
    relation: 0,
    tension: 0,
    attention: 0,
  };

  while (iterationCount < maxIterations) {
    lastScores = evaluateShapeTheory({
      shape: working,
      visual: current.visual,
      triad: current.triad,
      structure,
    });
    isValid = validShape(lastScores, thresholds);
    notes.push(
      `shape iteration ${iterationCount + 1}: i ${lastScores.identity.toFixed(2)} / r ${lastScores.relation.toFixed(2)} / t ${lastScores.tension.toFixed(2)} / a ${lastScores.attention.toFixed(2)}`,
    );

    if (isValid) {
      break;
    }

    working = iterateShapeSystem(working, iterationCount);
    iterationCount += 1;
  }

  const terminationReached = evaluateShapeTerminationCondition({
    contaminationRejected: false,
    iterationCount,
    maxIterations,
    isValidShape: isValid,
  });
  const law = modifySpatialPerception(lastScores, working);

  const runtime: ShapeTheoryRuntime = {
    interpretation,
    shapeIdeaSet,
    detectedPrimitiveShape,
    primitiveShapeStructure,
    contaminationMode,
    acceptedContamination: true,
    hardFailureMode,
    hardFailureTriggered: hardFailureMode === "controlled" && !isValid,
    iterationCount: iterationCount + 1,
    terminated: terminationReached,
    terminationReason: isValid ? "threshold_reached" : "iteration_limit",
    failed: !isValid,
    failureReason: isValid ? null : "validation_thresholds",
    thresholds,
    scores: lastScores,
    isValidShape: isValid,
    lawPassed: law.modifiesSystem,
    lawNote: law.note,
    notes,
  };

  return buildShapeConcept(working, runtime);
}
