"use client";

import type { StoryMemoryEntry } from "@/lib/mindslice/mindslice-types";

export const STORY_MEMORY_STORAGE_KEY = "mindslice:story-memory";
export const STORY_MEMORY_UPDATED_EVENT = "mindslice:story-memory-updated";

export function readStoryMemory() {
  if (typeof window === "undefined") {
    return [] as StoryMemoryEntry[];
  }

  try {
    const raw = window.localStorage.getItem(STORY_MEMORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { storyMemory?: StoryMemoryEntry[] };
    return Array.isArray(parsed.storyMemory) ? parsed.storyMemory : [];
  } catch {
    return [];
  }
}

export function writeStoryMemory(next: StoryMemoryEntry[]) {
  try {
    window.localStorage.setItem(STORY_MEMORY_STORAGE_KEY, JSON.stringify({ storyMemory: next }));
    window.dispatchEvent(new Event(STORY_MEMORY_UPDATED_EVENT));
  } catch {
    // Alpha-safe fallback persistence only.
  }
}
