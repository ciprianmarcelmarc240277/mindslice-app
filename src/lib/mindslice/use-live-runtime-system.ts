"use client";

import { useEffect, useState } from "react";
import type { LiveInterference } from "@/lib/mindslice/mindslice-types";

type UseLiveRuntimeSystemOptions = {
  isSignedIn: boolean;
  interferenceRefreshKey: string;
  fallbackInterference: LiveInterference | null;
};

export function useLiveRuntimeSystem({
  isSignedIn,
  interferenceRefreshKey,
  fallbackInterference,
}: UseLiveRuntimeSystemOptions) {
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [interference, setInterference] = useState<LiveInterference | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReferenceImages() {
      try {
        const response = await fetch("/api/reference-images", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Reference images request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as { images?: string[] };
        const urls = Array.isArray(payload.images) ? payload.images : [];
        if (!urls.length || cancelled) {
          return;
        }

        setReferenceImageUrls(urls);
        setImageIndex(0);
      } catch {
        if (!cancelled) {
          setReferenceImageUrls([]);
        }
      }
    }

    loadReferenceImages();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setInterference(null);
      return;
    }

    let cancelled = false;

    async function loadInterference() {
      try {
        const response = await fetch("/api/live-interference", { cache: "no-store" });
        const payload = (await response.json()) as {
          interference?: LiveInterference | null;
        };

        if (!cancelled) {
          setInterference(payload.interference ?? fallbackInterference ?? null);
        }
      } catch {
        if (!cancelled) {
          setInterference(fallbackInterference ?? null);
        }
      }
    }

    loadInterference();

    return () => {
      cancelled = true;
    };
  }, [fallbackInterference, interferenceRefreshKey, isSignedIn]);

  const currentImageUrl = referenceImageUrls.length
    ? referenceImageUrls[imageIndex % referenceImageUrls.length]
    : null;
  const liveInfluenceMode = interference?.influenceMode ?? null;
  const liveAiResponseLines = (interference?.aiResponseText ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  return {
    referenceImageUrls,
    imageIndex,
    setImageIndex,
    currentImageUrl,
    interference,
    liveInfluenceMode,
    liveAiResponseLines,
  };
}
