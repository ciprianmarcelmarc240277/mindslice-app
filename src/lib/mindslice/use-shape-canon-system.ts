"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isShapeCanonical } from "@/lib/mindslice/concept-shape-theory-system";
import {
  readShapeCanon,
  SHAPE_CANON_STORAGE_KEY,
  SHAPE_CANON_UPDATED_EVENT,
  writeShapeCanon,
} from "@/lib/mindslice/shape-canon-storage";
import {
  loadPersistedMindsliceState,
  persistMindsliceState,
} from "@/lib/mindslice/mindslice-state-persistence";
import type {
  ShapeCanonEntry,
  ShapeMemoryEntry,
} from "@/lib/mindslice/mindslice-types";

type UseShapeCanonSystemOptions = {
  isSignedIn: boolean;
  shapeMemory: ShapeMemoryEntry[];
};

function buildMemoryFingerprint(shapeMemory: ShapeMemoryEntry[]) {
  return shapeMemory
    .map((entry) => [entry.id, entry.stage, entry.lastSeenAt].join(":"))
    .join("|");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useShapeCanonSystem({
  isSignedIn,
  shapeMemory,
}: UseShapeCanonSystemOptions) {
  const [shapeCanon, setShapeCanon] = useState<ShapeCanonEntry[]>(() => readShapeCanon());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncShapeCanon() {
      setShapeCanon(readShapeCanon());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== SHAPE_CANON_STORAGE_KEY) {
        return;
      }

      syncShapeCanon();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SHAPE_CANON_UPDATED_EVENT, syncShapeCanon);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SHAPE_CANON_UPDATED_EVENT, syncShapeCanon);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadShapeCanon() {
      try {
        const next = await loadPersistedMindsliceState<ShapeCanonEntry>("canon", "shape");

        if (cancelled) {
          return;
        }

        writeShapeCanon(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(SHAPE_CANON_UPDATED_EVENT));
        }
      }
    }

    loadShapeCanon();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const fingerprint = buildMemoryFingerprint(shapeMemory);
    if (lastFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readShapeCanon();
    const canonicalEntries = shapeMemory
      .filter((entry) => {
        const sourceIdeaCanonCount = shapeMemory.filter(
          (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId,
        ).length;
        return isShapeCanonical({
          shape: entry.shape,
          validation: entry.validation,
          stage: entry.stage,
          sourceIdeaCanonCount,
        });
      })
      .map((entry) => {
        const siblingCanonIds = shapeMemory
          .filter(
            (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId && candidate.id !== entry.id,
          )
          .map((candidate) => candidate.id)
          .slice(0, 6);
        const previousEntry = previous.find((candidate) => candidate.id === entry.id);
        const sourceIdeaCanonCount = siblingCanonIds.length + 1;
        const influenceWeight = clamp(
          entry.validation.attention * 0.24 +
            entry.validation.tension * 0.2 +
            entry.validation.identity * 0.18 +
            entry.validation.relation * 0.14 +
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
          shape: entry.shape,
          validation: entry.validation,
          canonizedAt: previousEntry?.canonizedAt ?? entry.storedAt,
          lastActivatedAt: entry.lastSeenAt,
          lineage: {
            siblingCanonIds,
            sourceIdeaCanonCount,
          },
          influenceWeight,
        } satisfies ShapeCanonEntry;
      });

    const next = [
      ...canonicalEntries,
      ...previous.filter((entry) => !canonicalEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 24);

    lastFingerprintRef.current = fingerprint;
    writeShapeCanon(next);

    void persistMindsliceState("canon", "shape", next)
      .then((synced) => {
        writeShapeCanon(synced);
      })
      .catch(() => {
        // Alpha-safe: local shape canon remains available if backend persistence fails.
      });
  }, [isSignedIn, shapeMemory]);

  const visibleShapeCanon = useMemo(
    () => (isSignedIn ? shapeCanon : []),
    [isSignedIn, shapeCanon],
  );
  const primaryShapeCanon = visibleShapeCanon[0] ?? null;

  return {
    shapeCanon: visibleShapeCanon,
    shapeCanonCount: visibleShapeCanon.length,
    primaryShapeCanon,
  };
}
