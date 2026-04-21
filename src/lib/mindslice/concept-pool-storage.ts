"use client";

import { normalizeLegacyConceptPoolEntry } from "@/lib/mindslice/concept-legacy-normalization";
import type { ConceptPoolEntry } from "@/lib/mindslice/mindslice-types";

export const CONCEPT_POOL_STORAGE_KEY = "mindslice:concept-pool";
export const CONCEPT_POOL_UPDATED_EVENT = "mindslice:concept-pool-updated";

export function readConceptPool() {
  if (typeof window === "undefined") {
    return [] as ConceptPoolEntry[];
  }

  try {
    const raw = window.localStorage.getItem(CONCEPT_POOL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { conceptPool?: ConceptPoolEntry[] };
    return Array.isArray(parsed.conceptPool)
      ? parsed.conceptPool.map(normalizeLegacyConceptPoolEntry)
      : [];
  } catch {
    return [];
  }
}

export function writeConceptPool(next: ConceptPoolEntry[]) {
  try {
    window.localStorage.setItem(CONCEPT_POOL_STORAGE_KEY, JSON.stringify({ conceptPool: next }));
    window.dispatchEvent(new Event(CONCEPT_POOL_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
