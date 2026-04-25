"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  finalizeSlicesRuntimeState,
  requestRemoteSlicesWithGuard,
  selectInitialSlices,
  type SlicesApiHydrationStatus,
  type SlicesRuntimeState,
} from "@/lib/mindslice/concept-slices-api-performance-guard-system";

type UseSlicesEngineSystemOptions<TSlice> = {
  fallbackSlices: TSlice[];
  fallbackEngineMode: string;
  isSignedIn: boolean;
  refreshKey: string;
  requestTimeoutMs?: number;
};

export function useSlicesEngineSystem<TSlice, TProfile>({
  fallbackSlices,
  fallbackEngineMode,
  isSignedIn,
  refreshKey,
  requestTimeoutMs = 6000,
}: UseSlicesEngineSystemOptions<TSlice>) {
  const fallbackLibrary = useMemo(
    () => ({
      default_slices: fallbackSlices,
      engine_mode: fallbackEngineMode,
    }),
    [fallbackEngineMode, fallbackSlices],
  );
  const [slicesRuntimeState, setSlicesRuntimeState] = useState<SlicesRuntimeState<TSlice, TProfile>>(
    () => selectInitialSlices(fallbackLibrary),
  );
  const [hydrationVersion, setHydrationVersion] = useState(0);
  const staleCacheRef = useRef<{
    slices: TSlice[];
    engine_mode?: string;
    engine_profile?: TProfile | null;
    expires_at?: number;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    const initialState = selectInitialSlices(fallbackLibrary, staleCacheRef.current);

    setSlicesRuntimeState(initialState);

    async function loadSlices() {
      const remoteResult = await requestRemoteSlicesWithGuard<TSlice, TProfile>({
        url: "/api/slices",
        timeout_ms: requestTimeoutMs,
        signal: controller.signal,
      });

      if (ignore) {
        return;
      }

      const nextState = finalizeSlicesRuntimeState(initialState, remoteResult, fallbackLibrary);

      if (remoteResult.status === "success") {
        staleCacheRef.current = {
          slices: remoteResult.slices,
          engine_mode: remoteResult.engine_mode,
          engine_profile: remoteResult.engine_profile,
          expires_at: Date.now() + 1000 * 60 * 5,
        };
      }

      setSlicesRuntimeState(nextState);
      setHydrationVersion((previous) => previous + 1);
    }

    if (isSignedIn) {
      void loadSlices();
    }

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [fallbackLibrary, isSignedIn, refreshKey, requestTimeoutMs]);

  const hydrationStatus: SlicesApiHydrationStatus = slicesRuntimeState.hydration_status;

  return {
    stateLibrary: slicesRuntimeState.active_slices,
    engineMode: slicesRuntimeState.engine_mode ?? fallbackEngineMode,
    engineProfile: slicesRuntimeState.engine_profile,
    hydrationVersion,
    librarySource: hydrationStatus === "remote_hydrated" ? ("remote" as const) : ("fallback" as const),
    hydrationStatus,
    slicesWarnings: slicesRuntimeState.warnings,
  };
}
