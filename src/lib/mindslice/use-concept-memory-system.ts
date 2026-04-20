"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CONCEPT_MEMORY_STORAGE_KEY,
  CONCEPT_MEMORY_UPDATED_EVENT,
  readConceptMemory,
  writeConceptMemory,
} from "@/lib/mindslice/concept-memory-storage";
import type {
  ConceptMemoryEntry,
  ConceptPoolEntry,
  ConceptPromotionResult,
} from "@/lib/mindslice/mindslice-types";

type UseConceptMemorySystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  activePoolEntry: ConceptPoolEntry | null;
};

function buildFingerprint(
  activePoolEntry: ConceptPoolEntry | null,
) {
  if (!activePoolEntry) {
    return "no-active-pool-entry";
  }

  return [
    activePoolEntry.id,
    activePoolEntry.concept.stage,
    activePoolEntry.validation.resolutionStatus,
    activePoolEntry.validation.isValidConcept ? "valid" : "not-valid",
  ].join("::");
}

export function useConceptMemorySystem({
  isSignedIn,
  isActive,
  activePoolEntry,
}: UseConceptMemorySystemOptions) {
  const [conceptMemory, setConceptMemory] = useState<ConceptMemoryEntry[]>(() => readConceptMemory());
  const lastStoredFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncConceptMemory() {
      setConceptMemory(readConceptMemory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== CONCEPT_MEMORY_STORAGE_KEY) {
        return;
      }

      syncConceptMemory();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CONCEPT_MEMORY_UPDATED_EVENT, syncConceptMemory);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CONCEPT_MEMORY_UPDATED_EVENT, syncConceptMemory);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadConceptMemory() {
      try {
        const response = await fetch("/api/concepts?scope=memory", { cache: "no-store" });
        const payload = (await response.json()) as {
          conceptMemory?: ConceptMemoryEntry[];
        };

        if (!response.ok) {
          throw new Error("Concept memory request failed.");
        }

        if (cancelled) {
          return;
        }

        const next = Array.isArray(payload.conceptMemory) ? payload.conceptMemory : [];
        writeConceptMemory(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(CONCEPT_MEMORY_UPDATED_EVENT));
        }
      }
    }

    loadConceptMemory();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !isActive) {
      return;
    }

    if (!activePoolEntry) {
      return;
    }

    const fingerprint = buildFingerprint(activePoolEntry);
    if (lastStoredFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readConceptMemory();

    lastStoredFingerprintRef.current = fingerprint;

    const promotedConcept = activePoolEntry.concept;
    const now = new Date().toISOString();
    const nextEntry: ConceptMemoryEntry = {
      id: promotedConcept.id,
      concept: promotedConcept,
      validation: activePoolEntry.validation,
      storedAt: previous.find((entry) => entry.id === promotedConcept.id)?.storedAt ?? now,
      lastSeenAt: now,
    };

    const next = [
      nextEntry,
      ...previous.filter((entry) => entry.id !== promotedConcept.id),
    ].slice(0, 24);

    writeConceptMemory(next);

    void fetch("/api/concepts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        concept: promotedConcept,
        validation: activePoolEntry.validation,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Concept memory persistence failed.");
        }

        const payload = (await response.json()) as {
          conceptMemory?: ConceptMemoryEntry;
        };

        if (!payload.conceptMemory) {
          return;
        }

        const synced = [
          payload.conceptMemory,
          ...readConceptMemory().filter((entry) => entry.id !== payload.conceptMemory?.id),
        ].slice(0, 24);

        writeConceptMemory(synced);
      })
      .catch(() => {
        // Alpha-safe: local concept memory remains available if backend persistence fails.
      });
  }, [activePoolEntry, isActive, isSignedIn]);

  const visibleConceptMemory = useMemo(
    () => (isSignedIn ? conceptMemory : []),
    [conceptMemory, isSignedIn],
  );
  const latestConcept = visibleConceptMemory[0] ?? null;
  const resolvedConceptCount = useMemo(
    () => visibleConceptMemory.filter((entry) => entry.validation.isValidConcept).length,
    [visibleConceptMemory],
  );
  const latestPromotion = useMemo<ConceptPromotionResult | null>(() => {
    if (!isSignedIn || !activePoolEntry) {
      return null;
    }

    return activePoolEntry.promotion;
  }, [activePoolEntry, isSignedIn]);

  return {
    conceptMemory: visibleConceptMemory,
    latestConcept,
    resolvedConceptCount,
    latestPromotion,
  };
}
