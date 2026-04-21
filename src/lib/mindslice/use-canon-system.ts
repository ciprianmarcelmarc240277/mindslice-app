"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CANON_STORAGE_KEY, CANON_UPDATED_EVENT, readCanon, writeCanon } from "@/lib/mindslice/canon-storage";
import type { CanonEntry, ConceptMemoryEntry } from "@/lib/mindslice/mindslice-types";

type UseCanonSystemOptions = {
  isSignedIn: boolean;
  conceptMemory: ConceptMemoryEntry[];
};

function buildMemoryFingerprint(conceptMemory: ConceptMemoryEntry[]) {
  return conceptMemory
    .map((entry) => [entry.id, entry.concept.stage, entry.lastSeenAt].join(":"))
    .join("|");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useCanonSystem({ isSignedIn, conceptMemory }: UseCanonSystemOptions) {
  const [canon, setCanon] = useState<CanonEntry[]>(() => readCanon());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncCanon() {
      setCanon(readCanon());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== CANON_STORAGE_KEY) {
        return;
      }

      syncCanon();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CANON_UPDATED_EVENT, syncCanon);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CANON_UPDATED_EVENT, syncCanon);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const fingerprint = buildMemoryFingerprint(conceptMemory);
    if (lastFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readCanon();
    const canonicalEntries = conceptMemory
      .filter((entry) => entry.concept.stage === "canonical")
      .map((entry) => {
        const siblingCanonIds = conceptMemory
          .filter(
            (candidate) =>
              candidate.concept.stage === "canonical" &&
              candidate.concept.provenance.sourceIdeaId === entry.concept.provenance.sourceIdeaId &&
              candidate.id !== entry.id,
          )
          .map((candidate) => candidate.id)
          .slice(0, 6);

        const previousEntry = previous.find((candidate) => candidate.id === entry.id);
        const sourceIdeaCanonCount = siblingCanonIds.length + 1;
        const subcanonClusterStrength = clamp(
          entry.validation.scores.crossCanonCoherence * 0.34 +
            entry.validation.scores.narrativeAttention * 0.16 +
            entry.validation.scores.focus * 0.16 +
            entry.validation.scores.structuralAttention * 0.16 +
            entry.validation.scores.attentionImpact * 0.18,
          0,
          1,
        );
        const influenceWeight = clamp(
          entry.concept.confidence.overall * 0.45 +
            entry.validation.scores.crossModalAlignment * 0.2 +
            entry.validation.scores.crossCanonCoherence * 0.15 +
            entry.validation.scores.authorDilemmaResolution * 0.12 +
            subcanonClusterStrength * 0.12 +
            Math.min(sourceIdeaCanonCount, 4) * 0.04,
          0,
          1,
        );

        return {
          id: entry.id,
          concept: entry.concept,
          validation: entry.validation,
          canonizedAt: previousEntry?.canonizedAt ?? entry.storedAt,
          lastActivatedAt: entry.lastSeenAt,
          lineage: {
            siblingCanonIds,
            sourceIdeaCanonCount,
          },
          influenceWeight,
        } satisfies CanonEntry;
      });

    const next = [
      ...canonicalEntries,
      ...previous.filter((entry) => !canonicalEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 24);

    lastFingerprintRef.current = fingerprint;
    writeCanon(next);
  }, [conceptMemory, isSignedIn]);

  const visibleCanon = useMemo(() => (isSignedIn ? canon : []), [canon, isSignedIn]);
  const primaryCanon = visibleCanon[0] ?? null;

  return {
    canon: visibleCanon,
    canonCount: visibleCanon.length,
    primaryCanon,
  };
}
