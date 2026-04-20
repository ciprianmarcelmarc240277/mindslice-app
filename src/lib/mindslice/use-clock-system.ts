"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLOCK_MEMORY_STORAGE_KEY,
  CLOCK_MEMORY_UPDATED_EVENT,
  readClockMemory,
  writeClockMemory,
} from "@/lib/mindslice/clock-memory-storage";
import { processTime } from "@/lib/mindslice/concept-clock-system";
import type {
  ClockDisplayState,
  ClockMemoryEntry,
  InfluenceMode,
  ThoughtState,
} from "@/lib/mindslice/mindslice-types";

type UseClockSystemOptions = {
  isActive: boolean;
  current: ThoughtState;
  influenceMode: InfluenceMode | null;
};

function buildClockMemoryFingerprint(display: ClockDisplayState) {
  return [
    display.hours,
    display.minutes,
    display.seconds,
    display.visualStyle,
    display.attentionAnchor,
    display.transition,
  ].join(":");
}

export function useClockSystem({
  isActive,
  current,
  influenceMode,
}: UseClockSystemOptions) {
  const [now, setNow] = useState(() => new Date());
  const [clockMemory, setClockMemory] = useState<ClockMemoryEntry[]>(() => readClockMemory());
  const lastPersistedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function syncClockMemory() {
      setClockMemory(readClockMemory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== CLOCK_MEMORY_STORAGE_KEY) {
        return;
      }

      syncClockMemory();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CLOCK_MEMORY_UPDATED_EVENT, syncClockMemory);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CLOCK_MEMORY_UPDATED_EVENT, syncClockMemory);
    };
  }, []);

  const clockDisplay = useMemo(
    () =>
      processTime({
        now,
        userState: {
          current,
          isActive,
          influenceMode,
        },
      }),
    [current, influenceMode, isActive, now],
  );

  useEffect(() => {
    if (!clockDisplay) {
      return;
    }

    const fingerprint = buildClockMemoryFingerprint(clockDisplay);
    if (lastPersistedFingerprintRef.current === fingerprint) {
      return;
    }

    const previous = readClockMemory();
    const nowIso = new Date().toISOString();
    const existing = previous.find((entry) => entry.timeKey === fingerprint);
    const nextEntry = {
      id: existing?.id ?? `clock-${fingerprint}`,
      timeKey: fingerprint,
      display: clockDisplay,
      storedAt: existing?.storedAt ?? nowIso,
      lastSeenAt: nowIso,
      source: "active_runtime",
    } satisfies ClockMemoryEntry;
    const next = [
      nextEntry,
      ...previous.filter((entry) => entry.timeKey !== fingerprint),
    ].slice(0, 120);

    lastPersistedFingerprintRef.current = fingerprint;
    writeClockMemory(next);
  }, [clockDisplay]);

  const latestClockMemory = clockMemory[0] ?? null;
  const activeClockDisplay = clockDisplay ?? latestClockMemory?.display ?? null;

  return {
    now,
    clockDisplay: activeClockDisplay,
    clockMemory,
    clockMemoryCount: clockMemory.length,
    latestClockMemory,
  };
}
