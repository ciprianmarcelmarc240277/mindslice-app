"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  readShapeMemory,
  SHAPE_MEMORY_STORAGE_KEY,
  SHAPE_MEMORY_UPDATED_EVENT,
  writeShapeMemory,
} from "@/lib/mindslice/shape-memory-storage";
import {
  loadPersistedMindsliceState,
  persistMindsliceState,
} from "@/lib/mindslice/mindslice-state-persistence";
import type {
  ShapeMemoryEntry,
  ShapePoolEntry,
} from "@/lib/mindslice/mindslice-types";

type UseShapeMemorySystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  activeShapePoolEntry: ShapePoolEntry | null;
};

function buildFingerprint(entry: ShapePoolEntry | null) {
  if (!entry) {
    return "no-active-shape-pool-entry";
  }

  return [
    entry.id,
    entry.stage,
    entry.shape.type,
    entry.shape.behavior,
  ].join("::");
}

export function useShapeMemorySystem({
  isSignedIn,
  isActive,
  activeShapePoolEntry,
}: UseShapeMemorySystemOptions) {
  const [shapeMemory, setShapeMemory] = useState<ShapeMemoryEntry[]>(() => readShapeMemory());
  const lastStoredFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncShapeMemory() {
      setShapeMemory(readShapeMemory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== SHAPE_MEMORY_STORAGE_KEY) {
        return;
      }

      syncShapeMemory();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SHAPE_MEMORY_UPDATED_EVENT, syncShapeMemory);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SHAPE_MEMORY_UPDATED_EVENT, syncShapeMemory);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    async function loadShapeMemory() {
      try {
        const next = await loadPersistedMindsliceState<ShapeMemoryEntry>("memory", "shape");

        if (cancelled) {
          return;
        }

        writeShapeMemory(next);
      } catch {
        if (!cancelled) {
          window.dispatchEvent(new Event(SHAPE_MEMORY_UPDATED_EVENT));
        }
      }
    }

    loadShapeMemory();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !isActive || !activeShapePoolEntry) {
      return;
    }

    const fingerprint = buildFingerprint(activeShapePoolEntry);
    if (lastStoredFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readShapeMemory();
    lastStoredFingerprintRef.current = fingerprint;
    const now = new Date().toISOString();
    const nextEntry: ShapeMemoryEntry = {
      id: activeShapePoolEntry.id,
      conceptId: activeShapePoolEntry.conceptId,
      conceptTitle: activeShapePoolEntry.conceptTitle,
      sourceIdeaId: activeShapePoolEntry.sourceIdeaId,
      stage: activeShapePoolEntry.stage,
      shape: activeShapePoolEntry.shape,
      validation: activeShapePoolEntry.validation,
      storedAt: previous.find((entry) => entry.id === activeShapePoolEntry.id)?.storedAt ?? now,
      lastSeenAt: now,
    };

    const next = [
      nextEntry,
      ...previous.filter((entry) => entry.id !== activeShapePoolEntry.id),
    ].slice(0, 24);

    writeShapeMemory(next);

    void persistMindsliceState("memory", "shape", next)
      .then((synced) => {
        writeShapeMemory(synced);
      })
      .catch(() => {
        // Alpha-safe: local shape memory remains available if backend persistence fails.
      });
  }, [activeShapePoolEntry, isActive, isSignedIn]);

  const visibleShapeMemory = useMemo(
    () => (isSignedIn ? shapeMemory : []),
    [isSignedIn, shapeMemory],
  );
  const latestShapeMemory = visibleShapeMemory[0] ?? null;
  const resolvedShapeCount = useMemo(
    () =>
      visibleShapeMemory.filter(
        (entry) => entry.stage === "resolved" || entry.stage === "canonical",
      ).length,
    [visibleShapeMemory],
  );

  return {
    shapeMemory: visibleShapeMemory,
    latestShapeMemory,
    resolvedShapeCount,
  };
}
