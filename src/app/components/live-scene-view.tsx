"use client";

import type {
  ThoughtSceneEngineState,
} from "@/lib/mindslice/thought-scene-engine";
import type {
  ConceptCandidate,
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
  ideaSetMainLoop: IdeaSetMainLoopResult;
  conceptProcess: ProcessIdeaResult;
  conceptCandidate: ConceptCandidate;
  conceptValidation: ConceptValidationResult;
  conceptPoolCount: number;
  latestPoolConceptTitle: string | null;
  canonCount: number;
  primaryCanonTitle: string | null;
  conceptMemoryCount: number;
  resolvedConceptCount: number;
  latestConceptTitle: string | null;
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
    ideaSetMainLoop,
    conceptProcess,
    conceptCandidate,
    conceptValidation,
    conceptPoolCount,
    latestPoolConceptTitle,
    canonCount,
    primaryCanonTitle,
    conceptMemoryCount,
    resolvedConceptCount,
    latestConceptTitle,
    promotionStatus,
    canPromoteToCanonical,
    promotionNotes,
  } = props;

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
        </div>
        <div className={styles.alphaDebugColumns}>
          <article className={styles.alphaDebugCard}>
            <span>Thought Scene Engine</span>
            <ul>
              <li>
                world state:{" "}
                {thoughtScene.world.contamination.active ? "contaminated" : "base field"}
              </li>
              <li>scene graph: {thoughtScene.sceneGraph.entityCount} active entities</li>
              <li>systems: composition / attention / typography / animation</li>
              <li>timeline: {Math.round(thoughtScene.timeline.cycleDuration / 1000)}s per slice cycle</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Visual Thought Evaluation</span>
            <ul>
              <li>sense: {current.triad.art.score.toFixed(2)} · {current.triad.art.label}</li>
              <li>structure: {current.triad.design.score.toFixed(2)} · {current.triad.design.label}</li>
              <li>attention: {current.triad.business.score.toFixed(2)} · {current.triad.business.label}</li>
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
            <span>System Modification</span>
            <ul>
              <li>modifies system: {systemState.modifiesSystem ? "yes" : "no"}</li>
              <li>source concept: {systemState.sourceConceptTitle ?? "none"}</li>
              <li>source stage: {systemState.sourceStage ?? "none"}</li>
              <li>preferred influence: {systemState.preferredInfluenceMode ?? "none"}</li>
              <li>probability bias: {systemState.probabilityBias.toFixed(2)}</li>
              <li>attention shift: {systemState.attentionShift.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>System Probabilities</span>
            <ul>
              <li>concept reuse: {systemState.probabilities.conceptReuseWeight.toFixed(2)}</li>
              <li>semantic priority: {systemState.probabilities.semanticPriority.toFixed(2)}</li>
              <li>convergence bias: {systemState.probabilities.convergenceBias.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Contamination Pattern</span>
            <ul>
              <li>preferred mode: {systemState.contaminationPattern.preferredMode ?? "none"}</li>
              <li>resistance: {systemState.contaminationPattern.resistanceWeight.toFixed(2)}</li>
              <li>recurrence: {systemState.contaminationPattern.recurrenceWeight.toFixed(2)}</li>
              <li>
                accepts external interference: {systemState.contaminationPattern.acceptsExternalInterference ? "yes" : "no"}
              </li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Attention Distribution</span>
            <ul>
              <li>anchor: {systemState.attentionDistribution.anchorWeight.toFixed(2)}</li>
              <li>peripheral: {systemState.attentionDistribution.peripheralWeight.toFixed(2)}</li>
              <li>memory field: {systemState.attentionDistribution.memoryFieldWeight.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Main Loop</span>
            <ul>
              <li>IDEA_SET size: {ideaSetMainLoop.totalIdeas}</li>
              <li>active idea index: {ideaSetMainLoop.activeIdeaIndex + 1}</li>
              <li>resolved ideas: {ideaSetMainLoop.resolvedCount}</li>
              <li>iterating ideas: {ideaSetMainLoop.iteratingCount}</li>
              <li>terminated ideas: {ideaSetMainLoop.terminatedCount}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Process Idea</span>
            <ul>
              <li>status: {conceptProcess.status}</li>
              <li>next action: {conceptProcess.nextAction}</li>
              <li>iterations: {conceptProcess.iterationCount}</li>
              <li>memory pressure: {conceptProcess.interpretation.memoryPressure.toFixed(2)}</li>
              <li>
                contamination pressure: {conceptProcess.interpretation.contaminationPressure.toFixed(2)}
              </li>
              <li>
                contamination: {conceptProcess.contamination.requestedMode} {"->"}{" "}
                {conceptProcess.contamination.appliedMode}
              </li>
              <li>accepted: {conceptProcess.contamination.accepted ? "yes" : "no"}</li>
              <li>iteration focus: {conceptProcess.iteration.iterationFocus}</li>
              <li>iteration weight: {conceptProcess.iteration.nextIterationWeight.toFixed(2)}</li>
              <li>termination: {conceptProcess.terminationReason}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Concept Formation</span>
            <ul>
              <li>stage: {conceptCandidate.stage}</li>
              <li>semantic: {conceptCandidate.coherenceSignals.semantic.toFixed(2)}</li>
              <li>visual: {conceptCandidate.coherenceSignals.visual.toFixed(2)}</li>
              <li>cross-modal: {conceptCandidate.coherenceSignals.crossModal.toFixed(2)}</li>
              <li>structure axis: {conceptCandidate.evaluationAxes.structure.toFixed(2)}</li>
              <li>sense axis: {conceptCandidate.evaluationAxes.sense.toFixed(2)}</li>
              <li>attention axis: {conceptCandidate.evaluationAxes.attention.toFixed(2)}</li>
              <li>coherence axis: {conceptCandidate.evaluationAxes.coherence.toFixed(2)}</li>
              <li>thesis: {conceptCandidate.thesisDraft}</li>
              <li>visual identity: {conceptCandidate.visualIdentityDraft}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Concept Validation</span>
            <ul>
              <li>valid: {conceptValidation.isValidConcept ? "yes" : "no"}</li>
              <li>status: {conceptValidation.resolutionStatus}</li>
              <li>τs structure: {conceptValidation.thresholds.structure.toFixed(2)}</li>
              <li>τm sense: {conceptValidation.thresholds.sense.toFixed(2)}</li>
              <li>τa attention: {conceptValidation.thresholds.attention.toFixed(2)}</li>
              <li>τc coherence: {conceptValidation.thresholds.coherence.toFixed(2)}</li>
              <li>
                semantic stability: {conceptValidation.scores.semanticStability.toFixed(2)}
              </li>
              <li>
                visual consistency: {conceptValidation.scores.visualConsistency.toFixed(2)}
              </li>
              <li>
                cross-modal: {conceptValidation.scores.crossModalAlignment.toFixed(2)}
              </li>
              <li>
                contamination: {conceptValidation.scores.contaminationResolution.toFixed(2)}
              </li>
              <li>
                dilemma resolution: {conceptValidation.scores.authorDilemmaResolution.toFixed(2)}
              </li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Concept Pool</span>
            <ul>
              <li>pooled concepts: {conceptPoolCount}</li>
              <li>latest pooled concept: {latestPoolConceptTitle ?? "none"}</li>
              <li>pool role: staging area before memory persistence</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Canon</span>
            <ul>
              <li>canon concepts: {canonCount}</li>
              <li>primary canon: {primaryCanonTitle ?? "none"}</li>
              <li>canon role: active doctrine for system modification</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Concept Memory</span>
            <ul>
              <li>stored concepts: {conceptMemoryCount}</li>
              <li>resolved concepts: {resolvedConceptCount}</li>
              <li>latest concept: {latestConceptTitle ?? "none"}</li>
              <li>
                memory mode: local alpha accumulation
              </li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Concept Promotion</span>
            <ul>
              <li>current promoted stage: {promotionStatus}</li>
              <li>canonical ready: {canPromoteToCanonical ? "yes" : "no"}</li>
              {promotionNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        </div>
        <div className={styles.alphaDebugColumns}>
          <article className={styles.alphaDebugCard}>
            <span>Process Notes</span>
            <ul>
              {conceptProcess.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>System Notes</span>
            <ul>
              {systemState.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Validation Notes</span>
            <ul>
              {conceptValidation.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Main Loop Notes</span>
            <ul>
              {ideaSetMainLoop.notes.map((note) => (
                <li key={note}>{note}</li>
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
              <span>Mode</span>
              <strong>{interference.influenceMode}</strong>
            </article>
            <article>
              <span>Sense</span>
              <strong>{interference.senseWeight.toFixed(2)}</strong>
            </article>
            <article>
              <span>Structure</span>
              <strong>{interference.structureWeight.toFixed(2)}</strong>
            </article>
            <article>
              <span>Attention</span>
              <strong>{interference.attentionWeight.toFixed(2)}</strong>
            </article>
          </div>
          {interference.excerpt ? <p className={styles.interferenceExcerpt}>{interference.excerpt}</p> : null}
          {interference.aiResponseText?.trim() ? (
            <div className={styles.blogAiResponse}>
              <span className={styles.blogAiResponseLabel}>Artist AI response</span>
              <p>{interference.aiResponseText}</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
