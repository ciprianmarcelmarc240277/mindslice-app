import type {
  ConceptExpression,
  ConceptOutput,
  ConceptStage,
  LiveInterference,
  ThoughtState,
} from "@/lib/mindslice/mindslice-types";

type BuildConceptOutputInput = {
  current: ThoughtState;
  stage: Extract<ConceptStage, "emergent" | "forming" | "stabilizing">;
  expression: ConceptExpression;
  thesis: string;
  tension: string;
  resolutionClaim: string;
  interference: LiveInterference | null;
};

function buildTextArtifact(
  current: ThoughtState,
  stage: Extract<ConceptStage, "emergent" | "forming" | "stabilizing">,
  thesis: string,
  tension: string,
  resolutionClaim: string,
  interference: LiveInterference | null,
) {
  const curatorText = [
    `${current.direction} intră în stadiul ${stage}.`,
    thesis,
    tension,
    resolutionClaim,
    interference
      ? `Influența ${interference.influenceMode} provenită din ${interference.title} rămâne activă în artefact.`
      : "Nu există contaminare externă activă în acest artefact.",
  ].join(" ");

  const publicText = [
    `${current.direction}.`,
    thesis,
    `Conceptul încearcă să rezolve: ${tension}`,
    `Rezolvare provizorie: ${resolutionClaim}`,
  ].join(" ");

  const prompt = [
    "Write a concise museum-wall text for this concept.",
    `Title: ${current.direction}`,
    `Stage: ${stage}`,
    `Thesis: ${thesis}`,
    `Tension: ${tension}`,
    `Resolution claim: ${resolutionClaim}`,
    interference
      ? `Interference: ${interference.influenceMode} via ${interference.title}`
      : "Interference: none",
  ].join("\n");

  return {
    title: `${current.direction} / text artifact`,
    curatorText,
    publicText,
    prompt,
  };
}

function buildVisualArtifact(
  current: ThoughtState,
  expression: ConceptExpression,
  stage: Extract<ConceptStage, "emergent" | "forming" | "stabilizing">,
  interference: LiveInterference | null,
) {
  const summary = [
    `${current.direction} este tratat ca un câmp tipografic ${expression.compositionMode}.`,
    `Semnătura vizuală urmărește ${expression.visualSignature}.`,
    expression.scenario.outputText,
    expression.artComposition.outputText,
    interference
      ? `Contaminarea ${interference.influenceMode} modifică ritmul fără să anuleze centrul.`
      : "Centrul vizual este construit fără contaminare externă.",
  ].join(" ");

  const compositionBrief = [
    `Stage ${stage}`,
    `Typography ${expression.typographyMode}`,
    `Motion ${expression.motionMode}`,
    `Palette ${expression.palette.dominant} / ${expression.palette.secondary} / ${expression.palette.accent}`,
    `Scenario ${expression.scenario.outputStructure}`,
    `Focus ${expression.artComposition.focusNode}`,
    `Fragments ${expression.dominantFragments.join(", ")}`,
    `Keywords ${expression.dominantKeywords.join(", ")}`,
  ].join(" · ");

  const visualPrompt = [
    "Create a conceptual exhibition visual.",
    `Concept: ${current.direction}`,
    `Visual signature: ${expression.visualSignature}`,
    `Composition: ${expression.compositionMode}`,
    `Scenario: ${expression.scenario.outputStructure}`,
    `Art composition: ${expression.artComposition.outputVisual}`,
    `Typography mode: ${expression.typographyMode}`,
    `Motion mode: ${expression.motionMode}`,
    `Mood: ${current.mood}`,
    `Palette: ${current.palette.join(", ")}`,
    `Materials: ${current.materials.join(", ")}`,
    `Keywords: ${expression.dominantKeywords.join(", ")}`,
    interference
      ? `Contamination trace: ${interference.influenceMode} / ${interference.title}`
      : "Contamination trace: none",
  ].join("\n");

  return {
    title: `${current.direction} / visual artifact`,
    summary,
    compositionBrief,
    visualPrompt,
  };
}

export function buildConceptOutput(input: BuildConceptOutputInput): ConceptOutput {
  const { current, stage, expression, thesis, tension, resolutionClaim, interference } = input;

  return {
    textArtifact: buildTextArtifact(
      current,
      stage,
      thesis,
      tension,
      resolutionClaim,
      interference,
    ),
    visualArtifact: buildVisualArtifact(
      current,
      expression,
      stage,
      interference,
    ),
  };
}
