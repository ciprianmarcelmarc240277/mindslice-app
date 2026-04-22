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
import { updateStructureSystemState } from "@/lib/mindslice/concept-composition-structure-system";
import { updateShapeSystemState } from "@/lib/mindslice/concept-shape-theory-system";
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
    const canonWeightPressure = (
      entry.process.candidate.canonInfluence.activeWeights.narrative * 0.24 +
      entry.process.candidate.canonInfluence.activeWeights.art * 0.24 +
      entry.process.candidate.canonInfluence.activeWeights.structure * 0.26 +
      entry.process.candidate.canonInfluence.activeWeights.color * 0.26
    );
    const validationStrength =
      entry.process.validation.scores.semanticStability * 0.34 +
      entry.process.validation.scores.visualConsistency * 0.18 +
      entry.process.validation.scores.crossModalAlignment * 0.2 +
      entry.process.validation.scores.crossCanonCoherence * 0.1 +
      entry.process.validation.scores.timeArtCoherence * 0.08 +
      entry.process.validation.scores.shapeIdentity * 0.04 +
      entry.process.validation.scores.shapeAttention * 0.04 +
      entry.process.validation.scores.authorDilemmaResolution * 0.08 +
      canonWeightPressure * 0.04;
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
      canonWeightPressure,
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
  const activeStructure = ideaSetMainLoop.activeResult.candidate.conceptStateDraft.expression.compositionStructure;
  const activeShape = ideaSetMainLoop.activeResult.candidate.conceptStateDraft.expression.shape;
  const activeShapeGrammar = ideaSetMainLoop.activeResult.candidate.conceptStateDraft.expression.shapeGrammar;
  const activeMetaSystem = ideaSetMainLoop.activeResult.candidate.conceptStateDraft.expression.metaSystem;
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
  const structureSystemStateUpdate = activeStructure.runtime
    ? updateStructureSystemState({
        structure: activeStructure,
        validation: activeStructure.runtime.scores,
      })
    : null;
  const shapeSystemStateUpdate = activeShape.runtime
    ? updateShapeSystemState({
        shape: activeShape,
        validation: activeShape.runtime.scores,
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
      colorPalette: activePalette.runtime?.colorPalette ?? null,
      compositionPalette: activePalette.runtime?.compositionPalette ?? null,
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
      visualOutput: activeArtComposition.runtime?.visualOutput ?? null,
      visualScore: activeArtComposition.runtime?.visualScore ?? null,
      visualRefined: activeArtComposition.runtime?.visualRefined ?? false,
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
    structure: {
      interpretation: activeStructure.runtime?.interpretation ?? "Nicio interpretare structurală disponibilă.",
      selectedStrategy: activeStructure.runtime?.selectedStrategy ?? null,
      compositionLayout: activeStructure.runtime?.compositionLayout ?? null,
      generatedLayout: activeStructure.runtime?.generatedLayout ?? null,
      contaminationMode: activeStructure.runtime?.contaminationMode ?? "none",
      acceptedContamination: activeStructure.runtime?.acceptedContamination ?? false,
      iterationCount: activeStructure.runtime?.iterationCount ?? 0,
      terminated: activeStructure.runtime?.terminated ?? false,
      terminationReason: activeStructure.runtime?.terminationReason ?? "none",
      isValidStructure: activeStructure.runtime?.isValidStructure ?? false,
      lawPassed: activeStructure.runtime?.lawPassed ?? false,
      lawNote: activeStructure.runtime?.lawNote ?? "Nicio lege structurală evaluată.",
      thresholds: activeStructure.runtime?.thresholds ?? {
        thirds: 0.66,
        golden: 0.64,
        symmetry: 0.66,
        center: 0.66,
        attention: 0.7,
      },
      scores: activeStructure.runtime?.scores ?? {
        thirds: 0,
        golden: 0,
        symmetry: 0,
        center: 0,
        attention: 0,
      },
      grid: activeStructure.grid,
      subjectPosition: activeStructure.subjectPosition,
      symmetryState: activeStructure.symmetryState,
      centerState: activeStructure.centerState,
      outputText: activeStructure.outputText,
      outputVisual: activeStructure.outputVisual,
      systemStateUpdate: structureSystemStateUpdate,
      notes: activeStructure.runtime?.notes ?? [],
    },
    shape: {
      interpretation: activeShape.runtime?.interpretation ?? "Nicio interpretare formală disponibilă.",
      shapeIdeaSet: activeShape.runtime?.shapeIdeaSet ?? [],
      detectedPrimitiveShape: activeShape.runtime?.detectedPrimitiveShape ?? null,
      primitiveShapeStructure: activeShape.runtime?.primitiveShapeStructure ?? null,
      contaminationMode: activeShape.runtime?.contaminationMode ?? "none",
      acceptedContamination: activeShape.runtime?.acceptedContamination ?? false,
      hardFailureMode: activeShape.runtime?.hardFailureMode ?? "soft",
      hardFailureTriggered: activeShape.runtime?.hardFailureTriggered ?? false,
      iterationCount: activeShape.runtime?.iterationCount ?? 0,
      terminated: activeShape.runtime?.terminated ?? false,
      terminationReason: activeShape.runtime?.terminationReason ?? "none",
      failed: activeShape.runtime?.failed ?? false,
      failureReason: activeShape.runtime?.failureReason ?? null,
      isValidShape: activeShape.runtime?.isValidShape ?? false,
      lawPassed: activeShape.runtime?.lawPassed ?? false,
      lawNote: activeShape.runtime?.lawNote ?? "Nicio lege formală evaluată.",
      thresholds: activeShape.runtime?.thresholds ?? {
        identity: 0.68,
        relation: 0.66,
        tension: 0.68,
        attention: 0.7,
      },
      scores: activeShape.runtime?.scores ?? {
        identity: 0,
        relation: 0,
        tension: 0,
        attention: 0,
      },
      type: activeShape.type,
      mass: activeShape.mass,
      behavior: activeShape.behavior,
      positionTendency: activeShape.positionTendency,
      outputText: activeShape.outputText,
      outputVisual: activeShape.outputVisual,
      systemStateUpdate: shapeSystemStateUpdate,
      notes: activeShape.runtime?.notes ?? [],
    },
    shapeGrammar: {
      seedShape: activeShapeGrammar.runtime?.seedShape ?? "no-seed-shape",
      primitiveBaseShape: activeShapeGrammar.runtime?.primitiveBaseShape ?? null,
      primitiveEvolvedShape: activeShapeGrammar.runtime?.primitiveEvolvedShape ?? null,
      generatedForm: activeShapeGrammar.runtime?.generatedForm ?? null,
      ruleset: activeShapeGrammar.runtime?.ruleset ?? [],
      rulesApplied: activeShapeGrammar.rulesApplied ?? [],
      constraints: activeShapeGrammar.runtime?.constraints ?? [],
      hardFailureMode: activeShapeGrammar.runtime?.hardFailureMode ?? "soft",
      hardFailureTriggered: activeShapeGrammar.runtime?.hardFailureTriggered ?? false,
      iterationCount: activeShapeGrammar.runtime?.iterationCount ?? 0,
      maxIterations: activeShapeGrammar.runtime?.maxIterations ?? 0,
      terminated: activeShapeGrammar.runtime?.terminated ?? false,
      terminationReason: activeShapeGrammar.runtime?.terminationReason ?? "none",
      failed: activeShapeGrammar.runtime?.failed ?? false,
      failureReason: activeShapeGrammar.runtime?.failureReason ?? null,
      thresholds: activeShapeGrammar.runtime?.thresholds ?? {
        coherence: 0.68,
        transformation: 0.64,
        relation: 0.66,
        expressivePower: 0.7,
      },
      scores: activeShapeGrammar.runtime?.scores ?? {
        coherence: 0,
        transformation: 0,
        relation: 0,
        expressivePower: 0,
      },
      lawPassed: activeShapeGrammar.runtime?.lawPassed ?? false,
      lawNote: activeShapeGrammar.runtime?.lawNote ?? "Nicio lege gramaticală evaluată.",
      outputText: activeShapeGrammar.outputText,
      outputVisual: activeShapeGrammar.outputVisual,
      systemStateUpdate: activeShapeGrammar.runtime?.systemStateUpdate ?? {
        rulePriorities: {
          dominantRule: "repeat",
          adaptiveBias: 0,
          rankedRules: ["repeat"],
          constraintBias: 0,
          suppressedRules: [],
          recoveredRules: [],
        },
        transformationLogic: {
          acceptedWeight: 0,
          rejectedWeight: 0,
        },
        sequenceBehavior: {
          continuityWeight: 0,
          varianceWeight: 0,
        },
        notes: ["no grammar system update available"],
      },
      notes: activeShapeGrammar.runtime?.notes ?? [],
    },
    metaSystem: {
      framework: activeMetaSystem.runtime?.framework ?? {
        intent: "no-intent",
        function: "no-function",
        target: "no-target",
        differentiator: "no-differentiator",
        domain: [],
        constraints: [],
        goal: "no-goal",
        priority: "no-priority",
      },
      labyrinth: activeMetaSystem.runtime?.labyrinth ?? {
        explorationMap: {
          explorations: {},
          connections: [],
        },
        explorations: {},
        connections: [],
        axes: [],
        variations: [],
        relations: [],
      },
      conductor: activeMetaSystem.runtime?.conductor ?? {
        mode: "conductor",
        targetModules: [],
        labyrinthPressure: 0,
        pipelinePressure: 0,
        relationPressure: 0,
        notes: [],
      },
      designOutput: activeMetaSystem.runtime?.designOutput ?? {
        direction: "artistic",
        style: "hybrid_stage",
        layout: "adaptive_layout",
        motion: "ambient_motion",
      },
      activePipeline: activeMetaSystem.runtime?.activePipeline ?? [],
      designState: activeMetaSystem.runtime?.designState ?? {
        executedModules: [],
        reorderedPipeline: [],
        suppressedModules: [],
        suppressionNotes: [],
        recoveredModules: [],
        recoveryNotes: [],
        moduleWeights: {},
        reweightNotes: [],
        failed: false,
        failureModule: null,
        failureReason: null,
        moduleNotes: [],
      },
      memory: activeMetaSystem.runtime?.memory ?? {
        globalWeight: 0,
        domainWeights: {},
        appliedDomains: [],
        influenceWeight: 0,
        influenceNotes: [],
        storedConcept: "none",
        canonical: false,
        canonicalReuse: 0,
        canonicalImpact: 0,
        canonicalStability: 0,
      },
      validationPassed: activeMetaSystem.runtime?.validationPassed ?? false,
      failed: activeMetaSystem.runtime?.failed ?? false,
      failureReason: activeMetaSystem.runtime?.failureReason ?? null,
      canon: activeMetaSystem.runtime?.canon ?? {
        globalCandidate: false,
        domainCandidates: [],
        influenceWeight: 0,
        influenceNotes: [],
      },
      thresholds: activeMetaSystem.runtime?.thresholds ?? {
        structure: 0.66,
        coherence: 0.68,
        attention: 0.67,
        integration: 0.7,
      },
      scores: activeMetaSystem.runtime?.scores ?? {
        structure: 0,
        coherence: 0,
        attention: 0,
        integration: 0,
      },
      lawPassed: activeMetaSystem.runtime?.lawPassed ?? false,
      lawNote: activeMetaSystem.runtime?.lawNote ?? "Nicio lege meta-sistemică evaluată.",
      outputText: activeMetaSystem.outputText,
      outputVisual: activeMetaSystem.outputVisual,
      notes: activeMetaSystem.runtime?.notes ?? [],
    },
    scenario: {
      interpretation: activeScenario.runtime?.interpretation ?? "Nicio interpretare narativă disponibilă.",
      extractedTension: activeScenario.runtime?.extractedTension ?? null,
      narrativeSequence: activeScenario.runtime?.narrativeSequence ?? [],
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
    canonInfluence: {
      dominantCanon: ideaSetMainLoop.activeResult.candidate.canonInfluence.dominantCanon,
      totalInfluence: ideaSetMainLoop.activeResult.candidate.canonInfluence.totalInfluence,
      activeWeights: ideaSetMainLoop.activeResult.candidate.canonInfluence.activeWeights,
      normalizedWeights: ideaSetMainLoop.activeResult.candidate.canonInfluence.normalizedWeights,
      notes: ideaSetMainLoop.activeResult.candidate.canonInfluence.notes,
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
