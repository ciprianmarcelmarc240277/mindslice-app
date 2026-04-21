import { processCompositionIdea } from "@/lib/mindslice/concept-art-composition-system";
import { runMetaSystem } from "@/lib/mindslice/concept-meta-system";
import { buildConceptOutput } from "@/lib/mindslice/concept-output-system";
import { buildConceptPalette } from "@/lib/mindslice/concept-color-theory-system";
import { processStructureIdea } from "@/lib/mindslice/concept-composition-structure-system";
import { generateShapeSequence } from "@/lib/mindslice/concept-shape-grammar-system";
import { processShapeIdea } from "@/lib/mindslice/concept-shape-theory-system";
import { processNarrativeIdea } from "@/lib/mindslice/concept-scenario-system";
import type { ThoughtSceneEngineState } from "@/lib/mindslice/thought-scene-engine";
import type {
  CanonInfluenceContext,
  ClockDisplayState,
  ConceptCandidate,
  ConceptConfidence,
  ConceptContaminationProfile,
  ConceptEvaluationAxes,
  ConceptResolutionStatus,
  ConceptStage,
  ConceptState,
  HistoryEntry,
  LiveInterference,
  ThoughtMemoryEntry,
  ThoughtState,
} from "@/lib/mindslice/mindslice-types";

type BuildConceptCandidateInput = {
  current: ThoughtState;
  currentIndex: number;
  thoughtScene: ThoughtSceneEngineState;
  history: HistoryEntry[];
  thoughtMemory: ThoughtMemoryEntry[];
  interference: LiveInterference | null;
  canonInfluence: CanonInfluenceContext;
  clockDisplay: ClockDisplayState | null;
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

function unique(values: Array<string | null | undefined>) {
  return values.filter((value, index, array): value is string => {
    if (!value?.trim()) {
      return false;
    }

    return array.findIndex((candidate) => candidate?.trim() === value.trim()) === index;
  });
}

function blendPrimaryValue<T extends string>(
  currentValue: T,
  canonicalValue: T | null | undefined,
  weight: number,
) {
  if (!canonicalValue || weight < 0.58) {
    return currentValue;
  }

  return canonicalValue;
}

function mergeLeadingValues(
  currentValues: string[],
  canonicalValues: string[] | null | undefined,
  limit: number,
  weight: number,
) {
  if (!canonicalValues?.length || weight < 0.18) {
    return currentValues.slice(0, limit);
  }

  const prioritizedCanonValues = canonicalValues.slice(
    0,
    Math.max(1, Math.round(limit * clamp(weight, 0, 1))),
  );

  return unique([...prioritizedCanonValues, ...currentValues]).slice(0, limit);
}

function resolveCanonBias(rawWeight: number, normalizedWeight: number) {
  return clamp(rawWeight * 0.72 + normalizedWeight * 0.28, 0, 1);
}

function applyClockToScenario(
  scenario: ReturnType<typeof processNarrativeIdea>,
  clockDisplay: ClockDisplayState | null,
) {
  if (!clockDisplay) {
    return scenario;
  }

  return {
    ...scenario,
    attentionFlow: unique([
      `clock:${clockDisplay.attentionAnchor}`,
      ...scenario.attentionFlow,
      `transition:${clockDisplay.transition}`,
    ]).slice(0, 5),
    progression: unique([
      ...scenario.progression,
      `time:${clockDisplay.transition}`,
    ]).slice(0, 4),
    outputText: `${scenario.outputText} Timpul intră în scenariu prin ${clockDisplay.attentionAnchor} și ${clockDisplay.transition}.`,
  };
}

function applyClockToArtComposition(
  artComposition: ReturnType<typeof processCompositionIdea>,
  clockDisplay: ClockDisplayState | null,
) {
  if (!clockDisplay) {
    return artComposition;
  }

  return {
    ...artComposition,
    rhythmMap: unique([
      `clock:${clockDisplay.transition}`,
      ...artComposition.rhythmMap,
      `format:${clockDisplay.format}`,
    ]).slice(0, 5),
    movementMap: unique([
      ...artComposition.movementMap,
      `clock_anchor:${clockDisplay.attentionAnchor}`,
    ]).slice(0, 5),
    proportionMap: unique([
      ...artComposition.proportionMap,
      `time_style:${clockDisplay.visualStyle}`,
    ]).slice(0, 4),
    outputText: `${artComposition.outputText} Ritmul este contaminat de ceas prin ${clockDisplay.transition}.`,
  };
}

function applyClockToStructure(
  structure: ReturnType<typeof processStructureIdea>,
  clockDisplay: ClockDisplayState | null,
) {
  if (!clockDisplay) {
    return structure;
  }

  const adjustedCenterState = clockDisplay.visualStyle.includes("anchored")
    ? "centered_intentional"
    : structure.centerState;

  return {
    ...structure,
    centerState: adjustedCenterState,
    tensionZones: unique([
      ...structure.tensionZones,
      `clock:${clockDisplay.attentionAnchor}`,
    ]).slice(0, 5),
    attentionMap: unique([
      `clock:${clockDisplay.transition}`,
      ...structure.attentionMap,
      `clock_anchor:${clockDisplay.attentionAnchor}`,
    ]).slice(0, 5),
    outputText: `${structure.outputText} Câmpul temporal fixează ${clockDisplay.attentionAnchor} ca regulă auxiliară de poziționare.`,
  };
}

function applyClockToPalette(
  palette: ReturnType<typeof buildConceptPalette>,
  clockDisplay: ClockDisplayState | null,
) {
  if (!clockDisplay) {
    return palette;
  }

  return {
    ...palette,
    attentionMap: unique([
      `clock:${clockDisplay.attentionAnchor}`,
      ...palette.attentionMap,
    ]).slice(0, 5),
    contaminationTrace: unique([
      ...palette.contaminationTrace,
      `clock_transition:${clockDisplay.transition}`,
    ]).slice(0, 5),
    supportTones: unique([
      ...palette.supportTones,
      `time:${clockDisplay.visualStyle}`,
    ]).slice(0, 6),
    outputText: `${palette.outputText} Paleta preia ritmul temporal ${clockDisplay.transition}.`,
  };
}

function pickDominantFragments(current: ThoughtState, history: HistoryEntry[]) {
  const recurringFragments = current.fragments.filter((fragment) =>
    history.some((entry) => entry.text.toLowerCase().includes(fragment.toLowerCase())),
  );

  return unique([...recurringFragments, ...current.fragments]).slice(0, 4);
}

function pickDominantKeywords(current: ThoughtState, thoughtMemory: ThoughtMemoryEntry[]) {
  const recurringKeywords = current.keywords.filter((keyword) =>
    thoughtMemory.some((entry) =>
      entry.keywords.some((candidate) => candidate.toLowerCase() === keyword.toLowerCase()),
    ),
  );

  return unique([...recurringKeywords, ...current.keywords]).slice(0, 6);
}

function buildTitle(current: ThoughtState) {
  return current.direction.trim() || "Untitled Concept";
}

function buildOneLineDefinition(current: ThoughtState, fragments: string[], keywords: string[]) {
  const fragment = fragments[0] ?? current.fragments[0] ?? current.keywords[0] ?? "nucleu";
  const keyword = keywords[0] ?? current.keywords[0] ?? "structură";
  return `${fragment} devine concept activ prin ${keyword}.`;
}

function buildThesis(current: ThoughtState) {
  return current.thought.trim();
}

function buildTension(current: ThoughtState, interference: LiveInterference | null) {
  if (interference) {
    return `${current.direction} este tensionat de ${interference.influenceMode} prin ${interference.title}.`;
  }

  return `${current.direction} caută să transforme ideea într-un centru recognoscibil fără contaminare activă.`;
}

function buildResolutionClaim(
  current: ThoughtState,
  interference: LiveInterference | null,
  stage: ConceptStage,
) {
  if (stage === "stabilizing") {
    return interference
      ? `Artist AI începe să rezolve dilema integrând contaminarea ${interference.influenceMode} fără să-și piardă axa.`
      : "Artist AI începe să rezolve dilema prin convergență semantică și vizuală.";
  }

  return interference
    ? `Artist AI procesează influența ${interference.influenceMode} și testează dacă ideea poate rezista fără colaps.`
    : `Artist AI transformă ideea ${current.direction} într-un traseu conceptual recognoscibil.`;
}

function buildVisualIdentityDraft(current: ThoughtState, thoughtScene: ThoughtSceneEngineState) {
  const compositionMode = thoughtScene.world.contamination.active ? "contaminated_field" : "base_field";
  return [
    `mode ${current.visual.mode}`,
    `motion ${current.motion}`,
    `composition ${compositionMode}`,
    `focus ${thoughtScene.sceneGraph.thoughtCenterFragment}`,
  ].join(" / ");
}

function buildContaminationProfile(
  current: ThoughtState,
  interference: LiveInterference | null,
  thoughtMemory: ThoughtMemoryEntry[],
): ConceptContaminationProfile {
  if (!interference) {
    return {
      acceptedInfluences: [],
      rejectedInfluences: [],
      transformedInfluences: [],
      activeTensions: [],
      resistanceScore: 0.78,
    };
  }

  const transformedInfluences = unique([
    interference.influenceMode,
    ...thoughtMemory
      .filter((entry) => entry.influence_mode)
      .map((entry) => entry.influence_mode),
  ]);

  return {
    acceptedInfluences: [interference.title],
    rejectedInfluences:
      current.triad.design.score >= 0.68 ? [] : ["contaminare fără structură recognoscibilă"],
    transformedInfluences,
    activeTensions: [
      `${interference.influenceMode} vs ${current.direction}`,
      `${current.visual.mode} / ${current.motion}`,
    ],
    resistanceScore: clamp(
      0.45 +
        current.triad.design.score * 0.22 +
        current.visual.convergence * 0.18 +
        current.visual.fracture * 0.08,
      0,
      1,
    ),
  };
}

function buildConfidence(
  current: ThoughtState,
  thoughtScene: ThoughtSceneEngineState,
  history: HistoryEntry[],
  contaminationResistance: number,
) {
  const semantic = clamp(
    current.triad.art.score * 0.52 +
      current.triad.design.score * 0.22 +
      Math.min(history.length, 5) * 0.05,
    0,
    1,
  );
  const visual = clamp(
    current.visual.convergence * 0.34 +
      current.visual.density * 0.12 +
      current.visual.wave * 0.08 +
      thoughtScene.sceneGraph.entityCount * 0.02,
    0,
    1,
  );
  const authorAlignment = clamp(
    current.triad.art.score * 0.35 +
      current.triad.business.score * 0.15 +
      current.fragments.length * 0.04,
    0,
    1,
  );
  const overall = clamp(
    semantic * 0.34 + visual * 0.24 + contaminationResistance * 0.22 + authorAlignment * 0.2,
    0,
    1,
  );

  return {
    semantic,
    visual,
    contaminationResistance,
    authorAlignment,
    overall,
  } satisfies ConceptConfidence;
}

function buildEvaluationAxes(
  current: ThoughtState,
  confidence: ConceptConfidence,
  contamination: ConceptContaminationProfile,
  dominantFragments: string[],
  dominantKeywords: string[],
  history: HistoryEntry[],
) {
  const structure = clamp(
    current.triad.design.score * 0.62 +
      current.visual.convergence * 0.24 +
      Math.max(0, 1 - current.visual.fracture) * 0.14,
    0,
    1,
  );

  const sense = clamp(
    current.triad.art.score * 0.68 +
      Math.min(dominantFragments.length, 4) * 0.04 +
      Math.min(dominantKeywords.length, 4) * 0.025 +
      Math.min(history.length, 4) * 0.02,
    0,
    1,
  );

  const attention = clamp(
    current.triad.business.score * 0.66 +
      current.visual.density * 0.14 +
      current.visual.wave * 0.08 +
      Math.min(dominantKeywords.length, 3) * 0.03 +
      Math.min(history.length, 3) * 0.01,
    0,
    1,
  );

  const coherence = clamp(
    ((structure + sense) / 2) * 0.42 +
      current.visual.convergence * 0.2 +
      contamination.resistanceScore * 0.2 +
      confidence.overall * 0.18,
    0,
    1,
  );

  return {
    structure,
    sense,
    attention,
    coherence,
  } satisfies ConceptEvaluationAxes;
}

function deriveStage(confidence: ConceptConfidence): Extract<ConceptStage, "emergent" | "forming" | "stabilizing"> {
  if (confidence.overall >= 0.76) {
    return "stabilizing";
  }

  if (confidence.overall >= 0.56) {
    return "forming";
  }

  return "emergent";
}

function deriveResolutionStatus(
  confidence: ConceptConfidence,
  stage: Extract<ConceptStage, "emergent" | "forming" | "stabilizing">,
): ConceptResolutionStatus {
  if (stage === "stabilizing" && confidence.authorAlignment >= 0.7) {
    return "partially_resolved";
  }

  if (confidence.contaminationResistance < 0.45) {
    return "contested";
  }

  return "unresolved";
}

export function buildConceptCandidate(
  input: BuildConceptCandidateInput,
): ConceptCandidate {
  const {
    current,
    currentIndex,
    thoughtScene,
    history,
    thoughtMemory,
    interference,
    canonInfluence,
    clockDisplay,
  } = input;
  const dominantFragments = pickDominantFragments(current, history);
  const dominantKeywords = pickDominantKeywords(current, thoughtMemory);
  const contamination = buildContaminationProfile(current, interference, thoughtMemory);
  const confidence = buildConfidence(
    current,
    thoughtScene,
    history,
    contamination.resistanceScore,
  );
  const evaluationAxes = buildEvaluationAxes(
    current,
    confidence,
    contamination,
    dominantFragments,
    dominantKeywords,
    history,
  );
  const stage = deriveStage(confidence);
  const resolutionStatus = deriveResolutionStatus(confidence, stage);
  const sourceIdeaId = `idea:${slugify(current.direction)}`;
  const currentThoughtId = `thought:${slugify(current.direction)}:${currentIndex + 1}`;
  const contaminationSummary = interference
    ? [
        `accepted ${interference.title}`,
        `mode ${interference.influenceMode}`,
        `note ${interference.note}`,
      ]
    : ["base field only", "no external contamination", "author challenge still internal"];
  const coreTitle = buildTitle(current);
  const oneLineDefinition = buildOneLineDefinition(current, dominantFragments, dominantKeywords);
  const thesis = buildThesis(current);
  const tension = buildTension(current, interference);
  const resolutionClaim = buildResolutionClaim(current, interference, stage);
  const palette = applyClockToPalette(
    buildConceptPalette(current, interference, thoughtMemory),
    clockDisplay,
  );
  const scenario = applyClockToScenario(processNarrativeIdea({
    current,
    history,
    interference,
    thoughtMemory,
  }), clockDisplay);
  const artComposition = applyClockToArtComposition(processCompositionIdea({
    current,
    palette,
    interference,
    thoughtMemory,
  }), clockDisplay);
  const compositionStructure = applyClockToStructure(processStructureIdea({
    current,
    palette,
    interference,
    thoughtMemory,
  }), clockDisplay);
  const shape = processShapeIdea({
    current,
    palette,
    structure: compositionStructure,
    artComposition,
    interference,
    thoughtMemory,
    hardFailureMode: "controlled",
  });
  const shapeGrammar = generateShapeSequence({
    shape,
    structure: compositionStructure,
    hardFailureMode: "controlled",
  });
  const influencedScenario = {
    ...scenario,
    coreConflict: blendPrimaryValue(
      scenario.coreConflict,
      canonInfluence.narrative?.scenario.coreConflict,
      resolveCanonBias(
        canonInfluence.activeWeights.narrative,
        canonInfluence.normalizedWeights.narrative,
      ),
    ),
    turningPoints: mergeLeadingValues(
      scenario.turningPoints,
      canonInfluence.narrative?.scenario.turningPoints,
      4,
      resolveCanonBias(
        canonInfluence.activeWeights.narrative,
        canonInfluence.normalizedWeights.narrative,
      ),
    ),
    progression: mergeLeadingValues(
      scenario.progression,
      canonInfluence.narrative?.scenario.progression,
      4,
      resolveCanonBias(
        canonInfluence.activeWeights.narrative,
        canonInfluence.normalizedWeights.narrative,
      ),
    ),
    attentionFlow: mergeLeadingValues(
      scenario.attentionFlow,
      canonInfluence.narrative?.scenario.attentionFlow,
      5,
      resolveCanonBias(
        canonInfluence.activeWeights.narrative,
        canonInfluence.normalizedWeights.narrative,
      ),
    ),
    outputText: canonInfluence.narrative
      ? `${scenario.outputText} Canon narativ activ: ${canonInfluence.narrative.conceptTitle}.`
      : scenario.outputText,
  };
  const influencedArtComposition = {
    ...artComposition,
    focusNode: blendPrimaryValue(
      artComposition.focusNode,
      canonInfluence.art?.composition.focusNode,
      resolveCanonBias(
        canonInfluence.activeWeights.art,
        canonInfluence.normalizedWeights.art,
      ),
    ),
    rhythmMap: mergeLeadingValues(
      artComposition.rhythmMap,
      canonInfluence.art?.composition.rhythmMap,
      5,
      resolveCanonBias(
        canonInfluence.activeWeights.art,
        canonInfluence.normalizedWeights.art,
      ),
    ),
    movementMap: mergeLeadingValues(
      artComposition.movementMap,
      canonInfluence.art?.composition.movementMap,
      5,
      resolveCanonBias(
        canonInfluence.activeWeights.art,
        canonInfluence.normalizedWeights.art,
      ),
    ),
    contrastMap: mergeLeadingValues(
      artComposition.contrastMap,
      canonInfluence.art?.composition.contrastMap,
      4,
      resolveCanonBias(
        canonInfluence.activeWeights.art,
        canonInfluence.normalizedWeights.art,
      ),
    ),
    outputText: canonInfluence.art
      ? `${artComposition.outputText} Canon compozițional activ: ${canonInfluence.art.conceptTitle}.`
      : artComposition.outputText,
  };
  const influencedStructure = {
    ...compositionStructure,
    grid: blendPrimaryValue(
      compositionStructure.grid,
      canonInfluence.structure?.structure.grid,
      resolveCanonBias(
        canonInfluence.activeWeights.structure,
        canonInfluence.normalizedWeights.structure,
      ),
    ),
    subjectPosition: blendPrimaryValue(
      compositionStructure.subjectPosition,
      canonInfluence.structure?.structure.subjectPosition,
      resolveCanonBias(
        canonInfluence.activeWeights.structure,
        canonInfluence.normalizedWeights.structure,
      ),
    ),
    symmetryState: blendPrimaryValue(
      compositionStructure.symmetryState,
      canonInfluence.structure?.structure.symmetryState,
      resolveCanonBias(
        canonInfluence.activeWeights.structure,
        canonInfluence.normalizedWeights.structure,
      ),
    ),
    centerState: blendPrimaryValue(
      compositionStructure.centerState,
      canonInfluence.structure?.structure.centerState,
      resolveCanonBias(
        canonInfluence.activeWeights.structure,
        canonInfluence.normalizedWeights.structure,
      ),
    ),
    tensionZones: mergeLeadingValues(
      compositionStructure.tensionZones,
      canonInfluence.structure?.structure.tensionZones,
      5,
      resolveCanonBias(
        canonInfluence.activeWeights.structure,
        canonInfluence.normalizedWeights.structure,
      ),
    ),
    attentionMap: mergeLeadingValues(
      compositionStructure.attentionMap,
      canonInfluence.structure?.structure.attentionMap,
      5,
      resolveCanonBias(
        canonInfluence.activeWeights.structure,
        canonInfluence.normalizedWeights.structure,
      ),
    ),
    outputText: canonInfluence.structure
      ? `${compositionStructure.outputText} Canon structural activ: ${canonInfluence.structure.conceptTitle}.`
      : compositionStructure.outputText,
  };
  const influencedPalette = {
    ...palette,
    dominant: blendPrimaryValue(
      palette.dominant,
      canonInfluence.color?.palette.dominant,
      resolveCanonBias(
        canonInfluence.activeWeights.color,
        canonInfluence.normalizedWeights.color,
      ),
    ),
    accent: blendPrimaryValue(
      palette.accent,
      canonInfluence.color?.palette.accent,
      resolveCanonBias(
        canonInfluence.activeWeights.color,
        canonInfluence.normalizedWeights.color,
      ),
    ),
    supportTones: mergeLeadingValues(
      palette.supportTones,
      canonInfluence.color?.palette.supportTones,
      6,
      resolveCanonBias(
        canonInfluence.activeWeights.color,
        canonInfluence.normalizedWeights.color,
      ),
    ),
    attentionMap: mergeLeadingValues(
      palette.attentionMap,
      canonInfluence.color?.palette.attentionMap,
      5,
      resolveCanonBias(
        canonInfluence.activeWeights.color,
        canonInfluence.normalizedWeights.color,
      ),
    ),
    contaminationTrace: mergeLeadingValues(
      palette.contaminationTrace,
      canonInfluence.color?.palette.contaminationTrace,
      5,
      resolveCanonBias(
        canonInfluence.activeWeights.color,
        canonInfluence.normalizedWeights.color,
      ),
    ),
    outputText: canonInfluence.color
      ? `${palette.outputText} Canon cromatic activ: ${canonInfluence.color.conceptTitle}.`
      : palette.outputText,
  };
  const metaSystem = runMetaSystem({
    current,
    history,
    thoughtMemory,
    canonInfluence,
    clockDisplay,
    scenario: influencedScenario,
    artComposition: influencedArtComposition,
    compositionStructure: influencedStructure,
    shape,
    shapeGrammar,
    palette: influencedPalette,
  });
  const expression = {
    textSignature: dominantFragments.join(" / "),
    visualSignature: clockDisplay
      ? `${buildVisualIdentityDraft(current, thoughtScene)} / shape ${shape.type} / clock ${clockDisplay.visualStyle} / ${clockDisplay.attentionAnchor}`
      : `${buildVisualIdentityDraft(current, thoughtScene)} / shape ${shape.type}`,
    compositionMode: thoughtScene.world.contamination.active ? "contaminated_field" : "base_field",
    typographyMode: current.visual.mode,
    motionMode: current.motion,
    clock: clockDisplay,
    scenario: influencedScenario,
    artComposition: influencedArtComposition,
    compositionStructure: influencedStructure,
    shape,
    shapeGrammar,
    metaSystem,
    palette: influencedPalette,
    dominantFragments,
    dominantKeywords,
  } as const;
  const output = buildConceptOutput({
    current,
    stage,
    expression,
    thesis,
    tension,
    resolutionClaim,
    interference,
  });

  const conceptStateDraft: ConceptState = {
    id: `concept:${slugify(current.direction)}:${currentIndex + 1}`,
    stage,
    resolutionStatus,
    provenance: {
      sourceIdeaId,
      sourceAuthorIds: interference?.authorUserId ? [interference.authorUserId] : [],
      sourceAuthorPseudonyms: interference?.authorPseudonym ? [interference.authorPseudonym] : [],
      sourceSliceIds: [`slice:${currentIndex + 1}`],
      thoughtCycleIds: [`cycle:${slugify(current.direction)}:${currentIndex + 1}`],
      contaminationEventIds: interference ? [`contamination:${interference.sourceId}`] : [],
    },
    core: {
      title: coreTitle,
      oneLineDefinition,
      thesis,
      tension,
      resolutionClaim,
      keywords: dominantKeywords,
    },
    expression,
    output,
    contamination,
    validation: {
      semanticCoherence: confidence.semantic,
      graphicCoherence: confidence.visual,
      crossModalAlignment: clamp((confidence.semantic + confidence.visual) / 2, 0, 1),
      persistenceAcrossCycles: clamp(Math.min(history.length, 5) * 0.18, 0, 1),
      survivesContamination: contamination.resistanceScore >= 0.6,
      validationNotes: [
        `${current.direction} rulează pe ${thoughtScene.world.contamination.active ? "câmp contaminat" : "câmp de bază"}.`,
        `Scene graph păstrează ${thoughtScene.sceneGraph.entityCount} entități active.`,
        `Scenariul menține conflictul ${influencedScenario.coreConflict} și progresia ${influencedScenario.progression[0] ?? "încă instabilă"}.`,
        `Paleta activă este condusă de ${influencedPalette.dominant}, cu accent pe ${influencedPalette.accent}.`,
        `Compoziția activează focusul ${influencedArtComposition.focusNode} și ritmul ${influencedArtComposition.rhythmMap[0] ?? "încă instabil"}.`,
        `Structura de suprafață fixează ${influencedStructure.grid} și traseul ${influencedStructure.subjectPosition}.`,
        shape.runtime.hardFailureTriggered
          ? `ShapeTheory a declanșat hard fail controlat: ${shape.runtime.failureReason ?? "fără motiv explicit"}.`
          : `ShapeTheory rămâne integrabil prin ${shape.type} și ${shape.behavior}.`,
        shapeGrammar.runtime.failed
          ? `ShapeGrammar nu a produs încă o secvență validă: ${shapeGrammar.runtime.failureReason ?? "fără motiv explicit"}.`
          : `ShapeGrammar produce transformări prin ${shapeGrammar.rulesApplied[0] ?? "stabilizare"} și evoluție ${shapeGrammar.structureEvolution[0] ?? "minimă"}.`,
        metaSystem.runtime.validationPassed
          ? `MetaSystem validează orchestrationarea globală prin pipeline ${metaSystem.runtime.activePipeline.join(" > ") || "none"}.`
          : `MetaSystem orchestrează modulele, dar nu trece încă pragurile globale de integrare.`,
        clockDisplay
          ? `Ceasul intră în generare prin ${clockDisplay.visualStyle}, ancora ${clockDisplay.attentionAnchor} și tranziția ${clockDisplay.transition}.`
          : "Ceasul nu modifică încă acest candidat de concept.",
        ...canonInfluence.notes.map((note) => `Canon influence: ${note}.`),
        interference
          ? `Interferența ${interference.influenceMode} este integrată în candidatul de concept.`
          : "Candidatul de concept este încă necontaminat extern.",
      ],
    },
    confidence,
    memory: {
      parentConceptIds: [],
      siblingConceptIds: [],
      descendantConceptIds: [],
      canonClusterId: null,
    },
    systemEffect: null,
    promotedAt: null,
    lastUpdatedAt: new Date().toISOString(),
  };

  return {
    id: `concept-candidate:${slugify(current.direction)}:${currentIndex + 1}`,
    sourceIdeaId,
    currentThoughtId,
    stage,
    thesisDraft: conceptStateDraft.core.thesis,
    visualIdentityDraft: conceptStateDraft.expression.visualSignature,
    dominantFragments,
    dominantKeywords,
    contaminationSummary,
    coherenceSignals: {
      semantic: confidence.semantic,
      visual: confidence.visual,
      crossModal: conceptStateDraft.validation.crossModalAlignment,
    },
    canonInfluence,
    evaluationAxes,
    conceptStateDraft,
  };
}
