"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ConceptMemoryEntry } from "@/lib/mindslice/mindslice-types";
import styles from "../page.module.css";

type ConceptArchiveViewProps = {
  conceptArchive: ConceptMemoryEntry[];
  isLoading: boolean;
  canViewArtistThinking: boolean;
};

type ArchiveFilter = "all" | "canonical" | "system-changing";
type ArchiveSort = "recent" | "stable" | "impact";

function matchesArchiveSearch(entry: ConceptMemoryEntry, query: string) {
  if (!query.trim()) {
    return true;
  }

  const haystack = [
    entry.concept.core.title,
    entry.concept.core.oneLineDefinition,
    entry.concept.core.thesis,
    entry.concept.core.tension,
    entry.concept.core.resolutionClaim,
    entry.concept.expression.visualSignature,
    ...entry.concept.core.keywords,
    ...entry.concept.expression.dominantFragments,
    ...(entry.concept.provenance.sourceAuthorPseudonyms ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}

function getStabilityScore(entry: ConceptMemoryEntry) {
  return (
    entry.validation.scores.semanticStability * 0.32 +
    entry.validation.scores.visualConsistency * 0.18 +
    entry.validation.scores.crossModalAlignment * 0.24 +
    entry.concept.confidence.overall * 0.26
  );
}

function getImpactScore(entry: ConceptMemoryEntry) {
  const systemEffect = entry.concept.systemEffect;
  if (!systemEffect?.modifiesSystem) {
    return 0;
  }

  return (
    systemEffect.probabilityBias * 0.38 +
    systemEffect.contaminationBias * 0.28 +
    systemEffect.attentionShift * 0.24 +
    (entry.concept.stage === "canonical" ? 0.1 : 0)
  );
}

export function ConceptArchiveView(props: ConceptArchiveViewProps) {
  const { conceptArchive, isLoading, canViewArtistThinking } = props;
  const [activeFilter, setActiveFilter] = useState<ArchiveFilter>("all");
  const [activeSort, setActiveSort] = useState<ArchiveSort>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const visibleArchive = useMemo(() => {
    const filteredArchive = (() => {
      if (activeFilter === "canonical") {
        return conceptArchive.filter((entry) => entry.concept.stage === "canonical");
      }

      if (activeFilter === "system-changing") {
        return conceptArchive.filter((entry) => entry.concept.systemEffect?.modifiesSystem);
      }

      return conceptArchive;
    })();

    const searchedArchive = filteredArchive.filter((entry) =>
      matchesArchiveSearch(entry, searchQuery),
    );

    return [...searchedArchive].sort((left, right) => {
      if (activeSort === "stable") {
        return getStabilityScore(right) - getStabilityScore(left);
      }

      if (activeSort === "impact") {
        return getImpactScore(right) - getImpactScore(left);
      }

      return new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime();
    });
  }, [activeFilter, activeSort, conceptArchive, searchQuery]);

  const filterLabel =
    activeFilter === "canonical"
      ? "Canonical concepts"
      : activeFilter === "system-changing"
        ? "System-changing concepts"
        : "All public concepts";

  const sortLabel =
    activeSort === "stable"
      ? "cele mai stabile"
      : activeSort === "impact"
        ? "impact mare asupra sistemului"
        : "cele mai recente";

  return (
    <>
      <section className={styles.archiveIntro}>
        <span className={styles.panelMarker}>PANEL · Concept Archive</span>
        <p className={styles.eyebrow}>Public Concept Archive</p>
        <h2>Conceptele pe care Artist AI le-a rezolvat deja</h2>
        <p className={styles.blogIntro}>
          Aici nu vezi gândirea live în desfășurare, ci conceptele care au trecut prin
          formare, validare și promovare. Archive rămâne public; câmpul live al Artistului AI
          rămâne accesibil doar din cont.
        </p>
        {!canViewArtistThinking ? (
          <p className={styles.accountHint}>
            Fără cont poți vizita arhiva conceptelor, dar nu poți intra în scena unde Artist
            AI gândește live.
          </p>
        ) : null}
      </section>

      <section className={styles.blogSection}>
        <span className={styles.panelMarker}>PANEL · Resolved Concepts</span>
        <div className={styles.blogHeading}>
          <p className={styles.eyebrow}>Concept Memory</p>
          <h2>Memoria publică a conceptelor</h2>
          <p className={styles.blogIntro}>
            Fiecare intrare de mai jos este o idee care a trecut prin tensiune, contaminare și
            convergență până a devenit concept recognoscibil.
          </p>
          <div className={styles.modeTabs}>
            <button
              type="button"
              className={`${styles.modeTab} ${activeFilter === "all" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              Toate
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${activeFilter === "canonical" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveFilter("canonical")}
            >
              Canonical
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${activeFilter === "system-changing" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveFilter("system-changing")}
            >
              System-changing
            </button>
          </div>
          <div className={styles.modeTabs}>
            <button
              type="button"
              className={`${styles.modeTab} ${activeSort === "recent" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveSort("recent")}
            >
              Cele mai recente
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${activeSort === "stable" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveSort("stable")}
            >
              Cele mai stabile
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${activeSort === "impact" ? styles.modeTabActive : ""}`}
              onClick={() => setActiveSort("impact")}
            >
              Impact mare
            </button>
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Caută după titlu, keywords, thesis sau pseudonim"
            className={styles.accountInput}
          />
          <p className={styles.blogByline}>
            {filterLabel} · sortate după {sortLabel} · {isLoading ? "..." : visibleArchive.length} rezultate
          </p>
        </div>
        <div className={styles.conceptArchiveGrid}>
          {isLoading ? (
            <article className={styles.blogCard}>
              <span className={styles.blogMeta}>Se încarcă</span>
              <h3>Concept Archive</h3>
              <p>Arhiva publică a conceptelor este în curs de încărcare.</p>
            </article>
          ) : visibleArchive.length ? (
            visibleArchive.map((entry) => (
              <Link
                key={entry.id}
                href={`/concepts/${entry.concept.id}`}
                className={`${styles.blogCard} ${styles.conceptArchiveCard}`}
              >
                <span className={styles.blogMeta}>
                  {entry.concept.stage} · {entry.validation.resolutionStatus}
                </span>
                {entry.concept.systemEffect?.modifiesSystem ? (
                  <span className={styles.blogAiResponseLabel}>System-changing concept</span>
                ) : null}
                <h3>{entry.concept.core.title}</h3>
                <p className={styles.blogByline}>{entry.concept.core.oneLineDefinition}</p>
                {(entry.concept.provenance.sourceAuthorPseudonyms ?? []).length ? (
                  <p className={styles.blogByline}>
                    Influențat de: {(entry.concept.provenance.sourceAuthorPseudonyms ?? []).join(", ")}
                  </p>
                ) : null}
                <p className={styles.blogContentPreview}>{entry.concept.core.thesis}</p>
                <div className={styles.conceptArchiveSignature}>
                  <span className={styles.blogAiResponseLabel}>Concept Signature</span>
                  <p>{entry.concept.expression.visualSignature}</p>
                </div>
                <div className={styles.conceptArchiveKeywords}>
                  {entry.concept.core.keywords.slice(0, 4).map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
                <strong>
                  semantic {entry.validation.scores.semanticStability.toFixed(2)} · visual{" "}
                  {entry.validation.scores.visualConsistency.toFixed(2)} · cross-modal{" "}
                  {entry.validation.scores.crossModalAlignment.toFixed(2)}
                </strong>
                {activeSort === "stable" ? (
                  <p className={styles.blogByline}>
                    Stabilitate {getStabilityScore(entry).toFixed(2)}
                  </p>
                ) : null}
                {activeSort === "impact" ? (
                  <p className={styles.blogByline}>
                    Impact de sistem {getImpactScore(entry).toFixed(2)}
                  </p>
                ) : null}
                {entry.concept.systemEffect?.modifiesSystem ? (
                  <p className={styles.blogByline}>
                    Modifică sistemul:{" "}
                    {entry.concept.systemEffect.sourceConceptTitle ?? entry.concept.core.title}
                  </p>
                ) : null}
              </Link>
            ))
          ) : (
            <article className={styles.blogCard}>
              <span className={styles.blogMeta}>Niciun rezultat</span>
              <h3>Filtrul curent nu are încă intrări</h3>
              <p>
                Artist AI nu a promovat încă niciun concept public în această categorie.
              </p>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
