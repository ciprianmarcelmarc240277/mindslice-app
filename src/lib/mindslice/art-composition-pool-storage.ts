"use client";

import type { ArtCompositionPoolEntry } from "@/lib/mindslice/mindslice-types";

export const ART_COMPOSITION_POOL_STORAGE_KEY = "mindslice:art-composition-pool";
export const ART_COMPOSITION_POOL_UPDATED_EVENT = "mindslice:art-composition-pool-updated";

export function readArtCompositionPool() {
  if (typeof window === "undefined") {
    return [] as ArtCompositionPoolEntry[];
  }

  try {
    const raw = window.localStorage.getItem(ART_COMPOSITION_POOL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { artCompositionPool?: ArtCompositionPoolEntry[] };
    return Array.isArray(parsed.artCompositionPool) ? parsed.artCompositionPool : [];
  } catch {
    return [];
  }
}

export function writeArtCompositionPool(next: ArtCompositionPoolEntry[]) {
  try {
    window.localStorage.setItem(
      ART_COMPOSITION_POOL_STORAGE_KEY,
      JSON.stringify({ artCompositionPool: next }),
    );
    window.dispatchEvent(new Event(ART_COMPOSITION_POOL_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
