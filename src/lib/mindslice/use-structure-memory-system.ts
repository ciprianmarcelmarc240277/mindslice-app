"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  readStructureMemory,
  STRUCTURE_MEMORY_STORAGE_KEY,
  STRUCTURE_MEMORY_UPDATED_EVENT,
  writeStructureMemory,
} from "@/lib/mindslice/structure-memory-storage";
import {
  loadPersistedMindsliceState,
  persistMindsliceState,
} from "@/lib/mindslice/mindslice-state-persistence";
import type {
  StructureMemoryEntry,
  StructurePoolEntry,
} from "@/lib/mindslice/mindslice-types";

type UseStructureMemorySystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  activeStructurePoolEntry: StructurePoolEntry | null;
};

function buildFingerprint(entry: StructurePoolEntry | null) {
  if (!entry) {
    return "no-active-structure-pool-entry";
  }

  return [
    entry.id,
    entry.stage,
    entry.structure.grid,
    entry.structure.subjectPosition,
  ].join("::");
}

export function useStructureMemorySystem({
  isSignedIn,
  isActive,
  activeStructurePoolEntry,
}: UseStructureMemorySystemOptions) {
  const [structureMemory, setStructureMemory] = useState<StructureMemoryEntry[]>(() => readStructureMemory());
  const lastStoredFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncStructureMemory() {
      setStructureMemory(readStructureMemory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== STRUCTURE_MEMORY_STORAGE_KEY) {
        return;
      }

      syncStructureMemory();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STRUCTURE_MEMORY_UPDATED_EVENT, syncStructureMemory);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STRUCTURE_MEMORY_UPDATED_EVENT, syncStructureMemory);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadStructureMemory() {
      try {
        const next = await loadPersistedMindsliceState<StructureMemoryEntry>("memory", "structure");

        if (cancelled) {
          return;
        }

        writeStructureMemory(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(STRUCTURE_MEMORY_UPDATED_EVENT));
        }
      }
    }

    loadStructureMemory();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !isActive || !activeStructurePoolEntry) {
      return;
    }

    const fingerprint = buildFingerprint(activeStructurePoolEntry);
    if (lastStoredFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readStructureMemory();
    lastStoredFingerprintRef.current = fingerprint;
    const now = new Date().toISOString();
    const nextEntry: StructureMemoryEntry = {
      id: activeStructurePoolEntry.id,
      conceptId: activeStructurePoolEntry.conceptId,
      conceptTitle: activeStructurePoolEntry.conceptTitle,
      sourceIdeaId: activeStructurePoolEntry.sourceIdeaId,
      stage: activeStructurePoolEntry.stage,
      structure: activeStructurePoolEntry.structure,
      validation: activeStructurePoolEntry.validation,
      storedAt: previous.find((entry) => entry.id === activeStructurePoolEntry.id)?.storedAt ?? now,
      lastSeenAt: now,
    };

    const next = [
      nextEntry,
      ...previous.filter((entry) => entry.id !== activeStructurePoolEntry.id),
    ].slice(0, 24);

    writeStructureMemory(next);

    void persistMindsliceState("memory", "structure", next)
      .then((synced) => {
        writeStructureMemory(synced);
      })
      .catch(() => {
        // Alpha-safe: local structure memory remains available if backend persistence fails.
      });
  }, [activeStructurePoolEntry, isActive, isSignedIn]);

  const visibleStructureMemory = useMemo(
    () => (isSignedIn ? structureMemory : []),
    [isSignedIn, structureMemory],
  );
  const latestStructureMemory = visibleStructureMemory[0] ?? null;
  const resolvedStructureCount = useMemo(
    () =>
      visibleStructureMemory.filter(
        (entry) => entry.stage === "resolved" || entry.stage === "canonical",
      ).length,
    [visibleStructureMemory],
  );

  return {
    structureMemory: visibleStructureMemory,
    latestStructureMemory,
    resolvedStructureCount,
  };
}
