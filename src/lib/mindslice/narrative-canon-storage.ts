"use client";

import type { NarrativeCanonEntry } from "@/lib/mindslice/mindslice-types";

export const NARRATIVE_CANON_STORAGE_KEY = "mindslice:narrative-canon";
export const NARRATIVE_CANON_UPDATED_EVENT = "mindslice:narrative-canon-updated";

export function readNarrativeCanon() {
  if (typeof window === "undefined") {
    return [] as NarrativeCanonEntry[];
  }

  try {
    const raw = window.localStorage.getItem(NARRATIVE_CANON_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { narrativeCanon?: NarrativeCanonEntry[] };
    return Array.isArray(parsed.narrativeCanon) ? parsed.narrativeCanon : [];
  } catch {
    return [];
  }
}

export function writeNarrativeCanon(next: NarrativeCanonEntry[]) {
  try {
    window.localStorage.setItem(NARRATIVE_CANON_STORAGE_KEY, JSON.stringify({ narrativeCanon: next }));
    window.dispatchEvent(new Event(NARRATIVE_CANON_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
