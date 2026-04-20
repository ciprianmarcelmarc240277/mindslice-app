"use client";

import { useEffect, useState } from "react";
import type { ConceptMemoryEntry } from "@/lib/mindslice/mindslice-types";

export function useConceptArchiveSystem() {
  const [conceptArchive, setConceptArchive] = useState<ConceptMemoryEntry[]>([]);
  const [isLoadingConceptArchive, setIsLoadingConceptArchive] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadConceptArchive() {
      try {
        const response = await fetch("/api/concepts", { cache: "no-store" });
        const payload = (await response.json()) as {
          conceptArchive?: ConceptMemoryEntry[];
        };

        if (!response.ok) {
          throw new Error("Concept archive request failed.");
        }

        if (!cancelled) {
          setConceptArchive(Array.isArray(payload.conceptArchive) ? payload.conceptArchive : []);
        }
      } catch {
        if (!cancelled) {
          setConceptArchive([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingConceptArchive(false);
        }
      }
    }

    loadConceptArchive();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    conceptArchive,
    isLoadingConceptArchive,
  };
}
