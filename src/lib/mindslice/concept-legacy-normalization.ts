"use client";

import type {
  CanonEntry,
  ConceptMemoryEntry,
  ConceptPoolEntry,
} from "@/lib/mindslice/mindslice-types";

type LegacyShape = {
  type?: unknown;
  mass?: unknown;
  behavior?: unknown;
  positionTendency?: unknown;
};

type LegacyExpression = {
  shape?: LegacyShape;
  shapeGrammar?: LegacyShapeGrammar;
  metaSystem?: unknown;
};

type LegacyConceptLike = {
  expression?: LegacyExpression;
  influence?: unknown;
  [key: string]: unknown;
};

type LegacyValidationLike = {
  scores?: Record<string, unknown>;
  [key: string]: unknown;
};

type LegacyShapeGrammar = {
  rulesApplied?: unknown[];
  [key: string]: unknown;
};

function stringField(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function buildFallbackShapeGrammar(shape: LegacyShape | undefined) {
  const seedShape = `${stringField(shape?.type, "hybrid")}:${stringField(shape?.mass, "light_mass")}:${stringField(shape?.behavior, "stable")}`;

  return {
    sequence: [seedShape],
    rulesApplied: [],
    transformationMap: [],
    structureEvolution: [stringField(shape?.positionTendency, "center")],
    outputVisual: "legacy grammar unavailable",
    outputText: "Concept istoric fără ShapeGrammar explicit; a fost injectat un fallback compatibil.",
    runtime: {
      seedShape,
      ruleset: [],
      constraints: [],
      hardFailureMode: "controlled" as const,
      hardFailureTriggered: true,
      iterationCount: 1,
      maxIterations: 0,
      terminated: true,
      terminationReason: "iteration_limit" as const,
      failed: true,
      failureReason: "invalid_grammar" as const,
      thresholds: {
        coherence: 0.68,
        transformation: 0.64,
        relation: 0.66,
        expressivePower: 0.7,
      },
      scores: {
        coherence: 0,
        transformation: 0,
        relation: 0,
        expressivePower: 0,
      },
      lawPassed: false,
      lawNote: "Fallback legacy grammar does not alter the system.",
      systemStateUpdate: {
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
          rejectedWeight: 1,
        },
        sequenceBehavior: {
          continuityWeight: 0,
          varianceWeight: 0,
        },
        notes: ["legacy fallback grammar has no system update"],
      },
      notes: ["legacy concept normalized with ShapeGrammar fallback"],
    },
  };
}

function buildFallbackMetaSystem(shapeGrammar: LegacyShapeGrammar) {
  return {
    outputVisual: "legacy-meta-system-unavailable",
    outputText: "Concept istoric fără MetaSystem explicit; a fost injectat un fallback compatibil.",
    runtime: {
      framework: {
        intent: "legacy concept",
        function: "legacy function unavailable",
        target: "legacy target unavailable",
        differentiator: "legacy differentiator unavailable",
        domain: ["shape", "composition", "color", "scenario"],
        constraints: [],
        goal: "legacy continuity",
        priority: shapeGrammar?.rulesApplied?.[0] ?? "repeat",
      },
      labyrinth: {
        explorationMap: {
          explorations: {},
          connections: [],
        },
        explorations: {},
        connections: [],
        axes: ["axis:legacy"],
        variations: [],
        relations: [],
      },
      conductor: {
        mode: "conductor",
        targetModules: ["shape_grammar", "composition_structure", "scenario"],
        labyrinthPressure: 0,
        pipelinePressure: 0,
        relationPressure: 0,
        notes: ["legacy concept has no active conductor state"],
      },
      designOutput: {
        direction: "artistic",
        style: "hybrid_stage",
        layout: "adaptive_layout",
        motion: "ambient_motion",
      },
      activePipeline: ["shape_theory", "shape_grammar", "composition_structure", "art_composition", "color_theory", "scenario"],
      designState: {
        executedModules: [],
        reorderedPipeline: [],
        suppressedModules: [],
        suppressionNotes: ["legacy concept has no meta suppression state"],
        recoveredModules: [],
        recoveryNotes: ["legacy concept has no meta recovery state"],
        moduleWeights: {},
        reweightNotes: ["legacy concept has no dynamic meta reweighting"],
        failed: true,
        failureModule: "legacy",
        failureReason: "meta design unavailable for legacy concept",
        moduleNotes: ["legacy concept normalized with inert MetaSystem design state"],
      },
      memory: {
        globalWeight: 0,
        domainWeights: {
          shape: 0,
          composition: 0,
          color: 0,
          scenario: 0,
        },
        appliedDomains: ["shape", "composition", "color", "scenario"],
        influenceWeight: 0,
        influenceNotes: ["legacy concept has no meta memory influence"],
        storedConcept: "legacy concept",
        canonical: false,
        canonicalReuse: 0,
        canonicalImpact: 0,
        canonicalStability: 0,
      },
      validationPassed: false,
      failed: true,
      failureReason: "design_failure",
      canon: {
        globalCandidate: false,
        domainCandidates: [],
        influenceWeight: 0,
        influenceNotes: ["legacy concept has no meta canon influence"],
      },
      thresholds: {
        structure: 0.66,
        coherence: 0.68,
        attention: 0.67,
        integration: 0.7,
      },
      scores: {
        structure: 0,
        coherence: 0,
        attention: 0,
        integration: 0,
      },
      lawPassed: false,
      lawNote: "Fallback legacy metasystem does not alter the system.",
      notes: ["legacy concept normalized with MetaSystem fallback"],
    },
  };
}

function buildFallbackInfluence() {
  return {
    role: "free",
    weightLabel: "LOW",
    weightValue: 0.92,
    notes: ["legacy concept normalized with default influence profile"],
  };
}

function normalizeValidationScores(scores: Record<string, unknown> | undefined) {
  return {
    ...scores,
    grammarCoherence: typeof scores?.grammarCoherence === "number" ? scores.grammarCoherence : 0,
    grammarTransformation: typeof scores?.grammarTransformation === "number" ? scores.grammarTransformation : 0,
    grammarRelation: typeof scores?.grammarRelation === "number" ? scores.grammarRelation : 0,
    grammarExpressivePower: typeof scores?.grammarExpressivePower === "number" ? scores.grammarExpressivePower : 0,
    metaStructure: typeof scores?.metaStructure === "number" ? scores.metaStructure : 0,
    metaCoherence: typeof scores?.metaCoherence === "number" ? scores.metaCoherence : 0,
    metaAttention: typeof scores?.metaAttention === "number" ? scores.metaAttention : 0,
    metaIntegration: typeof scores?.metaIntegration === "number" ? scores.metaIntegration : 0,
  };
}

function normalizeConcept<T extends LegacyConceptLike>(concept: T): T {
  if (!concept?.expression) {
    return concept;
  }

  const shape = concept.expression.shape;
  const shapeGrammar = concept.expression.shapeGrammar ?? buildFallbackShapeGrammar(shape);
  const metaSystem = concept.expression.metaSystem ?? buildFallbackMetaSystem(shapeGrammar);

  return {
    ...concept,
    influence: concept.influence ?? buildFallbackInfluence(),
    expression: {
      ...concept.expression,
      shapeGrammar,
      metaSystem,
    },
  };
}

function normalizeValidation<T extends LegacyValidationLike>(validation: T): T {
  if (!validation?.scores) {
    return validation;
  }

  return {
    ...validation,
    scores: normalizeValidationScores(validation.scores),
  };
}

export function normalizeLegacyConceptPoolEntry(entry: ConceptPoolEntry): ConceptPoolEntry {
  return {
    ...entry,
    concept: normalizeConcept(entry.concept),
    validation: normalizeValidation(entry.validation),
  };
}

export function normalizeLegacyConceptMemoryEntry(entry: ConceptMemoryEntry): ConceptMemoryEntry {
  return {
    ...entry,
    concept: normalizeConcept(entry.concept),
    validation: normalizeValidation(entry.validation),
  };
}

export function normalizeLegacyCanonEntry(entry: CanonEntry): CanonEntry {
  return {
    ...entry,
    concept: normalizeConcept(entry.concept),
    validation: normalizeValidation(entry.validation),
  };
}
