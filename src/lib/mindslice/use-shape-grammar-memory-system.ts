"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  readShapeGrammarMemory,
  SHAPE_GRAMMAR_MEMORY_STORAGE_KEY,
  SHAPE_GRAMMAR_MEMORY_UPDATED_EVENT,
  writeShapeGrammarMemory,
} from "@/lib/mindslice/shape-grammar-memory-storage";
import {
  loadPersistedMindsliceState,
  persistMindsliceState,
} from "@/lib/mindslice/mindslice-state-persistence";
import type {
  ConceptPoolEntry,
  ShapeGrammarMemoryEntry,
} from "@/lib/mindslice/mindslice-types";

type UseShapeGrammarMemorySystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  activePoolEntry: ConceptPoolEntry | null;
};

function buildFingerprint(activePoolEntry: ConceptPoolEntry | null) {
  if (!activePoolEntry) {
    return "no-active-grammar-entry";
  }

  const grammar = activePoolEntry.concept.expression.shapeGrammar;
  if (!grammar) {
    return "missing-shape-grammar";
  }

  return [
    activePoolEntry.id,
    activePoolEntry.concept.stage,
    grammar.outputVisual,
    (activePoolEntry.validation.scores.grammarCoherence ?? 0).toFixed(3),
  ].join("::");
}

export function useShapeGrammarMemorySystem({
  isSignedIn,
  isActive,
  activePoolEntry,
}: UseShapeGrammarMemorySystemOptions) {
  const [shapeGrammarMemory, setShapeGrammarMemory] = useState<ShapeGrammarMemoryEntry[]>(() => readShapeGrammarMemory());
  const lastStoredFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncShapeGrammarMemory() {
      setShapeGrammarMemory(readShapeGrammarMemory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== SHAPE_GRAMMAR_MEMORY_STORAGE_KEY) {
        return;
      }

      syncShapeGrammarMemory();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SHAPE_GRAMMAR_MEMORY_UPDATED_EVENT, syncShapeGrammarMemory);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SHAPE_GRAMMAR_MEMORY_UPDATED_EVENT, syncShapeGrammarMemory);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadShapeGrammarMemory() {
      try {
        const next = await loadPersistedMindsliceState<ShapeGrammarMemoryEntry>("memory", "shape_grammar");

        if (cancelled) {
          return;
        }

        writeShapeGrammarMemory(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(SHAPE_GRAMMAR_MEMORY_UPDATED_EVENT));
        }
      }
    }

    loadShapeGrammarMemory();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !isActive || !activePoolEntry) {
      return;
    }

    const grammar = activePoolEntry.concept.expression.shapeGrammar;
    if (!grammar || grammar.runtime.failed) {
      return;
    }

    const fingerprint = buildFingerprint(activePoolEntry);
    if (lastStoredFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readShapeGrammarMemory();
    lastStoredFingerprintRef.current = fingerprint;
    const now = new Date().toISOString();
    const nextEntry: ShapeGrammarMemoryEntry = {
      id: activePoolEntry.id,
      conceptId: activePoolEntry.concept.id,
      conceptTitle: activePoolEntry.concept.core.title,
      sourceIdeaId: activePoolEntry.concept.provenance.sourceIdeaId,
      stage: activePoolEntry.concept.stage,
      grammar,
      validation: {
        coherence: activePoolEntry.validation.scores.grammarCoherence ?? 0,
        transformation: activePoolEntry.validation.scores.grammarTransformation ?? 0,
        relation: activePoolEntry.validation.scores.grammarRelation ?? 0,
        expressivePower: activePoolEntry.validation.scores.grammarExpressivePower ?? 0,
      },
      storedAt: previous.find((entry) => entry.id === activePoolEntry.id)?.storedAt ?? now,
      lastSeenAt: now,
    };

    const next = [
      nextEntry,
      ...previous.filter((entry) => entry.id !== activePoolEntry.id),
    ].slice(0, 24);

    writeShapeGrammarMemory(next);

    void persistMindsliceState("memory", "shape_grammar", next)
      .then((synced) => {
        writeShapeGrammarMemory(synced);
      })
      .catch(() => {
        // Alpha-safe: local shape grammar memory remains available if backend persistence fails.
      });
  }, [activePoolEntry, isActive, isSignedIn]);

  const visibleShapeGrammarMemory = useMemo(
    () => (isSignedIn ? shapeGrammarMemory : []),
    [isSignedIn, shapeGrammarMemory],
  );
  const latestShapeGrammarMemory = visibleShapeGrammarMemory[0] ?? null;
  const resolvedShapeGrammarCount = useMemo(
    () =>
      visibleShapeGrammarMemory.filter(
        (entry) => entry.stage === "resolved" || entry.stage === "canonical",
      ).length,
    [visibleShapeGrammarMemory],
  );

  return {
    shapeGrammarMemory: visibleShapeGrammarMemory,
    latestShapeGrammarMemory,
    resolvedShapeGrammarCount,
  };
}
