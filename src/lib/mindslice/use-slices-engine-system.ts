"use client";

import { useEffect, useState } from "react";

type UseSlicesEngineSystemOptions<TSlice> = {
  fallbackSlices: TSlice[];
  fallbackEngineMode: string;
  isSignedIn: boolean;
  refreshKey: string;
};

export function useSlicesEngineSystem<TSlice, TProfile>({
  fallbackSlices,
  fallbackEngineMode,
  isSignedIn,
  refreshKey,
}: UseSlicesEngineSystemOptions<TSlice>) {
  const [stateLibrary, setStateLibrary] = useState<TSlice[]>(fallbackSlices);
  const [engineMode, setEngineMode] = useState(fallbackEngineMode);
  const [engineProfile, setEngineProfile] = useState<TProfile | null>(null);
  const [hydrationVersion, setHydrationVersion] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadSlices() {
      try {
        const response = await fetch("/api/slices", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Slices request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as {
          slices?: TSlice[];
          engineMode?: string;
          engineProfile?: TProfile;
        };
        const slices = Array.isArray(payload.slices) ? payload.slices : [];
        if (!slices.length || ignore) {
          return;
        }

        setStateLibrary(slices);
        setEngineMode(payload.engineMode || fallbackEngineMode);
        setEngineProfile(payload.engineProfile || null);
        setHydrationVersion((previous) => previous + 1);
      } catch {
        if (!ignore) {
          setStateLibrary(fallbackSlices);
          setEngineMode(fallbackEngineMode);
          setEngineProfile(null);
          setHydrationVersion((previous) => previous + 1);
        }
      }
    }

    loadSlices();

    return () => {
      ignore = true;
    };
  }, [fallbackEngineMode, fallbackSlices, isSignedIn, refreshKey]);

  return {
    stateLibrary,
    engineMode,
    engineProfile,
    hydrationVersion,
  };
}
