"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ART_MEMORY_STORAGE_KEY,
  ART_MEMORY_UPDATED_EVENT,
  readArtMemory,
  writeArtMemory,
} from "@/lib/mindslice/art-memory-storage";
import {
  loadPersistedMindsliceState,
  persistMindsliceState,
} from "@/lib/mindslice/mindslice-state-persistence";
import type {
  ArtCompositionPoolEntry,
  ArtMemoryEntry,
} from "@/lib/mindslice/mindslice-types";

type UseArtMemorySystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  activeArtCompositionPoolEntry: ArtCompositionPoolEntry | null;
};

function buildFingerprint(entry: ArtCompositionPoolEntry | null) {
  if (!entry) {
    return "no-active-art-composition-pool-entry";
  }

  return [
    entry.id,
    entry.stage,
    entry.composition.focusNode,
    entry.composition.runtime.contaminationMode,
  ].join("::");
}

export function useArtMemorySystem({
  isSignedIn,
  isActive,
  activeArtCompositionPoolEntry,
}: UseArtMemorySystemOptions) {
  const [artMemory, setArtMemory] = useState<ArtMemoryEntry[]>(() => readArtMemory());
  const lastStoredFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncArtMemory() {
      setArtMemory(readArtMemory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== ART_MEMORY_STORAGE_KEY) {
        return;
      }

      syncArtMemory();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(ART_MEMORY_UPDATED_EVENT, syncArtMemory);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ART_MEMORY_UPDATED_EVENT, syncArtMemory);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadArtMemory() {
      try {
        const next = await loadPersistedMindsliceState<ArtMemoryEntry>("memory", "art");

        if (cancelled) {
          return;
        }

        writeArtMemory(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(ART_MEMORY_UPDATED_EVENT));
        }
      }
    }

    loadArtMemory();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !isActive || !activeArtCompositionPoolEntry) {
      return;
    }

    const fingerprint = buildFingerprint(activeArtCompositionPoolEntry);
    if (lastStoredFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readArtMemory();
    lastStoredFingerprintRef.current = fingerprint;
    const now = new Date().toISOString();
    const nextEntry: ArtMemoryEntry = {
      id: activeArtCompositionPoolEntry.id,
      conceptId: activeArtCompositionPoolEntry.conceptId,
      conceptTitle: activeArtCompositionPoolEntry.conceptTitle,
      sourceIdeaId: activeArtCompositionPoolEntry.sourceIdeaId,
      stage: activeArtCompositionPoolEntry.stage,
      composition: activeArtCompositionPoolEntry.composition,
      validation: activeArtCompositionPoolEntry.validation,
      storedAt:
        previous.find((entry) => entry.id === activeArtCompositionPoolEntry.id)?.storedAt ?? now,
      lastSeenAt: now,
    };

    const next = [
      nextEntry,
      ...previous.filter((entry) => entry.id !== activeArtCompositionPoolEntry.id),
    ].slice(0, 24);

    writeArtMemory(next);

    void persistMindsliceState("memory", "art", next)
      .then((synced) => {
        writeArtMemory(synced);
      })
      .catch(() => {
        // Alpha-safe: local art memory remains available if backend persistence fails.
      });
  }, [activeArtCompositionPoolEntry, isActive, isSignedIn]);

  const visibleArtMemory = useMemo(() => (isSignedIn ? artMemory : []), [artMemory, isSignedIn]);
  const latestArtMemory = visibleArtMemory[0] ?? null;
  const resolvedArtCount = useMemo(
    () =>
      visibleArtMemory.filter(
        (entry) => entry.stage === "resolved" || entry.stage === "canonical",
      ).length,
    [visibleArtMemory],
  );

  return {
    artMemory: visibleArtMemory,
    latestArtMemory,
    resolvedArtCount,
  };
}
