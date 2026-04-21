"use client";

import type { StructureCanonEntry } from "@/lib/mindslice/mindslice-types";

export const STRUCTURE_CANON_STORAGE_KEY = "mindslice:structure-canon";
export const STRUCTURE_CANON_UPDATED_EVENT = "mindslice:structure-canon-updated";

export function readStructureCanon() {
  if (typeof window === "undefined") {
    return [] as StructureCanonEntry[];
  }

  try {
    const raw = window.localStorage.getItem(STRUCTURE_CANON_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { structureCanon?: StructureCanonEntry[] };
    return Array.isArray(parsed.structureCanon) ? parsed.structureCanon : [];
  } catch {
    return [];
  }
}

export function writeStructureCanon(next: StructureCanonEntry[]) {
  try {
    window.localStorage.setItem(
      STRUCTURE_CANON_STORAGE_KEY,
      JSON.stringify({ structureCanon: next }),
    );
    window.dispatchEvent(new Event(STRUCTURE_CANON_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
