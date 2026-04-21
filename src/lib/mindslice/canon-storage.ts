"use client";

import { normalizeLegacyCanonEntry } from "@/lib/mindslice/concept-legacy-normalization";
import type { CanonEntry } from "@/lib/mindslice/mindslice-types";

export const CANON_STORAGE_KEY = "mindslice:canon";
export const CANON_UPDATED_EVENT = "mindslice:canon-updated";

export function readCanon() {
  if (typeof window === "undefined") {
    return [] as CanonEntry[];
  }

  try {
    const raw = window.localStorage.getItem(CANON_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { canon?: CanonEntry[] };
    return Array.isArray(parsed.canon)
      ? parsed.canon.map(normalizeLegacyCanonEntry)
      : [];
  } catch {
    return [];
  }
}

export function writeCanon(next: CanonEntry[]) {
  try {
    window.localStorage.setItem(CANON_STORAGE_KEY, JSON.stringify({ canon: next }));
    window.dispatchEvent(new Event(CANON_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
