import { applyContamination } from "@/lib/mindslice/concept-contamination-system";
import { buildConceptCandidate } from "@/lib/mindslice/concept-formation-system";
import { interpretIdea } from "@/lib/mindslice/concept-interpretation-system";
import { buildThoughtIteration } from "@/lib/mindslice/concept-iteration-system";
import { runThinkingEngine } from "@/lib/mindslice/concept-thinking-engine-system";
import { evaluateTerminationCondition } from "@/lib/mindslice/concept-termination-system";
import { validateConceptCandidate } from "@/lib/mindslice/concept-validation-system";
import type { ThoughtSceneEngineState } from "@/lib/mindslice/thought-scene-engine";
import type {
  AuthorIdentityType,
  AuthorRole,
  CanonInfluenceContext,
  ClockDisplayState,
  HistoryEntry,
  InfluenceMode,
  LiveInterference,
  ProcessIdeaResult,
  ThoughtMemoryEntry,
  ThoughtState
} from "@/lib/mindslice/mindslice-types";

type ProcessIdeaInput = {
  current: ThoughtState;
  currentIndex: number;
  thoughtScene: ThoughtSceneEngineState;
  history: HistoryEntry[];
  thoughtMemory: ThoughtMemoryEntry[];
  interference: LiveInterference | null;
  influenceMode: InfluenceMode | null;
  canonInfluence: CanonInfluenceContext;
  clockDisplay: ClockDisplayState | null;
  authorRole?: AuthorRole | null;
  identityType?: AuthorIdentityType | null;
};

export function processIdea(input: ProcessIdeaInput): ProcessIdeaResult {
  const {
    current,
    currentIndex,
    thoughtScene,
    history,
    thoughtMemory,
    interference,
    influenceMode,
    canonInfluence,
    clockDisplay,
    authorRole,
    identityType,
  } = input;

  const interpretation = interpretIdea({
    current,
    currentIndex,
    history,
    thoughtMemory,
    interference,
  });
  const contaminationResult = applyContamination({
    thought: interpretation.activeThought,
    influenceMode,
    interference,
    interpretation,
  });
  const contamination = contaminationResult.decision;
  const candidate = buildConceptCandidate({
    current: contaminationResult.thought,
    currentIndex,
    thoughtScene,
    history,
    thoughtMemory,
    interference: contamination.accepted ? interference : null,
    canonInfluence,
    clockDisplay,
    authorRole,
  });
  const validation = validateConceptCandidate(candidate);
  const thinkingEngine = runThinkingEngine({
    candidate,
    validation,
    authorRole,
    identityType,
  });
  const iterationCount = Math.max(history.length, 1);

  const terminationReason = evaluateTerminationCondition({
    iterationCount,
    validation,
    contaminationAccepted: contamination.accepted,
    persistenceAcrossCycles: candidate.conceptStateDraft.validation.persistenceAcrossCycles,
  });
  const iteration = buildThoughtIteration({
    validation,
    thought: interpretation.activeThought.thought,
  });

  const status = validation.isValidConcept
    ? "resolved"
    : terminationReason !== "none"
      ? "terminated"
      : "iterating";

  const nextAction =
    status === "resolved" ? "build_concept" : status === "terminated" ? "fail" : "iterate";

  const shouldIntegrate = status === "resolved";

  const notes = [
    ...interpretation.notes,
    ...contaminationResult.notes,
    ...thinkingEngine.notes.map((note) => `thinking: ${note}`),
    `contamination: ${contamination.rationale}`,
    `evaluare: organizare internă ${validation.axes.structure.toFixed(2)} / sens ${validation.axes.sense.toFixed(2)} / focalizare conceptuală ${validation.axes.attention.toFixed(2)} / coerență ${validation.axes.coherence.toFixed(2)}`,
    ...canonInfluence.notes.map((note) => `canon: ${note}`),
    `decizie: ${nextAction}`,
    ...iteration.notes,
  ];

  if (terminationReason !== "none") {
    notes.push(`terminare: ${terminationReason}`);
  }

  return {
    status,
    nextAction,
    iterationCount,
    interpretation,
    contamination,
    thinkingEngine,
    iteration,
    candidate,
    validation,
    shouldIntegrate,
    terminationReason,
    notes,
  };
}
