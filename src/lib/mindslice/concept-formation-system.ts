import { processCompositionIdea } from "@/lib/mindslice/concept-art-composition-system";
import { buildConceptOutput } from "@/lib/mindslice/concept-output-system";
import { buildConceptPalette } from "@/lib/mindslice/concept-color-theory-system";
import { processNarrativeIdea } from "@/lib/mindslice/concept-scenario-system";
import type { ThoughtSceneEngineState } from "@/lib/mindslice/thought-scene-engine";
import type {
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
  const { current, currentIndex, thoughtScene, history, thoughtMemory, interference } = input;
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
  const palette = buildConceptPalette(current, interference, thoughtMemory);
  const scenario = processNarrativeIdea({
    current,
    history,
    interference,
    thoughtMemory,
  });
  const artComposition = processCompositionIdea({
    current,
    palette,
    interference,
    thoughtMemory,
  });
  const expression = {
    textSignature: dominantFragments.join(" / "),
    visualSignature: buildVisualIdentityDraft(current, thoughtScene),
    compositionMode: thoughtScene.world.contamination.active ? "contaminated_field" : "base_field",
    typographyMode: current.visual.mode,
    motionMode: current.motion,
    scenario,
    artComposition,
    palette,
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
        `Scenariul menține conflictul ${scenario.coreConflict} și progresia ${scenario.progression[0] ?? "încă instabilă"}.`,
        `Paleta activă este condusă de ${palette.dominant}, cu accent pe ${palette.accent}.`,
        `Compoziția activează focusul ${artComposition.focusNode} și ritmul ${artComposition.rhythmMap[0] ?? "încă instabil"}.`,
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
    evaluationAxes,
    conceptStateDraft,
  };
}
