"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SCENARIO_POOL_STORAGE_KEY,
  SCENARIO_POOL_UPDATED_EVENT,
  readScenarioPool,
  writeScenarioPool,
} from "@/lib/mindslice/scenario-pool-storage";
import type { ConceptPoolEntry, ScenarioPoolEntry } from "@/lib/mindslice/mindslice-types";

type UseScenarioPoolSystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  conceptPool: ConceptPoolEntry[];
};

function buildPoolFingerprint(conceptPool: ConceptPoolEntry[]) {
  return conceptPool
    .map((entry) => {
      const scenario = entry.concept.expression.scenario;
      return [
        entry.id,
        entry.concept.stage,
        scenario?.coreConflict ?? "none",
        scenario?.runtime.contaminationMode ?? "none",
      ].join(":");
    })
    .join("|");
}

export function useScenarioPoolSystem({
  isSignedIn,
  isActive,
  conceptPool,
}: UseScenarioPoolSystemOptions) {
  const [scenarioPool, setScenarioPool] = useState<ScenarioPoolEntry[]>(() => readScenarioPool());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncScenarioPool() {
      setScenarioPool(readScenarioPool());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== SCENARIO_POOL_STORAGE_KEY) {
        return;
      }

      syncScenarioPool();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SCENARIO_POOL_UPDATED_EVENT, syncScenarioPool);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SCENARIO_POOL_UPDATED_EVENT, syncScenarioPool);
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

    const previous = readScenarioPool();
    const nextEntries = conceptPool
      .filter((entry) => entry.concept.expression.scenario)
      .map((entry) => {
        const now = new Date().toISOString();
        const existing = previous.find((candidate) => candidate.id === entry.id);
        return {
          id: entry.id,
          conceptId: entry.concept.id,
          conceptTitle: entry.concept.core.title,
          sourceIdeaId: entry.concept.provenance.sourceIdeaId,
          stage: entry.concept.stage,
          scenario: entry.concept.expression.scenario,
          validation: {
            conflict: entry.validation.scores.conflict,
            tension: entry.validation.scores.tension,
            progression: entry.validation.scores.progression,
            meaning: entry.validation.scores.meaning,
            attention: entry.validation.scores.narrativeAttention,
          },
          pooledAt: existing?.pooledAt ?? now,
          lastSeenAt: now,
          source: entry.source,
        } satisfies ScenarioPoolEntry;
      });

    const next = [
      ...nextEntries,
      ...previous.filter((entry) => !nextEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 32);

    lastFingerprintRef.current = fingerprint;
    writeScenarioPool(next);
  }, [conceptPool, isActive, isSignedIn]);

  const latestScenarioPoolEntry = scenarioPool[0] ?? null;
  const activeScenarioPoolEntry = useMemo(
    () => scenarioPool.find((entry) => entry.source === "active_runtime") ?? latestScenarioPoolEntry,
    [latestScenarioPoolEntry, scenarioPool],
  );

  return {
    scenarioPool,
    scenarioPoolCount: scenarioPool.length,
    latestScenarioPoolEntry,
    activeScenarioPoolEntry,
  };
}
