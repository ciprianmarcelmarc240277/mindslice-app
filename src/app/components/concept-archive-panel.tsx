"use client";

import type { ConceptMemoryEntry } from "@/lib/mindslice/mindslice-types";
import styles from "../page.module.css";

type ConceptArchivePanelProps = {
  conceptArchive: ConceptMemoryEntry[];
  isLoading: boolean;
};

export function ConceptArchivePanel(props: ConceptArchivePanelProps) {
  const { conceptArchive, isLoading } = props;
  const canonicalConcepts = conceptArchive.filter((entry) => entry.concept.stage === "canonical");
  const resolvedConcepts = conceptArchive.filter((entry) => entry.validation.isValidConcept);
  const systemChangingConcepts = conceptArchive.filter(
    (entry) => entry.concept.systemEffect?.modifiesSystem,
  );

  return (
    <>
      <section className={styles.panelBlock}>
        <span className={styles.panelMarker}>PANEL · Archive Stats</span>
        <h2>Concept Archive</h2>
        <div className={styles.detailList}>
          <div>
            <span>Total</span>
            <strong>{isLoading ? "..." : conceptArchive.length}</strong>
          </div>
          <div>
            <span>Resolved</span>
            <strong>{isLoading ? "..." : resolvedConcepts.length}</strong>
          </div>
          <div>
            <span>Canonical</span>
            <strong>{isLoading ? "..." : canonicalConcepts.length}</strong>
          </div>
          <div>
            <span>System-changing</span>
            <strong>{isLoading ? "..." : systemChangingConcepts.length}</strong>
          </div>
        </div>
      </section>

      <section className={styles.panelBlock}>
        <span className={styles.panelMarker}>PANEL · Recent Concepts</span>
        <h2>Concepte recente</h2>
        <ul className={styles.savedList}>
          {isLoading ? (
            <li>
              <p>Arhiva conceptelor se încarcă.</p>
            </li>
          ) : conceptArchive.length ? (
            conceptArchive.slice(0, 8).map((entry) => (
              <li key={entry.id}>
                <span className={styles.historyTime}>
                  {new Date(entry.lastSeenAt).toLocaleString("ro-RO", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <strong>{entry.concept.core.title}</strong>
                <p>{entry.concept.core.oneLineDefinition}</p>
                {(entry.concept.provenance.sourceAuthorPseudonyms ?? []).length ? (
                  <p>influență: {(entry.concept.provenance.sourceAuthorPseudonyms ?? []).join(", ")}</p>
                ) : null}
                <span className={styles.draftStatus}>
                  {entry.concept.stage} · {entry.validation.resolutionStatus}
                </span>
                {entry.concept.systemEffect?.modifiesSystem ? (
                  <span className={styles.blogMeta}>modifică sistemul</span>
                ) : null}
              </li>
            ))
          ) : (
            <li>
              <p>Niciun concept public încă.</p>
            </li>
          )}
        </ul>
      </section>
    </>
  );
}
