"use client";

import type { MetaSystemCanonEntry } from "@/lib/mindslice/mindslice-types";

export const META_SYSTEM_CANON_STORAGE_KEY = "mindslice:meta-system-canon";
export const META_SYSTEM_CANON_UPDATED_EVENT = "mindslice:meta-system-canon-updated";

export function readMetaSystemCanon() {
  if (typeof window === "undefined") {
    return [] as MetaSystemCanonEntry[];
  }

  try {
    const raw = window.localStorage.getItem(META_SYSTEM_CANON_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { metaSystemCanon?: MetaSystemCanonEntry[] };
    return Array.isArray(parsed.metaSystemCanon) ? parsed.metaSystemCanon : [];
  } catch {
    return [];
  }
}

export function writeMetaSystemCanon(next: MetaSystemCanonEntry[]) {
  try {
    window.localStorage.setItem(
      META_SYSTEM_CANON_STORAGE_KEY,
      JSON.stringify({ metaSystemCanon: next }),
    );
    window.dispatchEvent(new Event(META_SYSTEM_CANON_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
