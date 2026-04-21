"use client";

import { useEffect, useMemo, useState } from "react";
import {
  COLOR_CANON_UPDATED_EVENT,
  readColorCanon,
} from "@/lib/mindslice/color-canon-storage";
import {
  NARRATIVE_CANON_UPDATED_EVENT,
  readNarrativeCanon,
} from "@/lib/mindslice/narrative-canon-storage";
import {
  ART_CANON_UPDATED_EVENT,
  readArtCanon,
} from "@/lib/mindslice/art-canon-storage";
import {
  STRUCTURE_CANON_UPDATED_EVENT,
  readStructureCanon,
} from "@/lib/mindslice/structure-canon-storage";
import type {
  CanonDomain,
  CanonInfluenceContext,
  CanonInfluenceWeights,
} from "@/lib/mindslice/mindslice-types";

function buildNormalizedWeights(weights: CanonInfluenceWeights) {
  const total = weights.narrative + weights.art + weights.structure + weights.color;

  if (total <= 0) {
    return {
      normalizedWeights: {
        narrative: 0,
        art: 0,
        structure: 0,
        color: 0,
      } satisfies CanonInfluenceWeights,
      totalInfluence: 0,
      dominantCanon: null as CanonDomain | null,
    };
  }

  const normalizedWeights = {
    narrative: weights.narrative / total,
    art: weights.art / total,
    structure: weights.structure / total,
    color: weights.color / total,
  } satisfies CanonInfluenceWeights;

  const dominantCanon =
    (Object.entries(normalizedWeights) as Array<[CanonDomain, number]>)
      .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;

  return {
    normalizedWeights,
    totalInfluence: total,
    dominantCanon,
  };
}

function buildCanonInfluenceContext(): CanonInfluenceContext {
  const narrative = readNarrativeCanon()[0] ?? null;
  const art = readArtCanon()[0] ?? null;
  const structure = readStructureCanon()[0] ?? null;
  const color = readColorCanon()[0] ?? null;
  const activeWeights = {
    narrative: narrative?.influenceWeight ?? 0,
    art: art?.influenceWeight ?? 0,
    structure: structure?.influenceWeight ?? 0,
    color: color?.influenceWeight ?? 0,
  } satisfies CanonInfluenceWeights;
  const {
    normalizedWeights,
    totalInfluence,
    dominantCanon,
  } = buildNormalizedWeights(activeWeights);

  const notes = [
    narrative ? `narrative canon active: ${narrative.conceptTitle}` : "narrative canon inactive",
    art ? `art canon active: ${art.conceptTitle}` : "art canon inactive",
    structure ? `structure canon active: ${structure.conceptTitle}` : "structure canon inactive",
    color ? `color canon active: ${color.conceptTitle}` : "color canon inactive",
    `canon weights raw: N ${activeWeights.narrative.toFixed(2)} / A ${activeWeights.art.toFixed(2)} / S ${activeWeights.structure.toFixed(2)} / C ${activeWeights.color.toFixed(2)}`,
    `canon weights normalized: N ${normalizedWeights.narrative.toFixed(2)} / A ${normalizedWeights.art.toFixed(2)} / S ${normalizedWeights.structure.toFixed(2)} / C ${normalizedWeights.color.toFixed(2)}`,
    dominantCanon ? `dominant canon: ${dominantCanon}` : "dominant canon: none",
  ];

  return {
    narrative,
    art,
    structure,
    color,
    activeWeights,
    normalizedWeights,
    dominantCanon,
    totalInfluence,
    notes,
  };
}

export function useCanonInfluenceContext(isSignedIn: boolean) {
  const [context, setContext] = useState<CanonInfluenceContext>(() => buildCanonInfluenceContext());

  useEffect(() => {
    function syncContext() {
      setContext(buildCanonInfluenceContext());
    }

    window.addEventListener(NARRATIVE_CANON_UPDATED_EVENT, syncContext);
    window.addEventListener(ART_CANON_UPDATED_EVENT, syncContext);
    window.addEventListener(STRUCTURE_CANON_UPDATED_EVENT, syncContext);
    window.addEventListener(COLOR_CANON_UPDATED_EVENT, syncContext);
    window.addEventListener("storage", syncContext);

    return () => {
      window.removeEventListener(NARRATIVE_CANON_UPDATED_EVENT, syncContext);
      window.removeEventListener(ART_CANON_UPDATED_EVENT, syncContext);
      window.removeEventListener(STRUCTURE_CANON_UPDATED_EVENT, syncContext);
      window.removeEventListener(COLOR_CANON_UPDATED_EVENT, syncContext);
      window.removeEventListener("storage", syncContext);
    };
  }, []);

  return useMemo(
    () =>
      isSignedIn
        ? context
        : {
            narrative: null,
            art: null,
            structure: null,
            color: null,
            activeWeights: { narrative: 0, art: 0, structure: 0, color: 0 },
            normalizedWeights: { narrative: 0, art: 0, structure: 0, color: 0 },
            dominantCanon: null,
            totalInfluence: 0,
            notes: [
              "narrative canon inactive",
              "art canon inactive",
              "structure canon inactive",
              "color canon inactive",
            ],
          } satisfies CanonInfluenceContext,
    [context, isSignedIn],
  );
}
