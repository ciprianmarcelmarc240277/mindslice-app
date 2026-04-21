"use client";

import type { MetaSystemMemoryEntry } from "@/lib/mindslice/mindslice-types";

export const META_SYSTEM_MEMORY_STORAGE_KEY = "mindslice:meta-system-memory";
export const META_SYSTEM_MEMORY_UPDATED_EVENT = "mindslice:meta-system-memory-updated";

export function readMetaSystemMemory() {
  if (typeof window === "undefined") {
    return [] as MetaSystemMemoryEntry[];
  }

  try {
    const raw = window.localStorage.getItem(META_SYSTEM_MEMORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { metaSystemMemory?: MetaSystemMemoryEntry[] };
    return Array.isArray(parsed.metaSystemMemory) ? parsed.metaSystemMemory : [];
  } catch {
    return [];
  }
}

export function writeMetaSystemMemory(next: MetaSystemMemoryEntry[]) {
  try {
    window.localStorage.setItem(
      META_SYSTEM_MEMORY_STORAGE_KEY,
      JSON.stringify({ metaSystemMemory: next }),
    );
    window.dispatchEvent(new Event(META_SYSTEM_MEMORY_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
