"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isGrammarCanonical } from "@/lib/mindslice/concept-shape-grammar-system";
import {
  readShapeGrammarCanon,
  SHAPE_GRAMMAR_CANON_STORAGE_KEY,
  SHAPE_GRAMMAR_CANON_UPDATED_EVENT,
  writeShapeGrammarCanon,
} from "@/lib/mindslice/shape-grammar-canon-storage";
import {
  loadPersistedMindsliceState,
  persistMindsliceState,
} from "@/lib/mindslice/mindslice-state-persistence";
import type {
  ShapeGrammarCanonEntry,
  ShapeGrammarMemoryEntry,
} from "@/lib/mindslice/mindslice-types";

type UseShapeGrammarCanonSystemOptions = {
  isSignedIn: boolean;
  shapeGrammarMemory: ShapeGrammarMemoryEntry[];
};

function buildMemoryFingerprint(shapeGrammarMemory: ShapeGrammarMemoryEntry[]) {
  return shapeGrammarMemory
    .map((entry) => [entry.id, entry.stage, entry.lastSeenAt].join(":"))
    .join("|");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useShapeGrammarCanonSystem({
  isSignedIn,
  shapeGrammarMemory,
}: UseShapeGrammarCanonSystemOptions) {
  const [shapeGrammarCanon, setShapeGrammarCanon] = useState<ShapeGrammarCanonEntry[]>(() => readShapeGrammarCanon());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncShapeGrammarCanon() {
      setShapeGrammarCanon(readShapeGrammarCanon());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== SHAPE_GRAMMAR_CANON_STORAGE_KEY) {
        return;
      }

      syncShapeGrammarCanon();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SHAPE_GRAMMAR_CANON_UPDATED_EVENT, syncShapeGrammarCanon);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SHAPE_GRAMMAR_CANON_UPDATED_EVENT, syncShapeGrammarCanon);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadShapeGrammarCanon() {
      try {
        const next = await loadPersistedMindsliceState<ShapeGrammarCanonEntry>("canon", "shape_grammar");

        if (cancelled) {
          return;
        }

        writeShapeGrammarCanon(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(SHAPE_GRAMMAR_CANON_UPDATED_EVENT));
        }
      }
    }

    loadShapeGrammarCanon();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const fingerprint = buildMemoryFingerprint(shapeGrammarMemory);
    if (lastFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readShapeGrammarCanon();
    const canonicalEntries = shapeGrammarMemory
      .filter((entry) => {
        const sourceIdeaCanonCount = shapeGrammarMemory.filter(
          (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId,
        ).length;
        return isGrammarCanonical({
          grammar: entry.grammar,
          validation: entry.validation,
          stage: entry.stage,
          sourceIdeaCanonCount,
        });
      })
      .map((entry) => {
        const siblingCanonIds = shapeGrammarMemory
          .filter(
            (candidate) => candidate.sourceIdeaId === entry.sourceIdeaId && candidate.id !== entry.id,
          )
          .map((candidate) => candidate.id)
          .slice(0, 6);
        const previousEntry = previous.find((candidate) => candidate.id === entry.id);
        const sourceIdeaCanonCount = siblingCanonIds.length + 1;
        const influenceWeight = clamp(
          entry.validation.coherence * 0.22 +
            entry.validation.transformation * 0.18 +
            entry.validation.relation * 0.18 +
            entry.validation.expressivePower * 0.2 +
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
          grammar: entry.grammar,
          validation: entry.validation,
          canonizedAt: previousEntry?.canonizedAt ?? entry.storedAt,
          lastActivatedAt: entry.lastSeenAt,
          lineage: {
            siblingCanonIds,
            sourceIdeaCanonCount,
          },
          influenceWeight,
        } satisfies ShapeGrammarCanonEntry;
      });

    const next = [
      ...canonicalEntries,
      ...previous.filter((entry) => !canonicalEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 24);

    lastFingerprintRef.current = fingerprint;
    writeShapeGrammarCanon(next);

    void persistMindsliceState("canon", "shape_grammar", next)
      .then((synced) => {
        writeShapeGrammarCanon(synced);
      })
      .catch(() => {
        // Alpha-safe: local shape grammar canon remains available if backend persistence fails.
      });
  }, [isSignedIn, shapeGrammarMemory]);

  const visibleShapeGrammarCanon = useMemo(
    () => (isSignedIn ? shapeGrammarCanon : []),
    [isSignedIn, shapeGrammarCanon],
  );
  const primaryShapeGrammarCanon = visibleShapeGrammarCanon[0] ?? null;

  return {
    shapeGrammarCanon: visibleShapeGrammarCanon,
    shapeGrammarCanonCount: visibleShapeGrammarCanon.length,
    primaryShapeGrammarCanon,
  };
}
