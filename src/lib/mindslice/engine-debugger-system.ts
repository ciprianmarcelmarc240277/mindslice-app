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
import { updateArtSystemState } from "@/lib/mindslice/concept-art-composition-system";
import { updateColorSystemState } from "@/lib/mindslice/concept-color-theory-system";
import { updateNarrativeSystemState } from "@/lib/mindslice/concept-scenario-system";

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
      "Idee interpretată",
      `presiune de memorie ${process.interpretation.memoryPressure.toFixed(2)} / presiune de contaminare ${process.interpretation.contaminationPressure.toFixed(2)}`,
    ),
    makeEvent(
      sequence++,
      "contamination",
      process.contamination.accepted ? "success" : "warning",
      entry,
      `Contaminare ${process.contamination.requestedMode} -> ${process.contamination.appliedMode}`,
      process.contamination.rationale,
    ),
    makeEvent(
      sequence++,
      "validation",
      process.validation.isValidConcept ? "success" : "warning",
      entry,
      `Validare ${process.validation.isValidConcept ? "reușită" : "eșuată"}`,
      `organizare internă ${process.validation.axes.structure.toFixed(2)} / sens ${process.validation.axes.sense.toFixed(2)} / focalizare conceptuală ${process.validation.axes.attention.toFixed(2)} / coerență ${process.validation.axes.coherence.toFixed(2)}`,
    ),
    makeEvent(
      sequence++,
      "promotion",
      process.status === "resolved" ? "success" : process.status === "terminated" ? "warning" : "info",
      entry,
      `Proces ${process.status}`,
      `acțiune următoare ${process.nextAction} / terminare ${process.terminationReason}`,
    ),
  ];

  if (pooledEntry) {
    events.push(
      makeEvent(
        sequence++,
        "pool",
        "success",
        entry,
        "Concept intrat în pool",
        `stadiu ${pooledEntry.concept.stage} / sursă ${pooledEntry.source}`,
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
  let currentBlocker = "Niciun blocaj activ.";

  if (active.status === "terminated") {
    currentBlocker = `Ideea activă s-a încheiat din cauza: ${active.terminationReason}.`;
  } else if (!active.validation.isValidConcept) {
    const failedAxes = Object.entries(active.validation.axes)
      .filter(([axis, value]) => value < active.validation.thresholds[axis as keyof typeof active.validation.axes])
      .map(([axis]) => axis);
    currentBlocker = failedAxes.length
      ? `Ideea activă este blocată de axe sub prag: ${failedAxes.join(", ")}.`
      : "Ideea activă încă iterează fără un semnal dominant de trecere.";
  } else if (!systemState.modifiesSystem) {
    currentBlocker =
      "Conceptul a trecut validarea, dar nu produce încă un efect suficient asupra sistemului.";
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
    "Niciun concept nu este încă aproape de promovare.";

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
        ? "Nu există încă un tipar dominant de eșec."
        : `Cel mai frecvent tipar de eșec: ${topFailurePattern}.`,
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
  const activePalette = ideaSetMainLoop.activeResult.candidate.conceptStateDraft.expression.palette;
  const activeArtComposition = ideaSetMainLoop.activeResult.candidate.conceptStateDraft.expression.artComposition;
  const activeScenario = ideaSetMainLoop.activeResult.candidate.conceptStateDraft.expression.scenario;
  const colorSystemStateUpdate = activePalette.runtime
    ? updateColorSystemState({
        palette: activePalette,
        validation: activePalette.runtime.scores,
      })
    : null;
  const artSystemStateUpdate = activeArtComposition.runtime
    ? updateArtSystemState({
        composition: activeArtComposition,
        validation: activeArtComposition.runtime.scores,
      })
    : null;
  const narrativeSystemStateUpdate = activeScenario.runtime
    ? updateNarrativeSystemState({
        scenario: activeScenario,
        validation: activeScenario.runtime.scores,
      })
    : null;

  if (conceptMemory.length) {
    trace.push(
      makeEvent(
        globalSequence++,
        "memory",
        "success",
        null,
        "Memoria conceptelor a fost actualizată",
        `${conceptMemory.length} concepte stocate în memorie`,
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
        "Canonul este activ",
        `${canon.length} concepte canonice / principal ${canon[0]?.concept.core.title ?? "niciunul"}`,
      ),
    );
  }

  trace.push(
    makeEvent(
      globalSequence++,
      "system",
      systemState.modifiesSystem ? "success" : "info",
      null,
      systemState.modifiesSystem ? "Sistem modificat" : "Sistem în repaus",
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
    colorTheory: {
      interpretation: activePalette.runtime?.interpretation ?? "Nicio interpretare cromatică disponibilă.",
      contaminationMode: activePalette.runtime?.contaminationMode ?? "none",
      acceptedContamination: activePalette.runtime?.acceptedContamination ?? false,
      iterationCount: activePalette.runtime?.iterationCount ?? 0,
      terminated: activePalette.runtime?.terminated ?? false,
      terminationReason: activePalette.runtime?.terminationReason ?? "none",
      isValidPalette: activePalette.runtime?.isValidPalette ?? false,
      lawPassed: activePalette.runtime?.lawPassed ?? false,
      lawNote: activePalette.runtime?.lawNote ?? "Nicio lege cromatică evaluată.",
      thresholds: activePalette.runtime?.thresholds ?? {
        hueStructure: 0.7,
        valueBalance: 0.7,
        saturationControl: 0.7,
        colorRelations: 0.72,
        attentionImpact: 0.72,
      },
      scores: activePalette.runtime?.scores ?? {
        hueStructure: 0,
        valueBalance: 0,
        saturationControl: 0,
        colorRelations: 0,
        attentionImpact: 0,
      },
      outputText: activePalette.outputText,
      outputVisual: activePalette.outputVisual,
      systemStateUpdate: colorSystemStateUpdate,
      notes: activePalette.runtime?.notes ?? [],
    },
    artComposition: {
      interpretation: activeArtComposition.runtime?.interpretation ?? "Nicio interpretare compozițională disponibilă.",
      contaminationMode: activeArtComposition.runtime?.contaminationMode ?? "none",
      acceptedContamination: activeArtComposition.runtime?.acceptedContamination ?? false,
      iterationCount: activeArtComposition.runtime?.iterationCount ?? 0,
      terminated: activeArtComposition.runtime?.terminated ?? false,
      terminationReason: activeArtComposition.runtime?.terminationReason ?? "none",
      isValidComposition: activeArtComposition.runtime?.isValidComposition ?? false,
      lawPassed: activeArtComposition.runtime?.lawPassed ?? false,
      lawNote: activeArtComposition.runtime?.lawNote ?? "Nicio lege compozițională evaluată.",
      thresholds: activeArtComposition.runtime?.thresholds ?? {
        unity: 0.7,
        balance: 0.68,
        rhythm: 0.66,
        movement: 0.68,
        contrast: 0.7,
        proportion: 0.67,
        focus: 0.72,
      },
      scores: activeArtComposition.runtime?.scores ?? {
        unity: 0,
        balance: 0,
        rhythm: 0,
        movement: 0,
        contrast: 0,
        proportion: 0,
        focus: 0,
      },
      focusNode: activeArtComposition.focusNode,
      outputText: activeArtComposition.outputText,
      outputVisual: activeArtComposition.outputVisual,
      systemStateUpdate: artSystemStateUpdate,
      notes: activeArtComposition.runtime?.notes ?? [],
    },
    scenario: {
      interpretation: activeScenario.runtime?.interpretation ?? "Nicio interpretare narativă disponibilă.",
      contaminationMode: activeScenario.runtime?.contaminationMode ?? "none",
      acceptedContamination: activeScenario.runtime?.acceptedContamination ?? false,
      iterationCount: activeScenario.runtime?.iterationCount ?? 0,
      terminated: activeScenario.runtime?.terminated ?? false,
      terminationReason: activeScenario.runtime?.terminationReason ?? "none",
      isValidScenario: activeScenario.runtime?.isValidScenario ?? false,
      lawPassed: activeScenario.runtime?.lawPassed ?? false,
      lawNote: activeScenario.runtime?.lawNote ?? "Nicio lege narativă evaluată.",
      thresholds: activeScenario.runtime?.thresholds ?? {
        conflict: 0.68,
        tension: 0.7,
        progression: 0.66,
        meaning: 0.68,
        attention: 0.7,
      },
      scores: activeScenario.runtime?.scores ?? {
        conflict: 0,
        tension: 0,
        progression: 0,
        meaning: 0,
        attention: 0,
      },
      coreConflict: activeScenario.coreConflict,
      outputText: activeScenario.outputText,
      outputStructure: activeScenario.outputStructure,
      systemStateUpdate: narrativeSystemStateUpdate,
      notes: activeScenario.runtime?.notes ?? [],
    },
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
