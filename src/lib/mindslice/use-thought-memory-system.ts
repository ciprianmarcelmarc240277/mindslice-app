"use client";

import { useEffect, useRef, useState } from "react";
import type {
  HistoryEntry,
  InfluenceMode,
  ThoughtMemoryEntry,
} from "@/lib/mindslice/mindslice-types";

type ThoughtSnapshot = {
  direction: string;
  thought: string;
  fragments: string[];
  keywords: string[];
  triad: {
    art: {
      score: number;
    };
    design: {
      score: number;
    };
    business: {
      score: number;
    };
  };
};

type UseThoughtMemorySystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  hasProfileAccess: boolean;
  current: ThoughtSnapshot;
  currentIndex: number;
  influenceMode: InfluenceMode | null;
};

export function useThoughtMemorySystem({
  isSignedIn,
  isActive,
  hasProfileAccess,
  current,
  currentIndex,
  influenceMode,
}: UseThoughtMemorySystemOptions) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [thoughtMemory, setThoughtMemory] = useState<ThoughtMemoryEntry[]>([]);
  const lastPersistedThoughtRef = useRef<string | null>(null);

  useEffect(() => {
    const time = new Date().toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setHistory((previous) => {
      const next = [{ time, text: current.thought }, ...previous];
      return next.slice(0, 5);
    });
  }, [current.thought]);

  useEffect(() => {
    if (!isSignedIn) {
      setThoughtMemory([]);
      lastPersistedThoughtRef.current = null;
      return;
    }

    let cancelled = false;

    async function loadThoughtMemory() {
      try {
        const response = await fetch("/api/thought-memory", { cache: "no-store" });
        const payload = (await response.json()) as {
          thoughtMemory?: ThoughtMemoryEntry[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut încărca memoria gândurilor.");
        }

        if (!cancelled) {
          setThoughtMemory(Array.isArray(payload.thoughtMemory) ? payload.thoughtMemory : []);
        }
      } catch {
        if (!cancelled) {
          setThoughtMemory([]);
        }
      }
    }

    loadThoughtMemory();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, currentIndex, influenceMode]);

  useEffect(() => {
    if (!isSignedIn || !isActive || !hasProfileAccess) {
      return;
    }

    const fingerprint = [
      current.direction,
      current.thought,
      currentIndex,
      influenceMode ?? "none",
    ].join("::");

    if (lastPersistedThoughtRef.current === fingerprint) {
      return;
    }

    lastPersistedThoughtRef.current = fingerprint;

    void fetch("/api/thought-memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceType: influenceMode ? "journal_contamination" : "live_slice",
        direction: current.direction,
        thought: current.thought,
        fragments: current.fragments,
        keywords: current.keywords,
        senseScore: current.triad.art.score,
        structureScore: current.triad.design.score,
        attentionScore: current.triad.business.score,
        influenceMode,
        memoryWeight: influenceMode ? 0.7 : 0.4,
      }),
    }).catch(() => {
      // Alpha-safe: memoria nu trebuie să rupă scena live dacă persistarea eșuează.
    });
  }, [current, currentIndex, hasProfileAccess, influenceMode, isActive, isSignedIn]);

  return {
    history,
    thoughtMemory,
  };
}
