import Link from "next/link";
import { notFound } from "next/navigation";
import { ConceptArtCompositionVisual } from "@/app/components/concept-art-composition-visual";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ConceptPaletteVisual } from "@/app/components/concept-palette-visual";
import type {
  ConceptArtifact,
  ConceptState,
  ConceptValidationResult,
} from "@/lib/mindslice/mindslice-types";
import styles from "./page.module.css";

type ConceptDetailRow = {
  id: string;
  concept_key: string;
  concept_state: ConceptState;
  validation_result: ConceptValidationResult;
  created_at: string;
  updated_at: string;
};

async function getConceptDetail(conceptId: string) {
  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return null;
  }

  const { data: concept } = await supabase
    .from("concepts")
    .select("id, concept_key, concept_state, validation_result, created_at, updated_at")
    .eq("concept_key", conceptId)
    .in("stage", ["resolved", "canonical"])
    .single();

  if (!concept) {
    return null;
  }

  const { data: artifacts } = await supabase
    .from("concept_artifacts")
    .select("id, concept_id, artifact_type, content_text, content_json, image_url, created_at, updated_at")
    .eq("concept_id", concept.id)
    .order("created_at", { ascending: false });

  return {
    concept: concept as ConceptDetailRow,
    artifacts: (artifacts ?? []) as ConceptArtifact[],
  };
}

export default async function ConceptDetailPage(
  props: { params: Promise<{ conceptId: string }> },
) {
  const { conceptId } = await props.params;
  const data = await getConceptDetail(conceptId);

  if (!data) {
    notFound();
  }

  const { concept, artifacts } = data;
  const textArtifact = artifacts.find((entry) => entry.artifact_type === "text");
  const graphArtifact = artifacts.find((entry) => entry.artifact_type === "graph_state");
  const systemArtifact = artifacts.find((entry) => entry.artifact_type === "hybrid");
  const promptArtifact = artifacts.find((entry) => entry.artifact_type === "prompt");
  const palette = concept.concept_state.expression.palette;
  const artComposition = concept.concept_state.expression.artComposition;
  const scenario = concept.concept_state.expression.scenario;

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.backLink}>
        Înapoi la Concept Archive
      </Link>

      <section className={styles.hero}>
        <span className={styles.marker}>Public Concept</span>
        <h1>{concept.concept_state.core.title}</h1>
        <p className={styles.lede}>{concept.concept_state.core.oneLineDefinition}</p>
        <div className={styles.meta}>
          <span className={styles.pill}>{concept.concept_state.stage}</span>
          <span className={styles.pill}>{concept.validation_result.resolutionStatus}</span>
          <span className={styles.pill}>
            overall {concept.concept_state.confidence.overall.toFixed(2)}
          </span>
        </div>
      </section>

      <div className={styles.layout}>
        <div className={styles.stack}>
          <section className={styles.section}>
            <span className={styles.marker}>Thesis</span>
            <h2>Teza conceptului</h2>
            <p className={styles.text}>{concept.concept_state.core.thesis}</p>
          </section>

          <section className={styles.section}>
            <span className={styles.marker}>Tension</span>
            <h2>Tensiunea pe care o rezolvă</h2>
            <p className={styles.text}>{concept.concept_state.core.tension}</p>
          </section>

          <section className={styles.section}>
            <span className={styles.marker}>Resolution</span>
            <h2>Claim de rezolvare</h2>
            <p className={styles.text}>{concept.concept_state.core.resolutionClaim}</p>
          </section>

          <section className={styles.section}>
            <span className={styles.marker}>Influence</span>
            <h2>Cine a influențat Artist AI</h2>
            <p className={styles.text}>
              {(concept.concept_state.provenance.sourceAuthorPseudonyms ?? []).length
                ? (concept.concept_state.provenance.sourceAuthorPseudonyms ?? []).join(", ")
                : "Acest concept nu are încă influență umană publică atașată în memorie."}
            </p>
          </section>

          <section className={styles.section}>
            <span className={styles.marker}>Artifacts</span>
            <h2>Artefactele conceptului</h2>
            {concept.concept_state.output?.textArtifact ? (
              <div className={styles.artifactBox}>
                <strong>{concept.concept_state.output.textArtifact.title}</strong>
                <p className={styles.text}>{concept.concept_state.output.textArtifact.publicText}</p>
                <p className={styles.text}>{concept.concept_state.output.textArtifact.curatorText}</p>
              </div>
            ) : textArtifact?.content_text ? (
              <div className={styles.artifactBox}>
                <pre>{textArtifact.content_text}</pre>
              </div>
            ) : null}
            {concept.concept_state.output?.visualArtifact ? (
              <div className={styles.artifactBox}>
                <strong>{concept.concept_state.output.visualArtifact.title}</strong>
                <p className={styles.text}>{concept.concept_state.output.visualArtifact.summary}</p>
                <p className={styles.text}>{concept.concept_state.output.visualArtifact.compositionBrief}</p>
              </div>
            ) : graphArtifact?.content_text ? (
              <div className={styles.artifactBox}>
                <pre>{graphArtifact.content_text}</pre>
              </div>
            ) : null}
            {systemArtifact?.content_text ? (
              <div className={styles.artifactBox}>
                <pre>{systemArtifact.content_text}</pre>
              </div>
            ) : null}
            {promptArtifact?.content_text ? (
              <div className={styles.artifactBox}>
                <pre>{promptArtifact.content_text}</pre>
              </div>
            ) : null}
          </section>

          <section className={styles.section}>
            <span className={styles.marker}>Visual Brief</span>
            <h2>Ieșirea vizuală autonomă</h2>
            <ConceptPaletteVisual
              expression={concept.concept_state.expression}
              compositionBrief={concept.concept_state.output?.visualArtifact.compositionBrief}
            />
            <ConceptArtCompositionVisual expression={concept.concept_state.expression} />
            <p className={styles.text}>
              {concept.concept_state.output?.visualArtifact.summary ??
                concept.concept_state.expression.visualSignature}
            </p>
            <div className={styles.artifactBox}>
              <pre>
                {concept.concept_state.output?.visualArtifact.compositionBrief ??
                  "Fără brief vizual explicit încă."}
              </pre>
            </div>
            {palette ? (
              <div className={styles.artifactBox}>
                <strong>Sistem cromatic</strong>
                <p className={styles.text}>{palette.outputText}</p>
                <ul className={styles.list}>
                  <li>dominantă: {palette.dominant}</li>
                  <li>secundară: {palette.secondary}</li>
                  <li>accent: {palette.accent}</li>
                  <li>suport: {palette.supportTones.length ? palette.supportTones.join(", ") : "niciunul"}</li>
                </ul>
              </div>
            ) : null}
            {artComposition ? (
              <div className={styles.artifactBox}>
                <strong>Sistem compozițional</strong>
                <p className={styles.text}>{artComposition.outputText}</p>
                <ul className={styles.list}>
                  <li>focus node: {artComposition.focusNode}</li>
                  <li>unity: {artComposition.unityMap.length ? artComposition.unityMap.join(", ") : "niciun raport încă"}</li>
                  <li>balance: {artComposition.balanceMap.length ? artComposition.balanceMap.join(", ") : "niciun raport încă"}</li>
                  <li>rhythm: {artComposition.rhythmMap.length ? artComposition.rhythmMap.join(", ") : "niciun raport încă"}</li>
                </ul>
              </div>
            ) : null}
            {scenario ? (
              <div className={styles.artifactBox}>
                <strong>Sistem narativ</strong>
                <p className={styles.text}>{scenario.outputText}</p>
                <ul className={styles.list}>
                  <li>conflict central: {scenario.coreConflict}</li>
                  <li>motor de personaj: {scenario.characterDrive}</li>
                  <li>stakes: {scenario.stakes}</li>
                  <li>turning points: {scenario.turningPoints.length ? scenario.turningPoints.join(", ") : "niciun prag încă"}</li>
                  <li>tension curve: {scenario.tensionCurve.length ? scenario.tensionCurve.join(", ") : "niciun traseu încă"}</li>
                  <li>resolution: {scenario.resolution}</li>
                </ul>
              </div>
            ) : null}
          </section>
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.sidebarCard}>
            <span className={styles.marker}>System Effect</span>
            <h2>Modificare de sistem</h2>
            <p className={styles.text}>
              {concept.concept_state.systemEffect?.modifiesSystem
                ? "Acest concept a schimbat efectiv distribuția internă a Artist AI."
                : "Acest concept este arhivat, dar nu a produs încă o modificare persistentă de sistem."}
            </p>
            <ul className={styles.list}>
              <li>source: {concept.concept_state.systemEffect?.sourceConceptTitle ?? concept.concept_state.core.title}</li>
              <li>
                preferred influence: {concept.concept_state.systemEffect?.preferredInfluenceMode ?? "none"}
              </li>
              <li>
                probability bias: {concept.concept_state.systemEffect
                  ? concept.concept_state.systemEffect.probabilityBias.toFixed(2)
                  : "0.00"}
              </li>
              <li>
                attention shift: {concept.concept_state.systemEffect
                  ? concept.concept_state.systemEffect.attentionShift.toFixed(2)
                  : "0.00"}
              </li>
              <li>
                reuse weight: {concept.concept_state.systemEffect
                  ? concept.concept_state.systemEffect.probabilities.conceptReuseWeight.toFixed(2)
                  : "0.00"}
              </li>
              <li>
                resistance: {concept.concept_state.systemEffect
                  ? concept.concept_state.systemEffect.contaminationPattern.resistanceWeight.toFixed(2)
                  : "0.00"}
              </li>
              <li>
                anchor weight: {concept.concept_state.systemEffect
                  ? concept.concept_state.systemEffect.attentionDistribution.anchorWeight.toFixed(2)
                  : "0.00"}
              </li>
            </ul>
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.marker}>Canon</span>
            <h2>Poziție în canon</h2>
            <p className={styles.text}>
              {concept.concept_state.stage === "canonical"
                ? "Conceptul a intrat în canonul activ al Artist AI și poate funcționa ca doctrină pentru runtime-ul viitor."
                : "Conceptul este arhivat și validat, dar nu a intrat încă în canonul activ."}
            </p>
            <ul className={styles.list}>
              <li>canon cluster: {concept.concept_state.memory.canonClusterId ?? "none"}</li>
              <li>parent concepts: {concept.concept_state.memory.parentConceptIds.length}</li>
              <li>sibling concepts: {concept.concept_state.memory.siblingConceptIds.length}</li>
              <li>descendant concepts: {concept.concept_state.memory.descendantConceptIds.length}</li>
            </ul>
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.marker}>Scores</span>
            <h2>Validare</h2>
            <div className={styles.scores}>
              {[
                ["Semantic", concept.validation_result.scores.semanticStability],
                ["Visual", concept.validation_result.scores.visualConsistency],
                ["Unity", concept.validation_result.scores.unity ?? 0],
                ["Balance", concept.validation_result.scores.balance ?? 0],
                ["Rhythm", concept.validation_result.scores.rhythm ?? 0],
                ["Movement", concept.validation_result.scores.movement ?? 0],
                ["Contrast", concept.validation_result.scores.contrast ?? 0],
                ["Proportion", concept.validation_result.scores.proportion ?? 0],
                ["Focus", concept.validation_result.scores.focus ?? 0],
                ["Hue Structure", concept.validation_result.scores.hueStructure ?? 0],
                ["Value Balance", concept.validation_result.scores.valueBalance ?? 0],
                ["Saturation Control", concept.validation_result.scores.saturationControl ?? 0],
                ["Color Relations", concept.validation_result.scores.colorRelations ?? 0],
                ["Attention Impact", concept.validation_result.scores.attentionImpact ?? 0],
                ["Cross-modal", concept.validation_result.scores.crossModalAlignment],
                ["Contamination", concept.validation_result.scores.contaminationResolution],
                [
                  "Dilemma Resolution",
                  concept.validation_result.scores.authorDilemmaResolution,
                ],
              ].map(([label, score]) => (
                <div key={label} className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>
                    {label} · {Number(score).toFixed(2)}
                  </span>
                  <div className={styles.scoreBar}>
                    <div className={styles.scoreFill} style={{ width: `${Number(score) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.marker}>Signature</span>
            <h2>Expresie</h2>
            <p className={styles.text}>{concept.concept_state.expression.visualSignature}</p>
            <ul className={styles.list}>
              {concept.concept_state.expression.dominantFragments.map((fragment) => (
                <li key={fragment}>{fragment}</li>
              ))}
            </ul>
          </section>

          <section className={styles.sidebarCard}>
            <span className={styles.marker}>Notes</span>
            <h2>Note de validare</h2>
            <ul className={styles.list}>
              {concept.validation_result.notes.map((note) => (
                <li key={note} className={styles.note}>
                  {note}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
