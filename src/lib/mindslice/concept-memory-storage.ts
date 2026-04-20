"use client";

import type { ConceptMemoryEntry } from "@/lib/mindslice/mindslice-types";

export const CONCEPT_MEMORY_STORAGE_KEY = "mindslice:concept-memory";
export const CONCEPT_MEMORY_UPDATED_EVENT = "mindslice:concept-memory-updated";

export function readConceptMemory() {
  if (typeof window === "undefined") {
    return [] as ConceptMemoryEntry[];
  }

  try {
    const raw = window.localStorage.getItem(CONCEPT_MEMORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { conceptMemory?: ConceptMemoryEntry[] };
    return Array.isArray(parsed.conceptMemory) ? parsed.conceptMemory : [];
  } catch {
    return [];
  }
}

export function writeConceptMemory(next: ConceptMemoryEntry[]) {
  try {
    window.localStorage.setItem(CONCEPT_MEMORY_STORAGE_KEY, JSON.stringify({ conceptMemory: next }));
    window.dispatchEvent(new Event(CONCEPT_MEMORY_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
