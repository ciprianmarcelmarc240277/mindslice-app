"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  NARRATIVE_CANON_STORAGE_KEY,
  NARRATIVE_CANON_UPDATED_EVENT,
  readNarrativeCanon,
  writeNarrativeCanon,
} from "@/lib/mindslice/narrative-canon-storage";
import {
  loadPersistedMindsliceState,
  persistMindsliceState,
} from "@/lib/mindslice/mindslice-state-persistence";
import { isNarrativeCanonical } from "@/lib/mindslice/concept-scenario-system";
import type { NarrativeCanonEntry, StoryMemoryEntry } from "@/lib/mindslice/mindslice-types";

type UseNarrativeCanonSystemOptions = {
  isSignedIn: boolean;
  storyMemory: StoryMemoryEntry[];
};

function buildMemoryFingerprint(storyMemory: StoryMemoryEntry[]) {
  return storyMemory.map((entry) => [entry.id, entry.stage, entry.lastSeenAt].join(":")).join("|");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useNarrativeCanonSystem({
  isSignedIn,
  storyMemory,
}: UseNarrativeCanonSystemOptions) {
  const [narrativeCanon, setNarrativeCanon] = useState<NarrativeCanonEntry[]>(() => readNarrativeCanon());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncNarrativeCanon() {
      setNarrativeCanon(readNarrativeCanon());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== NARRATIVE_CANON_STORAGE_KEY) {
        return;
      }

      syncNarrativeCanon();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(NARRATIVE_CANON_UPDATED_EVENT, syncNarrativeCanon);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(NARRATIVE_CANON_UPDATED_EVENT, syncNarrativeCanon);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadNarrativeCanon() {
      try {
        const next = await loadPersistedMindsliceState<NarrativeCanonEntry>("canon", "narrative");

        if (cancelled) {
          return;
        }

        writeNarrativeCanon(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(NARRATIVE_CANON_UPDATED_EVENT));
        }
      }
    }

    loadNarrativeCanon();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const fingerprint = buildMemoryFingerprint(storyMemory);
    if (lastFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readNarrativeCanon();
    const canonicalEntries = storyMemory
      .filter((entry) => {
        const sourceIdeaCanonCount = storyMemory.filter(
          (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId,
        ).length;
        return isNarrativeCanonical({
          scenario: entry.scenario,
          validation: entry.validation,
          stage: entry.stage,
          sourceIdeaCanonCount,
        });
      })
      .map((entry) => {
        const siblingCanonIds = storyMemory
          .filter(
            (candidate) =>
              candidate.sourceIdeaId === entry.sourceIdeaId &&
              candidate.id !== entry.id,
          )
          .map((candidate) => candidate.id)
          .slice(0, 6);

        const previousEntry = previous.find((candidate) => candidate.id === entry.id);
        const sourceIdeaCanonCount = siblingCanonIds.length + 1;
        const influenceWeight = clamp(
          entry.validation.tension * 0.24 +
            entry.validation.progression * 0.22 +
            entry.validation.meaning * 0.18 +
            entry.validation.attention * 0.16 +
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
          scenario: entry.scenario,
          validation: entry.validation,
          canonizedAt: previousEntry?.canonizedAt ?? entry.storedAt,
          lastActivatedAt: entry.lastSeenAt,
          lineage: {
            siblingCanonIds,
            sourceIdeaCanonCount,
          },
          influenceWeight,
        } satisfies NarrativeCanonEntry;
      });

    const next = [
      ...canonicalEntries,
      ...previous.filter((entry) => !canonicalEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 24);

    lastFingerprintRef.current = fingerprint;
    writeNarrativeCanon(next);

    void persistMindsliceState("canon", "narrative", next)
      .then((synced) => {
        writeNarrativeCanon(synced);
      })
      .catch(() => {
        // Alpha-safe: local narrative canon remains available if backend persistence fails.
      });
  }, [isSignedIn, storyMemory]);

  const visibleNarrativeCanon = useMemo(
    () => (isSignedIn ? narrativeCanon : []),
    [isSignedIn, narrativeCanon],
  );
  const primaryNarrativeCanon = visibleNarrativeCanon[0] ?? null;

  return {
    narrativeCanon: visibleNarrativeCanon,
    narrativeCanonCount: visibleNarrativeCanon.length,
    primaryNarrativeCanon,
  };
}
