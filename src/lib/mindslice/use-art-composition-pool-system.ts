"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ART_COMPOSITION_POOL_STORAGE_KEY,
  ART_COMPOSITION_POOL_UPDATED_EVENT,
  readArtCompositionPool,
  writeArtCompositionPool,
} from "@/lib/mindslice/art-composition-pool-storage";
import type {
  ArtCompositionPoolEntry,
  ConceptPoolEntry,
} from "@/lib/mindslice/mindslice-types";

type UseArtCompositionPoolSystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  conceptPool: ConceptPoolEntry[];
};

function buildPoolFingerprint(conceptPool: ConceptPoolEntry[]) {
  return conceptPool
    .map((entry) => {
      const composition = entry.concept.expression.artComposition;
      return [
        entry.id,
        entry.concept.stage,
        composition?.focusNode ?? "none",
        composition?.runtime.contaminationMode ?? "none",
      ].join(":");
    })
    .join("|");
}

export function useArtCompositionPoolSystem({
  isSignedIn,
  isActive,
  conceptPool,
}: UseArtCompositionPoolSystemOptions) {
  const [artCompositionPool, setArtCompositionPool] = useState<ArtCompositionPoolEntry[]>(() =>
    readArtCompositionPool(),
  );
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncArtCompositionPool() {
      setArtCompositionPool(readArtCompositionPool());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== ART_COMPOSITION_POOL_STORAGE_KEY) {
        return;
      }

      syncArtCompositionPool();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(ART_COMPOSITION_POOL_UPDATED_EVENT, syncArtCompositionPool);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ART_COMPOSITION_POOL_UPDATED_EVENT, syncArtCompositionPool);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || !isActive || !conceptPool.length) {
      return;
    }

    const fingerprint = buildPoolFingerprint(conceptPool);
    if (lastFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readArtCompositionPool();
    const nextEntries = conceptPool
      .filter((entry) => entry.concept.expression.artComposition)
      .map((entry) => {
        const now = new Date().toISOString();
        const existing = previous.find((candidate) => candidate.id === entry.id);
        return {
          id: entry.id,
          conceptId: entry.concept.id,
          conceptTitle: entry.concept.core.title,
          sourceIdeaId: entry.concept.provenance.sourceIdeaId,
          stage: entry.concept.stage,
          composition: entry.concept.expression.artComposition,
          validation: {
            unity: entry.validation.scores.unity,
            balance: entry.validation.scores.balance,
            rhythm: entry.validation.scores.rhythm,
            movement: entry.validation.scores.movement,
            contrast: entry.validation.scores.contrast,
            proportion: entry.validation.scores.proportion,
            focus: entry.validation.scores.focus,
          },
          pooledAt: existing?.pooledAt ?? now,
          lastSeenAt: now,
          source: entry.source,
        } satisfies ArtCompositionPoolEntry;
      });

    const next = [
      ...nextEntries,
      ...previous.filter((entry) => !nextEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 32);

    lastFingerprintRef.current = fingerprint;
    writeArtCompositionPool(next);
  }, [conceptPool, isActive, isSignedIn]);

  const latestArtCompositionPoolEntry = artCompositionPool[0] ?? null;
  const activeArtCompositionPoolEntry = useMemo(
    () =>
      artCompositionPool.find((entry) => entry.source === "active_runtime") ??
      latestArtCompositionPoolEntry,
    [artCompositionPool, latestArtCompositionPoolEntry],
  );

  return {
    artCompositionPool,
    artCompositionPoolCount: artCompositionPool.length,
    latestArtCompositionPoolEntry,
    activeArtCompositionPoolEntry,
  };
}
