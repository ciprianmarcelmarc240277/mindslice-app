"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  STORY_MEMORY_STORAGE_KEY,
  STORY_MEMORY_UPDATED_EVENT,
  readStoryMemory,
  writeStoryMemory,
} from "@/lib/mindslice/story-memory-storage";
import type { ScenarioPoolEntry, StoryMemoryEntry } from "@/lib/mindslice/mindslice-types";

type UseStoryMemorySystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  activeScenarioPoolEntry: ScenarioPoolEntry | null;
};

function buildFingerprint(entry: ScenarioPoolEntry | null) {
  if (!entry) {
    return "no-active-scenario-pool-entry";
  }

  return [
    entry.id,
    entry.stage,
    entry.scenario.coreConflict,
    entry.scenario.runtime.contaminationMode,
  ].join("::");
}

export function useStoryMemorySystem({
  isSignedIn,
  isActive,
  activeScenarioPoolEntry,
}: UseStoryMemorySystemOptions) {
  const [storyMemory, setStoryMemory] = useState<StoryMemoryEntry[]>(() => readStoryMemory());
  const lastStoredFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncStoryMemory() {
      setStoryMemory(readStoryMemory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== STORY_MEMORY_STORAGE_KEY) {
        return;
      }

      syncStoryMemory();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STORY_MEMORY_UPDATED_EVENT, syncStoryMemory);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STORY_MEMORY_UPDATED_EVENT, syncStoryMemory);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || !isActive || !activeScenarioPoolEntry) {
      return;
    }

    const fingerprint = buildFingerprint(activeScenarioPoolEntry);
    if (lastStoredFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readStoryMemory();
    lastStoredFingerprintRef.current = fingerprint;
    const now = new Date().toISOString();
    const nextEntry: StoryMemoryEntry = {
      id: activeScenarioPoolEntry.id,
      conceptId: activeScenarioPoolEntry.conceptId,
      conceptTitle: activeScenarioPoolEntry.conceptTitle,
      sourceIdeaId: activeScenarioPoolEntry.sourceIdeaId,
      stage: activeScenarioPoolEntry.stage,
      scenario: activeScenarioPoolEntry.scenario,
      validation: activeScenarioPoolEntry.validation,
      storedAt: previous.find((entry) => entry.id === activeScenarioPoolEntry.id)?.storedAt ?? now,
      lastSeenAt: now,
    };

    const next = [nextEntry, ...previous.filter((entry) => entry.id !== activeScenarioPoolEntry.id)].slice(0, 24);

    writeStoryMemory(next);
  }, [activeScenarioPoolEntry, isActive, isSignedIn]);

  const visibleStoryMemory = useMemo(() => (isSignedIn ? storyMemory : []), [isSignedIn, storyMemory]);
  const latestStoryMemory = visibleStoryMemory[0] ?? null;
  const resolvedScenarioCount = useMemo(
    () => visibleStoryMemory.filter((entry) => entry.stage === "resolved" || entry.stage === "canonical").length,
    [visibleStoryMemory],
  );

  return {
    storyMemory: visibleStoryMemory,
    latestStoryMemory,
    resolvedScenarioCount,
  };
}
