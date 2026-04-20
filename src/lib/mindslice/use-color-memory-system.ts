"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  COLOR_MEMORY_STORAGE_KEY,
  COLOR_MEMORY_UPDATED_EVENT,
  readColorMemory,
  writeColorMemory,
} from "@/lib/mindslice/color-memory-storage";
import type {
  ColorMemoryEntry,
  ColorPoolEntry,
} from "@/lib/mindslice/mindslice-types";

type UseColorMemorySystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  activeColorPoolEntry: ColorPoolEntry | null;
};

function buildFingerprint(entry: ColorPoolEntry | null) {
  if (!entry) {
    return "no-active-color-pool-entry";
  }

  return [
    entry.id,
    entry.stage,
    entry.palette.dominant,
    entry.palette.accent,
  ].join("::");
}

export function useColorMemorySystem({
  isSignedIn,
  isActive,
  activeColorPoolEntry,
}: UseColorMemorySystemOptions) {
  const [colorMemory, setColorMemory] = useState<ColorMemoryEntry[]>(() => readColorMemory());
  const lastStoredFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    function syncColorMemory() {
      setColorMemory(readColorMemory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== COLOR_MEMORY_STORAGE_KEY) {
        return;
      }

      syncColorMemory();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(COLOR_MEMORY_UPDATED_EVENT, syncColorMemory);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(COLOR_MEMORY_UPDATED_EVENT, syncColorMemory);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || !isActive || !activeColorPoolEntry) {
      return;
    }

    const fingerprint = buildFingerprint(activeColorPoolEntry);
    if (lastStoredFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readColorMemory();
    lastStoredFingerprintRef.current = fingerprint;
    const now = new Date().toISOString();
    const nextEntry: ColorMemoryEntry = {
      id: activeColorPoolEntry.id,
      conceptId: activeColorPoolEntry.conceptId,
      conceptTitle: activeColorPoolEntry.conceptTitle,
      sourceIdeaId: activeColorPoolEntry.sourceIdeaId,
      stage: activeColorPoolEntry.stage,
      palette: activeColorPoolEntry.palette,
      validation: activeColorPoolEntry.validation,
      storedAt: previous.find((entry) => entry.id === activeColorPoolEntry.id)?.storedAt ?? now,
      lastSeenAt: now,
    };

    const next = [
      nextEntry,
      ...previous.filter((entry) => entry.id !== activeColorPoolEntry.id),
    ].slice(0, 24);

    writeColorMemory(next);
  }, [activeColorPoolEntry, isActive, isSignedIn]);

  const visibleColorMemory = useMemo(
    () => (isSignedIn ? colorMemory : []),
    [colorMemory, isSignedIn],
  );
  const latestColorMemory = visibleColorMemory[0] ?? null;
  const resolvedColorCount = useMemo(
    () => visibleColorMemory.filter((entry) => entry.stage === "resolved" || entry.stage === "canonical").length,
    [visibleColorMemory],
  );

  return {
    colorMemory: visibleColorMemory,
    latestColorMemory,
    resolvedColorCount,
  };
}
