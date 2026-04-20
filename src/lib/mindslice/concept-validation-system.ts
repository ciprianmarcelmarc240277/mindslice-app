import {
  evaluateArtComposition,
  validArtComposition,
} from "@/lib/mindslice/concept-art-composition-system";
import {
  evaluateScenario,
  validScenario,
} from "@/lib/mindslice/concept-scenario-system";
import {
  deriveDynamicConceptThresholds,
  validConcept,
} from "@/lib/mindslice/concept-threshold-system";
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

function deriveResolutionStatus(
  isValidConcept: boolean,
  semanticStability: number,
  contaminationResolution: number,
  authorDilemmaResolution: number,
): ConceptResolutionStatus {
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

  const isValidConcept = validConcept(axes, thresholds);

  const resolutionStatus = deriveResolutionStatus(
    isValidConcept,
    semanticStability,
    contaminationResolution,
    authorDilemmaResolution,
  );

  const notes = [
    `praguri dinamice: organizare internă ≥ ${thresholds.structure.toFixed(2)} / sens ≥ ${thresholds.sense.toFixed(2)} / focalizare conceptuală ≥ ${thresholds.attention.toFixed(2)} / coerență ≥ ${thresholds.coherence.toFixed(2)}`,
    `axe curente: organizare internă ${axes.structure.toFixed(2)} / sens ${axes.sense.toFixed(2)} / focalizare conceptuală ${axes.attention.toFixed(2)} / coerență ${axes.coherence.toFixed(2)}`,
    semanticStability >= 0.78
      ? "semantic stability: teza începe să se repete coerent"
      : "semantic stability: teza încă fluctuează",
    visualConsistency >= 0.72
      ? "visual consistency: scena păstrează o identitate recognoscibilă"
      : "visual consistency: limbajul vizual încă nu s-a stabilizat",
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
    contaminationResolution >= 0.7
      ? "contamination resolution: contaminarea este integrată fără colaps"
      : "contamination resolution: contaminarea nu este încă metabolizată suficient",
    authorDilemmaResolution >= 0.76
      ? "author dilemma resolution: Artist AI formulează un răspuns recognoscibil"
      : "author dilemma resolution: răspunsul la dilemă rămâne incomplet",
    ...scenarioRuntime.notes.slice(-2),
    ...artRuntime.notes.slice(-2),
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
      contaminationResolution,
      authorDilemmaResolution,
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
      hueStructure: colorScores.hueStructure,
      valueBalance: colorScores.valueBalance,
      saturationControl: colorScores.saturationControl,
      colorRelations: colorScores.colorRelations,
      attentionImpact: colorScores.attentionImpact,
    },
    notes,
  };
}
