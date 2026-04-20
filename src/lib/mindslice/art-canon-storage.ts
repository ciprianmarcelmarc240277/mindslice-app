"use client";

import type { ArtCanonEntry } from "@/lib/mindslice/mindslice-types";

export const ART_CANON_STORAGE_KEY = "mindslice:art-canon";
export const ART_CANON_UPDATED_EVENT = "mindslice:art-canon-updated";

export function readArtCanon() {
  if (typeof window === "undefined") {
    return [] as ArtCanonEntry[];
  }

  try {
    const raw = window.localStorage.getItem(ART_CANON_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { artCanon?: ArtCanonEntry[] };
    return Array.isArray(parsed.artCanon) ? parsed.artCanon : [];
  } catch {
    return [];
  }
}

export function writeArtCanon(next: ArtCanonEntry[]) {
  try {
    window.localStorage.setItem(ART_CANON_STORAGE_KEY, JSON.stringify({ artCanon: next }));
    window.dispatchEvent(new Event(ART_CANON_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
