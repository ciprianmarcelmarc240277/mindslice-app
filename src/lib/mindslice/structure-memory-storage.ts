"use client";

import type { StructureMemoryEntry } from "@/lib/mindslice/mindslice-types";

export const STRUCTURE_MEMORY_STORAGE_KEY = "mindslice:structure-memory";
export const STRUCTURE_MEMORY_UPDATED_EVENT = "mindslice:structure-memory-updated";

export function readStructureMemory() {
  if (typeof window === "undefined") {
    return [] as StructureMemoryEntry[];
  }

  try {
    const raw = window.localStorage.getItem(STRUCTURE_MEMORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { structureMemory?: StructureMemoryEntry[] };
    return Array.isArray(parsed.structureMemory) ? parsed.structureMemory : [];
  } catch {
    return [];
  }
}

export function writeStructureMemory(next: StructureMemoryEntry[]) {
  try {
    window.localStorage.setItem(
      STRUCTURE_MEMORY_STORAGE_KEY,
      JSON.stringify({ structureMemory: next }),
    );
    window.dispatchEvent(new Event(STRUCTURE_MEMORY_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
