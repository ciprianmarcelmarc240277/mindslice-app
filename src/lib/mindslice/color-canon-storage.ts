"use client";

import type { ColorCanonEntry } from "@/lib/mindslice/mindslice-types";

export const COLOR_CANON_STORAGE_KEY = "mindslice:color-canon";
export const COLOR_CANON_UPDATED_EVENT = "mindslice:color-canon-updated";

export function readColorCanon() {
  if (typeof window === "undefined") {
    return [] as ColorCanonEntry[];
  }

  try {
    const raw = window.localStorage.getItem(COLOR_CANON_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { colorCanon?: ColorCanonEntry[] };
    return Array.isArray(parsed.colorCanon) ? parsed.colorCanon : [];
  } catch {
    return [];
  }
}

export function writeColorCanon(next: ColorCanonEntry[]) {
  try {
    window.localStorage.setItem(COLOR_CANON_STORAGE_KEY, JSON.stringify({ colorCanon: next }));
    window.dispatchEvent(new Event(COLOR_CANON_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
