"use client";

import type { ColorMemoryEntry } from "@/lib/mindslice/mindslice-types";

export const COLOR_MEMORY_STORAGE_KEY = "mindslice:color-memory";
export const COLOR_MEMORY_UPDATED_EVENT = "mindslice:color-memory-updated";

export function readColorMemory() {
  if (typeof window === "undefined") {
    return [] as ColorMemoryEntry[];
  }

  try {
    const raw = window.localStorage.getItem(COLOR_MEMORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { colorMemory?: ColorMemoryEntry[] };
    return Array.isArray(parsed.colorMemory) ? parsed.colorMemory : [];
  } catch {
    return [];
  }
}

export function writeColorMemory(next: ColorMemoryEntry[]) {
  try {
    window.localStorage.setItem(COLOR_MEMORY_STORAGE_KEY, JSON.stringify({ colorMemory: next }));
    window.dispatchEvent(new Event(COLOR_MEMORY_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
