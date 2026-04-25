export type LegacyVisualReferenceKind =
  | "visual_pipeline_v2"
  | "text_layout_v1"
  | "manual_background_renderer"
  | "direct_svg_mount"
  | "legacy_background_setting"
  | "direct_svg_assembly";

export type LegacyVisualReference = {
  kind: LegacyVisualReferenceKind;
  token: string;
  path?: string;
  line?: number;
  text: string;
};

export type LegacyVisualMigrationSettings = {
  near_complete_threshold?: number;
};

export type LegacyVisualRetirementPlanOutput = {
  retirement_steps: string[];
  migration_status: "complete" | "near_complete" | "in_progress";
  remaining_legacy_references: LegacyVisualReference[];
};

type CodebaseScanEntry = {
  path?: string;
  line?: number;
  text?: string;
};

const LEGACY_PATTERNS: Array<{
  kind: LegacyVisualReferenceKind;
  token: string;
  pattern: RegExp;
}> = [
  {
    kind: "visual_pipeline_v2",
    token: "runVisualPipelineControllerV2",
    pattern: /\brunVisualPipelineControllerV2\b/,
  },
  {
    kind: "text_layout_v1",
    token: "runTextLayoutEngineV1",
    pattern: /\brunTextLayoutEngineV1\b/,
  },
  {
    kind: "manual_background_renderer",
    token: "manual_background_renderers",
    pattern:
      /\b(runPatternSvgRendererV1|runTriangulationSvgRendererV1|runFlatAbstractPatternSvgRendererV1|runIsometricPatternSvgRendererV1|runZigZagPatternSvgRendererV1|runRetroGridPatternSvgRendererV1)\b/,
  },
  {
    kind: "direct_svg_mount",
    token: "dangerouslySetInnerHTML",
    pattern: /\bdangerouslySetInnerHTML\b|\binnerHTML\b/,
  },
  {
    kind: "legacy_background_setting",
    token: "background_layer_kind",
    pattern: /\bbackground_layer_kind\b/,
  },
  {
    kind: "direct_svg_assembly",
    token: "manual_svg_assembly",
    pattern: /\bmanualSVG\b|\bmanual SVG\b|<svg\b|<rect\b|<circle\b|<line\b|<path\b|<polygon\b/,
  },
];

function normalizeScan(codebaseScan: unknown): CodebaseScanEntry[] {
  if (typeof codebaseScan === "string") {
    return codebaseScan.split(/\r?\n/).map((line) => {
      const match = /^(.*?):(\d+):(.*)$/.exec(line);

      if (!match) {
        return { text: line };
      }

      return {
        path: match[1],
        line: Number.parseInt(match[2] ?? "", 10),
        text: match[3] ?? "",
      };
    });
  }

  if (Array.isArray(codebaseScan)) {
    return codebaseScan.map((entry) => {
      if (typeof entry === "string") {
        return { text: entry };
      }

      if (typeof entry === "object" && entry !== null) {
        const record = entry as Record<string, unknown>;

        return {
          path: typeof record.path === "string" ? record.path : undefined,
          line: typeof record.line === "number" ? record.line : undefined,
          text: typeof record.text === "string" ? record.text : String(record.content ?? ""),
        };
      }

      return { text: String(entry) };
    });
  }

  return [];
}

export function findLegacyReferences(codebaseScan: unknown): LegacyVisualReference[] {
  const entries = normalizeScan(codebaseScan);
  const refs: LegacyVisualReference[] = [];

  entries.forEach((entry) => {
    const text = entry.text ?? "";

    LEGACY_PATTERNS.forEach((legacyPattern) => {
      if (!legacyPattern.pattern.test(text)) {
        return;
      }

      refs.push({
        kind: legacyPattern.kind,
        token: legacyPattern.token,
        path: entry.path,
        line: entry.line,
        text: text.trim(),
      });
    });
  });

  return refs;
}

export function buildRetirementSteps(legacyRefs: LegacyVisualReference[]) {
  const kinds = new Set(legacyRefs.map((reference) => reference.kind));
  const steps: string[] = [];

  if (kinds.has("visual_pipeline_v2")) {
    steps.push("Replace runVisualPipelineControllerV2 with MindSlice_VisualPipelineController_vNext.");
  }

  if (kinds.has("text_layout_v1")) {
    steps.push("Replace runTextLayoutEngineV1 with MindSlice_TextLayoutEngine_v2.");
  }

  if (kinds.has("manual_background_renderer") || kinds.has("legacy_background_setting")) {
    steps.push("Remove manual background rendering; use BackgroundModuleRegistry and BackgroundOrchestrator_v2.");
  }

  if (kinds.has("direct_svg_assembly")) {
    steps.push("Remove direct SVG assembly from UI; let VisualRenderer_v2 and SVGObjectSerializer own SVG output.");
  }

  if (kinds.has("direct_svg_mount")) {
    steps.push("Route all SVG string output through SVGObjectSerializer plus SafeSVGMount.");
  }

  steps.push("Run ArchitectureValidator after migration.");
  steps.push("Run VisualRuntimeSmokeTest before deleting legacy code.");

  return [...new Set(steps)];
}

export function computeMigrationStatus(
  legacyRefs: LegacyVisualReference[],
  migrationSettings: LegacyVisualMigrationSettings = {},
): LegacyVisualRetirementPlanOutput["migration_status"] {
  const nearCompleteThreshold = migrationSettings.near_complete_threshold ?? 3;

  if (legacyRefs.length === 0) {
    return "complete";
  }

  if (legacyRefs.length <= nearCompleteThreshold) {
    return "near_complete";
  }

  return "in_progress";
}

export function runLegacyVisualRetirementPlanV1(
  codebaseScan: unknown,
  migrationSettings: LegacyVisualMigrationSettings = {},
): LegacyVisualRetirementPlanOutput {
  const legacyRefs = findLegacyReferences(codebaseScan);

  return {
    retirement_steps: buildRetirementSteps(legacyRefs),
    migration_status: computeMigrationStatus(legacyRefs, migrationSettings),
    remaining_legacy_references: legacyRefs,
  };
}

export const RUN = runLegacyVisualRetirementPlanV1;
