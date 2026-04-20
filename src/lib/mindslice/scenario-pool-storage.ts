"use client";

import type { ScenarioPoolEntry } from "@/lib/mindslice/mindslice-types";

export const SCENARIO_POOL_STORAGE_KEY = "mindslice:scenario-pool";
export const SCENARIO_POOL_UPDATED_EVENT = "mindslice:scenario-pool-updated";

export function readScenarioPool() {
  if (typeof window === "undefined") {
    return [] as ScenarioPoolEntry[];
  }

  try {
    const raw = window.localStorage.getItem(SCENARIO_POOL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { scenarioPool?: ScenarioPoolEntry[] };
    return Array.isArray(parsed.scenarioPool) ? parsed.scenarioPool : [];
  } catch {
    return [];
  }
}

export function writeScenarioPool(next: ScenarioPoolEntry[]) {
  try {
    window.localStorage.setItem(SCENARIO_POOL_STORAGE_KEY, JSON.stringify({ scenarioPool: next }));
    window.dispatchEvent(new Event(SCENARIO_POOL_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
