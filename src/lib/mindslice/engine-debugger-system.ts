import type {
  CanonEntry,
  ConceptMemoryEntry,
  ConceptPoolEntry,
  EngineDebugEvent,
  EngineDebuggerReport,
  IdeaLoopEntryResult,
  IdeaSetMainLoopResult,
  SystemModificationState,
} from "@/lib/mindslice/mindslice-types";

type BuildEngineDebuggerReportInput = {
  ideaSetMainLoop: IdeaSetMainLoopResult;
  conceptPool: ConceptPoolEntry[];
  conceptMemory: ConceptMemoryEntry[];
  canon: CanonEntry[];
  systemState: SystemModificationState;
};

function makeEvent(
  sequence: number,
  phase: EngineDebugEvent["phase"],
  level: EngineDebugEvent["level"],
  entry: IdeaLoopEntryResult | null,
  summary: string,
  detail: string,
): EngineDebugEvent {
  return {
    id: `${phase}:${entry?.ideaIndex ?? "global"}:${summary}`,
    phase,
    level,
    ideaIndex: entry?.ideaIndex ?? null,
    ideaDirection: entry?.ideaDirection ?? null,
    sequence,
    summary,
    detail,
  };
}

function buildEntryTrace(entry: IdeaLoopEntryResult, conceptPool: ConceptPoolEntry[]) {
  const { process } = entry;
  const pooledEntry = conceptPool.find(
    (candidate) => candidate.id === process.candidate.conceptStateDraft.id,
  );
  let sequence = entry.ideaIndex * 10;
  const events: EngineDebugEvent[] = [
    makeEvent(
      sequence++,
      "interpret",
      "info",
      entry,
      "Idea interpreted",
      `memory pressure ${process.interpretation.memoryPressure.toFixed(2)} / contamination pressure ${process.interpretation.contaminationPressure.toFixed(2)}`,
    ),
    makeEvent(
      sequence++,
      "contamination",
      process.contamination.accepted ? "success" : "warning",
      entry,
      `Contamination ${process.contamination.requestedMode} -> ${process.contamination.appliedMode}`,
      process.contamination.rationale,
    ),
    makeEvent(
      sequence++,
      "validation",
      process.validation.isValidConcept ? "success" : "warning",
      entry,
      `Validation ${process.validation.isValidConcept ? "passed" : "failed"}`,
      `structure ${process.validation.axes.structure.toFixed(2)} / sense ${process.validation.axes.sense.toFixed(2)} / attention ${process.validation.axes.attention.toFixed(2)} / coherence ${process.validation.axes.coherence.toFixed(2)}`,
    ),
    makeEvent(
      sequence++,
      "promotion",
      process.status === "resolved" ? "success" : process.status === "terminated" ? "warning" : "info",
      entry,
      `Process ${process.status}`,
      `next action ${process.nextAction} / termination ${process.terminationReason}`,
    ),
  ];

  if (pooledEntry) {
    events.push(
      makeEvent(
        sequence++,
        "pool",
        "success",
        entry,
        "Concept entered pool",
        `stage ${pooledEntry.concept.stage} / source ${pooledEntry.source}`,
      ),
    );
  }

  return events;
}

function buildTimeline(trace: EngineDebugEvent[]) {
  return trace.map((event) => {
    const status: EngineDebuggerReport["timeline"][number]["status"] =
      event.phase === "pool"
        ? "pooled"
        : event.phase === "canon"
          ? "canonical"
          : event.phase === "memory"
            ? "stored"
            : event.summary.includes("terminated")
              ? "terminated"
              : event.summary.includes("resolved") || event.summary.includes("passed")
                ? "resolved"
                : "iterating";

    return {
      label: `${event.phase}: ${event.summary}`,
      sequence: event.sequence,
      status,
      ideaDirection: event.ideaDirection,
    };
  });
}

function buildComparativeRuns(
  ideaSetMainLoop: IdeaSetMainLoopResult,
  conceptPool: ConceptPoolEntry[],
  canon: CanonEntry[],
) {
  return ideaSetMainLoop.entries.map((entry) => {
    const validationStrength =
      entry.process.validation.scores.semanticStability * 0.34 +
      entry.process.validation.scores.visualConsistency * 0.2 +
      entry.process.validation.scores.crossModalAlignment * 0.22 +
      entry.process.validation.scores.authorDilemmaResolution * 0.24;
    const pooled = conceptPool.some(
      (candidate) => candidate.id === entry.process.candidate.conceptStateDraft.id,
    );
    const canonical = canon.some(
      (candidate) => candidate.id === entry.process.candidate.conceptStateDraft.id,
    );

    return {
      ideaDirection: entry.ideaDirection,
      status: entry.process.status,
      blocker:
        entry.process.status === "terminated"
          ? entry.process.terminationReason
          : entry.process.validation.isValidConcept
            ? "none"
            : entry.process.nextAction,
      validationStrength,
      reachedPool: pooled,
      reachedCanon: canonical,
    };
  });
}

function buildFailureAnalysis(
  ideaSetMainLoop: IdeaSetMainLoopResult,
  conceptPool: ConceptPoolEntry[],
  conceptMemory: ConceptMemoryEntry[],
  canon: CanonEntry[],
  systemState: SystemModificationState,
) {
  const active = ideaSetMainLoop.activeResult;
  let currentBlocker = "No active blocker.";

  if (active.status === "terminated") {
    currentBlocker = `Active idea terminated because ${active.terminationReason}.`;
  } else if (!active.validation.isValidConcept) {
    const failedAxes = Object.entries(active.validation.axes)
      .filter(([axis, value]) => value < active.validation.thresholds[axis as keyof typeof active.validation.axes])
      .map(([axis]) => axis);
    currentBlocker = failedAxes.length
      ? `Active idea is blocked by ${failedAxes.join(", ")} below threshold.`
      : "Active idea is still iterating without a dominant passing signal.";
  } else if (!systemState.modifiesSystem) {
    currentBlocker = "Concept passed validation but has not produced enough system effect.";
  }

  const terminationCounts = ideaSetMainLoop.entries.reduce<Record<string, number>>((acc, entry) => {
    const key = entry.process.terminationReason;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const [topFailurePattern = "none"] =
    Object.entries(terminationCounts)
      .filter(([reason]) => reason !== "none")
      .sort((left, right) => right[1] - left[1])[0] ?? [];

  const nextLikelyPromotion =
    conceptPool[0]?.concept.core.title ??
    ideaSetMainLoop.entries.find((entry) => entry.process.validation.isValidConcept)?.ideaDirection ??
    "No concept is close to promotion yet.";

  const systemPressureSummary = [
    `pool ${conceptPool.length}`,
    `memory ${conceptMemory.length}`,
    `canon ${canon.length}`,
    `system ${systemState.modifiesSystem ? "modified" : "base"}`,
  ].join(" / ");

  return {
    currentBlocker,
    topFailurePattern:
      topFailurePattern === "none"
        ? "No dominant failure pattern yet."
        : `Most common failure pattern: ${topFailurePattern}.`,
    nextLikelyPromotion,
    systemPressureSummary,
  };
}

export function buildEngineDebuggerReport({
  ideaSetMainLoop,
  conceptPool,
  conceptMemory,
  canon,
  systemState,
}: BuildEngineDebuggerReportInput): EngineDebuggerReport {
  const trace = ideaSetMainLoop.entries.flatMap((entry) => buildEntryTrace(entry, conceptPool));
  let globalSequence = trace.length * 10 + 1;

  if (conceptMemory.length) {
    trace.push(
      makeEvent(
        globalSequence++,
        "memory",
        "success",
        null,
        "Concept memory updated",
        `${conceptMemory.length} concepts stored in memory`,
      ),
    );
  }

  if (canon.length) {
    trace.push(
      makeEvent(
        globalSequence++,
        "canon",
        "success",
        null,
        "Canon is active",
        `${canon.length} canonical concepts / primary ${canon[0]?.concept.core.title ?? "none"}`,
      ),
    );
  }

  trace.push(
    makeEvent(
      globalSequence++,
      "system",
      systemState.modifiesSystem ? "success" : "info",
      null,
      systemState.modifiesSystem ? "System modified" : "System idle",
      systemState.notes.join(" | "),
    ),
  );

  const activeTrace = trace.filter(
    (event) =>
      event.ideaIndex === null || event.ideaIndex === ideaSetMainLoop.activeIdeaIndex,
  );

  return {
    trace,
    activeTrace,
    timeline: buildTimeline(trace),
    comparativeRuns: buildComparativeRuns(ideaSetMainLoop, conceptPool, canon),
    failureAnalysis: buildFailureAnalysis(
      ideaSetMainLoop,
      conceptPool,
      conceptMemory,
      canon,
      systemState,
    ),
    funnel: {
      total: ideaSetMainLoop.totalIdeas,
      iterating: ideaSetMainLoop.iteratingCount,
      resolved: ideaSetMainLoop.resolvedCount,
      pooled: conceptPool.length,
      stored: conceptMemory.length,
      canonical: canon.length,
      systemChanging: conceptMemory.filter((entry) => entry.concept.systemEffect?.modifiesSystem)
        .length,
    },
  };
}
