export type SlicesApiHydrationStatus =
  | "fallback_active"
  | "remote_hydrated"
  | "timeout_using_fallback"
  | "error_using_fallback";

export type SlicesApiRequestConfig = {
  url?: string;
  timeout_ms?: number;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
};

export type SlicesFallbackLibrary<TSlice> = {
  default_slices: TSlice[];
  engine_mode?: string;
};

export type SlicesStaleCache<TSlice, TProfile> = {
  slices: TSlice[];
  engine_mode?: string;
  engine_profile?: TProfile | null;
  expires_at?: number;
};

export type SlicesRuntimeState<TSlice, TProfile> = {
  active_slices: TSlice[];
  engine_mode?: string;
  engine_profile: TProfile | null;
  hydration_status: SlicesApiHydrationStatus;
  warnings: string[];
};

export type RemoteSlicesResult<TSlice, TProfile> =
  | {
      status: "success";
      slices: TSlice[];
      engine_mode?: string;
      engine_profile?: TProfile | null;
    }
  | {
      status: "timeout" | "error";
      warning: string;
    };

const DEFAULT_REQUEST_TIMEOUT_MS = 6000;

function staleCacheIsFresh<TSlice, TProfile>(staleCache?: SlicesStaleCache<TSlice, TProfile> | null) {
  if (!staleCache || !Array.isArray(staleCache.slices) || staleCache.slices.length === 0) {
    return false;
  }

  return !staleCache.expires_at || staleCache.expires_at > Date.now();
}

export function selectInitialSlices<TSlice, TProfile>(
  fallbackLibrary: SlicesFallbackLibrary<TSlice>,
  staleCache?: SlicesStaleCache<TSlice, TProfile> | null,
): SlicesRuntimeState<TSlice, TProfile> {
  if (staleCache && staleCacheIsFresh(staleCache)) {
    return {
      active_slices: staleCache.slices,
      engine_mode: staleCache.engine_mode ?? fallbackLibrary.engine_mode,
      engine_profile: staleCache.engine_profile ?? null,
      hydration_status: "fallback_active",
      warnings: [],
    };
  }

  return {
    active_slices: fallbackLibrary.default_slices,
    engine_mode: fallbackLibrary.engine_mode,
    engine_profile: null,
    hydration_status: "fallback_active",
    warnings: [],
  };
}

function abortSignalAny(signals: AbortSignal[]) {
  const controller = new AbortController();

  signals.forEach((signal) => {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return;
    }

    signal.addEventListener(
      "abort",
      () => {
        controller.abort(signal.reason);
      },
      { once: true },
    );
  });

  return controller.signal;
}

export async function requestRemoteSlicesWithGuard<TSlice, TProfile>(
  requestConfig: SlicesApiRequestConfig = {},
): Promise<RemoteSlicesResult<TSlice, TProfile>> {
  const fetcher = requestConfig.fetcher ?? fetch;
  const url = requestConfig.url ?? "/api/slices";
  const timeoutMs = requestConfig.timeout_ms ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const timeoutController = new AbortController();
  const timeout = window.setTimeout(() => {
    timeoutController.abort("REMOTE_SLICES_TIMEOUT");
  }, timeoutMs);
  const signal = requestConfig.signal
    ? abortSignalAny([requestConfig.signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetcher(url, {
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      return {
        status: "error",
        warning: "REMOTE_SLICES_ERROR_KEEPING_FALLBACK",
      };
    }

    const payload = (await response.json()) as {
      slices?: TSlice[];
      engineMode?: string;
      engineProfile?: TProfile;
    };
    const slices = Array.isArray(payload.slices) ? payload.slices : [];

    if (slices.length === 0) {
      return {
        status: "error",
        warning: "REMOTE_SLICES_ERROR_KEEPING_FALLBACK",
      };
    }

    return {
      status: "success",
      slices,
      engine_mode: payload.engineMode,
      engine_profile: payload.engineProfile ?? null,
    };
  } catch (error) {
    if (
      timeoutController.signal.aborted ||
      (error instanceof DOMException && error.name === "AbortError")
    ) {
      return {
        status: "timeout",
        warning: "REMOTE_SLICES_TIMEOUT_KEEPING_FALLBACK",
      };
    }

    return {
      status: "error",
      warning: "REMOTE_SLICES_ERROR_KEEPING_FALLBACK",
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function finalizeSlicesRuntimeState<TSlice, TProfile>(
  currentState: SlicesRuntimeState<TSlice, TProfile>,
  remoteResult: RemoteSlicesResult<TSlice, TProfile>,
  fallbackLibrary: SlicesFallbackLibrary<TSlice>,
): SlicesRuntimeState<TSlice, TProfile> {
  if (remoteResult.status === "success") {
    return {
      active_slices: remoteResult.slices,
      engine_mode: remoteResult.engine_mode ?? fallbackLibrary.engine_mode,
      engine_profile: remoteResult.engine_profile ?? null,
      hydration_status: "remote_hydrated",
      warnings: [],
    };
  }

  return {
    ...currentState,
    hydration_status:
      remoteResult.status === "timeout" ? "timeout_using_fallback" : "error_using_fallback",
    warnings: [remoteResult.warning],
  };
}

export async function runSlicesApiPerformanceGuardV1<TSlice, TProfile>(
  requestConfig: SlicesApiRequestConfig,
  fallbackLibrary: SlicesFallbackLibrary<TSlice>,
  staleCache?: SlicesStaleCache<TSlice, TProfile> | null,
): Promise<SlicesRuntimeState<TSlice, TProfile>> {
  const initialState = selectInitialSlices(fallbackLibrary, staleCache);
  const remoteResult = await requestRemoteSlicesWithGuard<TSlice, TProfile>(requestConfig);

  return finalizeSlicesRuntimeState(initialState, remoteResult, fallbackLibrary);
}

export const RUN = runSlicesApiPerformanceGuardV1;
