"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  COLOR_POOL_STORAGE_KEY,
  COLOR_POOL_UPDATED_EVENT,
  readColorPool,
  writeColorPool,
} from "@/lib/mindslice/color-pool-storage";
import type {
  ColorPoolEntry,
  ConceptPoolEntry,
} from "@/lib/mindslice/mindslice-types";

type UseColorPoolSystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  conceptPool: ConceptPoolEntry[];
};

function buildPoolFingerprint(conceptPool: ConceptPoolEntry[]) {
  return conceptPool
    .map((entry) => {
      const palette = entry.concept.expression.palette;
      return [
        entry.id,
        entry.concept.stage,
        palette?.dominant ?? "none",
        palette?.accent ?? "none",
      ].join(":");
    })
    .join("|");
}

export function useColorPoolSystem({
  isSignedIn,
  isActive,
  conceptPool,
}: UseColorPoolSystemOptions) {
  const [colorPool, setColorPool] = useState<ColorPoolEntry[]>(() => readColorPool());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncColorPool() {
      setColorPool(readColorPool());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== COLOR_POOL_STORAGE_KEY) {
        return;
      }

      syncColorPool();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(COLOR_POOL_UPDATED_EVENT, syncColorPool);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(COLOR_POOL_UPDATED_EVENT, syncColorPool);
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

    const previous = readColorPool();
    const nextEntries = conceptPool
      .filter((entry) => entry.concept.expression.palette)
      .map((entry) => {
        const now = new Date().toISOString();
        const existing = previous.find((candidate) => candidate.id === entry.id);
        return {
          id: entry.id,
          conceptId: entry.concept.id,
          conceptTitle: entry.concept.core.title,
          sourceIdeaId: entry.concept.provenance.sourceIdeaId,
          stage: entry.concept.stage,
          palette: entry.concept.expression.palette,
          validation: {
            hueStructure: entry.validation.scores.hueStructure,
            valueBalance: entry.validation.scores.valueBalance,
            saturationControl: entry.validation.scores.saturationControl,
            colorRelations: entry.validation.scores.colorRelations,
            attentionImpact: entry.validation.scores.attentionImpact,
          },
          pooledAt: existing?.pooledAt ?? now,
          lastSeenAt: now,
          source: entry.source,
        } satisfies ColorPoolEntry;
      });

    const next = [
      ...nextEntries,
      ...previous.filter((entry) => !nextEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 32);

    lastFingerprintRef.current = fingerprint;
    writeColorPool(next);
  }, [conceptPool, isActive, isSignedIn]);

  const latestColorPoolEntry = colorPool[0] ?? null;
  const activeColorPoolEntry = useMemo(
    () => colorPool.find((entry) => entry.source === "active_runtime") ?? latestColorPoolEntry,
    [colorPool, latestColorPoolEntry],
  );

  return {
    colorPool,
    colorPoolCount: colorPool.length,
    latestColorPoolEntry,
    activeColorPoolEntry,
  };
}
