"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isStructureCanonical } from "@/lib/mindslice/concept-composition-structure-system";
import {
  readStructureCanon,
  STRUCTURE_CANON_STORAGE_KEY,
  STRUCTURE_CANON_UPDATED_EVENT,
  writeStructureCanon,
} from "@/lib/mindslice/structure-canon-storage";
import {
  loadPersistedMindsliceState,
  persistMindsliceState,
} from "@/lib/mindslice/mindslice-state-persistence";
import type {
  StructureCanonEntry,
  StructureMemoryEntry,
} from "@/lib/mindslice/mindslice-types";

type UseStructureCanonSystemOptions = {
  isSignedIn: boolean;
  structureMemory: StructureMemoryEntry[];
};

function buildMemoryFingerprint(structureMemory: StructureMemoryEntry[]) {
  return structureMemory
    .map((entry) => [entry.id, entry.stage, entry.lastSeenAt].join(":"))
    .join("|");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useStructureCanonSystem({
  isSignedIn,
  structureMemory,
}: UseStructureCanonSystemOptions) {
  const [structureCanon, setStructureCanon] = useState<StructureCanonEntry[]>(() => readStructureCanon());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncStructureCanon() {
      setStructureCanon(readStructureCanon());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== STRUCTURE_CANON_STORAGE_KEY) {
        return;
      }

      syncStructureCanon();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STRUCTURE_CANON_UPDATED_EVENT, syncStructureCanon);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STRUCTURE_CANON_UPDATED_EVENT, syncStructureCanon);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadStructureCanon() {
      try {
        const next = await loadPersistedMindsliceState<StructureCanonEntry>("canon", "structure");

        if (cancelled) {
          return;
        }

        writeStructureCanon(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(STRUCTURE_CANON_UPDATED_EVENT));
        }
      }
    }

    loadStructureCanon();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const fingerprint = buildMemoryFingerprint(structureMemory);
    if (lastFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readStructureCanon();
    const canonicalEntries = structureMemory
      .filter((entry) => {
        const sourceIdeaCanonCount = structureMemory.filter(
          (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId,
        ).length;
        return isStructureCanonical({
          structure: entry.structure,
          validation: entry.validation,
          stage: entry.stage,
          sourceIdeaCanonCount,
        });
      })
      .map((entry) => {
        const siblingCanonIds = structureMemory
          .filter(
            (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId && candidate.id !== entry.id,
          )
          .map((candidate) => candidate.id)
          .slice(0, 6);
        const previousEntry = previous.find((candidate) => candidate.id === entry.id);
        const sourceIdeaCanonCount = siblingCanonIds.length + 1;
        const influenceWeight = clamp(
          entry.validation.attention * 0.24 +
            entry.validation.center * 0.18 +
            entry.validation.symmetry * 0.16 +
            entry.validation.golden * 0.14 +
            entry.validation.thirds * 0.12 +
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
          structure: entry.structure,
          validation: entry.validation,
          canonizedAt: previousEntry?.canonizedAt ?? entry.storedAt,
          lastActivatedAt: entry.lastSeenAt,
          lineage: {
            siblingCanonIds,
            sourceIdeaCanonCount,
          },
          influenceWeight,
        } satisfies StructureCanonEntry;
      });

    const next = [
      ...canonicalEntries,
      ...previous.filter((entry) => !canonicalEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 24);

    lastFingerprintRef.current = fingerprint;
    writeStructureCanon(next);

    void persistMindsliceState("canon", "structure", next)
      .then((synced) => {
        writeStructureCanon(synced);
      })
      .catch(() => {
        // Alpha-safe: local structure canon remains available if backend persistence fails.
      });
  }, [isSignedIn, structureMemory]);

  const visibleStructureCanon = useMemo(
    () => (isSignedIn ? structureCanon : []),
    [isSignedIn, structureCanon],
  );
  const primaryStructureCanon = visibleStructureCanon[0] ?? null;

  return {
    structureCanon: visibleStructureCanon,
    structureCanonCount: visibleStructureCanon.length,
    primaryStructureCanon,
  };
}
