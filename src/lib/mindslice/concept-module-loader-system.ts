import { runBackgroundModuleRegistryV1 } from "@/lib/mindslice/concept-background-module-registry-system";
import { runGrammarPipelineContractV1 } from "@/lib/mindslice/concept-grammar-pipeline-contract-system";
import { runBackgroundOrchestratorV2 } from "@/lib/mindslice/concept-background-layer-orchestrator-system";
import { runVisualRendererV2 } from "@/lib/mindslice/concept-visual-renderer-v2-system";
import { runTextLayoutEngineV2 } from "@/lib/mindslice/concept-text-layout-engine-v2-system";
import { runVisualAuditEngineV1 } from "@/lib/mindslice/concept-visual-audit-engine-system";
import { runSvgObjectSerializerV1 } from "@/lib/mindslice/concept-svg-object-serializer-system";
import { runSafeSvgMountV1 } from "@/lib/mindslice/concept-safe-svg-mount-system";
import { runLegacyVisualRetirementPlanV1 } from "@/lib/mindslice/concept-legacy-visual-retirement-plan-system";
import { runBackgroundSelectionTelemetryV1 } from "@/lib/mindslice/concept-background-selection-telemetry-system";
import { runVisualRuntimeSmokeTestV1 } from "@/lib/mindslice/concept-visual-runtime-smoke-test-system";
import { runVisualErrorBoundaryContractV1 } from "@/lib/mindslice/concept-visual-error-boundary-contract-system";
import { runTextEchoConstellationEngineV1 } from "@/lib/mindslice/concept-text-echo-constellation-engine-system";
import { runTextSourceParityBridgeV1 } from "@/lib/mindslice/concept-text-source-parity-bridge-system";
import { runTemplateLikeTextPlacementEngineV1 } from "@/lib/mindslice/concept-template-like-text-placement-engine-system";
import { runTextLayoutCollisionResolverV1 } from "@/lib/mindslice/concept-text-layout-collision-resolver-system";
import { runTextLayoutCollisionResolverV2 } from "@/lib/mindslice/concept-text-layout-collision-resolver-v2-system";
import { runVisualPipelineControllerVNext } from "@/lib/mindslice/concept-visual-pipeline-controller-vnext-system";

export type MindSliceModuleType =
  | "engine"
  | "grammar_engine"
  | "pattern_engine"
  | "renderer"
  | "registry"
  | "orchestrator"
  | "serializer"
  | "controller"
  | "audit"
  | "utility";

export type MindSliceModuleDefinition = {
  id?: string;
  name?: string;
  type: MindSliceModuleType;
  version?: string;
  dependencies?: string[];
  provides?: string[];
  requires?: string[];
  module_ref?: unknown;
  exports?: Record<string, unknown>;
  activate?: (runtimeContext: MindSliceRuntimeContext) => unknown;
  input_contract?: unknown;
  output_contract?: unknown;
  functions?: string[];
  supported_nodes?: string[];
  source?: string;
  pipeline_order?: string[];
  metadata?: Record<string, unknown>;
  previous_version_required?: boolean;
};

export type MindSliceModuleManifest = {
  modules: MindSliceModuleDefinition[];
};

export type MindSliceModuleRuntimeConfig = {
  system_name?: string;
  version?: string;
  mode?: string;
  strict_mode?: boolean;
  allow_fallbacks?: boolean;
  allow_export?: boolean;
  default_canvas?: {
    width: number;
    height: number;
    margin: number;
  };
  default_render_settings?: Record<string, unknown>;
  activate_core?: boolean;
  allow_missing_optional?: boolean;
  overrides?: Record<string, Partial<MindSliceModuleDefinition>>;
  context?: Record<string, unknown>;
};

export type MindSliceModuleExportSettings = {
  enabled?: boolean;
  format?: "json";
  include_exports?: boolean;
  include_validation_report?: boolean;
  include_runtime_context?: boolean;
  include_module_source?: boolean;
};

export type MindSliceModuleRecord = {
  name: string;
  type: MindSliceModuleType;
  version: string | null;
  module_ref: unknown;
  activate?: (runtimeContext: MindSliceRuntimeContext) => unknown;
  dependencies: string[];
  provides: string[];
  requires: string[];
  status: "loaded";
  metadata?: Record<string, unknown>;
  previous_version_required?: boolean;
};

export type MindSliceDependencyGraphNode = {
  dependencies: string[];
  dependents: string[];
};

export type MindSliceActiveModuleRecord = {
  name: string;
  type: MindSliceModuleType;
  version: string | null;
  instance: unknown;
  status: "active";
  boot_report: unknown;
};

export type MindSliceValidationReport = {
  status: "ok" | "fail";
  errors: string[];
  warnings: string[];
  missing_core_modules: string[];
  invalid_modules: string[];
  dependency_errors: string[];
};

export type MindSliceGraphReport = {
  status: "ok" | "fail";
  errors: string[];
  warnings: string[];
};

export type MindSliceSmokeTestReport = {
  status: "ok" | "fail";
  errors: string[];
  warnings: string[];
  checks: string[];
};

export type MindSliceRuntimeContext = {
  system_name: string;
  version: string;
  mode: string;
  strict_mode: boolean;
  allow_fallbacks: boolean;
  allow_export: boolean;
  renderer_rule: string;
  module_version_policy: "versions_stack_not_replace";
  default_canvas: {
    width: number;
    height: number;
    margin: number;
  };
  default_render_settings: Record<string, unknown>;
  module_registry: Record<string, MindSliceModuleRecord>;
  dependency_graph: Record<string, MindSliceDependencyGraphNode>;
  load_order: string[];
  active_modules: Record<string, MindSliceActiveModuleRecord>;
  validation_report: MindSliceValidationReport;
  runtime_config: MindSliceModuleRuntimeConfig;
  [key: string]: unknown;
};

export type MindSliceActiveRuntime = {
  system: "MindSlice_VisualSVGArchitecture";
  version: string;
  modules: Record<string, MindSliceActiveModuleRecord>;
  module_registry: Record<string, MindSliceModuleRecord>;
  dependency_graph: Record<string, MindSliceDependencyGraphNode>;
  load_order: string[];
  active_modules: Record<string, MindSliceActiveModuleRecord>;
  background_registry: unknown;
  controller: unknown;
  serializer: unknown;
  audit_engine: unknown;
  renderer: unknown;
  text_layout_engine: unknown;
  background_orchestrator: unknown;
  grammar_contract: unknown;
  error_boundary: unknown;
  validation_report: MindSliceValidationReport;
  graph_report: MindSliceGraphReport;
  smoke_test_report: MindSliceSmokeTestReport;
  runtime_context: MindSliceRuntimeContext;
  context: MindSliceRuntimeContext;
};

export type MindSliceModuleLoaderResult = {
  loader_result: {
    status: "ok" | "fail";
    active_modules?: Record<string, MindSliceActiveModuleRecord>;
    load_order?: string[];
    dependency_graph?: Record<string, MindSliceDependencyGraphNode>;
    validation_report?: MindSliceValidationReport;
    graph_report?: MindSliceGraphReport;
    smoke_test_report?: MindSliceSmokeTestReport;
    runtime_context?: MindSliceRuntimeContext;
    message?: string;
    report?: unknown;
  };
  active_runtime: MindSliceActiveRuntime | null;
  single_file_export?: unknown;
};

const REQUIRED_CORE_MODULES = [
  "MindSlice_BackgroundModuleRegistry_v1",
  "MindSlice_GrammarPipelineContract_v1",
  "MindSlice_BackgroundOrchestrator_v2",
  "MindSlice_VisualRenderer_v2",
  "MindSlice_TextLayoutEngine_v2",
  "MindSlice_TextSourceParityBridge_v1",
  "MindSlice_TemplateLikeTextPlacementEngine_v1",
  "MindSlice_TextEchoConstellationEngine_v1",
  "MindSlice_TextLayoutCollisionResolver_v1",
  "MindSlice_TextLayoutCollisionResolver_v2",
  "MindSlice_VisualAuditEngine_v1",
  "MindSlice_SVGObjectSerializer_v1",
  "MindSlice_VisualErrorBoundaryContract_v1",
  "MindSlice_VisualPipelineController_vNext",
];

const CORE_MODULES: MindSliceModuleDefinition[] = [
  {
    name: "MindSlice_BackgroundModuleRegistry_v1",
    type: "registry",
    version: "v1",
    module_ref: { RUN: runBackgroundModuleRegistryV1 },
    provides: ["background_registry"],
    exports: {
      RUN: runBackgroundModuleRegistryV1,
    },
    metadata: {
      input_contract: ["registry_action", "module_definition", "background_kind"],
      output_contract: ["registered_module", "selected_module", "available_modules"],
      functions: ["REGISTER", "GET", "LIST", "MATCH", "VALIDATE_MODULE", "REGISTER_DEFAULTS", "RUN"],
    },
    activate() {
      return runBackgroundModuleRegistryV1({ registry_action: "register_defaults" });
    },
  },
  {
    name: "MindSlice_GrammarPipelineContract_v1",
    type: "utility",
    version: "v1",
    dependencies: ["MindSlice_BackgroundModuleRegistry_v1"],
    module_ref: { RUN: runGrammarPipelineContractV1 },
    provides: ["grammar_pipeline"],
    exports: {
      RUN: runGrammarPipelineContractV1,
    },
    metadata: {
      input_contract: ["background_module", "canvas", "palette", "grammar_profile", "settings"],
      output_contract: ["background_layer_output"],
      functions: [
        "RUN_WITH_GRAMMAR",
        "RUN_WITHOUT_GRAMMAR",
        "HANDLE_EMPTY_GRAMMAR_PLAN",
        "FALLBACK_PATTERN_OUTPUT",
        "VALIDATE_PATTERN_OUTPUT",
        "RUN",
      ],
      rules: [
        "GrammarEngine -> grammar_plan",
        "PatternEngine -> pattern_output",
        "SVGRenderer -> svg_layer",
      ],
    },
  },
  {
    name: "MindSlice_BackgroundOrchestrator_v2",
    type: "orchestrator",
    version: "v2",
    dependencies: ["MindSlice_BackgroundModuleRegistry_v1"],
    module_ref: { RUN: runBackgroundOrchestratorV2 },
    provides: ["background_selection"],
    exports: {
      RUN: runBackgroundOrchestratorV2,
    },
    metadata: {
      input_contract: ["parsed_slice", "conceptual_preset", "canvas", "render_settings", "registry"],
      output_contract: ["background_layer_selection"],
      functions: [
        "choose_background_kind",
        "choose_grammar_profile",
        "compute_seed",
        "compute_density",
        "build_settings",
        "compute_opacity",
        "RUN",
      ],
    },
  },
  {
    name: "MindSlice_VisualRenderer_v2",
    type: "renderer",
    version: "v2",
    dependencies: ["MindSlice_GrammarPipelineContract_v1"],
    module_ref: { RUN: runVisualRendererV2 },
    provides: ["draw"],
    exports: {
      RUN: runVisualRendererV2,
    },
    metadata: {
      input_contract: [
        "structure_output",
        "scenario_output",
        "color_output",
        "composition_output",
        "background_layer_selection",
        "text_layout_output",
      ],
      output_contract: ["visual_svg_scene"],
      functions: [
        "create_svg_root",
        "render_background",
        "render_structure_layer",
        "render_scenario_layer",
        "render_composition_layer",
        "render_text_layer",
        "RUN",
      ],
      rules: ["Renderer does not think", "Renderer only draws"],
      principles: ["Renderer does not think. Renderer only draws."],
      source_summary: "Assembles SVG layers and delegates rendering; no semantic background selection.",
    },
  },
  {
    name: "MindSlice_TextLayoutEngine_v2",
    type: "engine",
    version: "v2",
    dependencies: [
      "MindSlice_TextSourceParityBridge_v1",
      "MindSlice_TemplateLikeTextPlacementEngine_v1",
      "MindSlice_TextEchoConstellationEngine_v1",
      "MindSlice_TextLayoutCollisionResolver_v2",
    ],
    module_ref: { RUN: runTextLayoutEngineV2 },
    provides: ["text_layout"],
    exports: {
      RUN: runTextLayoutEngineV2,
    },
    metadata: {
      input_contract: [
        "parsed_slice",
        "structure_output",
        "scenario_output",
        "composition_output",
        "canvas",
        "text_settings",
      ],
      output_contract: ["text_layout_output"],
      functions: ["extract_text_data", "build_center_text", "build_peripheral_text", "RUN"],
    },
  },
  {
    name: "MindSlice_TemplateLikeTextPlacementEngine_v1",
    type: "engine",
    version: "v1",
    dependencies: ["MindSlice_TextSourceParityBridge_v1"],
    module_ref: { RUN: runTemplateLikeTextPlacementEngineV1 },
    provides: ["template_like_text_layout", "placement_report"],
    exports: {
      RUN: runTemplateLikeTextPlacementEngineV1,
    },
    metadata: {
      input_contract: [
        "bridged_text_source",
        "canvas",
        "structure_output",
        "scenario_output",
        "composition_output",
        "placement_settings",
      ],
      output_contract: ["template_like_text_layout", "placement_report"],
      functions: [
        "resolve_text_anchor",
        "build_sentence_fragments",
        "build_wandering_words",
        "build_wandering_letters",
        "build_grammar_particles",
        "build_temporal_particles",
        "run_soft_collision_pass",
        "RUN",
      ],
      rules: [
        "Renderer does not think",
        "Designed text slots replace random scattering",
        "Sentence fragments, wandering words, and wandering letters stay distinct",
      ],
    },
  },
  {
    name: "MindSlice_TextSourceParityBridge_v1",
    type: "engine",
    version: "v1",
    dependencies: [],
    module_ref: { RUN: runTextSourceParityBridgeV1 },
    provides: ["bridged_text_source", "source_parity_report"],
    exports: {
      RUN: runTextSourceParityBridgeV1,
    },
    metadata: {
      input_contract: [
        "parsed_slice",
        "thought_state",
        "thought_scene",
        "shape_grammar",
        "clock_display",
        "existing_vnext_text_layout",
        "text_settings",
      ],
      output_contract: ["bridged_text_source", "source_parity_report"],
      functions: [
        "extract_template_sources",
        "extract_vnext_sources",
        "merge_template_and_vnext_sources",
        "build_bridged_text_source",
        "build_source_parity_report",
        "RUN",
      ],
      rules: [
        "Renderer does not think",
        "Template text sources are primary",
        "vNext text sources are preserved as enrichment",
      ],
    },
  },
  {
    name: "MindSlice_VisualAuditEngine_v1",
    type: "audit",
    version: "v1",
    module_ref: { RUN: runVisualAuditEngineV1 },
    provides: ["visual_audit"],
    exports: {
      RUN: runVisualAuditEngineV1,
    },
    metadata: {
      input_contract: [
        "svg_tree",
        "background_layer_output",
        "text_layout_output",
        "background_layer_selection",
        "canvas",
      ],
      output_contract: ["audit_result"],
      functions: ["check_empty_background", "check_density", "check_invalid_svg_nodes", "RUN"],
    },
  },
  {
    name: "MindSlice_SVGObjectSerializer_v1",
    type: "serializer",
    version: "v1",
    module_ref: { RUN: runSvgObjectSerializerV1 },
    provides: ["svg_string"],
    exports: {
      RUN: runSvgObjectSerializerV1,
    },
    metadata: {
      input_contract: ["svg_tree"],
      output_contract: ["svg_string"],
      functions: [
        "serialize_node",
        "serialize_svg",
        "serialize_group",
        "serialize_rect",
        "serialize_circle",
        "serialize_line",
        "serialize_path",
        "serialize_polygon",
        "serialize_polyline",
        "serialize_text",
        "serialize_tspan",
        "RUN",
      ],
      supported_nodes: [
        "svg",
        "defs",
        "clipPath",
        "g",
        "rect",
        "circle",
        "line",
        "path",
        "polygon",
        "polyline",
        "text",
        "tspan",
      ],
    },
  },
  {
    name: "MindSlice_SafeSVGMount_v1",
    type: "utility",
    version: "v1",
    dependencies: ["MindSlice_SVGObjectSerializer_v1"],
    module_ref: { RUN: runSafeSvgMountV1 },
    provides: ["safe_svg_mount"],
    exports: {
      RUN: runSafeSvgMountV1,
    },
    metadata: {
      input_contract: ["svg_tree OR svg_string", "render_mode"],
      output_contract: ["react_svg_output OR sanitized_svg_string"],
      functions: [
        "validate_allowed_svg_nodes",
        "validate_no_script_nodes",
        "sanitize_svg_string",
        "render_svg_tree_to_react",
        "RUN",
      ],
      supported_nodes: [
        "svg",
        "defs",
        "clipPath",
        "g",
        "rect",
        "circle",
        "line",
        "path",
        "polygon",
        "polyline",
        "text",
        "tspan",
      ],
    },
  },
  {
    name: "MindSlice_LegacyVisualRetirementPlan_v1",
    type: "utility",
    version: "v1",
    dependencies: ["MindSlice_VisualPipelineController_vNext", "MindSlice_SafeSVGMount_v1"],
    module_ref: { RUN: runLegacyVisualRetirementPlanV1 },
    provides: ["legacy_visual_retirement_plan"],
    exports: {
      RUN: runLegacyVisualRetirementPlanV1,
    },
    metadata: {
      input_contract: ["codebase_scan", "migration_settings"],
      output_contract: ["retirement_steps", "migration_status", "remaining_legacy_references"],
      functions: [
        "find_legacy_references",
        "build_retirement_steps",
        "compute_migration_status",
        "RUN",
      ],
    },
  },
  {
    name: "MindSlice_BackgroundSelectionTelemetry_v1",
    type: "utility",
    version: "v1",
    dependencies: ["MindSlice_BackgroundOrchestrator_v2", "MindSlice_VisualRenderer_v2"],
    module_ref: { RUN: runBackgroundSelectionTelemetryV1 },
    provides: ["background_selection_telemetry"],
    exports: {
      RUN: runBackgroundSelectionTelemetryV1,
    },
    metadata: {
      input_contract: ["background_layer_selection", "background_layer_output"],
      output_contract: ["telemetry_output"],
      functions: ["RUN"],
    },
  },
  {
    name: "MindSlice_TextEchoConstellationEngine_v1",
    type: "engine",
    version: "v1",
    dependencies: [],
    module_ref: { RUN: runTextEchoConstellationEngineV1 },
    provides: ["text_echo_constellation"],
    exports: {
      RUN: runTextEchoConstellationEngineV1,
    },
    metadata: {
      input_contract: [
        "parsed_slice",
        "scenario_output",
        "composition_output",
        "text_constellation_output",
        "text_settings",
      ],
      output_contract: ["text_echo_constellation_output"],
      functions: [
        "extract_echo_terms_like_text_constellation",
        "build_reference_points_like_text_constellation",
        "resolve_echo_count",
        "select_balanced_echo_term",
        "select_reference_point",
        "offset_from_reference",
        "compute_echo_opacity",
        "RUN",
      ],
    },
  },
  {
    name: "MindSlice_TextLayoutCollisionResolver_v1",
    type: "engine",
    version: "v1",
    dependencies: [],
    module_ref: { RUN: runTextLayoutCollisionResolverV1 },
    provides: ["resolved_text_layout_output", "collision_report"],
    exports: {
      RUN: runTextLayoutCollisionResolverV1,
    },
    metadata: {
      input_contract: ["text_layout_output", "canvas", "collision_settings"],
      output_contract: ["resolved_text_layout_output", "collision_report"],
      functions: [
        "flatten_text_items",
        "estimate_text_bounds",
        "bounds_overlap",
        "find_non_overlapping_position",
        "apply_role_density_limits",
        "rebuild_text_layout_output",
        "RUN",
      ],
    },
  },
  {
    name: "MindSlice_TextLayoutCollisionResolver_v2",
    type: "engine",
    version: "v2",
    dependencies: ["MindSlice_TextLayoutCollisionResolver_v1"],
    module_ref: { RUN: runTextLayoutCollisionResolverV2 },
    provides: ["resolved_text_layout_output", "collision_report"],
    exports: {
      RUN: runTextLayoutCollisionResolverV2,
    },
    metadata: {
      input_contract: [
        "text_layout_output",
        "canvas",
        "structure_output",
        "scenario_output",
        "composition_output",
        "collision_settings",
      ],
      output_contract: ["resolved_text_layout_output", "collision_report"],
      functions: [
        "flatten_text_items",
        "normalize_text_items",
        "build_role_policy",
        "build_collision_matrix",
        "build_protected_zones",
        "build_placement_zones",
        "estimate_text_bounds",
        "place_item",
        "fallback_unplaceable_item",
        "rebuild_text_layout_output",
        "validate_resolved_output",
        "RUN",
      ],
      rules: [
        "Renderer does not think",
        "Renderer only draws",
        "CollisionResolver decides text spacing before rendering",
      ],
    },
  },
  {
    name: "MindSlice_VisualRuntimeSmokeTest_v1",
    type: "audit",
    version: "v1",
    dependencies: [
      "MindSlice_VisualPipelineController_vNext",
      "MindSlice_BackgroundModuleRegistry_v1",
    ],
    module_ref: { RUN: runVisualRuntimeSmokeTestV1 },
    provides: ["visual_runtime_smoke_test"],
    exports: {
      RUN: runVisualRuntimeSmokeTestV1,
    },
    metadata: {
      input_contract: ["active_runtime", "test_slice", "smoke_settings"],
      output_contract: ["smoke_test_report"],
      functions: ["RUN"],
    },
  },
  {
    name: "MindSlice_VisualErrorBoundaryContract_v1",
    type: "utility",
    version: "v1",
    dependencies: ["MindSlice_SVGObjectSerializer_v1"],
    module_ref: { RUN: runVisualErrorBoundaryContractV1 },
    provides: ["visual_error_boundary"],
    exports: {
      RUN: runVisualErrorBoundaryContractV1,
    },
    metadata: {
      input_contract: ["error", "runtime_context", "fallback_settings"],
      output_contract: [
        "user_safe_message",
        "developer_diagnostics",
        "fallback_svg",
        "recovery_action",
      ],
      functions: [
        "build_user_safe_message",
        "build_developer_diagnostics",
        "build_fallback_svg",
        "choose_recovery_action",
        "RUN",
      ],
    },
  },
  {
    name: "MindSlice_VisualPipelineController_vNext",
    type: "controller",
    version: "vNext",
    dependencies: [
      "MindSlice_BackgroundModuleRegistry_v1",
      "MindSlice_BackgroundOrchestrator_v2",
      "MindSlice_TextLayoutEngine_v2",
      "MindSlice_VisualRenderer_v2",
      "MindSlice_VisualAuditEngine_v1",
      "MindSlice_SVGObjectSerializer_v1",
      "MindSlice_VisualErrorBoundaryContract_v1",
    ],
    module_ref: { RUN: runVisualPipelineControllerVNext },
    provides: ["visual_svg_pipeline"],
    exports: {
      RUN: runVisualPipelineControllerVNext,
    },
    metadata: {
      input_contract: ["raw_slice", "canvas_settings", "render_settings", "text_settings"],
      output_contract: ["final_svg_string", "pipeline_result"],
      functions: ["RUN"],
      pipeline_order: [
        "ParserEngine",
        "ConceptualPresetSystem",
        "StructureEngine",
        "ScenarioEngine",
        "ColorTheoryEngine",
        "ArtCompositionEngine",
        "GeometryEngine",
        "SnapEngine",
        "BackgroundOrchestrator",
        "TextLayoutEngine",
        "VisualRenderer",
        "VisualAuditEngine",
        "SVGObjectSerializer",
      ],
    },
  },
];

export const MindSlice_VisualSVGArchitecture_Manifest_vNext: MindSliceModuleManifest = {
  modules: CORE_MODULES,
};

function emptyValidationReport(): MindSliceValidationReport {
  return {
    status: "ok",
    errors: [],
    warnings: [],
    missing_core_modules: [],
    invalid_modules: [],
    dependency_errors: [],
  };
}

function fail(message: string, report: unknown): MindSliceModuleLoaderResult {
  return {
    loader_result: {
      status: "fail",
      message,
      report,
    },
    active_runtime: null,
  };
}

function buildRuntimeContext(runtimeConfig: MindSliceModuleRuntimeConfig = {}): MindSliceRuntimeContext {
  return {
    ...(runtimeConfig.context ?? {}),
    system_name: runtimeConfig.system_name ?? "MindSlice",
    version: runtimeConfig.version ?? "vNext",
    mode: runtimeConfig.mode ?? "visual_svg_runtime",
    strict_mode: runtimeConfig.strict_mode ?? true,
    allow_fallbacks: runtimeConfig.allow_fallbacks ?? true,
    allow_export: runtimeConfig.allow_export ?? true,
    renderer_rule: "Renderer does not think. Renderer only draws.",
    module_version_policy: "versions_stack_not_replace",
    default_canvas: runtimeConfig.default_canvas ?? {
      width: 1080,
      height: 1080,
      margin: 80,
    },
    default_render_settings: runtimeConfig.default_render_settings ?? {
      allow_repair: true,
      background_kind: null,
      grammar_profile: null,
      background_opacity: null,
      density: null,
    },
    module_registry: {},
    dependency_graph: {},
    load_order: [],
    active_modules: {},
    validation_report: emptyValidationReport(),
    runtime_config: runtimeConfig,
  };
}

function applyOverrides(
  moduleDefinition: MindSliceModuleDefinition,
  runtimeConfig: MindSliceModuleRuntimeConfig,
): MindSliceModuleDefinition {
  const moduleName = moduleDefinition.name ?? moduleDefinition.id ?? "";
  const override = runtimeConfig.overrides?.[moduleName] ?? runtimeConfig.overrides?.[moduleDefinition.id ?? ""];

  return {
    ...moduleDefinition,
    ...(override ?? {}),
  };
}

function normalizeModuleEntry(moduleEntry: MindSliceModuleDefinition): MindSliceModuleRecord {
  const name = moduleEntry.name ?? moduleEntry.id ?? "";
  const moduleRef = moduleEntry.module_ref ?? moduleEntry.exports ?? moduleEntry.activate ?? null;

  return {
    name,
    type: moduleEntry.type,
    version: moduleEntry.version ?? null,
    module_ref: moduleRef,
    activate: moduleEntry.activate,
    dependencies: moduleEntry.dependencies ?? [],
    provides: moduleEntry.provides ?? [],
    requires: moduleEntry.requires ?? [],
    status: "loaded",
    metadata: moduleEntry.metadata,
    previous_version_required: moduleEntry.previous_version_required,
  };
}

function loadManifest(
  moduleManifest: MindSliceModuleManifest,
  runtimeConfig: MindSliceModuleRuntimeConfig,
) {
  const registry: Record<string, MindSliceModuleRecord> = {};
  const modules = runtimeConfig.activate_core === false
    ? moduleManifest.modules
    : [...CORE_MODULES, ...moduleManifest.modules];

  modules.forEach((moduleDefinition) => {
    const resolvedModule = applyOverrides(moduleDefinition, runtimeConfig);
    const moduleRecord = normalizeModuleEntry(resolvedModule);

    if (moduleRecord.name) {
      registry[moduleRecord.name] = moduleRecord;
    }
  });

  return registry;
}

function buildDependencyGraph(moduleRegistry: Record<string, MindSliceModuleRecord>) {
  const graph: Record<string, MindSliceDependencyGraphNode> = {};

  Object.entries(moduleRegistry).forEach(([moduleName, moduleRecord]) => {
    graph[moduleName] = {
      dependencies: moduleRecord.dependencies,
      dependents: [],
    };
  });

  Object.entries(graph).forEach(([moduleName, node]) => {
    node.dependencies.forEach((dependency) => {
      if (graph[dependency]) {
        graph[dependency].dependents.push(moduleName);
      }
    });
  });

  return graph;
}

const MODULE_TYPES: MindSliceModuleType[] = [
  "engine",
  "grammar_engine",
  "pattern_engine",
  "renderer",
  "registry",
  "orchestrator",
  "serializer",
  "controller",
  "audit",
  "utility",
];

function validateSingleModule(moduleRecord: MindSliceModuleRecord) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!moduleRecord.name) {
    errors.push("MODULE_WITHOUT_NAME");
  }

  if (!MODULE_TYPES.includes(moduleRecord.type)) {
    errors.push(`INVALID_MODULE_TYPE:${moduleRecord.name}`);
  }

  if (!moduleRecord.version) {
    warnings.push(`MODULE_WITHOUT_VERSION:${moduleRecord.name}`);
  }

  if (!moduleRecord.module_ref) {
    errors.push(`MODULE_WITHOUT_REFERENCE:${moduleRecord.name}`);
  }

  if (moduleRecord.type === "renderer" && !moduleRecord.provides.includes("draw")) {
    warnings.push(`RENDERER_WITHOUT_DRAW_PROVIDE:${moduleRecord.name}`);
  }

  if (
    moduleRecord.type === "grammar_engine" &&
    !moduleRecord.provides.includes("grammar_plan")
  ) {
    warnings.push(`GRAMMAR_ENGINE_WITHOUT_GRAMMAR_PLAN_PROVIDE:${moduleRecord.name}`);
  }

  return {
    errors,
    warnings,
  };
}

function validateModules(
  moduleRegistry: Record<string, MindSliceModuleRecord>,
  _runtimeContext: MindSliceRuntimeContext,
) {
  void _runtimeContext;

  const report = emptyValidationReport();

  Object.values(moduleRegistry).forEach((moduleRecord) => {
    const moduleReport = validateSingleModule(moduleRecord);

    if (moduleReport.errors.length > 0) {
      report.invalid_modules.push(moduleRecord.name || "unknown");
      report.errors.push(...moduleReport.errors);
    }

    report.warnings.push(...moduleReport.warnings);
  });

  REQUIRED_CORE_MODULES.forEach((moduleId) => {
    if (!moduleRegistry[moduleId]) {
      report.missing_core_modules.push(moduleId);
      report.errors.push(`MISSING_CORE_MODULE:${moduleId}`);
    }
  });

  report.status = report.errors.length > 0 ? "fail" : "ok";

  return report;
}

function validateDependencyGraph(
  moduleRegistry: Record<string, MindSliceModuleRecord>,
  dependencyGraph: Record<string, MindSliceDependencyGraphNode>,
): MindSliceGraphReport {
  const report: MindSliceGraphReport = {
    status: "ok",
    errors: [],
    warnings: [],
  };

  Object.entries(dependencyGraph).forEach(([moduleId, node]) => {
    node.dependencies.forEach((dependencyId) => {
      if (!moduleRegistry[dependencyId]) {
        report.errors.push(`MISSING_DEPENDENCY:${moduleId}->${dependencyId}`);
      }
    });
  });

  const { cycleErrors } = resolveLoadOrder(moduleRegistry, dependencyGraph);
  if (cycleErrors.length > 0) {
    report.errors.push("CIRCULAR_DEPENDENCY_DETECTED", ...cycleErrors);
  }

  report.status = report.errors.length > 0 ? "fail" : "ok";

  return report;
}

function resolveLoadOrder(
  moduleRegistry: Record<string, MindSliceModuleRecord>,
  dependencyGraph: Record<string, MindSliceDependencyGraphNode>,
) {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const loadOrder: string[] = [];
  const cycleErrors: string[] = [];

  function visit(moduleId: string) {
    if (visited.has(moduleId)) {
      return;
    }

    if (visiting.has(moduleId)) {
      cycleErrors.push(`CYCLIC_DEPENDENCY:${moduleId}`);
      return;
    }

    visiting.add(moduleId);

    (dependencyGraph[moduleId]?.dependencies ?? []).forEach((dependencyId) => {
      if (moduleRegistry[dependencyId]) {
        visit(dependencyId);
      }
    });

    visiting.delete(moduleId);
    visited.add(moduleId);
    loadOrder.push(moduleId);
  }

  Object.keys(moduleRegistry).forEach((moduleId) => visit(moduleId));

  return {
    loadOrder,
    cycleErrors,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectDependencies(
  moduleRecord: MindSliceModuleRecord,
  activeModules: Record<string, MindSliceActiveModuleRecord>,
) {
  return Object.fromEntries(
    moduleRecord.dependencies.map((dependencyName) => [
      dependencyName,
      activeModules[dependencyName],
    ]),
  );
}

function activateSingleModule(
  moduleRecord: MindSliceModuleRecord,
  activeModules: Record<string, MindSliceActiveModuleRecord>,
  runtimeContext: MindSliceRuntimeContext,
): MindSliceActiveModuleRecord {
  const moduleInstance = moduleRecord.module_ref;
  const activatedInstance = moduleRecord.activate
    ? moduleRecord.activate(runtimeContext)
    : null;

  if (activatedInstance) {
    return {
      name: moduleRecord.name,
      type: moduleRecord.type,
      version: moduleRecord.version,
      instance: moduleInstance,
      status: "active",
      boot_report: activatedInstance,
    };
  }

  const boot = isRecord(moduleInstance) && typeof moduleInstance.BOOT === "function"
    ? moduleInstance.BOOT
    : null;

  if (boot) {
    const bootResult = boot({
      dependencies: collectDependencies(moduleRecord, activeModules),
      runtime_context: runtimeContext,
    });

    return {
      name: moduleRecord.name,
      type: moduleRecord.type,
      version: moduleRecord.version,
      instance: isRecord(bootResult) && bootResult.instance ? bootResult.instance : moduleInstance,
      status: "active",
      boot_report: bootResult,
    };
  }

  return {
    name: moduleRecord.name,
    type: moduleRecord.type,
    version: moduleRecord.version,
    instance: moduleInstance,
    status: "active",
    boot_report: {
      status: "no_boot_required",
    },
  };
}

function activateModules(runtimeContext: MindSliceRuntimeContext) {
  const activeModules: Record<string, MindSliceActiveModuleRecord> = {};

  runtimeContext.load_order.forEach((moduleId) => {
    const moduleRecord = runtimeContext.module_registry[moduleId];

    if (!moduleRecord) {
      return;
    }

    activeModules[moduleId] = activateSingleModule(moduleRecord, activeModules, runtimeContext);
  });

  return activeModules;
}

function getActiveInstance(
  activeModules: Record<string, MindSliceActiveModuleRecord>,
  moduleName: string,
) {
  return activeModules[moduleName]?.instance ?? null;
}

function callRun(instance: unknown, input: Record<string, unknown>) {
  if (isRecord(instance) && typeof instance.RUN === "function") {
    return instance.RUN(input);
  }

  return null;
}

function initializeBackgroundRegistry(activeModules: Record<string, MindSliceActiveModuleRecord>) {
  const registryModule = getActiveInstance(activeModules, "MindSlice_BackgroundModuleRegistry_v1");

  callRun(registryModule, {
    registry_action: "register_defaults",
  });

  Object.values(activeModules).forEach((activeRecord) => {
    const instance = activeRecord.instance;

    if (isRecord(instance) && instance.background_module_definition) {
      callRun(registryModule, {
        registry_action: "register",
        module_definition: instance.background_module_definition,
      });
    }
  });

  return registryModule;
}

function buildActiveRuntime(
  moduleRegistry: Record<string, MindSliceModuleRecord>,
  dependencyGraph: Record<string, MindSliceDependencyGraphNode>,
  loadOrder: string[],
  activeModules: Record<string, MindSliceActiveModuleRecord>,
  backgroundRegistry: unknown,
  runtimeContext: MindSliceRuntimeContext,
  validationReport: MindSliceValidationReport,
  graphReport: MindSliceGraphReport,
): MindSliceActiveRuntime {
  const activeRuntimeContext = {
    ...runtimeContext,
    module_registry: moduleRegistry,
    dependency_graph: dependencyGraph,
    load_order: loadOrder,
    active_modules: activeModules,
    validation_report: validationReport,
  };

  return {
    system: "MindSlice_VisualSVGArchitecture",
    version: runtimeContext.version,
    modules: activeModules,
    module_registry: moduleRegistry,
    dependency_graph: dependencyGraph,
    load_order: loadOrder,
    active_modules: activeModules,
    background_registry: backgroundRegistry,
    controller: getActiveInstance(activeModules, "MindSlice_VisualPipelineController_vNext"),
    serializer: getActiveInstance(activeModules, "MindSlice_SVGObjectSerializer_v1"),
    audit_engine: getActiveInstance(activeModules, "MindSlice_VisualAuditEngine_v1"),
    renderer: getActiveInstance(activeModules, "MindSlice_VisualRenderer_v2"),
    text_layout_engine: getActiveInstance(activeModules, "MindSlice_TextLayoutEngine_v2"),
    background_orchestrator: getActiveInstance(activeModules, "MindSlice_BackgroundOrchestrator_v2"),
    grammar_contract: getActiveInstance(activeModules, "MindSlice_GrammarPipelineContract_v1"),
    error_boundary: getActiveInstance(activeModules, "MindSlice_VisualErrorBoundaryContract_v1"),
    validation_report: validationReport,
    graph_report: graphReport,
    smoke_test_report: {
      status: "ok",
      errors: [],
      warnings: [],
      checks: [],
    },
    runtime_context: activeRuntimeContext,
    context: activeRuntimeContext,
  };
}

function runSmokeTests(activeRuntime: MindSliceActiveRuntime): MindSliceSmokeTestReport {
  const report: MindSliceSmokeTestReport = {
    status: "ok",
    errors: [],
    warnings: [],
    checks: [],
  };

  REQUIRED_CORE_MODULES.forEach((moduleId) => {
    if (!activeRuntime.active_modules[moduleId]) {
      report.errors.push(`CORE_MODULE_NOT_ACTIVE:${moduleId}`);
    } else {
      report.checks.push(`CORE_MODULE_ACTIVE:${moduleId}`);
    }
  });

  if (!activeRuntime.background_registry) {
    report.errors.push("BACKGROUND_REGISTRY_NOT_INITIALIZED");
  } else {
    report.checks.push("BACKGROUND_REGISTRY_INITIALIZED");
  }

  if (!activeRuntime.controller) {
    report.errors.push("NO_CONTROLLER_ACTIVE");
  } else {
    report.checks.push("CONTROLLER_ACTIVE");
  }

  if (!activeRuntime.background_registry) {
    report.errors.push("NO_BACKGROUND_REGISTRY_ACTIVE");
  }

  if (!activeRuntime.serializer) {
    report.errors.push("NO_SERIALIZER_ACTIVE");
  }

  const backgroundList = callRun(activeRuntime.background_registry, {
    registry_action: "list",
  });

  if (!backgroundList || (isRecord(backgroundList) && Object.keys(backgroundList).length === 0)) {
    report.errors.push("NO_BACKGROUND_MODULES_REGISTERED");
  } else {
    report.checks.push("BACKGROUND_MODULES_REGISTERED");
  }

  if (!activeRuntime.renderer) {
    report.errors.push("NO_VISUAL_RENDERER_ACTIVE");
  }

  if (!activeRuntime.grammar_contract) {
    report.errors.push("NO_GRAMMAR_PIPELINE_CONTRACT_ACTIVE");
  }

  report.status = report.errors.length > 0 ? "fail" : "ok";

  return report;
}

type SingleFileSerializableValue =
  | string
  | number
  | boolean
  | null
  | SingleFileSerializableValue[]
  | { [key: string]: SingleFileSerializableValue };

function serializeExportValue(value: unknown): SingleFileSerializableValue {
  if (typeof value === "function") {
    return "[Function]";
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeExportValue(entry));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeExportValue(entry)]),
    );
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  return String(value);
}

function buildSingleFileExport(
  activeRuntime: MindSliceActiveRuntime,
  exportSettings: MindSliceModuleExportSettings,
) {
  const modules = Object.entries(activeRuntime.modules).map(([moduleName, activeRecord]) => ({
    name: moduleName,
    type: activeRecord.type,
    version: activeRecord.version,
    ...(exportSettings.include_module_source === true
      ? { source: serializeExportValue(activeRecord.instance) }
      : { reference: serializeExportValue(activeRecord.instance) }),
  }));

  return {
    type: "MindSlice_VisualSVGArchitecture_vNext_SINGLE_FILE",
    generated_from: "MindSlice_ModuleLoader_v1",
    version: activeRuntime.version,
    modules,
    registry_snapshot: callRun(activeRuntime.background_registry, {
      registry_action: "list",
    }),
    dependency_snapshot: activeRuntime.dependency_graph,
    validation_report: exportSettings.include_validation_report === false
      ? undefined
      : activeRuntime.validation_report,
    runtime_context: exportSettings.include_runtime_context
      ? serializeExportValue(activeRuntime.runtime_context)
      : undefined,
    notes: ["SINGLE_FILE is export snapshot, not source of truth."],
  };
}

function exportSingleFile(
  activeRuntime: MindSliceActiveRuntime,
  exportSettings: MindSliceModuleExportSettings,
) {
  return buildSingleFileExport(activeRuntime, exportSettings);
}

function baseModuleName(moduleName: string) {
  return moduleName.replace(/_v(?:Next|\d+)$/i, "");
}

function versionWeight(version: string | null) {
  if (!version) {
    return 0;
  }

  if (version.toLowerCase() === "vnext") {
    return Number.MAX_SAFE_INTEGER;
  }

  const numeric = Number.parseInt(version.replace(/^v/i, ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function previousVersionMissing(
  moduleRecord: MindSliceModuleRecord,
  sortedVersions: MindSliceModuleRecord[],
) {
  const currentWeight = versionWeight(moduleRecord.version);

  if (currentWeight <= 1) {
    return false;
  }

  return !sortedVersions.some((candidate) => versionWeight(candidate.version) === currentWeight - 1);
}

export const MindSlice_ModuleVersionPolicy_v1 = {
  CHECK(moduleRegistry: Record<string, MindSliceModuleRecord>) {
    const warnings: string[] = [];
    const grouped = Object.values(moduleRegistry).reduce<Record<string, MindSliceModuleRecord[]>>(
      (groups, moduleRecord) => {
        const baseName = baseModuleName(moduleRecord.name);
        groups[baseName] = [...(groups[baseName] ?? []), moduleRecord];
        return groups;
      },
      {},
    );

    Object.entries(grouped).forEach(([baseName, versions]) => {
      const sortedVersions = [...versions].sort(
        (a, b) => versionWeight(a.version) - versionWeight(b.version),
      );

      sortedVersions.forEach((version) => {
        if (
          version.previous_version_required === true &&
          previousVersionMissing(version, sortedVersions)
        ) {
          warnings.push(`VERSION_STACK_BROKEN:${baseName}:${version.version}`);
        }
      });
    });

    return {
      status: warnings.length === 0 ? "ok" : "warning",
      warnings,
    };
  },
};

export function runModuleLoaderV1(
  moduleManifest: MindSliceModuleManifest = { modules: [] },
  runtimeConfig: MindSliceModuleRuntimeConfig = {},
  exportSettings?: MindSliceModuleExportSettings,
): MindSliceModuleLoaderResult {
  const runtimeContext = buildRuntimeContext(runtimeConfig);
  const moduleRegistry = loadManifest(moduleManifest, runtimeConfig);
  const validationReport = validateModules(moduleRegistry, runtimeContext);

  if (validationReport.status === "fail") {
    return fail("MODULE_VALIDATION_FAILED", validationReport);
  }

  const dependencyGraph = buildDependencyGraph(moduleRegistry);
  const graphReport = validateDependencyGraph(moduleRegistry, dependencyGraph);

  if (graphReport.status === "fail") {
    return fail("DEPENDENCY_GRAPH_FAILED", graphReport);
  }

  const { loadOrder, cycleErrors } = resolveLoadOrder(moduleRegistry, dependencyGraph);

  if (cycleErrors.length > 0) {
    return fail("DEPENDENCY_GRAPH_FAILED", {
      ...graphReport,
      status: "fail",
      errors: [...graphReport.errors, ...cycleErrors],
    });
  }

  const hydratedRuntimeContext: MindSliceRuntimeContext = {
    ...runtimeContext,
    module_registry: moduleRegistry,
    dependency_graph: dependencyGraph,
    load_order: loadOrder,
    active_modules: {},
    validation_report: validationReport,
  };

  const activeModules = activateModules(hydratedRuntimeContext);
  const backgroundRegistry = initializeBackgroundRegistry(activeModules);
  let activeRuntime = buildActiveRuntime(
    moduleRegistry,
    dependencyGraph,
    loadOrder,
    activeModules,
    backgroundRegistry,
    hydratedRuntimeContext,
    validationReport,
    graphReport,
  );
  const smokeTestReport = runSmokeTests(activeRuntime);

  activeRuntime = {
    ...activeRuntime,
    smoke_test_report: smokeTestReport,
  };

  if (smokeTestReport.status === "fail") {
    return fail("RUNTIME_SMOKE_TEST_FAILED", smokeTestReport);
  }

  return {
    loader_result: {
      status: "ok",
      active_modules: activeModules,
      load_order: loadOrder,
      dependency_graph: dependencyGraph,
      validation_report: validationReport,
      graph_report: graphReport,
      smoke_test_report: smokeTestReport,
      runtime_context: hydratedRuntimeContext,
    },
    active_runtime: activeRuntime,
    ...(exportSettings?.enabled === true
      ? { single_file_export: exportSingleFile(activeRuntime, exportSettings) }
      : {}),
  };
}

export const RUN = runModuleLoaderV1;
