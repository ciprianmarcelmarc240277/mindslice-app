"use client";

import type { ShapeGrammarCanonEntry } from "@/lib/mindslice/mindslice-types";

export const SHAPE_GRAMMAR_CANON_STORAGE_KEY = "mindslice:shape-grammar-canon";
export const SHAPE_GRAMMAR_CANON_UPDATED_EVENT = "mindslice:shape-grammar-canon-updated";

export function readShapeGrammarCanon() {
  if (typeof window === "undefined") {
    return [] as ShapeGrammarCanonEntry[];
  }

  try {
    const raw = window.localStorage.getItem(SHAPE_GRAMMAR_CANON_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { shapeGrammarCanon?: ShapeGrammarCanonEntry[] };
    return Array.isArray(parsed.shapeGrammarCanon) ? parsed.shapeGrammarCanon : [];
  } catch {
    return [];
  }
}

export function writeShapeGrammarCanon(next: ShapeGrammarCanonEntry[]) {
  try {
    window.localStorage.setItem(
      SHAPE_GRAMMAR_CANON_STORAGE_KEY,
      JSON.stringify({ shapeGrammarCanon: next }),
    );
    window.dispatchEvent(new Event(SHAPE_GRAMMAR_CANON_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
