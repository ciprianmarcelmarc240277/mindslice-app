export type InfluenceMode = "whisper" | "echo" | "rupture" | "counterpoint" | "stain";
export type ContaminationType =
  | InfluenceMode
  | "noise"
  | "overload"
  | "collapse"
  | "fragment"
  | "none";

export type AddressForm = "domnule" | "doamnă" | "domnișoară";
export type SubscriptionStatus = "inactive" | "active" | "past_due" | "canceled";
export type DebutStatus = "aspirant" | "in_program" | "selected" | "published" | "alumni";
export type ViewMode = "live" | "journal" | "archive";

export type Triad = {
  art: {
    score: number;
    label: string;
  };
  design: {
    score: number;
    label: string;
  };
  business: {
    score: number;
    label: string;
  };
};

export type VisualState = {
  background: string;
  accent: string;
  ink: string;
  mode: string;
  density: number;
  wave: number;
  fracture: number;
  drift: number;
  convergence: number;
};

export type ThoughtState = {
  direction: string;
  thought: string;
  fragments: string[];
  mood: string;
  palette: string[];
  materials: string[];
  motion: string;
  triad: Triad;
  visual: VisualState;
  keywords: string[];
};

export type SavedMoment = {
  id: string;
  direction: string;
  thought: string;
  prompt: string;
  image_url: string | null;
  created_at: string;
};

export type BlogPostDraft = {
  id: string;
  author_user_id?: string;
  saved_moment_id: string | null;
  author_pseudonym?: string | null;
  title: string;
  excerpt: string | null;
  source_text?: string | null;
  content: string;
  ai_response_text?: string | null;
  ai_response_generated_at?: string | null;
  sense_weight: number;
  structure_weight: number;
  attention_weight: number;
  influence_mode: InfluenceMode;
  is_contaminant: boolean;
  is_debut_submission?: boolean;
  is_debut_selected?: boolean;
  is_debut_published?: boolean;
  status: "draft" | "published";
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InteriorChatMessage = {
  id: string;
  author_user_id: string;
  message: string;
  message_body?: string;
  created_at: string;
  author_pseudonym: string | null;
  is_current_user: boolean;
  address_mode?: "all" | "direct" | "legacy";
  address_label?: string | null;
  target_pseudonym?: string | null;
};

export type UserProfile = {
  user_id: string;
  display_name?: string | null;
  pseudonym?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  name_declaration_accepted?: boolean | null;
  subscription_status?: SubscriptionStatus | null;
  subscription_expires_at?: string | null;
  address_form?: AddressForm | null;
  bio?: string | null;
  artist_statement?: string | null;
  debut_status?: DebutStatus | null;
};

export type EngineProfile = {
  stage: "alpha";
  generationStrategy: "slice_file_parser" | "slice_file_parser_plus_openai_refinement";
  contaminationStrategy: "journal_contamination_overlay";
  charterAxes: readonly string[];
  sceneConstraints: readonly string[];
  activeContaminationRule: string | null;
  openaiStructuredGeneration: "inactive" | "active";
};

export type LiveInterference = {
  sourceId: string;
  authorUserId?: string;
  title: string;
  authorPseudonym?: string | null;
  excerpt: string | null;
  aiResponseText?: string | null;
  aiResponseGeneratedAt?: string | null;
  senseWeight: number;
  structureWeight: number;
  attentionWeight: number;
  influenceMode: InfluenceMode;
  note: string;
  publishedAt: string;
};

export type HistoryEntry = {
  time: string;
  text: string;
};

export type ThoughtMemoryEntry = {
  id: string;
  source_type: "live_slice" | "journal_contamination";
  direction: string;
  thought: string;
  fragments: string[];
  keywords: string[];
  sense_score: number;
  structure_score: number;
  attention_score: number;
  influence_mode: InfluenceMode | null;
  memory_weight: number;
  created_at: string;
};

export type AdminSubscriptionProfile = {
  user_id: string;
  pseudonym: string | null;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
};

export type AdminSubscriptionOption = AdminSubscriptionProfile;

export type ConceptStage =
  | "emergent"
  | "forming"
  | "stabilizing"
  | "resolved"
  | "canonical";

export type ConceptResolutionStatus =
  | "unresolved"
  | "partially_resolved"
  | "resolved"
  | "contested";

export type ConceptConfidence = {
  semantic: number;
  visual: number;
  contaminationResistance: number;
  authorAlignment: number;
  overall: number;
};

export type ConceptProvenance = {
  sourceIdeaId: string;
  sourceAuthorIds: string[];
  sourceAuthorPseudonyms: string[];
  sourceSliceIds: string[];
  thoughtCycleIds: string[];
  contaminationEventIds: string[];
};

export type ConceptCore = {
  title: string;
  oneLineDefinition: string;
  thesis: string;
  tension: string;
  resolutionClaim: string;
  keywords: string[];
};

export type ConceptExpression = {
  textSignature: string;
  visualSignature: string;
  compositionMode: string;
  typographyMode: string;
  motionMode: string;
  scenario: {
    coreConflict: string;
    characterDrive: string;
    stakes: string;
    turningPoints: string[];
    tensionCurve: string[];
    progression: string[];
    resolution: string;
    attentionFlow: string[];
    outputText: string;
    outputStructure: string;
    runtime: NarrativeScenarioRuntime;
  };
  artComposition: {
    unityMap: string[];
    balanceMap: string[];
    rhythmMap: string[];
    movementMap: string[];
    contrastMap: string[];
    proportionMap: string[];
    focusNode: string;
    outputText: string;
    outputVisual: string;
    runtime: ArtCompositionRuntime;
  };
  palette: {
    dominant: string;
    secondary: string;
    accent: string;
    supportTones: string[];
    hueMap: string[];
    valueMap: string[];
    saturationMap: string[];
    attentionMap: string[];
    contaminationTrace: string[];
    outputText: string;
    outputVisual: string;
    runtime: ColorTheoryRuntime;
  };
  dominantFragments: string[];
  dominantKeywords: string[];
};

export type ConceptOutput = {
  textArtifact: {
    title: string;
    curatorText: string;
    publicText: string;
    prompt: string;
  };
  visualArtifact: {
    title: string;
    summary: string;
    compositionBrief: string;
    visualPrompt: string;
  };
};

export type ConceptContaminationProfile = {
  acceptedInfluences: string[];
  rejectedInfluences: string[];
  transformedInfluences: string[];
  activeTensions: string[];
  resistanceScore: number;
};

export type ConceptValidation = {
  semanticCoherence: number;
  graphicCoherence: number;
  crossModalAlignment: number;
  persistenceAcrossCycles: number;
  survivesContamination: boolean;
  validationNotes: string[];
};

export type ConceptMemoryLinks = {
  parentConceptIds: string[];
  siblingConceptIds: string[];
  descendantConceptIds: string[];
  canonClusterId: string | null;
};

export type ConceptState = {
  id: string;
  stage: ConceptStage;
  resolutionStatus: ConceptResolutionStatus;
  provenance: ConceptProvenance;
  core: ConceptCore;
  expression: ConceptExpression;
  output: ConceptOutput;
  contamination: ConceptContaminationProfile;
  validation: ConceptValidation;
  confidence: ConceptConfidence;
  memory: ConceptMemoryLinks;
  systemEffect: SystemModificationState | null;
  promotedAt: string | null;
  lastUpdatedAt: string;
};

export type ConceptEvaluationAxes = {
  structure: number;
  sense: number;
  attention: number;
  coherence: number;
};

export type ConceptDynamicThresholds = {
  structure: number;
  sense: number;
  attention: number;
  coherence: number;
  drivers: {
    contaminationPressure: number;
    memoryRelief: number;
    stagePressure: number;
    confidenceRelief: number;
  };
};

export type ConceptCandidate = {
  id: string;
  sourceIdeaId: string;
  currentThoughtId: string;
  stage: Extract<ConceptStage, "emergent" | "forming" | "stabilizing">;
  thesisDraft: string;
  visualIdentityDraft: string;
  dominantFragments: string[];
  dominantKeywords: string[];
  contaminationSummary: string[];
  coherenceSignals: {
    semantic: number;
    visual: number;
    crossModal: number;
  };
  evaluationAxes: ConceptEvaluationAxes;
  conceptStateDraft: ConceptState;
};

export type ConceptValidationResult = {
  isValidConcept: boolean;
  resolutionStatus: ConceptResolutionStatus;
  axes: ConceptEvaluationAxes;
  thresholds: ConceptDynamicThresholds;
  scores: {
    semanticStability: number;
    visualConsistency: number;
    crossModalAlignment: number;
    contaminationResolution: number;
    authorDilemmaResolution: number;
    conflict: number;
    tension: number;
    progression: number;
    meaning: number;
    narrativeAttention: number;
    unity: number;
    balance: number;
    rhythm: number;
    movement: number;
    contrast: number;
    proportion: number;
    focus: number;
    hueStructure: number;
    valueBalance: number;
    saturationControl: number;
    colorRelations: number;
    attentionImpact: number;
  };
  notes: string[];
};

export type NarrativeScenarioThresholds = {
  conflict: number;
  tension: number;
  progression: number;
  meaning: number;
  attention: number;
};

export type NarrativeScenarioScores = {
  conflict: number;
  tension: number;
  progression: number;
  meaning: number;
  attention: number;
};

export type NarrativeScenarioRuntime = {
  interpretation: string;
  contaminationMode: ContaminationType;
  acceptedContamination: boolean;
  iterationCount: number;
  terminated: boolean;
  terminationReason: "threshold_reached" | "rejected_contamination" | "iteration_limit";
  thresholds: NarrativeScenarioThresholds;
  scores: NarrativeScenarioScores;
  isValidScenario: boolean;
  lawPassed: boolean;
  lawNote: string;
  notes: string[];
};

export type ClockThresholds = {
  readability: number;
  attention: number;
  stability: number;
  perception: number;
};

export type ClockScores = {
  readability: number;
  attention: number;
  stability: number;
  perception: number;
};

export type ClockRuntime = {
  interpretation: string;
  contaminationMode: ContaminationType;
  acceptedContamination: boolean;
  iterationCount: number;
  terminated: boolean;
  terminationReason: "threshold_reached" | "rejected_contamination" | "iteration_limit";
  thresholds: ClockThresholds;
  scores: ClockScores;
  isValidClockState: boolean;
  lawPassed: boolean;
  lawNote: string;
  notes: string[];
};

export type ClockDisplayState = {
  hours: string;
  minutes: string;
  seconds: string;
  format: "24h" | "12h";
  visualStyle: string;
  attentionAnchor: string;
  transition: string;
  outputVisual: string;
  runtime: ClockRuntime;
};

export type ConceptMemoryEntry = {
  id: string;
  concept: ConceptState;
  validation: ConceptValidationResult;
  storedAt: string;
  lastSeenAt: string;
};

export type ConceptPoolEntry = {
  id: string;
  concept: ConceptState;
  validation: ConceptValidationResult;
  promotion: ConceptPromotionResult;
  pooledAt: string;
  lastSeenAt: string;
  source: "main_loop" | "active_runtime";
};

export type CanonEntry = {
  id: string;
  concept: ConceptState;
  validation: ConceptValidationResult;
  canonizedAt: string;
  lastActivatedAt: string;
  lineage: {
    siblingCanonIds: string[];
    sourceIdeaCanonCount: number;
  };
  influenceWeight: number;
};

export type ColorPaletteState = ConceptExpression["palette"];

export type ColorTheoryThresholds = {
  hueStructure: number;
  valueBalance: number;
  saturationControl: number;
  colorRelations: number;
  attentionImpact: number;
};

export type ColorTheoryScores = {
  hueStructure: number;
  valueBalance: number;
  saturationControl: number;
  colorRelations: number;
  attentionImpact: number;
};

export type ColorTheoryRuntime = {
  interpretation: string;
  contaminationMode: ContaminationType;
  acceptedContamination: boolean;
  iterationCount: number;
  terminated: boolean;
  terminationReason: "threshold_reached" | "rejected_contamination" | "iteration_limit";
  thresholds: ColorTheoryThresholds;
  scores: ColorTheoryScores;
  isValidPalette: boolean;
  lawPassed: boolean;
  lawNote: string;
  notes: string[];
};

export type ArtCompositionThresholds = {
  unity: number;
  balance: number;
  rhythm: number;
  movement: number;
  contrast: number;
  proportion: number;
  focus: number;
};

export type ArtCompositionScores = {
  unity: number;
  balance: number;
  rhythm: number;
  movement: number;
  contrast: number;
  proportion: number;
  focus: number;
};

export type ArtCompositionRuntime = {
  interpretation: string;
  contaminationMode: ContaminationType;
  acceptedContamination: boolean;
  iterationCount: number;
  terminated: boolean;
  terminationReason: "threshold_reached" | "rejected_contamination" | "iteration_limit";
  thresholds: ArtCompositionThresholds;
  scores: ArtCompositionScores;
  isValidComposition: boolean;
  lawPassed: boolean;
  lawNote: string;
  notes: string[];
};

export type ColorPoolEntry = {
  id: string;
  conceptId: string;
  conceptTitle: string;
  sourceIdeaId: string;
  stage: ConceptStage;
  palette: ColorPaletteState;
  validation: {
    hueStructure: number;
    valueBalance: number;
    saturationControl: number;
    colorRelations: number;
    attentionImpact: number;
  };
  pooledAt: string;
  lastSeenAt: string;
  source: "main_loop" | "active_runtime";
};

export type ArtCompositionState = ConceptExpression["artComposition"];
export type NarrativeScenarioState = ConceptExpression["scenario"];

export type ScenarioPoolEntry = {
  id: string;
  conceptId: string;
  conceptTitle: string;
  sourceIdeaId: string;
  stage: ConceptStage;
  scenario: NarrativeScenarioState;
  validation: {
    conflict: number;
    tension: number;
    progression: number;
    meaning: number;
    attention: number;
  };
  pooledAt: string;
  lastSeenAt: string;
  source: "main_loop" | "active_runtime";
};

export type StoryMemoryEntry = {
  id: string;
  conceptId: string;
  conceptTitle: string;
  sourceIdeaId: string;
  stage: ConceptStage;
  scenario: NarrativeScenarioState;
  validation: ScenarioPoolEntry["validation"];
  storedAt: string;
  lastSeenAt: string;
};

export type NarrativeCanonEntry = {
  id: string;
  conceptId: string;
  conceptTitle: string;
  sourceIdeaId: string;
  stage: ConceptStage;
  scenario: NarrativeScenarioState;
  validation: StoryMemoryEntry["validation"];
  canonizedAt: string;
  lastActivatedAt: string;
  lineage: {
    siblingCanonIds: string[];
    sourceIdeaCanonCount: number;
  };
  influenceWeight: number;
};

export type ClockMemoryEntry = {
  id: string;
  timeKey: string;
  display: ClockDisplayState;
  storedAt: string;
  lastSeenAt: string;
  source: "active_runtime";
};

export type ArtCompositionPoolEntry = {
  id: string;
  conceptId: string;
  conceptTitle: string;
  sourceIdeaId: string;
  stage: ConceptStage;
  composition: ArtCompositionState;
  validation: {
    unity: number;
    balance: number;
    rhythm: number;
    movement: number;
    contrast: number;
    proportion: number;
    focus: number;
  };
  pooledAt: string;
  lastSeenAt: string;
  source: "main_loop" | "active_runtime";
};

export type ArtMemoryEntry = {
  id: string;
  conceptId: string;
  conceptTitle: string;
  sourceIdeaId: string;
  stage: ConceptStage;
  composition: ArtCompositionState;
  validation: ArtCompositionPoolEntry["validation"];
  storedAt: string;
  lastSeenAt: string;
};

export type ArtCanonEntry = {
  id: string;
  conceptId: string;
  conceptTitle: string;
  sourceIdeaId: string;
  stage: ConceptStage;
  composition: ArtCompositionState;
  validation: ArtMemoryEntry["validation"];
  canonizedAt: string;
  lastActivatedAt: string;
  lineage: {
    siblingCanonIds: string[];
    sourceIdeaCanonCount: number;
  };
  influenceWeight: number;
};

export type ColorMemoryEntry = {
  id: string;
  conceptId: string;
  conceptTitle: string;
  sourceIdeaId: string;
  stage: ConceptStage;
  palette: ColorPaletteState;
  validation: ColorPoolEntry["validation"];
  storedAt: string;
  lastSeenAt: string;
};

export type ColorCanonEntry = {
  id: string;
  conceptId: string;
  conceptTitle: string;
  sourceIdeaId: string;
  stage: ConceptStage;
  palette: ColorPaletteState;
  validation: ColorPoolEntry["validation"];
  canonizedAt: string;
  lastActivatedAt: string;
  lineage: {
    siblingCanonIds: string[];
    sourceIdeaCanonCount: number;
  };
  influenceWeight: number;
};

export type ConceptArtifact = {
  id: string;
  concept_id: string;
  artifact_type: "text" | "visual_snapshot" | "graph_state" | "prompt" | "hybrid";
  content_text: string | null;
  content_json: Record<string, unknown> | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ConceptPromotionResult = {
  passesSystemLaw: boolean;
  canPromoteToResolved: boolean;
  canPromoteToCanonical: boolean;
  systemEffect: SystemModificationState;
  promotedConcept: ConceptState;
  notes: string[];
};

export type ConceptProcessStatus = "iterating" | "resolved" | "terminated";

export type ConceptTerminationReason =
  | "insufficient_structure"
  | "contamination_collapse"
  | "attention_dissipation"
  | "stagnation"
  | "none";

export type ConceptContaminationDecision = {
  requestedMode: ContaminationType;
  appliedMode: ContaminationType;
  accepted: boolean;
  rationale: string;
};

export type IdeaInterpretationResult = {
  sourceIdeaId: string;
  thoughtId: string;
  activeThought: ThoughtState;
  memoryPressure: number;
  contaminationPressure: number;
  notes: string[];
};

export type ThoughtIterationResult = {
  shouldIterate: boolean;
  nextIterationWeight: number;
  iterationFocus: "structure" | "sense" | "attention" | "coherence" | "hold";
  preview: string;
  notes: string[];
};

export type ProcessIdeaResult = {
  status: ConceptProcessStatus;
  nextAction: "iterate" | "build_concept" | "fail";
  iterationCount: number;
  interpretation: IdeaInterpretationResult;
  contamination: ConceptContaminationDecision;
  iteration: ThoughtIterationResult;
  candidate: ConceptCandidate;
  validation: ConceptValidationResult;
  shouldIntegrate: boolean;
  terminationReason: ConceptTerminationReason;
  notes: string[];
};

export type IdeaLoopEntryResult = {
  ideaIndex: number;
  ideaDirection: string;
  isActiveIdea: boolean;
  process: ProcessIdeaResult;
};

export type IdeaSetMainLoopResult = {
  totalIdeas: number;
  activeIdeaIndex: number;
  activeResult: ProcessIdeaResult;
  entries: IdeaLoopEntryResult[];
  resolvedCount: number;
  iteratingCount: number;
  terminatedCount: number;
  notes: string[];
};

export type SystemModificationState = {
  modifiesSystem: boolean;
  sourceConceptId: string | null;
  sourceConceptTitle: string | null;
  sourceStage: ConceptStage | null;
  preferredInfluenceMode: InfluenceMode | null;
  probabilityBias: number;
  contaminationBias: number;
  attentionShift: number;
  probabilities: {
    conceptReuseWeight: number;
    semanticPriority: number;
    convergenceBias: number;
  };
  contaminationPattern: {
    preferredMode: InfluenceMode | null;
    resistanceWeight: number;
    recurrenceWeight: number;
    acceptsExternalInterference: boolean;
  };
  attentionDistribution: {
    anchorWeight: number;
    peripheralWeight: number;
    memoryFieldWeight: number;
  };
  charterAdditions: string[];
  notes: string[];
};

export type EngineDebugEvent = {
  id: string;
  phase:
    | "interpret"
    | "contamination"
    | "validation"
    | "promotion"
    | "pool"
    | "memory"
    | "canon"
    | "system";
  level: "info" | "warning" | "success";
  ideaIndex: number | null;
  ideaDirection: string | null;
  sequence: number;
  summary: string;
  detail: string;
};

export type EngineFailureAnalysis = {
  currentBlocker: string;
  topFailurePattern: string;
  nextLikelyPromotion: string;
  systemPressureSummary: string;
};

export type EngineDebuggerReport = {
  trace: EngineDebugEvent[];
  activeTrace: EngineDebugEvent[];
  colorTheory: {
    interpretation: string;
    contaminationMode: ContaminationType;
    acceptedContamination: boolean;
    iterationCount: number;
    terminated: boolean;
    terminationReason: string;
    isValidPalette: boolean;
    lawPassed: boolean;
    lawNote: string;
    thresholds: ColorTheoryThresholds;
    scores: ColorTheoryScores;
    outputText: string;
    outputVisual: string;
    systemStateUpdate: {
      probabilities: {
        conceptReuseWeight: number;
        semanticPriority: number;
        convergenceBias: number;
      };
      hierarchyRules: {
        anchorWeight: number;
        peripheralWeight: number;
        hierarchyBias: number;
      };
      attentionBehavior: {
        focusWeight: number;
        memoryFieldWeight: number;
        contaminationLift: number;
      };
      notes: string[];
    } | null;
    notes: string[];
  };
  artComposition: {
    interpretation: string;
    contaminationMode: ContaminationType;
    acceptedContamination: boolean;
    iterationCount: number;
    terminated: boolean;
    terminationReason: string;
    isValidComposition: boolean;
    lawPassed: boolean;
    lawNote: string;
    thresholds: ArtCompositionThresholds;
    scores: ArtCompositionScores;
    focusNode: string;
    outputText: string;
    outputVisual: string;
    systemStateUpdate: {
      unityPatterns: {
        cohesionWeight: number;
      };
      balanceLogic: {
        redistributionWeight: number;
      };
      attentionBehavior: {
        focusWeight: number;
        pathWeight: number;
      };
      proportionRules: {
        hierarchyWeight: number;
      };
      notes: string[];
    } | null;
    notes: string[];
  };
  scenario: {
    interpretation: string;
    contaminationMode: ContaminationType;
    acceptedContamination: boolean;
    iterationCount: number;
    terminated: boolean;
    terminationReason: string;
    isValidScenario: boolean;
    lawPassed: boolean;
    lawNote: string;
    thresholds: NarrativeScenarioThresholds;
    scores: NarrativeScenarioScores;
    coreConflict: string;
    outputText: string;
    outputStructure: string;
    systemStateUpdate: {
      conflictPatterns: {
        escalationWeight: number;
      };
      tensionBehavior: {
        suspenseWeight: number;
        retentionWeight: number;
      };
      storyProbabilities: {
        irreversibilityBias: number;
        symbolicDepth: number;
        sequenceBias: number;
      };
      notes: string[];
    } | null;
    notes: string[];
  };
  timeline: Array<{
    label: string;
    sequence: number;
    status: "iterating" | "resolved" | "terminated" | "pooled" | "stored" | "canonical";
    ideaDirection: string | null;
  }>;
  comparativeRuns: Array<{
    ideaDirection: string;
    status: ConceptProcessStatus;
    blocker: string;
    validationStrength: number;
    reachedPool: boolean;
    reachedCanon: boolean;
  }>;
  failureAnalysis: EngineFailureAnalysis;
  funnel: {
    total: number;
    iterating: number;
    resolved: number;
    pooled: number;
    stored: number;
    canonical: number;
    systemChanging: number;
  };
};

export type EngineDebugRunEntry = {
  id: string;
  report: EngineDebuggerReport;
  createdAt: string;
};
