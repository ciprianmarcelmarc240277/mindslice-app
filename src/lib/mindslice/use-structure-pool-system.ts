"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  readStructurePool,
  STRUCTURE_POOL_STORAGE_KEY,
  STRUCTURE_POOL_UPDATED_EVENT,
  writeStructurePool,
} from "@/lib/mindslice/structure-pool-storage";
import type {
  ConceptPoolEntry,
  StructurePoolEntry,
} from "@/lib/mindslice/mindslice-types";

type UseStructurePoolSystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  conceptPool: ConceptPoolEntry[];
};

function buildPoolFingerprint(conceptPool: ConceptPoolEntry[]) {
  return conceptPool
    .map((entry) => {
      const structure = entry.concept.expression.compositionStructure;
      return [
        entry.id,
        entry.concept.stage,
        structure?.grid ?? "none",
        structure?.subjectPosition ?? "none",
      ].join(":");
    })
    .join("|");
}

export function useStructurePoolSystem({
  isSignedIn,
  isActive,
  conceptPool,
}: UseStructurePoolSystemOptions) {
  const [structurePool, setStructurePool] = useState<StructurePoolEntry[]>(() => readStructurePool());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncStructurePool() {
      setStructurePool(readStructurePool());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== STRUCTURE_POOL_STORAGE_KEY) {
        return;
      }

      syncStructurePool();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STRUCTURE_POOL_UPDATED_EVENT, syncStructurePool);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STRUCTURE_POOL_UPDATED_EVENT, syncStructurePool);
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

    const previous = readStructurePool();
    const nextEntries = conceptPool
      .filter((entry) => entry.concept.expression.compositionStructure)
      .map((entry) => {
        const now = new Date().toISOString();
        const existing = previous.find((candidate) => candidate.id === entry.id);
        return {
          id: entry.id,
          conceptId: entry.concept.id,
          conceptTitle: entry.concept.core.title,
          sourceIdeaId: entry.concept.provenance.sourceIdeaId,
          stage: entry.concept.stage,
          structure: entry.concept.expression.compositionStructure,
          validation: {
            thirds: entry.validation.scores.thirdsStructure,
            golden: entry.validation.scores.goldenStructure,
            symmetry: entry.validation.scores.symmetryStructure,
            center: entry.validation.scores.centerStructure,
            attention: entry.validation.scores.structuralAttention,
          },
          pooledAt: existing?.pooledAt ?? now,
          lastSeenAt: now,
          source: entry.source,
        } satisfies StructurePoolEntry;
      });

    const next = [
      ...nextEntries,
      ...previous.filter((entry) => !nextEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 32);

    lastFingerprintRef.current = fingerprint;
    writeStructurePool(next);
  }, [conceptPool, isActive, isSignedIn]);

  const latestStructurePoolEntry = structurePool[0] ?? null;
  const activeStructurePoolEntry = useMemo(
    () => structurePool.find((entry) => entry.source === "active_runtime") ?? latestStructurePoolEntry,
    [latestStructurePoolEntry, structurePool],
  );

  return {
    structurePool,
    structurePoolCount: structurePool.length,
    latestStructurePoolEntry,
    activeStructurePoolEntry,
  };
}
