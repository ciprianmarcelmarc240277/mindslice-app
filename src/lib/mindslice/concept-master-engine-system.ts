import { activateSubscription, buildAuthorProfileSnapshot, createUser } from "@/lib/mindslice/concept-author-engine-system";
import { applyContamination } from "@/lib/mindslice/concept-contamination-system";
import { buildDisplayOutput } from "@/lib/mindslice/concept-display-engine-system";
import { buildConceptCandidate, runMindSliceCore } from "@/lib/mindslice/concept-formation-system";
import { computeInfluenceWeight } from "@/lib/mindslice/concept-formation-system";
import { createSlice } from "@/lib/mindslice/concept-input-engine-system";
import { measureImpact, measureReuse, measureStability } from "@/lib/mindslice/concept-meta-system";
import { interpretIdea } from "@/lib/mindslice/concept-interpretation-system";
import { validateConceptCandidate } from "@/lib/mindslice/concept-validation-system";
import { buildThoughtSceneEngine } from "@/lib/mindslice/thought-scene-engine";
import type {
  AuthorRole,
  CanonInfluenceContext,
  ClockDisplayState,
  ConceptCandidate,
  ConceptState,
  HistoryEntry,
  InfluenceMode,
  LiveInterference,
  ThoughtMemoryEntry,
  ThoughtState,
  UserProfile,
} from "@/lib/mindslice/mindslice-types";

export type MasterIdentityContext = {
  author_id: string | null;
  role: AuthorRole | "anonymous";
  identity_type: UserProfile["identity_type"] | "none";
  pseudonym: string | null;
  indexed_name: string | null;
};

export type MasterSliceState = ReturnType<typeof createSlice> extends infer T
  ? Exclude<T, null>
  : never;

type MasterPipelineModule =
  | "ShapeTheory"
  | "ShapeGrammar"
  | "CompositionStructure"
  | "ColorTheory"
  | "ArtComposition"
  | "Scenario"
  | "Clock";

type MasterModuleOutput = {
  candidate: ConceptCandidate;
  modules: {
    shape: ConceptState["expression"]["shape"];
    shapeGrammar: ConceptState["expression"]["shapeGrammar"];
    compositionStructure: ConceptState["expression"]["compositionStructure"];
    palette: ConceptState["expression"]["palette"];
    artComposition: ConceptState["expression"]["artComposition"];
    scenario: ConceptState["expression"]["scenario"];
    clock: ClockDisplayState | null;
  };
};

export type MasterConcept = {
  concept_id: string;
  retries: number;
  source: {
    author_id: string | null;
    slice_id: string;
  };
  framework: ReturnType<typeof runMindSliceCore>["framework"];
  labyrinth: ReturnType<typeof runMindSliceCore>["exploration"];
  design: ReturnType<typeof runMindSliceCore>["design"];
  modules: MasterModuleOutput["modules"];
  conceptState: ConceptState;
  validation: ReturnType<typeof validateConceptCandidate>;
  created_at: string;
};

export type RunMasterEngineRequest = {
  user: UserProfile | null;
  idea: ThoughtState | null;
  currentIndex?: number;
  history?: HistoryEntry[];
  thoughtMemory?: ThoughtMemoryEntry[];
  interference?: LiveInterference | null;
  influenceMode?: InfluenceMode | null;
  canonInfluence?: CanonInfluenceContext | null;
  clockDisplay?: ClockDisplayState | null;
};

export type RunMasterEngineResult =
  | {
      status: "ok";
      output: ReturnType<typeof buildDisplayOutput>;
      pipeline: MasterPipelineModule[];
      memory: ReturnType<typeof runMindSliceCore>["memory"];
      canonical: boolean;
      notes: string[];
    }
  | {
      status: "fail";
      reason: string;
      notes: string[];
    };

function buildEmptyCanonInfluence(): CanonInfluenceContext {
  return {
    narrative: null,
    art: null,
    structure: null,
    color: null,
    activeWeights: { narrative: 0, art: 0, structure: 0, color: 0 },
    normalizedWeights: { narrative: 0, art: 0, structure: 0, color: 0 },
    dominantCanon: null,
    totalInfluence: 0,
    notes: ["master engine: no canon influence provided"],
  };
}

export function handleIdentity(user: UserProfile | null): MasterIdentityContext {
  if (!user) {
    return {
      author_id: null,
      role: "anonymous",
      identity_type: "none",
      pseudonym: null,
      indexed_name: null,
    };
  }

  const authorSnapshot = buildAuthorProfileSnapshot({
    profile: user,
  });

  return {
    author_id: user.user_id,
    role:
      user.subscription_status === "active"
        ? activateSubscription({
            currentRole: authorSnapshot.role,
            subscriptionStatus: user.subscription_status,
          })
        : authorSnapshot.role,
    identity_type: authorSnapshot.identity.identityType,
    pseudonym: user.pseudonym ?? authorSnapshot.identity.pseudonym ?? null,
    indexed_name: authorSnapshot.identity.indexedName ?? null,
  };
}

export function handleInput(
  identityContext: MasterIdentityContext,
  idea: ThoughtState | null,
): MasterSliceState | null {
  return createSlice({
    authorId: identityContext.author_id,
    idea,
  });
}

export function applyMasterContamination(input: {
  slice: MasterSliceState;
  history: HistoryEntry[];
  thoughtMemory: ThoughtMemoryEntry[];
  interference: LiveInterference | null;
  influenceMode: InfluenceMode | null;
}) {
  const interpretation = interpretIdea({
    current: input.slice.content,
    currentIndex: 0,
    history: input.history,
    thoughtMemory: input.thoughtMemory,
    interference: input.interference,
  });

  const contamination = applyContamination({
    thought: interpretation.activeThought,
    influenceMode: input.influenceMode,
    interference: input.interference,
    interpretation,
  });

  return {
    slice: {
      ...input.slice,
      content: contamination.thought,
    },
    decision: contamination.decision,
    notes: contamination.notes,
  };
}

export function buildPipeline(): MasterPipelineModule[] {
  return [
    "ShapeTheory",
    "ShapeGrammar",
    "CompositionStructure",
    "ColorTheory",
    "ArtComposition",
    "Scenario",
    "Clock",
  ];
}

export function executePipeline(input: {
  pipeline: MasterPipelineModule[];
  slice: MasterSliceState;
  currentIndex: number;
  history: HistoryEntry[];
  thoughtMemory: ThoughtMemoryEntry[];
  interference: LiveInterference | null;
  canonInfluence: CanonInfluenceContext;
  clockDisplay: ClockDisplayState | null;
  authorRole: AuthorRole | null;
}): MasterModuleOutput | null {
  if (!input.pipeline.length) {
    return null;
  }

  const thoughtScene = buildThoughtSceneEngine({
    current: input.slice.content,
    currentIndex: input.currentIndex,
    influenceMode: null,
    animatedThought: input.slice.content.thought,
    isThoughtOverlayVisible: true,
    aiResponseLines: [],
  });

  const candidate = buildConceptCandidate({
    current: input.slice.content,
    currentIndex: input.currentIndex,
    thoughtScene,
    history: input.history,
    thoughtMemory: input.thoughtMemory,
    interference: input.interference,
    canonInfluence: input.canonInfluence,
    clockDisplay: input.clockDisplay,
    authorRole: input.authorRole,
  });

  return {
    candidate,
    modules: {
      shape: candidate.conceptStateDraft.expression.shape,
      shapeGrammar: candidate.conceptStateDraft.expression.shapeGrammar,
      compositionStructure: candidate.conceptStateDraft.expression.compositionStructure,
      palette: candidate.conceptStateDraft.expression.palette,
      artComposition: candidate.conceptStateDraft.expression.artComposition,
      scenario: candidate.conceptStateDraft.expression.scenario,
      clock: candidate.conceptStateDraft.expression.clock,
    },
  };
}

export function buildMasterConcept(input: {
  identityContext: MasterIdentityContext;
  slice: MasterSliceState;
  framework: ReturnType<typeof runMindSliceCore>["framework"];
  exploration: ReturnType<typeof runMindSliceCore>["exploration"];
  design: ReturnType<typeof runMindSliceCore>["design"];
  moduleOutput: MasterModuleOutput;
}): MasterConcept {
  const validation = validateConceptCandidate(input.moduleOutput.candidate);

  return {
    concept_id: input.moduleOutput.candidate.conceptStateDraft.id,
    retries: 0,
    source: {
      author_id: input.identityContext.author_id,
      slice_id: input.slice.slice_id,
    },
    framework: input.framework,
    labyrinth: input.exploration,
    design: input.design,
    modules: input.moduleOutput.modules,
    conceptState: input.moduleOutput.candidate.conceptStateDraft,
    validation,
    created_at: input.slice.created_at,
  };
}

export function applyInfluence(identityContext: MasterIdentityContext, concept: MasterConcept) {
  if (identityContext.role === "anonymous") {
    return concept;
  }

  const influence = computeInfluenceWeight(identityContext.role);

  return {
    ...concept,
    conceptState: {
      ...concept.conceptState,
      influence,
    },
  };
}

export function validateMasterConcept(concept: MasterConcept) {
  return concept.validation.isValidConcept;
}

export function refineOrFail(input: {
  concept: MasterConcept;
  maxRetries?: number;
}): MasterConcept | null {
  const maxRetries = input.maxRetries ?? 1;

  if (input.concept.retries >= maxRetries) {
    return null;
  }

  const retryCandidate = {
    ...input.concept,
    retries: input.concept.retries + 1,
  };

  return validateMasterConcept(retryCandidate) ? retryCandidate : null;
}

export function isCanonicalConcept(concept: MasterConcept) {
  const reuse = measureReuse({
    sourceIdeaCanonCount: 0,
    validation: concept.conceptState.expression.metaSystem.runtime.scores,
  });
  const impact = measureImpact({
    validation: concept.conceptState.expression.metaSystem.runtime.scores,
  });
  const stability = measureStability({
    stage: concept.conceptState.stage,
    validation: concept.conceptState.expression.metaSystem.runtime.scores,
  });

  return reuse >= 0.42 && impact >= 0.58 && stability >= 0.62;
}

export function buildDisplay(
  identityContext: MasterIdentityContext,
  concept: MasterConcept,
) {
  return buildDisplayOutput(identityContext, concept);
}

export function masterLaw(concept: MasterConcept) {
  return Boolean(
    concept.conceptState.systemEffect?.modifiesSystem &&
      concept.validation.isValidConcept,
  );
}

export function runMasterEngine(request: RunMasterEngineRequest): RunMasterEngineResult {
  const notes: string[] = [];
  const identityContext = handleIdentity(request.user);
  notes.push(`identity resolved: ${identityContext.role} / ${identityContext.identity_type}`);

  const slice = handleInput(identityContext, request.idea);
  if (!slice) {
    return {
      status: "fail",
      reason: "input_failure",
      notes: [...notes, "input rejected: empty idea"],
    };
  }

  const history = request.history ?? [];
  const thoughtMemory = request.thoughtMemory ?? [];
  const canonInfluence = request.canonInfluence ?? buildEmptyCanonInfluence();
  const contaminated = applyMasterContamination({
    slice,
    history,
    thoughtMemory,
    interference: request.interference ?? null,
    influenceMode: request.influenceMode ?? null,
  });
  notes.push(...contaminated.notes);

  const core = runMindSliceCore({
    current: contaminated.slice.content,
    currentIndex: request.currentIndex ?? 0,
    thoughtScene: buildThoughtSceneEngine({
      current: contaminated.slice.content,
      currentIndex: request.currentIndex ?? 0,
      influenceMode: request.influenceMode ?? null,
      animatedThought: contaminated.slice.content.thought,
      isThoughtOverlayVisible: true,
      aiResponseLines: [],
    }),
    history,
    thoughtMemory,
    interference: contaminated.decision.accepted ? request.interference ?? null : null,
    canonInfluence,
    clockDisplay: request.clockDisplay ?? null,
    authorRole: identityContext.role === "anonymous" ? createUser().role : identityContext.role,
  });

  const pipeline = buildPipeline();
  const moduleOutput = executePipeline({
    pipeline,
    slice: contaminated.slice,
    currentIndex: request.currentIndex ?? 0,
    history,
    thoughtMemory,
    interference: contaminated.decision.accepted ? request.interference ?? null : null,
    canonInfluence,
    clockDisplay: request.clockDisplay ?? null,
    authorRole: identityContext.role === "anonymous" ? createUser().role : identityContext.role,
  });

  if (!moduleOutput) {
    return {
      status: "fail",
      reason: "pipeline_failure",
      notes: [...notes, "pipeline returned FAIL"],
    };
  }

  let concept = buildMasterConcept({
    identityContext,
    slice: contaminated.slice,
    framework: core.framework,
    exploration: core.exploration,
    design: core.design,
    moduleOutput,
  });
  concept = applyInfluence(identityContext, concept);

  if (!validateMasterConcept(concept)) {
    const refined = refineOrFail({ concept });

    if (!refined) {
      return {
        status: "fail",
        reason: "validation_failure",
        notes: [...notes, "concept failed validation and refine cycle"],
      };
    }

    concept = refined;
  }

  const canonical = isCanonicalConcept(concept);
  const output = buildDisplay(identityContext, concept);

  if (!masterLaw(concept)) {
    return {
      status: "fail",
      reason: "master_law_rejection",
      notes: [...notes, "concept does not modify system or does not pass validation"],
    };
  }

  return {
    status: "ok",
    output,
    pipeline,
    memory: core.memory,
    canonical,
    notes: [
      ...notes,
      `pipeline executed: ${pipeline.join(" -> ")}`,
      `validation passed: ${concept.validation.isValidConcept ? "yes" : "no"}`,
      `canonical: ${canonical ? "yes" : "no"}`,
    ],
  };
}
