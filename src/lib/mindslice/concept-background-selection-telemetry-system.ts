import type { BackgroundLayerSelectionV2 } from "@/lib/mindslice/concept-background-layer-orchestrator-system";
import type { VisualRendererV2BackgroundResult } from "@/lib/mindslice/concept-visual-renderer-v2-system";

export type BackgroundSelectionTelemetryOutput = {
  active_kind: string | null;
  grammar_profile: string | null;
  seed: string | null;
  density: string | null;
  opacity: number | null;
  reason: string | null;
  score: number | null;
  fallback_used: boolean;
  warnings: string[];
};

type BackgroundSelectionWithScore = Partial<BackgroundLayerSelectionV2> & {
  score?: unknown;
};

function numericScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function scoreFromReason(reason: unknown) {
  if (typeof reason !== "string") {
    return null;
  }

  const match = /^registry_match_score_(-?\d+(?:\.\d+)?)$/.exec(reason);

  if (!match) {
    return null;
  }

  const score = Number.parseFloat(match[1] ?? "");

  return Number.isFinite(score) ? score : null;
}

export function runBackgroundSelectionTelemetryV1(
  backgroundLayerSelection: BackgroundSelectionWithScore | null | undefined,
  backgroundLayerOutput?: Partial<VisualRendererV2BackgroundResult> | null,
): BackgroundSelectionTelemetryOutput {
  return {
    active_kind: backgroundLayerSelection?.active_kind ?? null,
    grammar_profile: backgroundLayerSelection?.grammar_profile ?? null,
    seed: backgroundLayerSelection?.seed ?? null,
    density: backgroundLayerSelection?.density ?? null,
    opacity: numericScore(backgroundLayerSelection?.opacity),
    reason: backgroundLayerSelection?.reason ?? null,
    score: numericScore(backgroundLayerSelection?.score) ?? scoreFromReason(backgroundLayerSelection?.reason),
    fallback_used: Boolean(backgroundLayerOutput?.fallback_used ?? false),
    warnings: Array.isArray(backgroundLayerOutput?.warnings)
      ? backgroundLayerOutput.warnings.filter((warning): warning is string => typeof warning === "string")
      : [],
  };
}

export const RUN = runBackgroundSelectionTelemetryV1;
