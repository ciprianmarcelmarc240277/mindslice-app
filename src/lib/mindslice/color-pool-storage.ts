"use client";

import type { ColorPoolEntry } from "@/lib/mindslice/mindslice-types";

export const COLOR_POOL_STORAGE_KEY = "mindslice:color-pool";
export const COLOR_POOL_UPDATED_EVENT = "mindslice:color-pool-updated";

export function readColorPool() {
  if (typeof window === "undefined") {
    return [] as ColorPoolEntry[];
  }

  try {
    const raw = window.localStorage.getItem(COLOR_POOL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { colorPool?: ColorPoolEntry[] };
    return Array.isArray(parsed.colorPool) ? parsed.colorPool : [];
  } catch {
    return [];
  }
}

export function writeColorPool(next: ColorPoolEntry[]) {
  try {
    window.localStorage.setItem(COLOR_POOL_STORAGE_KEY, JSON.stringify({ colorPool: next }));
    window.dispatchEvent(new Event(COLOR_POOL_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
