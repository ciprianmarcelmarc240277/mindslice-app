"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  readShapePool,
  SHAPE_POOL_STORAGE_KEY,
  SHAPE_POOL_UPDATED_EVENT,
  writeShapePool,
} from "@/lib/mindslice/shape-pool-storage";
import type {
  ConceptPoolEntry,
  ShapePoolEntry,
} from "@/lib/mindslice/mindslice-types";

type UseShapePoolSystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  conceptPool: ConceptPoolEntry[];
};

function buildPoolFingerprint(conceptPool: ConceptPoolEntry[]) {
  return conceptPool
    .map((entry) => {
      const shape = entry.concept.expression.shape;
      return [
        entry.id,
        entry.concept.stage,
        shape?.type ?? "none",
        shape?.behavior ?? "none",
      ].join(":");
    })
    .join("|");
}

export function useShapePoolSystem({
  isSignedIn,
  isActive,
  conceptPool,
}: UseShapePoolSystemOptions) {
  const [shapePool, setShapePool] = useState<ShapePoolEntry[]>(() => readShapePool());
  const lastFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncShapePool() {
      setShapePool(readShapePool());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== SHAPE_POOL_STORAGE_KEY) {
        return;
      }

      syncShapePool();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SHAPE_POOL_UPDATED_EVENT, syncShapePool);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SHAPE_POOL_UPDATED_EVENT, syncShapePool);
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

    const previous = readShapePool();
    const nextEntries = conceptPool
      .filter((entry) => entry.concept.expression.shape)
      .filter((entry) => !entry.concept.expression.shape.runtime.hardFailureTriggered)
      .map((entry) => {
        const now = new Date().toISOString();
        const existing = previous.find((candidate) => candidate.id === entry.id);
        return {
          id: entry.id,
          conceptId: entry.concept.id,
          conceptTitle: entry.concept.core.title,
          sourceIdeaId: entry.concept.provenance.sourceIdeaId,
          stage: entry.concept.stage,
          shape: entry.concept.expression.shape,
          validation: {
            identity: entry.validation.scores.shapeIdentity,
            relation: entry.validation.scores.shapeRelation,
            tension: entry.validation.scores.shapeTension,
            attention: entry.validation.scores.shapeAttention,
          },
          pooledAt: existing?.pooledAt ?? now,
          lastSeenAt: now,
          source: entry.source,
        } satisfies ShapePoolEntry;
      });

    const next = [
      ...nextEntries,
      ...previous.filter((entry) => !nextEntries.some((candidate) => candidate.id === entry.id)),
    ].slice(0, 32);

    lastFingerprintRef.current = fingerprint;
    writeShapePool(next);
  }, [conceptPool, isActive, isSignedIn]);

  const latestShapePoolEntry = shapePool[0] ?? null;
  const activeShapePoolEntry = useMemo(
    () => shapePool.find((entry) => entry.source === "active_runtime") ?? latestShapePoolEntry,
    [latestShapePoolEntry, shapePool],
  );

  return {
    shapePool,
    shapePoolCount: shapePool.length,
    latestShapePoolEntry,
    activeShapePoolEntry,
  };
}
