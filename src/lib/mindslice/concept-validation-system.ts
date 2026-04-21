import {
  evaluateArtComposition,
  validArtComposition,
} from "@/lib/mindslice/concept-art-composition-system";
import {
  evaluateCompositionStructure,
  validCompositionStructure,
} from "@/lib/mindslice/concept-composition-structure-system";
import {
  evaluateShapeGrammar,
  validGrammar,
} from "@/lib/mindslice/concept-shape-grammar-system";
import {
  evaluateShapeTheory,
  validShape,
} from "@/lib/mindslice/concept-shape-theory-system";
import {
  evaluateScenario,
  validScenario,
} from "@/lib/mindslice/concept-scenario-system";
import {
  deriveDynamicConceptThresholds,
  validConcept,
} from "@/lib/mindslice/concept-threshold-system";
import { validMetaSystem } from "@/lib/mindslice/concept-meta-system";
import {
  evaluateConceptPalette,
  validPalette,
} from "@/lib/mindslice/concept-color-theory-system";
import type {
  ConceptCandidate,
  ConceptResolutionStatus,
  ConceptValidationResult,
} from "@/lib/mindslice/mindslice-types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tokenize(values: string[]) {
  return new Set(
    values
      .flatMap((value) => value.toLowerCase().split(/[^-\p{L}\p{N}]+/u))
      .filter((token) => token.length >= 3),
  );
}

function overlapScore(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) {
    return 0;
  }

  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(Math.min(left.size, right.size), 1);
}

function closeness(left: number, right: number) {
  return clamp(1 - Math.abs(left - right), 0, 1);
}

function deriveResolutionStatus(
  isValidConcept: boolean,
  semanticStability: number,
  contaminationResolution: number,
  authorDilemmaResolution: number,
  shapeHardFailureTriggered: boolean,
): ConceptResolutionStatus {
  if (shapeHardFailureTriggered) {
    return contaminationResolution < 0.45 ? "contested" : "unresolved";
  }

  if (isValidConcept) {
    return "resolved";
  }

  if (contaminationResolution < 0.45) {
    return "contested";
  }

  if (semanticStability >= 0.68 || authorDilemmaResolution >= 0.66) {
    return "partially_resolved";
  }

  return "unresolved";
}

export function validateConceptCandidate(
  candidate: ConceptCandidate,
): ConceptValidationResult {
  const thresholds = deriveDynamicConceptThresholds(candidate);
  const axes = candidate.evaluationAxes;

  const semanticStability = clamp(
    axes.sense * 0.62 +
      candidate.coherenceSignals.semantic * 0.12 +
      candidate.conceptStateDraft.validation.persistenceAcrossCycles * 0.28,
    0,
    1,
  );

  const visualConsistency = clamp(
    axes.structure * 0.5 +
      candidate.coherenceSignals.visual * 0.34 +
      candidate.conceptStateDraft.confidence.visual * 0.16,
    0,
    1,
  );

  const crossModalAlignment = clamp(
    axes.coherence * 0.52 +
      candidate.coherenceSignals.crossModal * 0.32 +
      ((axes.sense + axes.structure) / 2) * 0.16,
    0,
    1,
  );

  const contaminationResolution = clamp(
    candidate.conceptStateDraft.contamination.resistanceScore * 0.72 +
      (candidate.conceptStateDraft.validation.survivesContamination ? 0.18 : 0) +
      (candidate.contaminationSummary.length > 1 ? 0.08 : 0),
    0,
    1,
  );

  const authorDilemmaResolution = clamp(
    axes.attention * 0.38 +
      candidate.conceptStateDraft.confidence.authorAlignment * 0.42 +
      candidate.conceptStateDraft.confidence.overall * 0.2,
    0,
    1,
  );

  const colorScores = evaluateConceptPalette(
    {
      palette: candidate.conceptStateDraft.expression.palette,
      visual: {
        background:
          candidate.conceptStateDraft.expression.palette.valueMap[0]?.replace("background:", "") ??
          "#f0e6d8",
        accent: candidate.conceptStateDraft.expression.palette.accent,
        ink:
          candidate.conceptStateDraft.expression.palette.valueMap[1]?.replace("ink:", "") ??
          "#181411",
        mode: candidate.conceptStateDraft.expression.typographyMode,
        density: candidate.conceptStateDraft.confidence.visual,
        wave: candidate.conceptStateDraft.confidence.visual,
        fracture: 1 - axes.structure,
        drift: 0.5,
        convergence: axes.coherence,
      },
      triad: {
        art: { score: axes.sense, label: "derived" },
        design: { score: axes.structure, label: "derived" },
        business: { score: axes.attention, label: "derived" },
      },
    },
    null,
  );
  const colorRuntime = candidate.conceptStateDraft.expression.palette.runtime ?? {
    thresholds: {
      hueStructure: 0.7,
      valueBalance: 0.7,
      saturationControl: 0.7,
      colorRelations: 0.72,
      attentionImpact: 0.72,
    },
    lawPassed: false,
    notes: [],
  };
  const colorValidity = validPalette(colorScores, colorRuntime.thresholds);
  const scenario = candidate.conceptStateDraft.expression.scenario;
  const scenarioScores = evaluateScenario({
    scenario,
    current: {
      direction: candidate.conceptStateDraft.core.title,
      thought: candidate.thesisDraft,
      fragments: candidate.dominantFragments,
      mood: candidate.conceptStateDraft.core.tension,
      palette: [
        candidate.conceptStateDraft.expression.palette.dominant,
        candidate.conceptStateDraft.expression.palette.secondary,
        candidate.conceptStateDraft.expression.palette.accent,
      ],
      materials: [],
      motion: candidate.conceptStateDraft.expression.motionMode,
      triad: {
        art: { score: axes.sense, label: "derived" },
        design: { score: axes.structure, label: "derived" },
        business: { score: axes.attention, label: "derived" },
      },
      visual: {
        background:
          candidate.conceptStateDraft.expression.palette.valueMap[0]?.replace("background:", "") ??
          "#f0e6d8",
        accent: candidate.conceptStateDraft.expression.palette.accent,
        ink:
          candidate.conceptStateDraft.expression.palette.valueMap[1]?.replace("ink:", "") ??
          "#181411",
        mode: candidate.conceptStateDraft.expression.typographyMode,
        density: candidate.conceptStateDraft.confidence.visual,
        wave: candidate.conceptStateDraft.confidence.visual,
        fracture: 1 - axes.structure,
        drift: 0.5,
        convergence: axes.coherence,
      },
      keywords: candidate.dominantKeywords,
    },
    history: [],
  });
  const scenarioRuntime = scenario.runtime;
  const scenarioValidity = validScenario(scenarioScores, scenarioRuntime.thresholds);
  const artComposition = candidate.conceptStateDraft.expression.artComposition;
  const artScores = evaluateArtComposition({
    composition: artComposition,
    visual: {
      background:
        candidate.conceptStateDraft.expression.palette.valueMap[0]?.replace("background:", "") ??
        "#f0e6d8",
      accent: candidate.conceptStateDraft.expression.palette.accent,
      ink:
        candidate.conceptStateDraft.expression.palette.valueMap[1]?.replace("ink:", "") ??
        "#181411",
      mode: candidate.conceptStateDraft.expression.typographyMode,
      density: candidate.conceptStateDraft.confidence.visual,
      wave: candidate.conceptStateDraft.confidence.visual,
      fracture: 1 - axes.structure,
      drift: 0.5,
      convergence: axes.coherence,
    },
    triad: {
      art: { score: axes.sense, label: "derived" },
      design: { score: axes.structure, label: "derived" },
      business: { score: axes.attention, label: "derived" },
    },
  });
  const artRuntime = artComposition.runtime;
  const artValidity = validArtComposition(artScores, artRuntime.thresholds);
  const compositionStructure = candidate.conceptStateDraft.expression.compositionStructure;
  const structureScores = evaluateCompositionStructure({
    structure: compositionStructure,
    visual: {
      background:
        candidate.conceptStateDraft.expression.palette.valueMap[0]?.replace("background:", "") ??
        "#f0e6d8",
      accent: candidate.conceptStateDraft.expression.palette.accent,
      ink:
        candidate.conceptStateDraft.expression.palette.valueMap[1]?.replace("ink:", "") ??
        "#181411",
      mode: candidate.conceptStateDraft.expression.typographyMode,
      density: candidate.conceptStateDraft.confidence.visual,
      wave: candidate.conceptStateDraft.confidence.visual,
      fracture: 1 - axes.structure,
      drift: 0.5,
      convergence: axes.coherence,
    },
    triad: {
      art: { score: axes.sense, label: "derived" },
      design: { score: axes.structure, label: "derived" },
      business: { score: axes.attention, label: "derived" },
    },
  });
  const structureRuntime = compositionStructure.runtime;
  const structureValidity = validCompositionStructure(structureScores, structureRuntime.thresholds);
  const shape = candidate.conceptStateDraft.expression.shape;
  const shapeScores = evaluateShapeTheory({
    shape,
    visual: {
      background:
        candidate.conceptStateDraft.expression.palette.valueMap[0]?.replace("background:", "") ??
        "#f0e6d8",
      accent: candidate.conceptStateDraft.expression.palette.accent,
      ink:
        candidate.conceptStateDraft.expression.palette.valueMap[1]?.replace("ink:", "") ??
        "#181411",
      mode: candidate.conceptStateDraft.expression.typographyMode,
      density: candidate.conceptStateDraft.confidence.visual,
      wave: candidate.conceptStateDraft.confidence.visual,
      fracture: 1 - axes.structure,
      drift: 0.5,
      convergence: axes.coherence,
    },
    triad: {
      art: { score: axes.sense, label: "derived" },
      design: { score: axes.structure, label: "derived" },
      business: { score: axes.attention, label: "derived" },
    },
    structure: compositionStructure,
  });
  const shapeRuntime = shape.runtime;
  const shapeValidity = validShape(shapeScores, shapeRuntime.thresholds);
  const shapeHardFailureTriggered = shapeRuntime.hardFailureTriggered;
  const shapeGrammar = candidate.conceptStateDraft.expression.shapeGrammar;
  const metaSystem = candidate.conceptStateDraft.expression.metaSystem;
  const grammarScores = evaluateShapeGrammar({
    sequence: shapeGrammar.sequence,
    successfulTransformations: shapeGrammar.rulesApplied.length,
    attemptedTransformations: shapeGrammar.runtime.maxIterations,
  });
  const grammarValidity = validGrammar(grammarScores, shapeGrammar.runtime.thresholds);
  const grammarHardFailureTriggered = shapeGrammar.runtime.hardFailureTriggered;
  const metaScores = metaSystem.runtime.scores;
  const metaValidity = validMetaSystem(metaScores, metaSystem.runtime.thresholds);
  const narrativeTokens = tokenize([
    scenario.coreConflict,
    scenario.characterDrive,
    scenario.stakes,
    ...scenario.turningPoints,
    ...scenario.progression,
    ...scenario.attentionFlow,
  ]);
  const structureTokens = tokenize([
    compositionStructure.grid,
    compositionStructure.subjectPosition,
    compositionStructure.symmetryState,
    compositionStructure.centerState,
    ...compositionStructure.tensionZones,
    ...compositionStructure.attentionMap,
  ]);
  const shapeTokens = tokenize([
    shape.type,
    ...shape.structure,
    ...shape.edges,
    shape.mass,
    ...shape.voidRelation,
    shape.behavior,
    shape.positionTendency,
    ...shape.tensionVectors,
    ...shape.attentionProfile,
  ]);
  const artTokens = tokenize([
    artComposition.focusNode,
    ...artComposition.rhythmMap,
    ...artComposition.movementMap,
    ...artComposition.contrastMap,
    ...artComposition.proportionMap,
  ]);
  const colorTokens = tokenize([
    candidate.conceptStateDraft.expression.palette.dominant,
    candidate.conceptStateDraft.expression.palette.secondary,
    candidate.conceptStateDraft.expression.palette.accent,
    ...candidate.conceptStateDraft.expression.palette.hueMap,
    ...candidate.conceptStateDraft.expression.palette.attentionMap,
    ...candidate.conceptStateDraft.expression.palette.supportTones,
  ]);
  const outputTokens = tokenize([
    candidate.conceptStateDraft.output.textArtifact.publicText,
    candidate.conceptStateDraft.output.visualArtifact.summary,
    candidate.conceptStateDraft.output.visualArtifact.compositionBrief,
  ]);
  const clockDisplay = candidate.conceptStateDraft.expression.clock;
  const clockTokens = clockDisplay
    ? tokenize([
        clockDisplay.visualStyle,
        clockDisplay.attentionAnchor,
        clockDisplay.transition,
        clockDisplay.outputVisual,
      ])
    : new Set<string>();
  const narrativeStructureFit = clamp(
    overlapScore(narrativeTokens, structureTokens) * 0.46 +
      closeness(scenarioScores.attention, structureScores.attention) * 0.32 +
      closeness(scenarioScores.progression, structureScores.center) * 0.22,
    0,
    1,
  );
  const structureArtFit = clamp(
    overlapScore(structureTokens, artTokens) * 0.4 +
      closeness(structureScores.attention, artScores.focus) * 0.34 +
      closeness(structureScores.center, artScores.balance) * 0.26,
    0,
    1,
  );
  const shapeStructureFit = clamp(
    overlapScore(shapeTokens, structureTokens) * 0.42 +
      closeness(shapeScores.relation, structureScores.attention) * 0.3 +
      closeness(shapeScores.attention, structureScores.center) * 0.28,
    0,
    1,
  );
  const shapeArtFit = clamp(
    overlapScore(shapeTokens, artTokens) * 0.4 +
      closeness(shapeScores.attention, artScores.focus) * 0.34 +
      closeness(shapeScores.tension, artScores.movement) * 0.26,
    0,
    1,
  );
  const artColorFit = clamp(
    overlapScore(artTokens, colorTokens) * 0.34 +
      closeness(artScores.contrast, colorScores.attentionImpact) * 0.34 +
      closeness(artScores.focus, colorScores.valueBalance) * 0.32,
    0,
    1,
  );
  const narrativeOutputFit = clamp(
    overlapScore(narrativeTokens, outputTokens) * 0.5 +
      overlapScore(structureTokens, outputTokens) * 0.2 +
      closeness(scenarioScores.meaning, crossModalAlignment) * 0.3,
    0,
    1,
  );
  const shapeOutputFit = clamp(
    overlapScore(shapeTokens, outputTokens) * 0.48 +
      overlapScore(shapeTokens, structureTokens) * 0.2 +
      closeness(shapeScores.identity, visualConsistency) * 0.32,
    0,
    1,
  );
  const clockScenarioFit = clockDisplay
    ? clamp(
        overlapScore(clockTokens, narrativeTokens) * 0.42 +
          closeness(clockDisplay.runtime.scores.attention, scenarioScores.attention) * 0.34 +
          closeness(clockDisplay.runtime.scores.stability, scenarioScores.progression) * 0.24,
        0,
        1,
      )
    : 0;
  const clockStructureFit = clockDisplay
    ? clamp(
        overlapScore(clockTokens, structureTokens) * 0.38 +
          closeness(clockDisplay.runtime.scores.attention, structureScores.attention) * 0.34 +
          closeness(clockDisplay.runtime.scores.stability, structureScores.center) * 0.28,
        0,
        1,
      )
    : 0;
  const clockArtFit = clockDisplay
    ? clamp(
        overlapScore(clockTokens, artTokens) * 0.36 +
          closeness(clockDisplay.runtime.scores.attention, artScores.focus) * 0.34 +
          closeness(clockDisplay.runtime.scores.perception, artScores.movement) * 0.3,
        0,
        1,
      )
    : 0;
  const clockColorFit = clockDisplay
    ? clamp(
        overlapScore(clockTokens, colorTokens) * 0.34 +
          closeness(clockDisplay.runtime.scores.readability, colorScores.valueBalance) * 0.32 +
          closeness(clockDisplay.runtime.scores.attention, colorScores.attentionImpact) * 0.34,
        0,
        1,
      )
    : 0;
  const timeArtCoherence = clockDisplay
    ? clamp(
        clockScenarioFit * 0.26 +
          clockStructureFit * 0.24 +
          clockArtFit * 0.28 +
          clockColorFit * 0.22,
        0,
        1,
      )
    : 0;
  const bridgeWeights = candidate.canonInfluence.totalInfluence > 0
    ? {
        narrativeStructure:
          (candidate.canonInfluence.normalizedWeights.narrative * 0.52) +
          (candidate.canonInfluence.normalizedWeights.structure * 0.38),
        structureArt:
          (candidate.canonInfluence.normalizedWeights.structure * 0.48) +
          (candidate.canonInfluence.normalizedWeights.art * 0.34),
        shapeStructure:
          (candidate.canonInfluence.normalizedWeights.structure * 0.26) +
          (candidate.canonInfluence.normalizedWeights.art * 0.18),
        shapeArt:
          (candidate.canonInfluence.normalizedWeights.art * 0.28) +
          (candidate.canonInfluence.normalizedWeights.structure * 0.14),
        artColor:
          (candidate.canonInfluence.normalizedWeights.art * 0.42) +
          (candidate.canonInfluence.normalizedWeights.color * 0.36),
        narrativeOutput:
          (candidate.canonInfluence.normalizedWeights.narrative * 0.46) +
          (candidate.canonInfluence.normalizedWeights.color * 0.08) +
          (candidate.canonInfluence.normalizedWeights.structure * 0.22),
        shapeOutput:
          (candidate.canonInfluence.normalizedWeights.structure * 0.18) +
          (candidate.canonInfluence.normalizedWeights.art * 0.14),
      }
    : {
        narrativeStructure: 0.2,
        structureArt: 0.18,
        shapeStructure: 0.14,
        shapeArt: 0.14,
        artColor: 0.14,
        narrativeOutput: 0.1,
        shapeOutput: 0.1,
      };
  const weightedBridgeTotal =
    bridgeWeights.narrativeStructure +
    bridgeWeights.structureArt +
    bridgeWeights.shapeStructure +
    bridgeWeights.shapeArt +
    bridgeWeights.artColor +
    bridgeWeights.narrativeOutput +
    bridgeWeights.shapeOutput;
  const crossCanonCoherence = clamp(
    narrativeStructureFit * (bridgeWeights.narrativeStructure / weightedBridgeTotal) +
      structureArtFit * (bridgeWeights.structureArt / weightedBridgeTotal) +
      shapeStructureFit * (bridgeWeights.shapeStructure / weightedBridgeTotal) +
      shapeArtFit * (bridgeWeights.shapeArt / weightedBridgeTotal) +
      artColorFit * (bridgeWeights.artColor / weightedBridgeTotal) +
      narrativeOutputFit * (bridgeWeights.narrativeOutput / weightedBridgeTotal) +
      shapeOutputFit * (bridgeWeights.shapeOutput / weightedBridgeTotal),
    0,
    1,
  );

  const baseValidConcept = validConcept(axes, thresholds);
  const isValidConcept = baseValidConcept &&
    !shapeHardFailureTriggered &&
    !grammarHardFailureTriggered &&
    shapeValidity &&
    shapeRuntime.lawPassed &&
    grammarValidity &&
    shapeGrammar.runtime.lawPassed &&
    metaValidity &&
    metaSystem.runtime.lawPassed;

  const resolutionStatus = deriveResolutionStatus(
    isValidConcept,
    semanticStability,
    contaminationResolution,
    authorDilemmaResolution,
    shapeHardFailureTriggered,
  );

  const notes = [
    `praguri dinamice: organizare internă ≥ ${thresholds.structure.toFixed(2)} / sens ≥ ${thresholds.sense.toFixed(2)} / focalizare conceptuală ≥ ${thresholds.attention.toFixed(2)} / coerență ≥ ${thresholds.coherence.toFixed(2)}`,
    `axe curente: organizare internă ${axes.structure.toFixed(2)} / sens ${axes.sense.toFixed(2)} / focalizare conceptuală ${axes.attention.toFixed(2)} / coerență ${axes.coherence.toFixed(2)}`,
    candidate.canonInfluence.dominantCanon
      ? `canon weights: dominanta activă este ${candidate.canonInfluence.dominantCanon}, cu distribuție N ${candidate.canonInfluence.normalizedWeights.narrative.toFixed(2)} / A ${candidate.canonInfluence.normalizedWeights.art.toFixed(2)} / S ${candidate.canonInfluence.normalizedWeights.structure.toFixed(2)} / C ${candidate.canonInfluence.normalizedWeights.color.toFixed(2)}`
      : "canon weights: nu există încă un canon dominant activ",
    semanticStability >= 0.78
      ? "semantic stability: teza începe să se repete coerent"
      : "semantic stability: teza încă fluctuează",
    visualConsistency >= 0.72
      ? "visual consistency: scena păstrează o identitate recognoscibilă"
      : "visual consistency: limbajul vizual încă nu s-a stabilizat",
    crossCanonCoherence >= 0.76
      ? "cross-canon coherence: scenariul, structura, compoziția și culoarea converg într-un singur sistem"
      : crossCanonCoherence >= 0.6
        ? "cross-canon coherence: subsistemele se susțin parțial, dar încă nu converg complet"
        : "cross-canon coherence: subsistemele coexistă, dar încă nu spun suficient de clar aceeași poveste",
    clockDisplay
      ? timeArtCoherence >= 0.76
        ? "time-art coherence: ceasul pulsează în același sistem cu scenariul, structura, compoziția și culoarea"
        : timeArtCoherence >= 0.6
          ? "time-art coherence: ceasul susține parțial generarea, dar încă nu sincronizează complet sistemul"
          : "time-art coherence: ceasul există în expresie, dar încă nu organizează suficient de coerent celelalte subsisteme"
      : "time-art coherence: nu există ceas activ în expresia conceptului",
    scenarioScores.conflict >= scenarioRuntime.thresholds.conflict
      ? "scenario: conflictul păstrează forțe opuse recognoscibile"
      : "scenario: conflictul nu menține încă suficientă opoziție activă",
    scenarioScores.tension >= scenarioRuntime.thresholds.tension
      ? "scenario: tensiunea continuă să escaleze fără rezolvare prematură"
      : "scenario: tensiunea cade încă prea repede sau nu escaladează suficient",
    scenarioScores.progression >= scenarioRuntime.thresholds.progression
      ? "scenario: pașii narativi produc schimbări ireversibile"
      : "scenario: progresia repetă încă prea mult fără transformare",
    scenarioScores.meaning >= scenarioRuntime.thresholds.meaning
      ? "scenario: scenariul produce interpretare și adâncime structurală"
      : "scenario: scenariul rămâne încă prea reductibil",
    scenarioScores.attention >= scenarioRuntime.thresholds.attention
      ? "scenario: fluxul atenției este ghidat clar"
      : "scenario: fluxul atenției nu susține încă suficient retenția",
    scenarioValidity
      ? "scenario runtime: scenariul trece explicit pragurile narative"
      : "scenario runtime: scenariul nu trece încă toate pragurile narative",
    scenarioRuntime.lawPassed
      ? "scenario law: scenariul modifică sistemul narativ"
      : "scenario law: scenariul nu modifică încă suficient sistemul narativ",
    artScores.unity >= artRuntime.thresholds.unity
      ? "art composition: unitatea vizuală rezistă variației"
      : "art composition: variațiile încă rup identitatea totală",
    artScores.balance >= artRuntime.thresholds.balance
      ? "art composition: greutatea vizuală este distribuită controlat"
      : "art composition: compoziția cade încă prea mult într-o singură zonă",
    artScores.rhythm >= artRuntime.thresholds.rhythm
      ? "art composition: repetiția produce ritm recognoscibil"
      : "art composition: ritmul nu creează încă destulă expectație",
    artScores.movement >= artRuntime.thresholds.movement
      ? "art composition: traseul privirii este ghidat clar"
      : "art composition: ochiul nu este ghidat încă suficient prin cadru",
    artScores.contrast >= artRuntime.thresholds.contrast
      ? "art composition: tensiunile sunt lizibile și productive"
      : "art composition: contrastul produce încă prea mult zgomot sau prea puțină tensiune",
    artScores.proportion >= artRuntime.thresholds.proportion
      ? "art composition: raporturile de scară susțin ierarhia"
      : "art composition: proporțiile nu sprijină încă suficient sistemul",
    artScores.focus >= artRuntime.thresholds.focus
      ? "art composition: nodul dominant rămâne perceput"
      : "art composition: centrul dominant nu rezistă încă suficient",
    artValidity
      ? "art runtime: compoziția trece explicit pragurile artistice"
      : "art runtime: compoziția nu trece încă toate pragurile artistice",
    artRuntime.lawPassed
      ? "art law: compoziția modifică sistemul percepției"
      : "art law: compoziția nu modifică încă suficient sistemul percepției",
    structureScores.thirds >= structureRuntime.thresholds.thirds
      ? "structure: subiectul folosește conștient grila treimilor"
      : "structure: plasarea pe treimi nu este încă suficient controlată",
    structureScores.golden >= structureRuntime.thresholds.golden
      ? "structure: proporțiile induc un flux aproape organic"
      : "structure: proporțiile nu produc încă suficientă curgere",
    structureScores.symmetry >= structureRuntime.thresholds.symmetry
      ? "structure: simetria sau asimetria sunt intenționale"
      : "structure: dezechilibrul pare încă accidental",
    structureScores.center >= structureRuntime.thresholds.center
      ? "structure: centrajul sau decentrul susțin sensul"
      : "structure: poziționarea nu justifică încă suficient tensiunea",
    structureScores.attention >= structureRuntime.thresholds.attention
      ? "structure: suprafața ghidează ochiul printr-un traseu lizibil"
      : "structure: traseul privirii nu este încă suficient organizat",
    structureValidity
      ? "structure runtime: structura trece explicit pragurile de ecran"
      : "structure runtime: structura nu trece încă toate pragurile de ecran",
    structureRuntime.lawPassed
      ? "structure law: poziționarea organizează atenția în suprafață"
      : "structure law: poziționarea nu ordonează încă suficient atenția",
    shapeScores.identity >= shapeRuntime.thresholds.identity
      ? "shape theory: forma are identitate recognoscibilă"
      : "shape theory: forma nu și-a fixat încă suficient identitatea",
    shapeScores.relation >= shapeRuntime.thresholds.relation
      ? "shape theory: forma intră în relație activă cu câmpul"
      : "shape theory: forma rămâne încă prea izolată în câmp",
    shapeScores.tension >= shapeRuntime.thresholds.tension
      ? "shape theory: vectorii interni produc presiune perceptibilă"
      : "shape theory: forma rămâne încă prea neutră sau prea amorfă",
    shapeScores.attention >= shapeRuntime.thresholds.attention
      ? "shape theory: forma atrage și distribuie atenția"
      : "shape theory: forma nu produce încă suficientă greutate perceptivă",
    shapeValidity
      ? "shape runtime: forma trece explicit pragurile ShapeTheory"
      : "shape runtime: forma nu trece încă toate pragurile ShapeTheory",
    shapeHardFailureTriggered
      ? "shape hard fail: subsystemul formelor a fost exclus controlat din integrarea conceptului"
      : "shape hard fail: subsystemul formelor rămâne integrabil în concept",
    grammarHardFailureTriggered
      ? "shape grammar hard fail: gramatica a fost exclusă controlat din integrarea conceptului"
      : "shape grammar hard fail: gramatica rămâne integrabilă în concept",
    grammarScores.coherence >= shapeGrammar.runtime.thresholds.coherence
      ? "shape grammar: secvența transformă forma coerent și lizibil"
      : "shape grammar: secvența produce încă salturi prea arbitrare",
    grammarScores.transformation >= shapeGrammar.runtime.thresholds.transformation
      ? "shape grammar: transformările trec pragul explicit de validitate"
      : "shape grammar: transformările nu trec încă pragul explicit de validitate",
    grammarScores.relation >= shapeGrammar.runtime.thresholds.relation
      ? "shape grammar: iterațiile rămân în relație între ele"
      : "shape grammar: iterațiile nu păstrează încă destulă continuitate",
    grammarScores.expressivePower >= shapeGrammar.runtime.thresholds.expressivePower
      ? "shape grammar: variațiile produc diferențe expresive reale"
      : "shape grammar: variațiile rămân încă prea repetitive sau prea plate",
    grammarValidity
      ? "shape grammar runtime: gramatica trece pragurile explicite"
      : "shape grammar runtime: gramatica nu trece încă toate pragurile explicite",
    shapeGrammar.runtime.lawPassed
      ? "shape grammar law: secvența produce forme inevitabile"
      : "shape grammar law: secvența nu produce încă forme inevitabile",
    metaValidity
      ? "meta system: orchestrationarea globală trece pragurile explicite"
      : "meta system: orchestrationarea globală nu trece încă toate pragurile explicite",
    metaSystem.runtime.lawPassed
      ? "meta law: ieșirea modifică sistemul ca întreg"
      : "meta law: ieșirea nu modifică încă suficient întregul sistem",
    shapeRuntime.lawPassed
      ? "shape law: forma modifică percepția spațială a sistemului"
      : "shape law: forma nu modifică încă suficient percepția spațială",
    colorScores.hueStructure >= 0.7
      ? "color theory: familia cromatică are o axă dominantă recognoscibilă"
      : "color theory: paleta încă nu și-a fixat suficient dominanta",
    colorScores.valueBalance >= 0.7
      ? "color theory: balanța lumină-întuneric ghidează citirea"
      : "color theory: contrastul valoric nu conduce încă destul de clar privirea",
    colorScores.saturationControl >= 0.7
      ? "color theory: saturația este controlată și intențională"
      : "color theory: saturația produce încă prea mult zgomot sau prea puțină tensiune",
    colorScores.colorRelations >= 0.72
      ? "color theory: relațiile cromatice susțin sistemul"
      : "color theory: opozițiile cromatice nu se susțin încă reciproc",
    colorScores.attentionImpact >= 0.72
      ? "color theory: paleta distribuie bine atenția"
      : "color theory: paleta nu organizează încă suficient focalizarea",
    colorValidity
      ? "color runtime: paleta trece explicit pragurile cromatice"
      : "color runtime: paleta nu trece încă toate pragurile cromatice explicite",
    colorRuntime.lawPassed
      ? "color law: paleta modifică sistemul percepției"
      : "color law: paleta nu modifică încă suficient sistemul percepției",
    crossModalAlignment >= 0.75
      ? "cross-modal alignment: textul și grafica converg"
      : "cross-modal alignment: textul și grafica încă nu spun același lucru",
    narrativeStructureFit >= 0.72
      ? "canon bridge: scenariul și structura împart același traseu de tensiune"
      : "canon bridge: scenariul și structura nu sunt încă suficient sincronizate",
    structureArtFit >= 0.72
      ? "canon bridge: structura și compoziția distribuie coerent privirea"
      : "canon bridge: structura și compoziția nu ghidează încă împreună privirea",
    shapeStructureFit >= 0.72
      ? "canon bridge: forma și structura împart aceeași logică spațială"
      : "canon bridge: forma și structura nu împart încă suficient aceeași logică spațială",
    shapeArtFit >= 0.72
      ? "canon bridge: forma și compoziția împing aceeași presiune vizuală"
      : "canon bridge: forma și compoziția nu împing încă aceeași presiune vizuală",
    artColorFit >= 0.72
      ? "canon bridge: compoziția și culoarea împing aceeași focalizare"
      : "canon bridge: compoziția și culoarea nu susțin încă aceeași focalizare",
    narrativeOutputFit >= 0.72
      ? "canon bridge: output-ul final păstrează urmele scenariului și ale structurii"
      : "canon bridge: output-ul final pierde încă o parte din logica internă a conceptului",
    shapeOutputFit >= 0.72
      ? "canon bridge: output-ul final păstrează și semnătura de formă"
      : "canon bridge: output-ul final pierde încă o parte din semnătura de formă",
    clockDisplay
      ? clockScenarioFit >= 0.72
        ? "time bridge: ceasul și scenariul împart același impuls de atenție"
        : "time bridge: ceasul și scenariul nu împart încă suficient același impuls de atenție"
      : "time bridge: scenariul nu primește încă sprijin temporal activ",
    clockDisplay
      ? clockStructureFit >= 0.72
        ? "time bridge: ceasul și structura distribuie coerent centrul și deriva"
        : "time bridge: ceasul și structura nu distribuie încă suficient coerent centrul și deriva"
      : "time bridge: structura nu este încă modulată temporal",
    clockDisplay
      ? clockArtFit >= 0.72
        ? "time bridge: ceasul și compoziția împing aceeași mișcare a privirii"
        : "time bridge: ceasul și compoziția nu împing încă aceeași mișcare a privirii"
      : "time bridge: compoziția nu primește încă ritm temporal activ",
    clockDisplay
      ? clockColorFit >= 0.72
        ? "time bridge: ceasul și culoarea susțin aceeași presiune perceptivă"
        : "time bridge: ceasul și culoarea nu susțin încă aceeași presiune perceptivă"
      : "time bridge: culoarea nu este încă acordată temporal",
    contaminationResolution >= 0.7
      ? "contamination resolution: contaminarea este integrată fără colaps"
      : "contamination resolution: contaminarea nu este încă metabolizată suficient",
    authorDilemmaResolution >= 0.76
      ? "author dilemma resolution: Artist AI formulează un răspuns recognoscibil"
      : "author dilemma resolution: răspunsul la dilemă rămâne incomplet",
    ...scenarioRuntime.notes.slice(-2),
    ...artRuntime.notes.slice(-2),
    ...structureRuntime.notes.slice(-2),
    ...shapeRuntime.notes.slice(-2),
    ...colorRuntime.notes.slice(-2),
  ];

  return {
    isValidConcept,
    resolutionStatus,
    axes,
    thresholds,
    scores: {
      semanticStability,
      visualConsistency,
      crossModalAlignment,
      crossCanonCoherence,
      timeArtCoherence,
      contaminationResolution,
      authorDilemmaResolution,
      shapeIdentity: shapeScores.identity,
      shapeRelation: shapeScores.relation,
      shapeTension: shapeScores.tension,
      shapeAttention: shapeScores.attention,
      grammarCoherence: grammarScores.coherence,
      grammarTransformation: grammarScores.transformation,
      grammarRelation: grammarScores.relation,
      grammarExpressivePower: grammarScores.expressivePower,
      metaStructure: metaScores.structure,
      metaCoherence: metaScores.coherence,
      metaAttention: metaScores.attention,
      metaIntegration: metaScores.integration,
      conflict: scenarioScores.conflict,
      tension: scenarioScores.tension,
      progression: scenarioScores.progression,
      meaning: scenarioScores.meaning,
      narrativeAttention: scenarioScores.attention,
      unity: artScores.unity,
      balance: artScores.balance,
      rhythm: artScores.rhythm,
      movement: artScores.movement,
      contrast: artScores.contrast,
      proportion: artScores.proportion,
      focus: artScores.focus,
      thirdsStructure: structureScores.thirds,
      goldenStructure: structureScores.golden,
      symmetryStructure: structureScores.symmetry,
      centerStructure: structureScores.center,
      structuralAttention: structureScores.attention,
      hueStructure: colorScores.hueStructure,
      valueBalance: colorScores.valueBalance,
      saturationControl: colorScores.saturationControl,
      colorRelations: colorScores.colorRelations,
      attentionImpact: colorScores.attentionImpact,
    },
    notes,
  };
}
