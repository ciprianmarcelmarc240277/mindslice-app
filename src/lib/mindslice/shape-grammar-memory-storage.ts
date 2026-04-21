"use client";

import type { ShapeGrammarMemoryEntry } from "@/lib/mindslice/mindslice-types";

export const SHAPE_GRAMMAR_MEMORY_STORAGE_KEY = "mindslice:shape-grammar-memory";
export const SHAPE_GRAMMAR_MEMORY_UPDATED_EVENT = "mindslice:shape-grammar-memory-updated";

export function readShapeGrammarMemory() {
  if (typeof window === "undefined") {
    return [] as ShapeGrammarMemoryEntry[];
  }

  try {
    const raw = window.localStorage.getItem(SHAPE_GRAMMAR_MEMORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { shapeGrammarMemory?: ShapeGrammarMemoryEntry[] };
    return Array.isArray(parsed.shapeGrammarMemory) ? parsed.shapeGrammarMemory : [];
  } catch {
    return [];
  }
}

export function writeShapeGrammarMemory(next: ShapeGrammarMemoryEntry[]) {
  try {
    window.localStorage.setItem(
      SHAPE_GRAMMAR_MEMORY_STORAGE_KEY,
      JSON.stringify({ shapeGrammarMemory: next }),
    );
    window.dispatchEvent(new Event(SHAPE_GRAMMAR_MEMORY_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
