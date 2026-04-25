import {
  runSvgObjectSerializerV1,
} from "@/lib/mindslice/concept-svg-object-serializer-system";
import type { VisualSvgRoot } from "@/lib/mindslice/concept-visual-renderer-v2-system";

export type VisualErrorBoundaryRuntimeContext = {
  mode?: string;
  modules?: Record<string, unknown>;
  active_modules?: Record<string, unknown>;
  [key: string]: unknown;
};

export type VisualErrorBoundaryFallbackSettings = {
  width?: number;
  height?: number;
  background?: string;
  ink?: string;
};

export type VisualErrorBoundaryOutput = {
  user_safe_message: string;
  developer_diagnostics: {
    error_message: string;
    error_type: string;
    runtime_mode: string;
    active_modules: string[];
    timestamp: string;
  };
  fallback_svg: VisualSvgRoot;
  fallback_svg_string: string;
  recovery_action:
    | "normalize_palette_and_retry"
    | "fallback_to_pattern_background"
    | "sanitize_and_retry"
    | "show_diagnostic_panel";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return String(error ?? "Unknown visual pipeline error");
}

function errorType(error: unknown) {
  if (isRecord(error) && typeof error.type === "string") {
    return error.type;
  }

  if (error instanceof Error && error.name) {
    return error.name;
  }

  if (isRecord(error) && typeof error.status === "string") {
    return error.status;
  }

  return "unknown";
}

export function buildUserSafeMessage() {
  return "Canvas-ul nu a putut randa scena completa. Am activat o versiune sigura de diagnostic.";
}

export function buildDeveloperDiagnostics(
  error: unknown,
  runtimeContext: VisualErrorBoundaryRuntimeContext = {},
): VisualErrorBoundaryOutput["developer_diagnostics"] {
  const modules = runtimeContext.modules ?? runtimeContext.active_modules ?? {};

  return {
    error_message: errorMessage(error),
    error_type: errorType(error),
    runtime_mode: runtimeContext.mode ?? "unknown",
    active_modules: isRecord(modules) ? Object.keys(modules) : [],
    timestamp: new Date().toISOString(),
  };
}

export function buildFallbackSvg(
  message: string,
  fallbackSettings: VisualErrorBoundaryFallbackSettings = {},
): VisualSvgRoot {
  const width = fallbackSettings.width ?? 1080;
  const height = fallbackSettings.height ?? 1080;
  const background = fallbackSettings.background ?? "#F6F4EF";
  const ink = fallbackSettings.ink ?? "#1C1C1C";

  return {
    type: "svg",
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    defs: [],
    children: [
      {
        type: "rect",
        x: 0,
        y: 0,
        width,
        height,
        fill: background,
      },
      {
        type: "g",
        id: "visual_error_boundary_diagnostic",
        children: [
          {
            type: "rect",
            x: width * 0.16,
            y: height * 0.42,
            width: width * 0.68,
            height: height * 0.16,
            fill: "#FFFFFF",
            stroke: "#D8CEC3",
            stroke_width: 2,
            opacity: 0.92,
          },
          {
            type: "text",
            id: "visual_error_boundary_message",
            x: width / 2,
            y: height / 2,
            text: message,
            text_anchor: "middle",
            dominant_baseline: "middle",
            font_size: 24,
            font_role: "diagnostic",
            fill: ink,
            opacity: 0.9,
          },
        ],
      },
    ],
  };
}

export function chooseRecoveryAction(error: unknown): VisualErrorBoundaryOutput["recovery_action"] {
  const message = errorMessage(error).toUpperCase();

  if (message.includes("PALETTE")) {
    return "normalize_palette_and_retry";
  }

  if (message.includes("BACKGROUND")) {
    return "fallback_to_pattern_background";
  }

  if (message.includes("SVG")) {
    return "sanitize_and_retry";
  }

  return "show_diagnostic_panel";
}

export function runVisualErrorBoundaryContractV1(
  error: unknown,
  runtimeContext: VisualErrorBoundaryRuntimeContext = {},
  fallbackSettings: VisualErrorBoundaryFallbackSettings = {},
): VisualErrorBoundaryOutput {
  const userSafeMessage = buildUserSafeMessage();
  const developerDiagnostics = buildDeveloperDiagnostics(error, runtimeContext);
  const fallbackSvg = buildFallbackSvg(userSafeMessage, fallbackSettings);

  return {
    user_safe_message: userSafeMessage,
    developer_diagnostics: developerDiagnostics,
    fallback_svg: fallbackSvg,
    fallback_svg_string: runSvgObjectSerializerV1(fallbackSvg),
    recovery_action: chooseRecoveryAction(error),
  };
}

export const RUN = runVisualErrorBoundaryContractV1;
