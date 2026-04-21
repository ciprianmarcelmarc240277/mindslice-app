"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isMetaCanonical } from "@/lib/mindslice/concept-meta-system";
import {
  readMetaSystemCanon,
  META_SYSTEM_CANON_STORAGE_KEY,
  META_SYSTEM_CANON_UPDATED_EVENT,
  writeMetaSystemCanon,
} from "@/lib/mindslice/meta-system-canon-storage";
import {
  loadPersistedMindsliceState,
  persistMindsliceState,
} from "@/lib/mindslice/mindslice-state-persistence";
import type {
  MetaSystemCanonEntry,
  MetaSystemMemoryEntry,
} from "@/lib/mindslice/mindslice-types";

type UseMetaSystemCanonOptions = {
  isSignedIn: boolean;
  metaSystemMemory: MetaSystemMemoryEntry[];
};

function buildMemoryFingerprint(metaSystemMemory: MetaSystemMemoryEntry[]) {
  return metaSystemMemory
    .map((entry) => [entry.id, entry.stage, entry.lastSeenAt].join(":"))
    .join("|");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useMetaSystemCanon({
  isSignedIn,
  metaSystemMemory,
}: UseMetaSystemCanonOptions) {
  const [metaSystemCanon, setMetaSystemCanon] = useState<MetaSystemCanonEntry[]>(() => readMetaSystemCanon());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncMetaSystemCanon() {
      setMetaSystemCanon(readMetaSystemCanon());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== META_SYSTEM_CANON_STORAGE_KEY) {
        return;
      }

      syncMetaSystemCanon();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(META_SYSTEM_CANON_UPDATED_EVENT, syncMetaSystemCanon);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(META_SYSTEM_CANON_UPDATED_EVENT, syncMetaSystemCanon);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadMetaSystemCanon() {
      try {
        const next = await loadPersistedMindsliceState<MetaSystemCanonEntry>("canon", "meta_system");

        if (cancelled) {
          return;
        }

        writeMetaSystemCanon(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(META_SYSTEM_CANON_UPDATED_EVENT));
        }
      }
    }

    loadMetaSystemCanon();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const fingerprint = buildMemoryFingerprint(metaSystemMemory);
    if (lastFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readMetaSystemCanon();
    const canonicalEntries = metaSystemMemory
      .filter((entry) => {
        const sourceIdeaCanonCount = metaSystemMemory.filter(
          (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId,
        ).length;
        return isMetaCanonical({
          metaSystem: entry.metaSystem,
          validation: entry.validation,
          stage: entry.stage,
          sourceIdeaCanonCount,
        });
      })
      .map((entry) => {
        const siblingCanonIds = metaSystemMemory
          .filter(
            (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId && candidate.id !== entry.id,
          )
          .map((candidate) => candidate.id)
          .slice(0, 6);
        const previousEntry = previous.find((candidate) => candidate.id === entry.id);
        const sourceIdeaCanonCount = siblingCanonIds.length + 1;
        const influenceWeight = clamp(
          entry.validation.integration * 0.26 +
            entry.validation.coherence * 0.22 +
            entry.validation.structure * 0.16 +
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
          metaSystem: entry.metaSystem,
          validation: entry.validation,
          canonizedAt: previousEntry?.canonizedAt ?? entry.storedAt,
          lastActivatedAt: entry.lastSeenAt,
          lineage: {
            siblingCanonIds,
            sourceIdeaCanonCount,
          },
          influenceWeight,
        } satisfies MetaSystemCanonEntry;
      });

    const next = [
      ...canonicalEntries,
      ...previous.filter((entry) => !canonicalEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 24);

    lastFingerprintRef.current = fingerprint;
    writeMetaSystemCanon(next);

    void persistMindsliceState("canon", "meta_system", next)
      .then((synced) => {
        writeMetaSystemCanon(synced);
      })
      .catch(() => {
        // Alpha-safe: local meta system canon remains available if backend persistence fails.
      });
  }, [isSignedIn, metaSystemMemory]);

  const visibleMetaSystemCanon = useMemo(
    () => (isSignedIn ? metaSystemCanon : []),
    [isSignedIn, metaSystemCanon],
  );
  const primaryMetaSystemCanon = visibleMetaSystemCanon[0] ?? null;

  return {
    metaSystemCanon: visibleMetaSystemCanon,
    metaSystemCanonCount: visibleMetaSystemCanon.length,
    primaryMetaSystemCanon,
  };
}
