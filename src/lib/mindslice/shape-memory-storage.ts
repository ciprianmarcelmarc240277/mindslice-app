"use client";

import type { ShapeMemoryEntry } from "@/lib/mindslice/mindslice-types";

export const SHAPE_MEMORY_STORAGE_KEY = "mindslice:shape-memory";
export const SHAPE_MEMORY_UPDATED_EVENT = "mindslice:shape-memory-updated";

export function readShapeMemory() {
  if (typeof window === "undefined") {
    return [] as ShapeMemoryEntry[];
  }

  try {
    const raw = window.localStorage.getItem(SHAPE_MEMORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { shapeMemory?: ShapeMemoryEntry[] };
    return Array.isArray(parsed.shapeMemory) ? parsed.shapeMemory : [];
  } catch {
    return [];
  }
}

export function writeShapeMemory(next: ShapeMemoryEntry[]) {
  try {
    window.localStorage.setItem(
      SHAPE_MEMORY_STORAGE_KEY,
      JSON.stringify({ shapeMemory: next }),
    );
    window.dispatchEvent(new Event(SHAPE_MEMORY_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
