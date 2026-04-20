"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ART_CANON_STORAGE_KEY,
  ART_CANON_UPDATED_EVENT,
  readArtCanon,
  writeArtCanon,
} from "@/lib/mindslice/art-canon-storage";
import { isArtCanonical } from "@/lib/mindslice/concept-art-composition-system";
import type {
  ArtCanonEntry,
  ArtMemoryEntry,
} from "@/lib/mindslice/mindslice-types";

type UseArtCanonSystemOptions = {
  isSignedIn: boolean;
  artMemory: ArtMemoryEntry[];
};

function buildMemoryFingerprint(artMemory: ArtMemoryEntry[]) {
  return artMemory
    .map((entry) => [entry.id, entry.stage, entry.lastSeenAt].join(":"))
    .join("|");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useArtCanonSystem({ isSignedIn, artMemory }: UseArtCanonSystemOptions) {
  const [artCanon, setArtCanon] = useState<ArtCanonEntry[]>(() => readArtCanon());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncArtCanon() {
      setArtCanon(readArtCanon());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== ART_CANON_STORAGE_KEY) {
        return;
      }

      syncArtCanon();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(ART_CANON_UPDATED_EVENT, syncArtCanon);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ART_CANON_UPDATED_EVENT, syncArtCanon);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const fingerprint = buildMemoryFingerprint(artMemory);
    if (lastFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readArtCanon();
    const canonicalEntries = artMemory
      .filter((entry) => {
        const sourceIdeaCanonCount = artMemory.filter(
          (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId,
        ).length;
        return isArtCanonical({
          composition: entry.composition,
          validation: entry.validation,
          stage: entry.stage,
          sourceIdeaCanonCount,
        });
      })
      .map((entry) => {
        const siblingCanonIds = artMemory
          .filter(
            (candidate) =>
              candidate.sourceIdeaId === entry.sourceIdeaId &&
              candidate.id !== entry.id,
          )
          .map((candidate) => candidate.id)
          .slice(0, 6);

        const previousEntry = previous.find((candidate) => candidate.id === entry.id);
        const sourceIdeaCanonCount = siblingCanonIds.length + 1;
        const influenceWeight = clamp(
          entry.validation.focus * 0.24 +
            entry.validation.movement * 0.19 +
            entry.validation.unity * 0.16 +
            entry.validation.balance * 0.14 +
            entry.validation.proportion * 0.12 +
            Math.min(sourceIdeaCanonCount, 4) * 0.04,
          0,
          1,
        );

        return {
          id: entry.id,
          conceptId: entry.conceptId,
          conceptTitle: entry.conceptTitle,
          sourceIdeaId: entry.sourceIdeaId,
          stage: entry.stage,
          composition: entry.composition,
          validation: entry.validation,
          canonizedAt: previousEntry?.canonizedAt ?? entry.storedAt,
          lastActivatedAt: entry.lastSeenAt,
          lineage: {
            siblingCanonIds,
            sourceIdeaCanonCount,
          },
          influenceWeight,
        } satisfies ArtCanonEntry;
      });

    const next = [
      ...canonicalEntries,
      ...previous.filter((entry) => !canonicalEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 24);

    lastFingerprintRef.current = fingerprint;
    writeArtCanon(next);
  }, [artMemory, isSignedIn]);

  const visibleArtCanon = useMemo(() => (isSignedIn ? artCanon : []), [artCanon, isSignedIn]);
  const primaryArtCanon = visibleArtCanon[0] ?? null;

  return {
    artCanon: visibleArtCanon,
    artCanonCount: visibleArtCanon.length,
    primaryArtCanon,
  };
}
