"use client";

import { useMemo, useState } from "react";
import type {
  ThoughtSceneEngineState,
} from "@/lib/mindslice/thought-scene-engine";
import type {
  ClockDisplayState,
  ConceptCandidate,
  EngineDebuggerReport,
  IdeaSetMainLoopResult,
  ProcessIdeaResult,
  ConceptValidationResult,
  EngineProfile,
  InfluenceMode,
  LiveInterference,
  SystemModificationState,
  ThoughtState,
  UserProfile,
} from "@/lib/mindslice/mindslice-types";
import styles from "../page.module.css";

type LiveSceneViewProps = {
  isActive: boolean;
  engineMode: string;
  engineProfile: EngineProfile | null;
  current: ThoughtState;
  currentIndex: number;
  libraryLength: number;
  clockDisplay: ClockDisplayState | null;
  clockMemoryCount: number;
  latestClockTime: string | null;
  liveInfluenceMode: InfluenceMode | null;
  thoughtScene: ThoughtSceneEngineState;
  leadingLineStyles: ThoughtSceneEngineState["sceneGraph"]["leadingLines"];
  focalHaloStyles: ThoughtSceneEngineState["sceneGraph"]["focalHalos"];
  negativeSpaceStyles: ThoughtSceneEngineState["sceneGraph"]["negativeSpace"];
  thoughtCenterAnchor: React.CSSProperties;
  thoughtCenterFragment: string;
  interference: LiveInterference | null;
  profile: Pick<UserProfile, "user_id"> | null;
  followedUserIds: string[];
  followActionUserId: string | null;
  handleFollowToggle: (targetUserId: string, shouldFollow: boolean) => void;
  formatPublicAuthor: (value: string | null | undefined) => string;
  isThoughtOverlayVisible: boolean;
  thoughtAnimationKey: number;
  thoughtLines: string[];
  liveAiResponseLines: string[];
  systemState: SystemModificationState;
  engineDebuggerReport: EngineDebuggerReport;
  debugRunCount: number;
  comparativeDelta: {
    resolvedDelta: number;
    pooledDelta: number;
    canonicalDelta: number;
  } | null;
  ideaSetMainLoop: IdeaSetMainLoopResult;
  conceptProcess: ProcessIdeaResult;
  conceptCandidate: ConceptCandidate;
  conceptValidation: ConceptValidationResult;
  conceptPoolCount: number;
  latestPoolConceptTitle: string | null;
  colorPoolCount: number;
  latestColorPoolTitle: string | null;
  scenarioPoolCount: number;
  latestScenarioPoolTitle: string | null;
  artCompositionPoolCount: number;
  latestArtCompositionPoolTitle: string | null;
  canonCount: number;
  primaryCanonTitle: string | null;
  colorCanonCount: number;
  primaryColorCanonTitle: string | null;
  narrativeCanonCount: number;
  primaryNarrativeCanonTitle: string | null;
  artCanonCount: number;
  primaryArtCanonTitle: string | null;
  conceptMemoryCount: number;
  resolvedConceptCount: number;
  latestConceptTitle: string | null;
  colorMemoryCount: number;
  resolvedColorCount: number;
  latestColorTitle: string | null;
  storyMemoryCount: number;
  resolvedScenarioCount: number;
  latestScenarioTitle: string | null;
  artMemoryCount: number;
  resolvedArtCount: number;
  latestArtTitle: string | null;
  promotionStatus: string;
  canPromoteToCanonical: boolean;
  promotionNotes: string[];
};

export function LiveSceneView(props: LiveSceneViewProps) {
  const {
    isActive,
    engineMode,
    engineProfile,
    current,
    currentIndex,
    libraryLength,
    clockDisplay,
    clockMemoryCount,
    latestClockTime,
    liveInfluenceMode,
    thoughtScene,
    leadingLineStyles,
    focalHaloStyles,
    negativeSpaceStyles,
    thoughtCenterAnchor,
    thoughtCenterFragment,
    interference,
    profile,
    followedUserIds,
    followActionUserId,
    handleFollowToggle,
    formatPublicAuthor,
    isThoughtOverlayVisible,
    thoughtAnimationKey,
    thoughtLines,
    liveAiResponseLines,
    systemState,
    engineDebuggerReport,
    debugRunCount,
    comparativeDelta,
    ideaSetMainLoop,
    conceptProcess,
    conceptCandidate,
    conceptValidation,
    conceptPoolCount,
    latestPoolConceptTitle,
    colorPoolCount,
    latestColorPoolTitle,
    scenarioPoolCount,
    latestScenarioPoolTitle,
    artCompositionPoolCount,
    latestArtCompositionPoolTitle,
    canonCount,
    primaryCanonTitle,
    colorCanonCount,
    primaryColorCanonTitle,
    narrativeCanonCount,
    primaryNarrativeCanonTitle,
    artCanonCount,
    primaryArtCanonTitle,
    conceptMemoryCount,
    resolvedConceptCount,
    latestConceptTitle,
    colorMemoryCount,
    resolvedColorCount,
    latestColorTitle,
    storyMemoryCount,
    resolvedScenarioCount,
    latestScenarioTitle,
    artMemoryCount,
    resolvedArtCount,
    latestArtTitle,
    promotionStatus,
    canPromoteToCanonical,
    promotionNotes,
  } = props;
  const [activeTracePhase, setActiveTracePhase] = useState<
    "all" | "interpret" | "contamination" | "validation" | "promotion" | "pool" | "memory" | "canon" | "system"
  >("all");
  const [activeTraceLevel, setActiveTraceLevel] = useState<"all" | "info" | "warning" | "success">(
    "all",
  );
  const filteredActiveTrace = useMemo(
    () =>
      engineDebuggerReport.activeTrace.filter((event) => {
        if (activeTracePhase !== "all" && event.phase !== activeTracePhase) {
          return false;
        }

        if (activeTraceLevel !== "all" && event.level !== activeTraceLevel) {
          return false;
        }

        return true;
      }),
    [activeTraceLevel, activeTracePhase, engineDebuggerReport.activeTrace],
  );

  return (
    <>
      <section className={styles.liveCuratorNote}>
        <span className={styles.panelMarker}>PANEL · Live Curator Note</span>
        <div>
          <p className={styles.eyebrow}>Curated Live Field</p>
          <h2>Scena în care gândirea devine tipografie activă</h2>
        </div>
        <p>
          Câmpul live expune fragmente, ecouri și deviații în timp real. Jurnalul nu stă
          separat de scenă: îl bruiază, îl îndoaie și îi mută centrul de greutate.
        </p>
      </section>

      <div className={styles.statusBar}>
        <span className={styles.panelMarker}>PANEL · Live Status Bar</span>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Stare curentă</span>
          <strong className={styles.statusValue}>
            {isActive ? "artistul gândește live" : "în așteptare"}
          </strong>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Sursa thinking</span>
          <strong className={styles.statusValue}>{engineMode}</strong>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Direcție</span>
          <strong key={current.direction} className={styles.statusValue}>
            {current.direction}
          </strong>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>MindSlice Clock</span>
          <strong className={styles.statusValue}>
            {clockDisplay
              ? `${clockDisplay.hours}:${clockDisplay.minutes}:${clockDisplay.seconds}`
              : "clock fail"}
          </strong>
          <span className={styles.statusLabel}>
            {clockDisplay
              ? `${clockDisplay.visualStyle} · ${clockDisplay.transition}`
              : "display invalid"}
          </span>
        </div>
      </div>

      {engineProfile ? (
        <section className={styles.engineProfilePanel}>
          <span className={styles.panelMarker}>PANEL · Engine Profile</span>
          <div className={styles.engineProfileHeading}>
            <p className={styles.eyebrow}>Alpha Engine Profile</p>
            <h2>Motorul live se descrie singur</h2>
            <p>
              În alpha, păstrăm motorul inspectabil. Vrem să vedem clar după ce reguli
              funcționează și ce contaminare este activă în scenă.
            </p>
          </div>
          <div className={styles.engineProfileGrid}>
            <article>
              <span>Stage</span>
              <strong>{engineProfile.stage}</strong>
            </article>
            <article>
              <span>Generation</span>
              <strong>{engineProfile.generationStrategy}</strong>
            </article>
            <article>
              <span>Contamination</span>
              <strong>{engineProfile.contaminationStrategy}</strong>
            </article>
            <article>
              <span>OpenAI</span>
              <strong>
                {engineProfile.openaiStructuredGeneration === "active"
                  ? "structured refinement active"
                  : "local alpha engine"}
              </strong>
            </article>
          </div>
          <div className={styles.engineProfileColumns}>
            <article className={styles.engineProfileCard}>
              <span>Charter Axes</span>
              <ul>
                {engineProfile.charterAxes.map((axis) => (
                  <li key={axis}>{axis}</li>
                ))}
              </ul>
            </article>
            <article className={styles.engineProfileCard}>
              <span>Scene Constraints</span>
              <ul>
                {engineProfile.sceneConstraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </article>
            <article className={styles.engineProfileCard}>
              <span>Active Rule</span>
              <p>
                {engineProfile.activeContaminationRule ||
                  "Fără regulă de contaminare activă. Sistemul rulează pe câmpul live de bază."}
              </p>
            </article>
            <article className={styles.engineProfileCard}>
              <span>MindSlice Clock</span>
              <ul>
                <li>display: {clockDisplay ? `${clockDisplay.hours}:${clockDisplay.minutes}:${clockDisplay.seconds}` : "fail"}</li>
                <li>format: {clockDisplay?.format ?? "none"}</li>
                <li>stil: {clockDisplay?.visualStyle ?? "none"}</li>
                <li>ancoră: {clockDisplay?.attentionAnchor ?? "none"}</li>
                <li>tranziție: {clockDisplay?.transition ?? "none"}</li>
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      <section className={styles.alphaDebugPanel}>
        <span className={styles.panelMarker}>PANEL · Alpha Debug</span>
        <div className={styles.alphaDebugHeading}>
          <p className={styles.eyebrow}>Alpha Debug Panel</p>
          <h2>Semnalele interne ale feliei curente</h2>
          <p>
            Panoul acesta este strict pentru faza alpha: ne arată dacă motorul produce
            densitate, fractură, deriva și convergență într-un mod recognoscibil și coerent
            cu conceptul.
          </p>
        </div>
        <div className={styles.alphaDebugGrid}>
          <article>
            <span>Slice index</span>
            <strong>
              {currentIndex + 1} / {libraryLength}
            </strong>
          </article>
          <article>
            <span>Visual mode</span>
            <strong>{current.visual.mode}</strong>
          </article>
          <article>
            <span>Live influence</span>
            <strong>{liveInfluenceMode ?? "none"}</strong>
          </article>
          <article>
            <span>System memory</span>
            <strong>{systemState.modifiesSystem ? "concept-modified" : "base runtime"}</strong>
          </article>
          <article>
            <span>Density</span>
            <strong>{current.visual.density.toFixed(2)}</strong>
          </article>
          <article>
            <span>Wave</span>
            <strong>{current.visual.wave.toFixed(2)}</strong>
          </article>
          <article>
            <span>Fracture</span>
            <strong>{current.visual.fracture.toFixed(2)}</strong>
          </article>
          <article>
            <span>Drift</span>
            <strong>{current.visual.drift.toFixed(2)}</strong>
          </article>
          <article>
            <span>Convergence</span>
            <strong>{current.visual.convergence.toFixed(2)}</strong>
          </article>
          <article>
            <span>Motion</span>
            <strong>{current.motion}</strong>
          </article>
          <article>
            <span>Clock readability</span>
            <strong>{clockDisplay ? clockDisplay.runtime.scores.readability.toFixed(2) : "0.00"}</strong>
          </article>
        </div>
        <div className={styles.alphaDebugColumns}>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice Clock Runtime</span>
            <ul>
              <li>contaminare: {clockDisplay?.runtime.contaminationMode ?? "none"}</li>
              <li>acceptată: {clockDisplay?.runtime.acceptedContamination ? "da" : "nu"}</li>
              <li>iterații: {clockDisplay?.runtime.iterationCount ?? 0}</li>
              <li>format: {clockDisplay?.format ?? "none"}</li>
              <li>stil: {clockDisplay?.visualStyle ?? "none"}</li>
              <li>ancoră: {clockDisplay?.attentionAnchor ?? "none"}</li>
              <li>tranziție: {clockDisplay?.transition ?? "none"}</li>
              <li>clock valid: {clockDisplay?.runtime.isValidClockState ? "da" : "nu"}</li>
              <li>trece legea: {clockDisplay?.runtime.lawPassed ? "da" : "nu"}</li>
              <li>τr: {clockDisplay ? clockDisplay.runtime.thresholds.readability.toFixed(2) : "0.00"}</li>
              <li>τa: {clockDisplay ? clockDisplay.runtime.thresholds.attention.toFixed(2) : "0.00"}</li>
              <li>τs: {clockDisplay ? clockDisplay.runtime.thresholds.stability.toFixed(2) : "0.00"}</li>
              <li>τp: {clockDisplay ? clockDisplay.runtime.thresholds.perception.toFixed(2) : "0.00"}</li>
              <li>readability: {clockDisplay ? clockDisplay.runtime.scores.readability.toFixed(2) : "0.00"}</li>
              <li>attention: {clockDisplay ? clockDisplay.runtime.scores.attention.toFixed(2) : "0.00"}</li>
              <li>stability: {clockDisplay ? clockDisplay.runtime.scores.stability.toFixed(2) : "0.00"}</li>
              <li>perception: {clockDisplay ? clockDisplay.runtime.scores.perception.toFixed(2) : "0.00"}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Motorul scenei mentale</span>
            <ul>
              <li>
                starea câmpului:{" "}
                {thoughtScene.world.contamination.active ? "contaminat" : "câmp de bază"}
              </li>
              <li>graf de scenă: {thoughtScene.sceneGraph.entityCount} entități active</li>
              <li>sisteme: compoziție / atenție / tipografie / animație</li>
              <li>timeline: {Math.round(thoughtScene.timeline.cycleDuration / 1000)}s per ciclu</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Evaluarea gândului vizual</span>
            <ul>
              <li>sense: {current.triad.art.score.toFixed(2)} · {current.triad.art.label}</li>
              <li>organizare internă: {current.triad.design.score.toFixed(2)} · {current.triad.design.label}</li>
              <li>focalizare conceptuală: {current.triad.business.score.toFixed(2)} · {current.triad.business.label}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Palette & Materials</span>
            <ul>
              {current.palette.map((tone: string) => (
                <li key={`palette-${tone}`}>{tone}</li>
              ))}
              {current.materials.map((material: string) => (
                <li key={`material-${material}`}>{material}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Keywords</span>
            <ul>
              {current.keywords.map((keyword: string) => (
                <li key={keyword}>{keyword}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Modificarea sistemului</span>
            <ul>
              <li>modifică sistemul: {systemState.modifiesSystem ? "da" : "nu"}</li>
              <li>concept sursă: {systemState.sourceConceptTitle ?? "niciunul"}</li>
              <li>stadiu sursă: {systemState.sourceStage ?? "niciunul"}</li>
              <li>influență preferată: {systemState.preferredInfluenceMode ?? "niciuna"}</li>
              <li>bias de probabilitate: {systemState.probabilityBias.toFixed(2)}</li>
              <li>deplasare a focalizării: {systemState.attentionShift.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Probabilități de sistem</span>
            <ul>
              <li>reutilizare de concept: {systemState.probabilities.conceptReuseWeight.toFixed(2)}</li>
              <li>prioritate semantică: {systemState.probabilities.semanticPriority.toFixed(2)}</li>
              <li>bias de convergență: {systemState.probabilities.convergenceBias.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Tipar de contaminare</span>
            <ul>
              <li>mod preferat: {systemState.contaminationPattern.preferredMode ?? "niciunul"}</li>
              <li>resistance: {systemState.contaminationPattern.resistanceWeight.toFixed(2)}</li>
              <li>recurrence: {systemState.contaminationPattern.recurrenceWeight.toFixed(2)}</li>
              <li>
                acceptă interferență externă: {systemState.contaminationPattern.acceptsExternalInterference ? "da" : "nu"}
              </li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Distribuția focalizării</span>
            <ul>
              <li>ancoră: {systemState.attentionDistribution.anchorWeight.toFixed(2)}</li>
              <li>periferie: {systemState.attentionDistribution.peripheralWeight.toFixed(2)}</li>
              <li>câmp de memorie: {systemState.attentionDistribution.memoryFieldWeight.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Main Loop</span>
            <ul>
              <li>mărime IDEA_SET: {ideaSetMainLoop.totalIdeas}</li>
              <li>index idee activă: {ideaSetMainLoop.activeIdeaIndex + 1}</li>
              <li>idei rezolvate: {ideaSetMainLoop.resolvedCount}</li>
              <li>idei în iterație: {ideaSetMainLoop.iteratingCount}</li>
              <li>idei terminate: {ideaSetMainLoop.terminatedCount}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Pâlnia debuggerului</span>
            <ul>
              <li>total: {engineDebuggerReport.funnel.total}</li>
              <li>în iterație: {engineDebuggerReport.funnel.iterating}</li>
              <li>rezolvate: {engineDebuggerReport.funnel.resolved}</li>
              <li>în pool: {engineDebuggerReport.funnel.pooled}</li>
              <li>stocate: {engineDebuggerReport.funnel.stored}</li>
              <li>canonice: {engineDebuggerReport.funnel.canonical}</li>
              <li>care schimbă sistemul: {engineDebuggerReport.funnel.systemChanging}</li>
              <li>rulări debug stocate: {debugRunCount}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Process Idea</span>
            <ul>
              <li>stare: {conceptProcess.status}</li>
              <li>acțiune următoare: {conceptProcess.nextAction}</li>
              <li>iterații: {conceptProcess.iterationCount}</li>
              <li>presiune de memorie: {conceptProcess.interpretation.memoryPressure.toFixed(2)}</li>
              <li>
                presiune de contaminare: {conceptProcess.interpretation.contaminationPressure.toFixed(2)}
              </li>
              <li>
                contaminare: {conceptProcess.contamination.requestedMode} {"->"}{" "}
                {conceptProcess.contamination.appliedMode}
              </li>
              <li>acceptată: {conceptProcess.contamination.accepted ? "da" : "nu"}</li>
              <li>focalizare a iterației: {conceptProcess.iteration.iterationFocus}</li>
              <li>greutate a iterației: {conceptProcess.iteration.nextIterationWeight.toFixed(2)}</li>
              <li>terminare: {conceptProcess.terminationReason}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Formarea conceptului</span>
            <ul>
              <li>stadiu: {conceptCandidate.stage}</li>
              <li>semantic: {conceptCandidate.coherenceSignals.semantic.toFixed(2)}</li>
              <li>vizual: {conceptCandidate.coherenceSignals.visual.toFixed(2)}</li>
              <li>cross-modal: {conceptCandidate.coherenceSignals.crossModal.toFixed(2)}</li>
              <li>axa de organizare internă: {conceptCandidate.evaluationAxes.structure.toFixed(2)}</li>
              <li>axa de sens: {conceptCandidate.evaluationAxes.sense.toFixed(2)}</li>
              <li>axa de focalizare conceptuală: {conceptCandidate.evaluationAxes.attention.toFixed(2)}</li>
              <li>axa de coerență: {conceptCandidate.evaluationAxes.coherence.toFixed(2)}</li>
              <li>teză: {conceptCandidate.thesisDraft}</li>
              <li>identitate vizuală: {conceptCandidate.visualIdentityDraft}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Validarea conceptului</span>
            <ul>
              <li>valid: {conceptValidation.isValidConcept ? "da" : "nu"}</li>
              <li>stare: {conceptValidation.resolutionStatus}</li>
              <li>τs organizare internă: {conceptValidation.thresholds.structure.toFixed(2)}</li>
              <li>τm sens: {conceptValidation.thresholds.sense.toFixed(2)}</li>
              <li>τa focalizare conceptuală: {conceptValidation.thresholds.attention.toFixed(2)}</li>
              <li>τc coerență: {conceptValidation.thresholds.coherence.toFixed(2)}</li>
              <li>
                stabilitate semantică: {conceptValidation.scores.semanticStability.toFixed(2)}
              </li>
              <li>
                consistență vizuală: {conceptValidation.scores.visualConsistency.toFixed(2)}
              </li>
              <li>
                cross-modal: {conceptValidation.scores.crossModalAlignment.toFixed(2)}
              </li>
              <li>
                metabolizare contaminare: {conceptValidation.scores.contaminationResolution.toFixed(2)}
              </li>
              <li>
                rezolvarea dilemei: {conceptValidation.scores.authorDilemmaResolution.toFixed(2)}
              </li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice ColorTheory Runtime</span>
            <ul>
              <li>contaminare: {engineDebuggerReport.colorTheory.contaminationMode}</li>
              <li>acceptată: {engineDebuggerReport.colorTheory.acceptedContamination ? "da" : "nu"}</li>
              <li>iterații: {engineDebuggerReport.colorTheory.iterationCount}</li>
              <li>terminat: {engineDebuggerReport.colorTheory.terminated ? "da" : "nu"}</li>
              <li>motiv: {engineDebuggerReport.colorTheory.terminationReason}</li>
              <li>paletă validă: {engineDebuggerReport.colorTheory.isValidPalette ? "da" : "nu"}</li>
              <li>trece legea: {engineDebuggerReport.colorTheory.lawPassed ? "da" : "nu"}</li>
              <li>τh: {engineDebuggerReport.colorTheory.thresholds.hueStructure.toFixed(2)}</li>
              <li>τv: {engineDebuggerReport.colorTheory.thresholds.valueBalance.toFixed(2)}</li>
              <li>τs: {engineDebuggerReport.colorTheory.thresholds.saturationControl.toFixed(2)}</li>
              <li>τr: {engineDebuggerReport.colorTheory.thresholds.colorRelations.toFixed(2)}</li>
              <li>τa: {engineDebuggerReport.colorTheory.thresholds.attentionImpact.toFixed(2)}</li>
              <li>hue: {engineDebuggerReport.colorTheory.scores.hueStructure.toFixed(2)}</li>
              <li>value: {engineDebuggerReport.colorTheory.scores.valueBalance.toFixed(2)}</li>
              <li>saturation: {engineDebuggerReport.colorTheory.scores.saturationControl.toFixed(2)}</li>
              <li>relations: {engineDebuggerReport.colorTheory.scores.colorRelations.toFixed(2)}</li>
              <li>attention: {engineDebuggerReport.colorTheory.scores.attentionImpact.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice Scenario Runtime</span>
            <ul>
              <li>contaminare: {engineDebuggerReport.scenario.contaminationMode}</li>
              <li>acceptată: {engineDebuggerReport.scenario.acceptedContamination ? "da" : "nu"}</li>
              <li>iterații: {engineDebuggerReport.scenario.iterationCount}</li>
              <li>terminat: {engineDebuggerReport.scenario.terminated ? "da" : "nu"}</li>
              <li>motiv: {engineDebuggerReport.scenario.terminationReason}</li>
              <li>scenariu valid: {engineDebuggerReport.scenario.isValidScenario ? "da" : "nu"}</li>
              <li>trece legea: {engineDebuggerReport.scenario.lawPassed ? "da" : "nu"}</li>
              <li>τc: {engineDebuggerReport.scenario.thresholds.conflict.toFixed(2)}</li>
              <li>τt: {engineDebuggerReport.scenario.thresholds.tension.toFixed(2)}</li>
              <li>τp: {engineDebuggerReport.scenario.thresholds.progression.toFixed(2)}</li>
              <li>τm: {engineDebuggerReport.scenario.thresholds.meaning.toFixed(2)}</li>
              <li>τa: {engineDebuggerReport.scenario.thresholds.attention.toFixed(2)}</li>
              <li>conflict: {engineDebuggerReport.scenario.scores.conflict.toFixed(2)}</li>
              <li>tension: {engineDebuggerReport.scenario.scores.tension.toFixed(2)}</li>
              <li>progression: {engineDebuggerReport.scenario.scores.progression.toFixed(2)}</li>
              <li>meaning: {engineDebuggerReport.scenario.scores.meaning.toFixed(2)}</li>
              <li>attention: {engineDebuggerReport.scenario.scores.attention.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice ArtComposition Runtime</span>
            <ul>
              <li>contaminare: {engineDebuggerReport.artComposition.contaminationMode}</li>
              <li>acceptată: {engineDebuggerReport.artComposition.acceptedContamination ? "da" : "nu"}</li>
              <li>iterații: {engineDebuggerReport.artComposition.iterationCount}</li>
              <li>terminat: {engineDebuggerReport.artComposition.terminated ? "da" : "nu"}</li>
              <li>motiv: {engineDebuggerReport.artComposition.terminationReason}</li>
              <li>compoziție validă: {engineDebuggerReport.artComposition.isValidComposition ? "da" : "nu"}</li>
              <li>trece legea: {engineDebuggerReport.artComposition.lawPassed ? "da" : "nu"}</li>
              <li>focus node: {engineDebuggerReport.artComposition.focusNode}</li>
              <li>τu: {engineDebuggerReport.artComposition.thresholds.unity.toFixed(2)}</li>
              <li>τb: {engineDebuggerReport.artComposition.thresholds.balance.toFixed(2)}</li>
              <li>τr: {engineDebuggerReport.artComposition.thresholds.rhythm.toFixed(2)}</li>
              <li>τm: {engineDebuggerReport.artComposition.thresholds.movement.toFixed(2)}</li>
              <li>τc: {engineDebuggerReport.artComposition.thresholds.contrast.toFixed(2)}</li>
              <li>τp: {engineDebuggerReport.artComposition.thresholds.proportion.toFixed(2)}</li>
              <li>τf: {engineDebuggerReport.artComposition.thresholds.focus.toFixed(2)}</li>
              <li>unity: {engineDebuggerReport.artComposition.scores.unity.toFixed(2)}</li>
              <li>balance: {engineDebuggerReport.artComposition.scores.balance.toFixed(2)}</li>
              <li>rhythm: {engineDebuggerReport.artComposition.scores.rhythm.toFixed(2)}</li>
              <li>movement: {engineDebuggerReport.artComposition.scores.movement.toFixed(2)}</li>
              <li>contrast: {engineDebuggerReport.artComposition.scores.contrast.toFixed(2)}</li>
              <li>proportion: {engineDebuggerReport.artComposition.scores.proportion.toFixed(2)}</li>
              <li>focus: {engineDebuggerReport.artComposition.scores.focus.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Concept Pool</span>
            <ul>
              <li>concepte în pool: {conceptPoolCount}</li>
              <li>ultimul concept din pool: {latestPoolConceptTitle ?? "niciunul"}</li>
              <li>rolul pool-ului: zonă de trecere înainte de persistența în memorie</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Color Pool</span>
            <ul>
              <li>palete în pool: {colorPoolCount}</li>
              <li>ultima paletă: {latestColorPoolTitle ?? "niciuna"}</li>
              <li>rolul pool-ului: zonă de filtrare cromatică înainte de memorie</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Scenario Pool</span>
            <ul>
              <li>scenarii în pool: {scenarioPoolCount}</li>
              <li>ultimul scenariu: {latestScenarioPoolTitle ?? "niciunul"}</li>
              <li>rolul pool-ului: zonă de filtrare narativă înainte de memorie</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Art Composition Pool</span>
            <ul>
              <li>compoziții în pool: {artCompositionPoolCount}</li>
              <li>ultima compoziție: {latestArtCompositionPoolTitle ?? "niciuna"}</li>
              <li>rolul pool-ului: zonă de filtrare compozițională înainte de memorie</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Canon</span>
            <ul>
              <li>concepte canonice: {canonCount}</li>
              <li>canon principal: {primaryCanonTitle ?? "niciunul"}</li>
              <li>rolul canonului: doctrină activă pentru modificarea sistemului</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Color Canon</span>
            <ul>
              <li>palete canonice: {colorCanonCount}</li>
              <li>canon cromatic principal: {primaryColorCanonTitle ?? "niciunul"}</li>
              <li>rolul canonului: doctrină cromatică activă pentru percepție</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Narrative Canon</span>
            <ul>
              <li>scenarii canonice: {narrativeCanonCount}</li>
              <li>canon narativ principal: {primaryNarrativeCanonTitle ?? "niciunul"}</li>
              <li>rolul canonului: doctrină narativă activă pentru structură</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Art Canon</span>
            <ul>
              <li>compoziții canonice: {artCanonCount}</li>
              <li>canon compozițional principal: {primaryArtCanonTitle ?? "niciuna"}</li>
              <li>rolul canonului: doctrină compozițională activă pentru percepție</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria conceptelor</span>
            <ul>
              <li>concepte stocate: {conceptMemoryCount}</li>
              <li>concepte rezolvate: {resolvedConceptCount}</li>
              <li>ultimul concept: {latestConceptTitle ?? "niciunul"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria culorilor</span>
            <ul>
              <li>palete stocate: {colorMemoryCount}</li>
              <li>palete rezolvate: {resolvedColorCount}</li>
              <li>ultima paletă: {latestColorTitle ?? "niciuna"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria scenariilor</span>
            <ul>
              <li>scenarii stocate: {storyMemoryCount}</li>
              <li>scenarii rezolvate: {resolvedScenarioCount}</li>
              <li>ultimul scenariu: {latestScenarioTitle ?? "niciunul"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria compozițiilor</span>
            <ul>
              <li>compoziții stocate: {artMemoryCount}</li>
              <li>compoziții rezolvate: {resolvedArtCount}</li>
              <li>ultima compoziție: {latestArtTitle ?? "niciuna"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Clock Memory</span>
            <ul>
              <li>display-uri stocate: {clockMemoryCount}</li>
              <li>ultimul display: {latestClockTime ?? "niciunul"}</li>
              <li>output: {clockDisplay?.outputVisual ?? "niciun output activ"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Promovarea conceptului</span>
            <ul>
              <li>stadiul curent promovat: {promotionStatus}</li>
              <li>pregătit pentru canon: {canPromoteToCanonical ? "da" : "nu"}</li>
              {promotionNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        </div>
        <div className={styles.alphaDebugColumns}>
          <article className={styles.alphaDebugCard}>
            <span>Note de proces</span>
            <ul>
              {conceptProcess.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Note de sistem</span>
            <ul>
              {systemState.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Note de validare</span>
            <ul>
              {conceptValidation.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Color Theory Notes</span>
            <ul>
              <li>{engineDebuggerReport.colorTheory.interpretation}</li>
              <li>{engineDebuggerReport.colorTheory.outputText}</li>
              <li>{engineDebuggerReport.colorTheory.outputVisual}</li>
              <li>{engineDebuggerReport.colorTheory.lawNote}</li>
              {engineDebuggerReport.colorTheory.systemStateUpdate ? (
                <>
                  <li>
                    probability update: reuse {engineDebuggerReport.colorTheory.systemStateUpdate.probabilities.conceptReuseWeight.toFixed(2)} / semantic {engineDebuggerReport.colorTheory.systemStateUpdate.probabilities.semanticPriority.toFixed(2)} / convergence {engineDebuggerReport.colorTheory.systemStateUpdate.probabilities.convergenceBias.toFixed(2)}
                  </li>
                  <li>
                    hierarchy update: anchor {engineDebuggerReport.colorTheory.systemStateUpdate.hierarchyRules.anchorWeight.toFixed(2)} / periphery {engineDebuggerReport.colorTheory.systemStateUpdate.hierarchyRules.peripheralWeight.toFixed(2)} / bias {engineDebuggerReport.colorTheory.systemStateUpdate.hierarchyRules.hierarchyBias.toFixed(2)}
                  </li>
                  <li>
                    attention update: focus {engineDebuggerReport.colorTheory.systemStateUpdate.attentionBehavior.focusWeight.toFixed(2)} / memory {engineDebuggerReport.colorTheory.systemStateUpdate.attentionBehavior.memoryFieldWeight.toFixed(2)} / contamination {engineDebuggerReport.colorTheory.systemStateUpdate.attentionBehavior.contaminationLift.toFixed(2)}
                  </li>
                </>
              ) : null}
              {engineDebuggerReport.colorTheory.notes.slice(0, 6).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Scenario Notes</span>
            <ul>
              <li>{engineDebuggerReport.scenario.interpretation}</li>
              <li>{engineDebuggerReport.scenario.outputText}</li>
              <li>{engineDebuggerReport.scenario.outputStructure}</li>
              <li>{engineDebuggerReport.scenario.lawNote}</li>
              {engineDebuggerReport.scenario.systemStateUpdate ? (
                <>
                  <li>
                    conflict update: escalation {engineDebuggerReport.scenario.systemStateUpdate.conflictPatterns.escalationWeight.toFixed(2)}
                  </li>
                  <li>
                    tension update: suspense {engineDebuggerReport.scenario.systemStateUpdate.tensionBehavior.suspenseWeight.toFixed(2)} / retention {engineDebuggerReport.scenario.systemStateUpdate.tensionBehavior.retentionWeight.toFixed(2)}
                  </li>
                  <li>
                    story update: irreversibility {engineDebuggerReport.scenario.systemStateUpdate.storyProbabilities.irreversibilityBias.toFixed(2)} / symbolic {engineDebuggerReport.scenario.systemStateUpdate.storyProbabilities.symbolicDepth.toFixed(2)} / sequence {engineDebuggerReport.scenario.systemStateUpdate.storyProbabilities.sequenceBias.toFixed(2)}
                  </li>
                </>
              ) : null}
              {engineDebuggerReport.scenario.notes.slice(0, 6).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Art Composition Notes</span>
            <ul>
              <li>{engineDebuggerReport.artComposition.interpretation}</li>
              <li>{engineDebuggerReport.artComposition.outputText}</li>
              <li>{engineDebuggerReport.artComposition.outputVisual}</li>
              <li>{engineDebuggerReport.artComposition.lawNote}</li>
              {engineDebuggerReport.artComposition.systemStateUpdate ? (
                <>
                  <li>
                    unity update: cohesion {engineDebuggerReport.artComposition.systemStateUpdate.unityPatterns.cohesionWeight.toFixed(2)}
                  </li>
                  <li>
                    balance update: redistribution {engineDebuggerReport.artComposition.systemStateUpdate.balanceLogic.redistributionWeight.toFixed(2)}
                  </li>
                  <li>
                    attention update: focus {engineDebuggerReport.artComposition.systemStateUpdate.attentionBehavior.focusWeight.toFixed(2)} / path {engineDebuggerReport.artComposition.systemStateUpdate.attentionBehavior.pathWeight.toFixed(2)}
                  </li>
                  <li>
                    proportion update: hierarchy {engineDebuggerReport.artComposition.systemStateUpdate.proportionRules.hierarchyWeight.toFixed(2)}
                  </li>
                </>
              ) : null}
              {engineDebuggerReport.artComposition.notes.slice(0, 6).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Analiza eșecului</span>
            <ul>
              <li>{engineDebuggerReport.failureAnalysis.currentBlocker}</li>
              <li>{engineDebuggerReport.failureAnalysis.topFailurePattern}</li>
              <li>următoarea promovare probabilă: {engineDebuggerReport.failureAnalysis.nextLikelyPromotion}</li>
              <li>{engineDebuggerReport.failureAnalysis.systemPressureSummary}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Rulări comparative</span>
            <ul>
              {comparativeDelta ? (
                <>
                  <li>delta rezolvate: {comparativeDelta.resolvedDelta}</li>
                  <li>delta pool: {comparativeDelta.pooledDelta}</li>
                  <li>delta canonice: {comparativeDelta.canonicalDelta}</li>
                </>
              ) : (
                <li>Nu există încă o rulare anterioară persistată.</li>
              )}
              {engineDebuggerReport.comparativeRuns.slice(0, 4).map((run) => (
                <li key={run.ideaDirection}>
                  {run.ideaDirection}: {run.status} / forță {run.validationStrength.toFixed(2)} / blocaj {run.blocker}
                </li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Note Main Loop</span>
            <ul>
              {ideaSetMainLoop.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Trasare automată</span>
            <div className={styles.modeTabs}>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTracePhase === "all" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTracePhase("all")}
              >
                Toate fazele
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTracePhase === "validation" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTracePhase("validation")}
              >
                Validation
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTracePhase === "promotion" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTracePhase("promotion")}
              >
                Promotion
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTracePhase === "system" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTracePhase("system")}
              >
                System
              </button>
            </div>
            <div className={styles.modeTabs}>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTraceLevel === "all" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTraceLevel("all")}
              >
                Toate nivelele
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTraceLevel === "success" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTraceLevel("success")}
              >
                Success
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTraceLevel === "warning" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTraceLevel("warning")}
              >
                Warning
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTraceLevel === "info" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTraceLevel("info")}
              >
                Info
              </button>
            </div>
            <ul>
              <li>
                filtered events: {filteredActiveTrace.length} / {engineDebuggerReport.activeTrace.length}
              </li>
              {filteredActiveTrace.slice(0, 8).map((event) => (
                <li key={event.id}>
                  <strong>{event.phase}</strong> [{event.level}]: {event.summary} · {event.detail}
                </li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Timeline</span>
            <ul>
              {engineDebuggerReport.timeline.slice(0, 8).map((point) => (
                <li key={`${point.sequence}:${point.label}`}>
                  #{point.sequence} · {point.status} · {point.ideaDirection ?? "global"} · {point.label}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <div className={styles.canvasCard}>
        <span className={styles.panelMarker}>PANEL · Slice Canvas</span>
        <div className={styles.visualStage}>
          <div className={`${styles.textStage} ${liveInfluenceMode ? styles[`textStage${liveInfluenceMode}`] : ""}`}>
            <div
              className={`${styles.compositionGuide} ${
                liveInfluenceMode ? styles[`compositionGuide${liveInfluenceMode}`] : ""
              }`}
              aria-hidden="true"
            >
              <span className={styles.layerMarker}>LAYER · Composition Guide</span>
              <span className={`${styles.thirdLine} ${styles.thirdVerticalOne}`} />
              <span className={`${styles.thirdLine} ${styles.thirdVerticalTwo}`} />
              <span className={`${styles.thirdLine} ${styles.thirdHorizontalOne}`} />
              <span className={`${styles.thirdLine} ${styles.thirdHorizontalTwo}`} />
              <span className={`${styles.guideLine} ${styles.leadingLineOne}`} style={leadingLineStyles[0]} />
              <span className={`${styles.guideLine} ${styles.leadingLineTwo}`} style={leadingLineStyles[1]} />
              <span className={`${styles.guideLine} ${styles.leadingLineThree}`} style={leadingLineStyles[2]} />
              <span className={`${styles.focalHalo} ${styles.focalHaloPrimary}`} style={focalHaloStyles.primary}>
                <span className={styles.focalHaloNumber}>1</span>
              </span>
              <span className={`${styles.focalHalo} ${styles.focalHaloSecondary}`} style={focalHaloStyles.secondary}>
                <span className={styles.focalHaloNumber}>2</span>
              </span>
              <span className={`${styles.spaceFrame} ${styles.negativeSpaceOne}`} style={negativeSpaceStyles.primary} />
              <span className={`${styles.spaceFrame} ${styles.negativeSpaceTwo}`} style={negativeSpaceStyles.secondary} />
              <span className={styles.guideLabelPrimary}>focus</span>
              <span className={styles.guideLabelSecondary}>thirds</span>
            </div>
            <div className={styles.compositionRules} aria-hidden="true">
              <span className={styles.compositionRulesTitle}>composition rules</span>
              <ul>
                <li>rule of thirds</li>
                <li>focal hierarchy</li>
                <li>leading lines</li>
                <li>negative space</li>
              </ul>
            </div>
            {clockDisplay ? (
              <div
                className={`${styles.clockField} ${liveInfluenceMode ? styles[`clockField${liveInfluenceMode}`] : ""}`}
                style={
                  {
                    "--clock-accent": current.visual.accent,
                    "--clock-ink": current.visual.ink,
                    "--clock-background": current.visual.background,
                  } as React.CSSProperties
                }
              >
                <span className={styles.layerMarker}>LAYER · Time Field</span>
                <span className={styles.clockMeta}>
                  {clockDisplay.format} · {clockDisplay.visualStyle}
                </span>
                <div className={styles.clockDigits} aria-label="MindSlice Clock display">
                  <span className={styles.clockHours}>{clockDisplay.hours}</span>
                  <span className={styles.clockSeparator}>:</span>
                  <span className={styles.clockMinutes}>{clockDisplay.minutes}</span>
                  <span className={styles.clockSeparator}>:</span>
                  <span className={styles.clockSeconds}>{clockDisplay.seconds}</span>
                </div>
                <div className={styles.clockEcho} aria-hidden="true">
                  <span>{clockDisplay.hours}</span>
                  <span>{clockDisplay.minutes}</span>
                  <span>{clockDisplay.seconds}</span>
                </div>
                <div className={styles.clockSignalRow}>
                  <span>anchor · {clockDisplay.attentionAnchor}</span>
                  <span>transition · {clockDisplay.transition}</span>
                </div>
              </div>
            ) : null}
            <div className={`${styles.relationField} ${liveInfluenceMode ? styles[`relationField${liveInfluenceMode}`] : ""}`} aria-hidden="true">
              <span className={styles.layerMarker}>LAYER · Relation Field</span>
              <span className={`${styles.axisLine} ${styles.axisPrimary}`} />
              <span className={`${styles.axisLine} ${styles.axisSecondary}`} />
              <span className={`${styles.axisLine} ${styles.axisDiagonal}`} />
              <span className={`${styles.relationLine} ${styles.relationLineOne}`} />
              <span className={`${styles.relationLine} ${styles.relationLineTwo}`} />
              <span className={`${styles.relationLine} ${styles.relationLineThree}`} />
              <span className={`${styles.relationNode} ${styles.relationNodeOne}`} />
              <span className={`${styles.relationNode} ${styles.relationNodeTwo}`} />
              <span className={`${styles.relationNode} ${styles.relationNodeThree}`} />
              <span className={`${styles.relationNode} ${styles.relationNodeFour}`} />
              <span className={`${styles.relationNode} ${styles.relationNodeCenter}`} />
            </div>
            <div className={styles.textFieldBackdrop} />
            <div className={`${styles.memoryField} ${liveInfluenceMode ? styles[`memoryField${liveInfluenceMode}`] : ""}`} aria-hidden="true">
              <span className={styles.layerMarker}>LAYER · Memory Field</span>
              {current.fragments.slice(0, 4).map((fragment, index) => (
                <span
                  key={`${current.direction}-memory-fragment-${fragment}`}
                  className={`${styles.memoryFragment} ${styles[`memoryFragment${index + 1}`]}`}
                >
                  {fragment}
                </span>
              ))}
              {current.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={`${current.direction}-memory-keyword-${keyword}`}
                  className={`${styles.memoryTrace} ${styles[`memoryTrace${index + 1}`]}`}
                >
                  {keyword}
                </span>
              ))}
            </div>
            <div className={styles.textConstellation} aria-hidden="true">
              <span className={styles.layerMarker}>LAYER · Text Constellation</span>
              {current.fragments.map((fragment, index) => (
                <span
                  key={`${current.direction}-fragment-${fragment}`}
                  className={`${styles.floatingFragment} ${styles[`fragment${index + 1}`]} ${
                    liveInfluenceMode ? styles[`floatingFragment${liveInfluenceMode}`] : ""
                  }`}
                >
                  {fragment}
                </span>
              ))}
              {current.keywords.slice(0, 6).map((keyword, index) => (
                <span
                  key={`${current.direction}-keyword-${keyword}`}
                  className={`${styles.keywordParticle} ${styles[`keyword${index + 1}`]} ${
                    liveInfluenceMode ? styles[`keywordParticle${liveInfluenceMode}`] : ""
                  }`}
                >
                  {keyword}
                </span>
              ))}
            </div>
            <div
              className={`${styles.textStageCenter} ${liveInfluenceMode ? styles[`textStageCenter${liveInfluenceMode}`] : ""}`}
              style={thoughtCenterAnchor}
            >
              <span className={styles.centerLayerMarker}>LAYER · Thought Center</span>
              <span className={styles.overlayLabel}>Din fișierul Slices</span>
              <strong>{current.direction}</strong>
              <p>{thoughtCenterFragment}</p>
            </div>
          </div>
        </div>
        <div className={styles.cornerSignature}>
          <strong>O felie de gândire</strong>
          <span>Marc, Ciprian-Marcel</span>
        </div>
        <div className={`${styles.thoughtOverlay} ${interference ? styles.thoughtOverlayInterference : ""}`}>
          {isThoughtOverlayVisible ? (
            <>
              <div className={styles.thoughtOverlayLabelPlate}>
                <span className={styles.overlayLabel}>Acum mă gândesc la</span>
              </div>
              <div key={thoughtAnimationKey} className={styles.thoughtOverlayTextStack}>
                {thoughtLines.map((line, index) => (
                  <div key={`${thoughtAnimationKey}-${index}-${line}`} className={styles.thoughtOverlayTextPlate}>
                    <p className={styles.typewriterText}>
                      {line}
                      {index === thoughtLines.length - 1 ? (
                        <span className={styles.typewriterCaret} aria-hidden="true" />
                      ) : null}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
        {liveAiResponseLines.length ? (
          <div className={styles.liveAiResponseOverlay}>
            <span className={styles.liveAiResponseLabel}>Artist AI răspunde</span>
            <div className={styles.liveAiResponseStack}>
              {liveAiResponseLines.map((line, index) => (
                <p key={`${interference?.sourceId}-ai-response-${index}-${line}`}>{line}</p>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {interference ? (
        <section className={styles.interferencePanel}>
          <span className={styles.panelMarker}>PANEL · Live Interference</span>
          <div className={styles.interferenceHeading}>
            <p className={styles.eyebrow}>Interferență activă</p>
            <h2>Jurnalul perturbă Artistul AI</h2>
            <p>{interference.note}</p>
          </div>
          <div className={styles.interferenceGrid}>
            <article>
              <span>Contaminat de</span>
              <strong>{interference.title}</strong>
            </article>
            <article>
              <span>Sub pseudonim</span>
              <strong>{formatPublicAuthor(interference.authorPseudonym)}</strong>
              {interference.authorUserId && profile?.user_id !== interference.authorUserId ? (
                <button
                  type="button"
                  className={styles.followButton}
                  onClick={() =>
                    handleFollowToggle(
                      interference.authorUserId!,
                      !followedUserIds.includes(interference.authorUserId!),
                    )
                  }
                  disabled={followActionUserId === interference.authorUserId}
                >
                  {followActionUserId === interference.authorUserId
                    ? "..."
                    : followedUserIds.includes(interference.authorUserId)
                      ? "Unfollow"
                      : "Follow"}
                </button>
              ) : null}
            </article>
            <article>
              <span>Mod</span>
              <strong>{interference.influenceMode}</strong>
            </article>
            <article>
              <span>Sens</span>
              <strong>{interference.senseWeight.toFixed(2)}</strong>
            </article>
            <article>
              <span>Organizare internă</span>
              <strong>{interference.structureWeight.toFixed(2)}</strong>
            </article>
            <article>
              <span>Focalizare conceptuală</span>
              <strong>{interference.attentionWeight.toFixed(2)}</strong>
            </article>
          </div>
          {interference.excerpt ? <p className={styles.interferenceExcerpt}>{interference.excerpt}</p> : null}
          {interference.aiResponseText?.trim() ? (
            <div className={styles.blogAiResponse}>
              <span className={styles.blogAiResponseLabel}>Răspuns Artist AI</span>
              <p>{interference.aiResponseText}</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
