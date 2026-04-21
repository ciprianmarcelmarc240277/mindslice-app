"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  readMetaSystemMemory,
  META_SYSTEM_MEMORY_STORAGE_KEY,
  META_SYSTEM_MEMORY_UPDATED_EVENT,
  writeMetaSystemMemory,
} from "@/lib/mindslice/meta-system-memory-storage";
import {
  loadPersistedMindsliceState,
  persistMindsliceState,
} from "@/lib/mindslice/mindslice-state-persistence";
import type {
  ConceptPoolEntry,
  MetaSystemMemoryEntry,
} from "@/lib/mindslice/mindslice-types";

type UseMetaSystemMemoryOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  activePoolEntry: ConceptPoolEntry | null;
};

function buildFingerprint(activePoolEntry: ConceptPoolEntry | null) {
  if (!activePoolEntry) {
    return "no-active-meta-entry";
  }

  const metaSystem = activePoolEntry.concept.expression.metaSystem;
  if (!metaSystem) {
    return "missing-meta-system";
  }

  return [
    activePoolEntry.id,
    activePoolEntry.concept.stage,
    metaSystem.outputVisual,
    (activePoolEntry.validation.scores.metaIntegration ?? 0).toFixed(3),
  ].join("::");
}

export function useMetaSystemMemory({
  isSignedIn,
  isActive,
  activePoolEntry,
}: UseMetaSystemMemoryOptions) {
  const [metaSystemMemory, setMetaSystemMemory] = useState<MetaSystemMemoryEntry[]>(() => readMetaSystemMemory());
  const lastStoredFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncMetaSystemMemory() {
      setMetaSystemMemory(readMetaSystemMemory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== META_SYSTEM_MEMORY_STORAGE_KEY) {
        return;
      }

      syncMetaSystemMemory();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(META_SYSTEM_MEMORY_UPDATED_EVENT, syncMetaSystemMemory);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(META_SYSTEM_MEMORY_UPDATED_EVENT, syncMetaSystemMemory);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadMetaSystemMemory() {
      try {
        const next = await loadPersistedMindsliceState<MetaSystemMemoryEntry>("memory", "meta_system");

        if (cancelled) {
          return;
        }

        writeMetaSystemMemory(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(META_SYSTEM_MEMORY_UPDATED_EVENT));
        }
      }
    }

    loadMetaSystemMemory();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !isActive || !activePoolEntry) {
      return;
    }

    const metaSystem = activePoolEntry.concept.expression.metaSystem;
    if (!metaSystem || !metaSystem.runtime.validationPassed || !metaSystem.runtime.lawPassed) {
      return;
    }

    const fingerprint = buildFingerprint(activePoolEntry);
    if (lastStoredFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readMetaSystemMemory();
    lastStoredFingerprintRef.current = fingerprint;
    const now = new Date().toISOString();
    const nextEntry: MetaSystemMemoryEntry = {
      id: activePoolEntry.id,
      conceptId: activePoolEntry.concept.id,
      conceptTitle: activePoolEntry.concept.core.title,
      sourceIdeaId: activePoolEntry.concept.provenance.sourceIdeaId,
      stage: activePoolEntry.concept.stage,
      metaSystem,
      validation: {
        structure: activePoolEntry.validation.scores.metaStructure ?? 0,
        coherence: activePoolEntry.validation.scores.metaCoherence ?? 0,
        attention: activePoolEntry.validation.scores.metaAttention ?? 0,
        integration: activePoolEntry.validation.scores.metaIntegration ?? 0,
      },
      storedAt: previous.find((entry) => entry.id === activePoolEntry.id)?.storedAt ?? now,
      lastSeenAt: now,
    };

    const next = [
      nextEntry,
      ...previous.filter((entry) => entry.id !== activePoolEntry.id),
    ].slice(0, 24);

    writeMetaSystemMemory(next);

    void persistMindsliceState("memory", "meta_system", next)
      .then((synced) => {
        writeMetaSystemMemory(synced);
      })
      .catch(() => {
        // Alpha-safe: local meta system memory remains available if backend persistence fails.
      });
  }, [activePoolEntry, isActive, isSignedIn]);

  const visibleMetaSystemMemory = useMemo(
    () => (isSignedIn ? metaSystemMemory : []),
    [isSignedIn, metaSystemMemory],
  );
  const latestMetaSystemMemory = visibleMetaSystemMemory[0] ?? null;
  const resolvedMetaSystemCount = useMemo(
    () =>
      visibleMetaSystemMemory.filter(
        (entry) => entry.stage === "resolved" || entry.stage === "canonical",
      ).length,
    [visibleMetaSystemMemory],
  );

  return {
    metaSystemMemory: visibleMetaSystemMemory,
    latestMetaSystemMemory,
    resolvedMetaSystemCount,
  };
}
