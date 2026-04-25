import { runParserEngine } from "@/lib/mindslice/concept-parser-engine-system";
import { runConceptualPresetSystemV1 } from "@/lib/mindslice/concept-conceptual-preset-system";
import { runStructureEngineV1 } from "@/lib/mindslice/concept-structure-engine-system";
import { runScenarioEngineV1 } from "@/lib/mindslice/concept-scenario-engine-system";
import { runColorTheoryEngineV1 } from "@/lib/mindslice/concept-color-theory-engine-system";
import { runArtCompositionEngineV1 } from "@/lib/mindslice/concept-art-composition-engine-system";
import { runGeometryEngineV1 } from "@/lib/mindslice/concept-geometry-engine-system";
import { runSnapEngineV1 } from "@/lib/mindslice/concept-snap-engine-system";
import { runPaletteContractAdapterV1 } from "@/lib/mindslice/concept-palette-contract-adapter-system";
import { runTextWrappingEngineV1 } from "@/lib/mindslice/concept-text-wrapping-engine-system";
import { runCanvasAccessPolicyV1 } from "@/lib/mindslice/concept-canvas-access-policy-system";
import { runSlicesApiPerformanceGuardV1 } from "@/lib/mindslice/concept-slices-api-performance-guard-system";
import {
  MindSlice_VisualSVGArchitecture_Manifest_vNext,
  runModuleLoaderV1,
  type MindSliceActiveRuntime,
  type MindSliceModuleDefinition,
  type MindSliceModuleExportSettings,
  type MindSliceModuleManifest,
  type MindSliceModuleRuntimeConfig,
} from "@/lib/mindslice/concept-module-loader-system";
import {
  runArchitectureValidatorV1,
  type MindSliceArchitectureValidationReport,
  type MindSliceArchitectureValidationSettings,
} from "@/lib/mindslice/concept-architecture-validator-system";

export type RuntimeBootAppConfig = {
  runtime_config?: MindSliceModuleRuntimeConfig;
  additional_modules?: MindSliceModuleDefinition[];
};

export type RuntimeBootSettings = {
  export_settings?: MindSliceModuleExportSettings;
  validation_settings?: MindSliceArchitectureValidationSettings;
};

export type RuntimeBootStatus = {
  runtime_ready: boolean;
  active_modules_count: number;
  background_registry_ready: boolean;
  controller_ready: boolean;
  audit_score: number | null;
  warnings: string[];
};

export type RuntimeBootResult =
  | {
      status: "ok";
      active_runtime: MindSliceActiveRuntime;
      runtime_status: RuntimeBootStatus;
      architecture_report: MindSliceArchitectureValidationReport;
    }
  | {
      status: "fallback";
      active_runtime: null;
      runtime_status: RuntimeBootStatus & {
        user_safe_message: string;
        developer_diagnostics: unknown;
      };
      fallback_svg: string;
    };

type RuntimeInitResult =
  | {
      status: "ok";
      loader_result: ReturnType<typeof runModuleLoaderV1>["loader_result"];
      active_runtime: MindSliceActiveRuntime;
    }
  | RuntimeBootFailure;

type RuntimeBootFailure = {
  status: "fail";
  message: string;
  details: unknown;
};

function moduleDefinition(input: MindSliceModuleDefinition): MindSliceModuleDefinition {
  return input;
}

const ConceptualRuntimeModules: MindSliceModuleDefinition[] = [
  moduleDefinition({
    name: "MindSlice_ParserEngine",
    type: "engine",
    version: "v1",
    module_ref: { RUN: runParserEngine },
    exports: { RUN: runParserEngine },
    provides: ["parsed_slice"],
    metadata: {
      input_contract: ["raw_slice"],
      output_contract: ["parsed_slice"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_ConceptualPresetSystem",
    type: "engine",
    version: "v1",
    dependencies: ["MindSlice_ParserEngine"],
    module_ref: { RUN: runConceptualPresetSystemV1 },
    exports: { RUN: runConceptualPresetSystemV1 },
    provides: ["conceptual_preset"],
    metadata: {
      input_contract: ["preset_name", "slice_context"],
      output_contract: ["conceptual_preset"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_StructureEngine",
    type: "engine",
    version: "v1",
    dependencies: ["MindSlice_ParserEngine", "MindSlice_ConceptualPresetSystem"],
    module_ref: { RUN: runStructureEngineV1 },
    exports: { RUN: runStructureEngineV1 },
    provides: ["structure_output"],
    metadata: {
      input_contract: ["parsed_slice", "canvas", "structure_bias"],
      output_contract: ["structure_output"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_ScenarioEngine",
    type: "engine",
    version: "v1",
    dependencies: ["MindSlice_ParserEngine", "MindSlice_StructureEngine"],
    module_ref: { RUN: runScenarioEngineV1 },
    exports: { RUN: runScenarioEngineV1 },
    provides: ["scenario_output"],
    metadata: {
      input_contract: ["parsed_slice", "structure_output", "scenario_bias"],
      output_contract: ["scenario_output"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_ColorTheoryEngine",
    type: "engine",
    version: "v1",
    dependencies: ["MindSlice_ParserEngine", "MindSlice_StructureEngine", "MindSlice_ScenarioEngine"],
    module_ref: { RUN: runColorTheoryEngineV1 },
    exports: { RUN: runColorTheoryEngineV1 },
    provides: ["color_output"],
    metadata: {
      input_contract: ["parsed_slice", "structure_output", "scenario_output", "color_bias"],
      output_contract: ["color_output"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_ArtCompositionEngine",
    type: "engine",
    version: "v1",
    dependencies: [
      "MindSlice_ParserEngine",
      "MindSlice_StructureEngine",
      "MindSlice_ScenarioEngine",
      "MindSlice_ColorTheoryEngine",
    ],
    module_ref: { RUN: runArtCompositionEngineV1 },
    exports: { RUN: runArtCompositionEngineV1 },
    provides: ["composition_output"],
    metadata: {
      input_contract: [
        "parsed_slice",
        "structure_output",
        "scenario_output",
        "color_output",
        "composition_bias",
      ],
      output_contract: ["composition_output"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_GeometryEngine",
    type: "engine",
    version: "v1",
    dependencies: ["MindSlice_ArtCompositionEngine", "MindSlice_StructureEngine"],
    module_ref: { RUN: runGeometryEngineV1 },
    exports: { RUN: runGeometryEngineV1 },
    provides: ["geometry_adjusted_output"],
    metadata: {
      input_contract: ["composition_output", "structure_output"],
      output_contract: ["geometry_adjusted_output"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_SnapEngine",
    type: "engine",
    version: "v1",
    dependencies: ["MindSlice_GeometryEngine"],
    module_ref: { RUN: runSnapEngineV1 },
    exports: { RUN: runSnapEngineV1 },
    provides: ["snapped_output"],
    metadata: {
      input_contract: ["elements", "grid", "conceptual_preset"],
      output_contract: ["snapped_output"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_PaletteContractAdapter_v1",
    type: "utility",
    version: "v1",
    module_ref: { RUN: runPaletteContractAdapterV1 },
    exports: { RUN: runPaletteContractAdapterV1 },
    provides: ["canonical_palette"],
    metadata: {
      input_contract: ["palette_input"],
      output_contract: ["canonical_palette"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_TextWrappingEngine_v1",
    type: "utility",
    version: "v1",
    module_ref: { RUN: runTextWrappingEngineV1 },
    exports: { RUN: runTextWrappingEngineV1 },
    provides: ["wrapped_text_node"],
    metadata: {
      input_contract: ["text_item", "font_metrics_profile", "max_width"],
      output_contract: ["text_node_with_tspans"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_CanvasAccessPolicy_v1",
    type: "utility",
    version: "v1",
    module_ref: { RUN: runCanvasAccessPolicyV1 },
    exports: { RUN: runCanvasAccessPolicyV1 },
    provides: ["canvas_access_policy"],
    metadata: {
      input_contract: ["user_state", "requested_action"],
      output_contract: ["access_result"],
      functions: ["RUN"],
    },
  }),
  moduleDefinition({
    name: "MindSlice_SlicesApiPerformanceGuard_v1",
    type: "utility",
    version: "v1",
    module_ref: { RUN: runSlicesApiPerformanceGuardV1 },
    exports: { RUN: runSlicesApiPerformanceGuardV1 },
    provides: ["slices_runtime_state"],
    metadata: {
      input_contract: ["request_config", "fallback_library", "stale_cache"],
      output_contract: ["slices_runtime_state"],
      functions: ["select_initial_slices", "request_remote_slices_with_guard", "RUN"],
    },
  }),
];

function uniqueModules(modules: MindSliceModuleDefinition[]) {
  const byName = new Map<string, MindSliceModuleDefinition>();

  modules.forEach((module) => {
    const name = module.name ?? module.id;

    if (name) {
      byName.set(name, module);
    }
  });

  return [...byName.values()];
}

export function buildRuntimeBootManifest(appConfig: RuntimeBootAppConfig = {}): MindSliceModuleManifest {
  return {
    modules: uniqueModules([
      ...ConceptualRuntimeModules,
      ...MindSlice_VisualSVGArchitecture_Manifest_vNext.modules,
      ...(appConfig.additional_modules ?? []),
    ]),
  };
}

function initializeRuntime(
  moduleManifest: MindSliceModuleManifest,
  appConfig: RuntimeBootAppConfig = {},
  bootSettings: RuntimeBootSettings = {},
): RuntimeInitResult {
  const loaderOutput = runModuleLoaderV1(
    moduleManifest,
    {
      activate_core: false,
      ...(appConfig.runtime_config ?? {}),
    },
    bootSettings.export_settings,
  );

  if (loaderOutput.loader_result.status !== "ok" || !loaderOutput.active_runtime) {
    return fail("MODULE_LOADER_FAILED", loaderOutput);
  }

  return {
    status: "ok",
    loader_result: loaderOutput.loader_result,
    active_runtime: loaderOutput.active_runtime,
  };
}

function validateRuntime(
  moduleManifest: MindSliceModuleManifest,
  activeRuntime: MindSliceActiveRuntime,
  bootSettings: RuntimeBootSettings = {},
) {
  return runArchitectureValidatorV1(
    moduleManifest,
    activeRuntime,
    bootSettings.validation_settings ?? {
      require_active_runtime: true,
    },
  );
}

function exposeRuntimeStatus(
  activeRuntime: MindSliceActiveRuntime,
  architectureReport: MindSliceArchitectureValidationReport,
): RuntimeBootStatus {
  return {
    runtime_ready: true,
    active_modules_count: Object.keys(activeRuntime.modules).length,
    background_registry_ready: Boolean(activeRuntime.background_registry),
    controller_ready: Boolean(activeRuntime.controller),
    audit_score: architectureReport.score,
    warnings: architectureReport.warnings,
  };
}

function minimalFallbackSvg(message = "MindSlice runtime incomplete") {
  return [
    "<svg width='1080' height='1080' viewBox='0 0 1080 1080' xmlns='http://www.w3.org/2000/svg'>",
    "<rect x='0' y='0' width='1080' height='1080' fill='#F7F3EC'/>",
    "<text x='540' y='520' text-anchor='middle' dominant-baseline='middle' font-family='ui-sans-serif, system-ui' font-size='28' fill='#181411'>",
    escapeXml(message),
    "</text>",
    "</svg>",
  ].join("");
}

function fallbackRuntime(errorReport: unknown): RuntimeBootResult {
  return {
    status: "fallback",
    active_runtime: null,
    runtime_status: {
      runtime_ready: false,
      active_modules_count: 0,
      background_registry_ready: false,
      controller_ready: false,
      audit_score: null,
      warnings: [],
      user_safe_message: "Canvas-ul a pornit in mod sigur, dar runtime-ul complet nu este disponibil.",
      developer_diagnostics: errorReport,
    },
    fallback_svg: minimalFallbackSvg(),
  };
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function fail(message: string, details: unknown): RuntimeBootFailure {
  return {
    status: "fail",
    message,
    details,
  };
}

export function runRuntimeBootControllerV1(
  appConfig: RuntimeBootAppConfig = {},
  bootSettings: RuntimeBootSettings = {},
): RuntimeBootResult {
  const moduleManifest = buildRuntimeBootManifest(appConfig);
  const runtimeInit = initializeRuntime(moduleManifest, appConfig, bootSettings);

  if (runtimeInit.status === "fail") {
    return fallbackRuntime(runtimeInit);
  }

  const architectureReport = validateRuntime(
    moduleManifest,
    runtimeInit.active_runtime,
    bootSettings,
  );

  if (architectureReport.status === "fail") {
    return fallbackRuntime(architectureReport);
  }

  return {
    status: "ok",
    active_runtime: runtimeInit.active_runtime,
    runtime_status: exposeRuntimeStatus(runtimeInit.active_runtime, architectureReport),
    architecture_report: architectureReport,
  };
}

export const RUN = runRuntimeBootControllerV1;
