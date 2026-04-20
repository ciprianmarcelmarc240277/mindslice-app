"use client";

import type { ClockMemoryEntry } from "@/lib/mindslice/mindslice-types";

export const CLOCK_MEMORY_STORAGE_KEY = "mindslice:clock-memory";
export const CLOCK_MEMORY_UPDATED_EVENT = "mindslice:clock-memory-updated";

export function readClockMemory() {
  if (typeof window === "undefined") {
    return [] as ClockMemoryEntry[];
  }

  try {
    const raw = window.localStorage.getItem(CLOCK_MEMORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { clockMemory?: ClockMemoryEntry[] };
    return Array.isArray(parsed.clockMemory) ? parsed.clockMemory : [];
  } catch {
    return [];
  }
}

export function writeClockMemory(next: ClockMemoryEntry[]) {
  try {
    window.localStorage.setItem(CLOCK_MEMORY_STORAGE_KEY, JSON.stringify({ clockMemory: next }));
    window.dispatchEvent(new Event(CLOCK_MEMORY_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
