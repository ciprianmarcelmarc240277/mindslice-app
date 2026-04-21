"use client";

import type { StructurePoolEntry } from "@/lib/mindslice/mindslice-types";

export const STRUCTURE_POOL_STORAGE_KEY = "mindslice:structure-pool";
export const STRUCTURE_POOL_UPDATED_EVENT = "mindslice:structure-pool-updated";

export function readStructurePool() {
  if (typeof window === "undefined") {
    return [] as StructurePoolEntry[];
  }

  try {
    const raw = window.localStorage.getItem(STRUCTURE_POOL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { structurePool?: StructurePoolEntry[] };
    return Array.isArray(parsed.structurePool) ? parsed.structurePool : [];
  } catch {
    return [];
  }
}

export function writeStructurePool(next: StructurePoolEntry[]) {
  try {
    window.localStorage.setItem(
      STRUCTURE_POOL_STORAGE_KEY,
      JSON.stringify({ structurePool: next }),
    );
    window.dispatchEvent(new Event(STRUCTURE_POOL_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
