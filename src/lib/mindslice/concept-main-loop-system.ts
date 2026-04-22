import { processIdea } from "@/lib/mindslice/concept-process-system";
import { buildThoughtSceneEngine } from "@/lib/mindslice/thought-scene-engine";
import type {
  AuthorIdentityType,
  AuthorRole,
  CanonInfluenceContext,
  ClockDisplayState,
  HistoryEntry,
  IdeaLoopEntryResult,
  IdeaSetMainLoopResult,
  InfluenceMode,
  LiveInterference,
  ThoughtMemoryEntry,
  ThoughtState,
} from "@/lib/mindslice/mindslice-types";

type RunIdeaSetMainLoopInput = {
  ideaSet: ThoughtState[];
  activeIdeaIndex: number;
  history: HistoryEntry[];
  thoughtMemory: ThoughtMemoryEntry[];
  interference: LiveInterference | null;
  influenceMode: InfluenceMode | null;
  liveAiResponseLines: string[];
  canonInfluence: CanonInfluenceContext;
  clockDisplay: ClockDisplayState | null;
  authorRole?: AuthorRole | null;
  identityType?: AuthorIdentityType | null;
};

function buildIdeaLoopEntry(
  idea: ThoughtState,
  ideaIndex: number,
  activeIdeaIndex: number,
  history: HistoryEntry[],
  thoughtMemory: ThoughtMemoryEntry[],
  interference: LiveInterference | null,
  influenceMode: InfluenceMode | null,
  liveAiResponseLines: string[],
  canonInfluence: CanonInfluenceContext,
  clockDisplay: ClockDisplayState | null,
  authorRole: AuthorRole | null | undefined,
  identityType: AuthorIdentityType | null | undefined,
): IdeaLoopEntryResult {
  const thoughtScene = buildThoughtSceneEngine({
    current: idea,
    currentIndex: ideaIndex,
    influenceMode,
    animatedThought: idea.thought,
    isThoughtOverlayVisible: true,
    aiResponseLines: liveAiResponseLines,
  });

  return {
    ideaIndex,
    ideaDirection: idea.direction,
    isActiveIdea: ideaIndex === activeIdeaIndex,
    process: processIdea({
      current: idea,
      currentIndex: ideaIndex,
      thoughtScene,
      history,
      thoughtMemory,
      interference,
      influenceMode,
      canonInfluence,
      clockDisplay,
      authorRole,
      identityType,
    }),
  };
}

export function runIdeaSetMainLoop({
  ideaSet,
  activeIdeaIndex,
  history,
  thoughtMemory,
  interference,
  influenceMode,
  liveAiResponseLines,
  canonInfluence,
  clockDisplay,
  authorRole,
  identityType,
}: RunIdeaSetMainLoopInput): IdeaSetMainLoopResult {
  const safeIdeaSet = ideaSet.length ? ideaSet : [];
  const safeActiveIdeaIndex =
    safeIdeaSet.length > 0
      ? Math.min(Math.max(activeIdeaIndex, 0), safeIdeaSet.length - 1)
      : 0;

  const entries = safeIdeaSet.map((idea, ideaIndex) =>
    buildIdeaLoopEntry(
      idea,
      ideaIndex,
      safeActiveIdeaIndex,
      history,
      thoughtMemory,
      interference,
      influenceMode,
      liveAiResponseLines,
      canonInfluence,
      clockDisplay,
      authorRole,
      identityType,
    ),
  );

  const activeEntry = entries[safeActiveIdeaIndex] ?? null;

  if (!activeEntry) {
    const fallbackEntry = buildIdeaLoopEntry(
      {
        direction: "Empty Idea Set",
        thought: "",
        fragments: [],
        mood: "idle",
        palette: [],
        materials: [],
        motion: "hold",
        triad: {
          art: { score: 0, label: "idle" },
          design: { score: 0, label: "idle" },
          business: { score: 0, label: "idle" },
        },
        visual: {
          background: "#000000",
          accent: "#000000",
          ink: "#000000",
          mode: "empty",
          density: 0,
          wave: 0,
          fracture: 0,
          drift: 0,
          convergence: 0,
        },
        keywords: [],
      },
      0,
      0,
      history,
      thoughtMemory,
      interference,
      influenceMode,
      liveAiResponseLines,
      canonInfluence,
      clockDisplay,
      authorRole,
      identityType,
    );

    return {
      totalIdeas: 0,
      activeIdeaIndex: 0,
      activeResult: fallbackEntry.process,
      entries: [],
      resolvedCount: 0,
      iteratingCount: 0,
      terminatedCount: 0,
      notes: ["main loop: IDEA_SET este gol"],
    };
  }

  const resolvedCount = entries.filter((entry) => entry.process.status === "resolved").length;
  const iteratingCount = entries.filter((entry) => entry.process.status === "iterating").length;
  const terminatedCount = entries.filter((entry) => entry.process.status === "terminated").length;

  return {
    totalIdeas: entries.length,
    activeIdeaIndex: safeActiveIdeaIndex,
    activeResult: activeEntry.process,
    entries,
    resolvedCount,
    iteratingCount,
    terminatedCount,
    notes: [
      `main loop: processed ${entries.length} ideas from IDEA_SET`,
      `resolved: ${resolvedCount}`,
      `iterating: ${iteratingCount}`,
      `terminated: ${terminatedCount}`,
      `active idea: ${activeEntry.ideaDirection}`,
      ...canonInfluence.notes.map((note) => `canon influence: ${note}`),
    ],
  };
}
