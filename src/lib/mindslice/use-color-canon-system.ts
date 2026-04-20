"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  COLOR_CANON_STORAGE_KEY,
  COLOR_CANON_UPDATED_EVENT,
  readColorCanon,
  writeColorCanon,
} from "@/lib/mindslice/color-canon-storage";
import { isColorCanonical } from "@/lib/mindslice/concept-color-theory-system";
import type {
  ColorCanonEntry,
  ColorMemoryEntry,
} from "@/lib/mindslice/mindslice-types";

type UseColorCanonSystemOptions = {
  isSignedIn: boolean;
  colorMemory: ColorMemoryEntry[];
};

function buildMemoryFingerprint(colorMemory: ColorMemoryEntry[]) {
  return colorMemory
    .map((entry) => [entry.id, entry.stage, entry.lastSeenAt].join(":"))
    .join("|");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useColorCanonSystem({ isSignedIn, colorMemory }: UseColorCanonSystemOptions) {
  const [colorCanon, setColorCanon] = useState<ColorCanonEntry[]>(() => readColorCanon());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncColorCanon() {
      setColorCanon(readColorCanon());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== COLOR_CANON_STORAGE_KEY) {
        return;
      }

      syncColorCanon();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(COLOR_CANON_UPDATED_EVENT, syncColorCanon);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(COLOR_CANON_UPDATED_EVENT, syncColorCanon);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const fingerprint = buildMemoryFingerprint(colorMemory);
    if (lastFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readColorCanon();
    const canonicalEntries = colorMemory
      .filter((entry) => {
        const sourceIdeaCanonCount = colorMemory.filter(
          (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId,
        ).length;
        return isColorCanonical({
          palette: entry.palette,
          validation: entry.validation,
          stage: entry.stage,
          sourceIdeaCanonCount,
        });
      })
      .map((entry) => {
        const siblingCanonIds = colorMemory
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
          entry.validation.attentionImpact * 0.3 +
            entry.validation.colorRelations * 0.22 +
            entry.validation.valueBalance * 0.16 +
            entry.validation.saturationControl * 0.14 +
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
          palette: entry.palette,
          validation: entry.validation,
          canonizedAt: previousEntry?.canonizedAt ?? entry.storedAt,
          lastActivatedAt: entry.lastSeenAt,
          lineage: {
            siblingCanonIds,
            sourceIdeaCanonCount,
          },
          influenceWeight,
        } satisfies ColorCanonEntry;
      });

    const next = [
      ...canonicalEntries,
      ...previous.filter((entry) => !canonicalEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 24);

    lastFingerprintRef.current = fingerprint;
    writeColorCanon(next);
  }, [colorMemory, isSignedIn]);

  const visibleColorCanon = useMemo(() => (isSignedIn ? colorCanon : []), [colorCanon, isSignedIn]);
  const primaryColorCanon = visibleColorCanon[0] ?? null;

  return {
    colorCanon: visibleColorCanon,
    colorCanonCount: visibleColorCanon.length,
    primaryColorCanon,
  };
}
