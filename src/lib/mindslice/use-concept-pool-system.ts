"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { readConceptMemory } from "@/lib/mindslice/concept-memory-storage";
import {
  CONCEPT_POOL_STORAGE_KEY,
  CONCEPT_POOL_UPDATED_EVENT,
  readConceptPool,
  writeConceptPool,
} from "@/lib/mindslice/concept-pool-storage";
import { promoteConceptCandidate } from "@/lib/mindslice/concept-promotion-system";
import type {
  ConceptPoolEntry,
  IdeaSetMainLoopResult,
} from "@/lib/mindslice/mindslice-types";

type UseConceptPoolSystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  ideaSetMainLoop: IdeaSetMainLoopResult;
};

function buildLoopFingerprint(ideaSetMainLoop: IdeaSetMainLoopResult) {
  return ideaSetMainLoop.entries
    .map((entry) => {
      const process = entry.process;
      return [
        entry.ideaIndex,
        process.candidate.id,
        process.validation.resolutionStatus,
        process.validation.isValidConcept ? "valid" : "not-valid",
      ].join(":");
    })
    .join("|");
}

export function useConceptPoolSystem({
  isSignedIn,
  isActive,
  ideaSetMainLoop,
}: UseConceptPoolSystemOptions) {
  const [conceptPool, setConceptPool] = useState<ConceptPoolEntry[]>(() => readConceptPool());
  const lastLoopFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncConceptPool() {
      setConceptPool(readConceptPool());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== CONCEPT_POOL_STORAGE_KEY) {
        return;
      }

      syncConceptPool();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CONCEPT_POOL_UPDATED_EVENT, syncConceptPool);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CONCEPT_POOL_UPDATED_EVENT, syncConceptPool);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || !isActive || !ideaSetMainLoop.entries.length) {
      return;
    }

    const fingerprint = buildLoopFingerprint(ideaSetMainLoop);
    if (lastLoopFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readConceptPool();
    const conceptMemory = readConceptMemory();
    const nextEntries = ideaSetMainLoop.entries
      .map((entry) => {
        const promotion = promoteConceptCandidate(
          entry.process.candidate,
          entry.process.validation,
          conceptMemory,
        );

        if (!promotion.canPromoteToResolved || !promotion.passesSystemLaw) {
          return null;
        }

        const now = new Date().toISOString();
        const existing = previous.find((poolEntry) => poolEntry.id === promotion.promotedConcept.id);

        return {
          id: promotion.promotedConcept.id,
          concept: promotion.promotedConcept,
          validation: entry.process.validation,
          promotion,
          pooledAt: existing?.pooledAt ?? now,
          lastSeenAt: now,
          source: entry.isActiveIdea ? "active_runtime" : "main_loop",
        } satisfies ConceptPoolEntry;
      })
      .filter((entry): entry is ConceptPoolEntry => entry !== null);

    const next = [
      ...nextEntries,
      ...previous.filter(
        (entry) => !nextEntries.some((nextEntry) => nextEntry.id === entry.id),
      ),
    ].slice(0, 32);

    lastLoopFingerprintRef.current = fingerprint;
    writeConceptPool(next);
  }, [ideaSetMainLoop, isActive, isSignedIn]);

  const latestPoolEntry = conceptPool[0] ?? null;
  const activePoolEntry = useMemo(
    () =>
      conceptPool.find(
        (entry) =>
          entry.id ===
          ideaSetMainLoop.activeResult.candidate.conceptStateDraft.id,
      ) ?? null,
    [conceptPool, ideaSetMainLoop.activeResult.candidate.conceptStateDraft.id],
  );

  return {
    conceptPool,
    conceptPoolCount: conceptPool.length,
    latestPoolEntry,
    activePoolEntry,
  };
}
