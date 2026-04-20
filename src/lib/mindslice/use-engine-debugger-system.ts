"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EngineDebugRunEntry, EngineDebuggerReport } from "@/lib/mindslice/mindslice-types";

type UseEngineDebuggerSystemOptions = {
  isSignedIn: boolean;
  isActive: boolean;
  report: EngineDebuggerReport;
};

function buildFingerprint(report: EngineDebuggerReport) {
  return [
    report.funnel.total,
    report.funnel.resolved,
    report.funnel.pooled,
    report.funnel.canonical,
    report.failureAnalysis.currentBlocker,
    report.failureAnalysis.nextLikelyPromotion,
  ].join("::");
}

export function useEngineDebuggerSystem({
  isSignedIn,
  isActive,
  report,
}: UseEngineDebuggerSystemOptions) {
  const [debugRuns, setDebugRuns] = useState<EngineDebugRunEntry[]>([]);
  const lastStoredFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setDebugRuns([]);
      return;
    }

    let cancelled = false;

    async function loadRuns() {
      try {
        const response = await fetch("/api/engine-debugger", { cache: "no-store" });
        const payload = (await response.json()) as { debugRuns?: EngineDebugRunEntry[] };

        if (!response.ok) {
          throw new Error("Engine debugger request failed.");
        }

        if (!cancelled) {
          setDebugRuns(Array.isArray(payload.debugRuns) ? payload.debugRuns : []);
        }
      } catch {
        if (!cancelled) {
          setDebugRuns([]);
        }
      }
    }

    loadRuns();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !isActive) {
      return;
    }

    const fingerprint = buildFingerprint(report);
    if (lastStoredFingerprintRef.current === fingerprint) {
      return;
    }

    lastStoredFingerprintRef.current = fingerprint;

    void fetch("/api/engine-debugger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ report }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Engine debugger persistence failed.");
        }

        const payload = (await response.json()) as { debugRun?: EngineDebugRunEntry };
        if (!payload.debugRun) {
          return;
        }

        setDebugRuns((previous) => [payload.debugRun!, ...previous].slice(0, 12));
      })
      .catch(() => {
        // Alpha-safe: debugger remains available in-memory even if persistence fails.
      });
  }, [isActive, isSignedIn, report]);

  const latestDebugRun = debugRuns[0] ?? null;
  const comparativeDelta = useMemo(() => {
    if (!latestDebugRun) {
      return null;
    }

    return {
      resolvedDelta: report.funnel.resolved - latestDebugRun.report.funnel.resolved,
      pooledDelta: report.funnel.pooled - latestDebugRun.report.funnel.pooled,
      canonicalDelta: report.funnel.canonical - latestDebugRun.report.funnel.canonical,
    };
  }, [latestDebugRun, report]);

  return {
    debugRuns,
    latestDebugRun,
    comparativeDelta,
  };
}
