"use client";

import type { ArtMemoryEntry } from "@/lib/mindslice/mindslice-types";

export const ART_MEMORY_STORAGE_KEY = "mindslice:art-memory";
export const ART_MEMORY_UPDATED_EVENT = "mindslice:art-memory-updated";

export function readArtMemory() {
  if (typeof window === "undefined") {
    return [] as ArtMemoryEntry[];
  }

  try {
    const raw = window.localStorage.getItem(ART_MEMORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { artMemory?: ArtMemoryEntry[] };
    return Array.isArray(parsed.artMemory) ? parsed.artMemory : [];
  } catch {
    return [];
  }
}

export function writeArtMemory(next: ArtMemoryEntry[]) {
  try {
    window.localStorage.setItem(ART_MEMORY_STORAGE_KEY, JSON.stringify({ artMemory: next }));
    window.dispatchEvent(new Event(ART_MEMORY_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
