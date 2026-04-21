"use client";

import type { ShapeCanonEntry } from "@/lib/mindslice/mindslice-types";

export const SHAPE_CANON_STORAGE_KEY = "mindslice:shape-canon";
export const SHAPE_CANON_UPDATED_EVENT = "mindslice:shape-canon-updated";

export function readShapeCanon() {
  if (typeof window === "undefined") {
    return [] as ShapeCanonEntry[];
  }

  try {
    const raw = window.localStorage.getItem(SHAPE_CANON_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { shapeCanon?: ShapeCanonEntry[] };
    return Array.isArray(parsed.shapeCanon) ? parsed.shapeCanon : [];
  } catch {
    return [];
  }
}

export function writeShapeCanon(next: ShapeCanonEntry[]) {
  try {
    window.localStorage.setItem(
      SHAPE_CANON_STORAGE_KEY,
      JSON.stringify({ shapeCanon: next }),
    );
    window.dispatchEvent(new Event(SHAPE_CANON_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
