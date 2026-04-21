"use client";

import type { ShapePoolEntry } from "@/lib/mindslice/mindslice-types";

export const SHAPE_POOL_STORAGE_KEY = "mindslice:shape-pool";
export const SHAPE_POOL_UPDATED_EVENT = "mindslice:shape-pool-updated";

export function readShapePool() {
  if (typeof window === "undefined") {
    return [] as ShapePoolEntry[];
  }

  try {
    const raw = window.localStorage.getItem(SHAPE_POOL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { shapePool?: ShapePoolEntry[] };
    return Array.isArray(parsed.shapePool) ? parsed.shapePool : [];
  } catch {
    return [];
  }
}

export function writeShapePool(next: ShapePoolEntry[]) {
  try {
    window.localStorage.setItem(
      SHAPE_POOL_STORAGE_KEY,
      JSON.stringify({ shapePool: next }),
    );
    window.dispatchEvent(new Event(SHAPE_POOL_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
