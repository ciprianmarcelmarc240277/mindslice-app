import {
  MindSlice_ModuleVersionPolicy_v1,
  type MindSliceActiveRuntime,
  type MindSliceDependencyGraphNode,
  type MindSliceModuleDefinition,
  type MindSliceModuleManifest,
  type MindSliceModuleRecord,
} from "@/lib/mindslice/concept-module-loader-system";
import { runVisualRuntimeSmokeTestV1 } from "@/lib/mindslice/concept-visual-runtime-smoke-test-system";

export type MindSliceArchitectureValidationSettings = {
  require_active_runtime?: boolean;
  allow_warnings?: boolean;
  smoke_test_runtime?: boolean;
  test_slice?: string;
};

export type MindSliceArchitectureValidationReport = {
  status: "ok" | "fail";
  score: number;
  errors: string[];
  warnings: string[];
  repair_suggestions: string[];
  dependency_graph: Record<string, MindSliceDependencyGraphNode>;
};

const REQUIRED_MODULES = [
  "ParserEngine",
  "ConceptualPresetSystem",
  "StructureEngine",
  "ScenarioEngine",
  "ColorTheoryEngine",
  "ArtCompositionEngine",
  "GeometryEngine",
  "SnapEngine",
  "BackgroundModuleRegistry_v1",
  "GrammarPipelineContract_v1",
  "BackgroundOrchestrator_v2",
  "TextLayoutEngine_v2",
  "TextSourceParityBridge_v1",
  "TemplateLikeTextPlacementEngine_v1",
  "TextEchoConstellationEngine_v1",
  "TextLayoutCollisionResolver_v1",
  "TextLayoutCollisionResolver_v2",
  "VisualRenderer_v2",
  "VisualAuditEngine_v1",
  "SVGObjectSerializer_v1",
  "VisualErrorBoundaryContract_v1",
  "VisualPipelineController_vNext",
];

const REQUIRED_BACKGROUND_MODULES = [
  "pattern",
  "triangulation",
  "flat_abstract_pattern",
  "isometric_pattern",
  "zigzag_pattern",
  "retro_grid_pattern",
];

const REQUIRED_RULES = [
  "Renderer does not think",
  "Renderer only draws",
  "Versions stack, versions do not overwrite",
  "GrammarEngine -> grammar_plan",
  "PatternEngine -> pattern_output",
  "SVGRenderer -> svg_layer",
];

const REQUIRED_SVG_NODES = [
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
];

function normalizeName(value: string) {
  return value
    .replace(/^MindSlice_/i, "")
    .replace(/_/g, "")
    .toLowerCase();
}

function moduleName(moduleDefinition: MindSliceModuleDefinition) {
  return moduleDefinition.name ?? moduleDefinition.id ?? "";
}

function moduleFunctions(moduleDefinition: MindSliceModuleDefinition) {
  const metadataFunctions = moduleDefinition.metadata?.functions;

  if (Array.isArray(moduleDefinition.functions)) {
    return moduleDefinition.functions;
  }

  if (Array.isArray(metadataFunctions)) {
    return metadataFunctions.filter((entry): entry is string => typeof entry === "string");
  }

  const exportKeys = moduleDefinition.exports ? Object.keys(moduleDefinition.exports) : [];
  const moduleRefKeys =
    typeof moduleDefinition.module_ref === "object" && moduleDefinition.module_ref !== null
      ? Object.keys(moduleDefinition.module_ref)
      : [];

  return [...new Set([...exportKeys, ...moduleRefKeys])];
}

function hasDeclaredContract(moduleDefinition: MindSliceModuleDefinition, contractName: string) {
  if (contractName in moduleDefinition) {
    return true;
  }

  return moduleDefinition.metadata?.[contractName] !== undefined;
}

function manifestModuleNames(moduleManifest: MindSliceModuleManifest) {
  return moduleManifest.modules.map((moduleDefinition) => moduleName(moduleDefinition));
}

function hasModule(moduleNames: string[], requiredName: string) {
  const normalizedRequired = normalizeName(requiredName);
  return moduleNames.some((name) => normalizeName(name).includes(normalizedRequired));
}

function buildDependencyGraph(moduleManifest: MindSliceModuleManifest) {
  const graph: Record<string, MindSliceDependencyGraphNode> = {};

  moduleManifest.modules.forEach((moduleDefinition) => {
    const name = moduleName(moduleDefinition);

    if (!name) {
      return;
    }

    graph[name] = {
      dependencies: moduleDefinition.dependencies ?? [],
      dependents: [],
    };
  });

  Object.entries(graph).forEach(([name, node]) => {
    node.dependencies.forEach((dependency) => {
      if (graph[dependency]) {
        graph[dependency].dependents.push(name);
      }
    });
  });

  return graph;
}

function hasCycle(dependencyGraph: Record<string, MindSliceDependencyGraphNode>) {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(moduleName: string): boolean {
    if (visiting.has(moduleName)) {
      return true;
    }

    if (visited.has(moduleName)) {
      return false;
    }

    visiting.add(moduleName);

    const hasNestedCycle = (dependencyGraph[moduleName]?.dependencies ?? []).some((dependency) => {
      if (!dependencyGraph[dependency]) {
        return false;
      }

      return visit(dependency);
    });

    visiting.delete(moduleName);
    visited.add(moduleName);

    return hasNestedCycle;
  }

  return Object.keys(dependencyGraph).some((moduleName) => visit(moduleName));
}

function checkRequiredModules(moduleManifest: MindSliceModuleManifest) {
  const errors: string[] = [];
  const moduleNames = manifestModuleNames(moduleManifest);

  REQUIRED_MODULES.forEach((requiredName) => {
    if (!hasModule(moduleNames, requiredName)) {
      errors.push(`MISSING_REQUIRED_MODULE:${requiredName}`);
    }
  });

  return errors;
}

function checkModuleContracts(moduleManifest: MindSliceModuleManifest) {
  const errors: string[] = [];
  const warnings: string[] = [];

  moduleManifest.modules.forEach((moduleDefinition) => {
    const name = moduleName(moduleDefinition);

    if (!name) {
      errors.push("MODULE_WITHOUT_NAME");
    }

    if (!moduleDefinition.type) {
      errors.push(`MODULE_WITHOUT_TYPE:${name || "unknown"}`);
    }

    if (!moduleDefinition.version) {
      warnings.push(`MODULE_WITHOUT_VERSION:${name || "unknown"}`);
    }

    if (!moduleDefinition.module_ref && !moduleDefinition.exports && !moduleDefinition.activate) {
      errors.push(`MODULE_WITHOUT_REFERENCE:${name || "unknown"}`);
    }

    if (!hasDeclaredContract(moduleDefinition, "input_contract")) {
      warnings.push(`MODULE_WITHOUT_INPUT_CONTRACT:${name || "unknown"}`);
    }

    if (!hasDeclaredContract(moduleDefinition, "output_contract")) {
      warnings.push(`MODULE_WITHOUT_OUTPUT_CONTRACT:${name || "unknown"}`);
    }

    if (!moduleFunctions(moduleDefinition).includes("RUN")) {
      errors.push(`MODULE_WITHOUT_RUN_FUNCTION:${name || "unknown"}`);
    }

    if (moduleDefinition.type === "renderer" && !moduleDefinition.provides?.includes("draw")) {
      warnings.push(`RENDERER_WITHOUT_DRAW_PROVIDE:${name}`);
    }

    if (
      moduleDefinition.type === "grammar_engine" &&
      !moduleDefinition.provides?.includes("grammar_plan")
    ) {
      warnings.push(`GRAMMAR_ENGINE_WITHOUT_GRAMMAR_PLAN_PROVIDE:${name}`);
    }
  });

  return { errors, warnings };
}

function checkDependencyGraph(
  moduleManifest: MindSliceModuleManifest,
  dependencyGraph: Record<string, MindSliceDependencyGraphNode>,
) {
  const errors: string[] = [];
  const moduleNames = new Set(manifestModuleNames(moduleManifest));

  Object.entries(dependencyGraph).forEach(([name, node]) => {
    node.dependencies.forEach((dependency) => {
      if (!moduleNames.has(dependency)) {
        errors.push(`MISSING_DEPENDENCY:${name}->${dependency}`);
      }
    });
  });

  if (hasCycle(dependencyGraph)) {
    errors.push("CIRCULAR_DEPENDENCY_DETECTED");
  }

  const controllerEntry = Object.entries(dependencyGraph).find(([name]) =>
    normalizeName(name).includes(normalizeName("VisualPipelineController_vNext")),
  );

  if (controllerEntry && controllerEntry[1].dependencies.length === 0) {
    errors.push("CONTROLLER_NOT_CONNECTED_TO_MODULES");
  }

  return errors;
}

function manifestRecords(moduleManifest: MindSliceModuleManifest) {
  return Object.fromEntries(
    moduleManifest.modules
      .map((moduleDefinition): [string, MindSliceModuleRecord] | null => {
        const name = moduleName(moduleDefinition);

        if (!name) {
          return null;
        }

        return [
          name,
          {
            name,
            type: moduleDefinition.type,
            version: moduleDefinition.version ?? null,
            module_ref: moduleDefinition.module_ref ?? moduleDefinition.exports ?? null,
            activate: moduleDefinition.activate,
            dependencies: moduleDefinition.dependencies ?? [],
            provides: moduleDefinition.provides ?? [],
            requires: moduleDefinition.requires ?? [],
            status: "loaded",
            metadata: moduleDefinition.metadata,
            previous_version_required: moduleDefinition.previous_version_required,
          },
        ];
      })
      .filter((entry): entry is [string, MindSliceModuleRecord] => entry !== null),
  );
}

function checkVersionStack(moduleManifest: MindSliceModuleManifest) {
  return MindSlice_ModuleVersionPolicy_v1.CHECK(manifestRecords(moduleManifest)).warnings;
}

function callRun(instance: unknown, input: Record<string, unknown>) {
  if (typeof instance === "object" && instance !== null && "RUN" in instance) {
    const run = (instance as { RUN?: unknown }).RUN;

    if (typeof run === "function") {
      return run(input);
    }
  }

  return null;
}

function checkBackgroundRegistry(activeRuntime?: MindSliceActiveRuntime | null) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!activeRuntime) {
    warnings.push("ACTIVE_RUNTIME_NOT_PROVIDED_FOR_BACKGROUND_REGISTRY_CHECK");
    return { errors, warnings };
  }

  const registry = activeRuntime.background_registry;

  if (!registry) {
    errors.push("NO_BACKGROUND_REGISTRY_ACTIVE");
    return { errors, warnings };
  }

  const backgroundList = callRun(registry, { registry_action: "list" });
  const backgroundKeys =
    typeof backgroundList === "object" && backgroundList !== null
      ? Object.keys(backgroundList)
      : [];

  REQUIRED_BACKGROUND_MODULES.forEach((kind) => {
    if (!backgroundKeys.includes(kind)) {
      errors.push(`BACKGROUND_MODULE_NOT_REGISTERED:${kind}`);
    }
  });

  if (typeof backgroundList === "object" && backgroundList !== null) {
    Object.entries(backgroundList).forEach(([kind, moduleDefinition]) => {
      if (typeof moduleDefinition !== "object" || moduleDefinition === null) {
        errors.push(`BACKGROUND_MODULE_INVALID:${kind}`);
        return;
      }

      [
        "kind",
        "infer_rules",
        "default_settings",
        "supported_grammar_profiles",
        "pattern_engine",
        "svg_renderer",
        "default_opacity",
        "layer_order",
        "semantic_tags",
      ].forEach((field) => {
        if (!(field in moduleDefinition)) {
          errors.push(`BACKGROUND_MODULE_FIELD_MISSING:${kind}:${field}`);
        }
      });
    });
  }

  return { errors, warnings };
}

function checkGrammarPipelineContract(moduleManifest: MindSliceModuleManifest) {
  const contract = moduleManifest.modules.find((moduleDefinition) =>
    normalizeName(moduleName(moduleDefinition)).includes(normalizeName("GrammarPipelineContract_v1")),
  );

  if (!contract) {
    return ["MISSING_GRAMMAR_PIPELINE_CONTRACT"];
  }

  const functions = moduleFunctions(contract);
  return [
    "RUN_WITH_GRAMMAR",
    "RUN_WITHOUT_GRAMMAR",
    "HANDLE_EMPTY_GRAMMAR_PLAN",
    "FALLBACK_PATTERN_OUTPUT",
    "VALIDATE_PATTERN_OUTPUT",
    "RUN",
  ].flatMap((fn) =>
    functions.includes(fn) ? [] : [`GRAMMAR_CONTRACT_MISSING_FUNCTION:${fn}`],
  );
}

function checkRendererPassivity(moduleManifest: MindSliceModuleManifest) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const renderers = moduleManifest.modules.filter((moduleDefinition) => moduleDefinition.type === "renderer");
  const forbiddenActions = [
    "infer_preset",
    "choose_background_kind",
    "select_grammar_profile",
    "compute_density",
    "extract_semantic_meaning",
    "modify_composition",
    "change_hierarchy",
  ];

  renderers.forEach((renderer) => {
    const source = `${renderer.source ?? ""} ${renderer.metadata?.source ?? ""} ${renderer.metadata?.source_summary ?? ""}`;

    forbiddenActions.forEach((action) => {
      if (source.includes(action)) {
        errors.push(`RENDERER_THINKING_VIOLATION:${moduleName(renderer)}:${action}`);
      }
    });
  });

  const renderer = moduleManifest.modules.find((moduleDefinition) =>
    normalizeName(moduleName(moduleDefinition)).includes(normalizeName("VisualRenderer_v2")),
  );
  const metadataRules = [
    ...(renderer?.metadata?.rules as string[] | undefined ?? []),
    ...(renderer?.metadata?.principles as string[] | undefined ?? []),
  ].join(" ");

  if (metadataRules && !metadataRules.includes("Renderer does not think")) {
    warnings.push("RENDERER_RULE_NOT_DECLARED:Renderer does not think");
  }

  return { errors, warnings };
}

function checkSvgSerializerSupport(moduleManifest: MindSliceModuleManifest) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const serializer = moduleManifest.modules.find((moduleDefinition) =>
    normalizeName(moduleName(moduleDefinition)).includes(normalizeName("SVGObjectSerializer_v1")),
  );

  if (!serializer) {
    return { errors: ["MISSING_SVG_SERIALIZER"], warnings };
  }

  const metadataSupported = serializer.metadata?.supported_nodes;
  const supported = Array.isArray(serializer.supported_nodes)
    ? serializer.supported_nodes
    : Array.isArray(metadataSupported)
      ? metadataSupported
      : null;

  if (!supported) {
    warnings.push("SERIALIZER_SUPPORTED_NODES_NOT_DECLARED");
    return { errors, warnings };
  }

  REQUIRED_SVG_NODES.forEach((nodeType) => {
    if (!supported.includes(nodeType)) {
      errors.push(`SVG_SERIALIZER_MISSING_NODE:${nodeType}`);
    }
  });

  return { errors, warnings };
}

function checkControllerPipeline(moduleManifest: MindSliceModuleManifest) {
  const controller = moduleManifest.modules.find((moduleDefinition) =>
    normalizeName(moduleName(moduleDefinition)).includes(normalizeName("VisualPipelineController_vNext")),
  );

  if (!controller) {
    return ["MISSING_VISUAL_PIPELINE_CONTROLLER"];
  }

  const pipelineOrder = Array.isArray(controller.pipeline_order)
    ? controller.pipeline_order
    : Array.isArray(controller.metadata?.pipeline_order)
      ? controller.metadata.pipeline_order.filter((entry): entry is string => typeof entry === "string")
      : null;

  if (!pipelineOrder) {
    return ["CONTROLLER_PIPELINE_ORDER_NOT_DECLARED"];
  }

  const requiredPipelineOrder = [
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
  ];
  let cursor = 0;

  pipelineOrder.forEach((step) => {
    if (normalizeName(step).includes(normalizeName(requiredPipelineOrder[cursor] ?? ""))) {
      cursor += 1;
    }
  });

  return cursor === requiredPipelineOrder.length ? [] : ["CONTROLLER_PIPELINE_ORDER_INVALID"];
}

function checkRuntimeSmokeTest(
  activeRuntime: MindSliceActiveRuntime | null | undefined,
  validationSettings: MindSliceArchitectureValidationSettings = {},
) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!activeRuntime) {
    if (validationSettings.require_active_runtime === true) {
      errors.push("ACTIVE_RUNTIME_REQUIRED_BUT_MISSING");
    } else {
      warnings.push("ACTIVE_RUNTIME_NOT_PROVIDED_FOR_SMOKE_TEST");
    }

    return { errors, warnings };
  }

  if (!activeRuntime.controller) {
    errors.push("NO_CONTROLLER_ACTIVE");
  }

  if (!activeRuntime.renderer) {
    errors.push("NO_VISUAL_RENDERER_ACTIVE");
  }

  if (!activeRuntime.serializer) {
    errors.push("NO_SERIALIZER_ACTIVE");
  }

  if (!activeRuntime.grammar_contract) {
    errors.push("NO_GRAMMAR_PIPELINE_CONTRACT_ACTIVE");
  }

  if (activeRuntime.smoke_test_report?.status === "fail") {
    errors.push(...activeRuntime.smoke_test_report.errors);
  }

  if (validationSettings.smoke_test_runtime === true) {
    const smokeReport = runVisualRuntimeSmokeTestV1();

    errors.push(...smokeReport.errors);
  }

  return { errors, warnings };
}

function checkRequiredRules(moduleManifest: MindSliceModuleManifest) {
  const warnings: string[] = [];
  const manifestText = JSON.stringify(
    moduleManifest.modules.map((moduleDefinition) => ({
      name: moduleName(moduleDefinition),
      metadata: moduleDefinition.metadata ?? {},
      provides: moduleDefinition.provides ?? [],
    })),
  );

  REQUIRED_RULES.forEach((rule) => {
    if (!manifestText.includes(rule)) {
      warnings.push(`RULE_NOT_DECLARED:${rule}`);
    }
  });

  return warnings;
}

function buildRepairSuggestions(errors: string[], warnings: string[]) {
  const suggestions = new Set<string>();
  const issues = [...errors, ...warnings];

  issues.forEach((issue) => {
    if (issue.includes("MISSING_REQUIRED_MODULE")) {
      suggestions.add("add_missing_required_module_to_manifest");
    }

    if (issue.includes("MODULE_WITHOUT_REFERENCE")) {
      suggestions.add("attach_module_ref_or_exports_to_manifest_entry");
    }

    if (issue.includes("MISSING_DEPENDENCY")) {
      suggestions.add("fix_manifest_dependencies_or_add_dependency_module");
    }

    if (issue.includes("RENDERER_THINKING_VIOLATION")) {
      suggestions.add("move_inference_logic_from_renderer_to_engine_or_orchestrator");
    }

    if (issue.includes("VERSION_STACK_BROKEN")) {
      suggestions.add("restore_previous_module_version_in_manifest");
    }

    if (issue.includes("BACKGROUND_MODULE_NOT_REGISTERED")) {
      suggestions.add("register_missing_background_module");
    }

    if (issue.includes("SVG_SERIALIZER_MISSING_NODE")) {
      suggestions.add("add_missing_svg_node_serializer");
    }

    if (issue.includes("CONTROLLER_PIPELINE_ORDER")) {
      suggestions.add("restore_official_visual_pipeline_order");
    }

    if (issue.includes("NO_") || issue.includes("ACTIVE_RUNTIME")) {
      suggestions.add("run_module_loader_and_pass_active_runtime");
    }

    if (issue.includes("RULE_NOT_DECLARED")) {
      suggestions.add("declare_architecture_rule_in_module_metadata");
    }
  });

  return [...suggestions];
}

function computeArchitectureScore(errors: string[], warnings: string[]) {
  return Math.max(0, Math.min(100, 100 - errors.length * 9 - warnings.length * 3));
}

export function runArchitectureValidatorV1(
  moduleManifest: MindSliceModuleManifest = { modules: [] },
  activeRuntime?: MindSliceActiveRuntime | null,
  validationSettings: MindSliceArchitectureValidationSettings = {},
): MindSliceArchitectureValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  errors.push(...checkRequiredModules(moduleManifest));

  const contractReport = checkModuleContracts(moduleManifest);
  errors.push(...contractReport.errors);
  warnings.push(...contractReport.warnings);

  const dependencyGraph = buildDependencyGraph(moduleManifest);
  errors.push(...checkDependencyGraph(moduleManifest, dependencyGraph));
  warnings.push(...checkVersionStack(moduleManifest));

  const backgroundReport = checkBackgroundRegistry(activeRuntime);
  errors.push(...backgroundReport.errors);
  warnings.push(...backgroundReport.warnings);

  errors.push(...checkGrammarPipelineContract(moduleManifest));
  const rendererPassivityReport = checkRendererPassivity(moduleManifest);
  errors.push(...rendererPassivityReport.errors);
  warnings.push(...rendererPassivityReport.warnings);

  const serializerReport = checkSvgSerializerSupport(moduleManifest);
  errors.push(...serializerReport.errors);
  warnings.push(...serializerReport.warnings);

  errors.push(...checkControllerPipeline(moduleManifest));
  warnings.push(...checkRequiredRules(moduleManifest));

  const smokeReport = checkRuntimeSmokeTest(activeRuntime, validationSettings);
  errors.push(...smokeReport.errors);
  warnings.push(...smokeReport.warnings);

  const score = computeArchitectureScore(errors, warnings);

  return {
    status: errors.length === 0 ? "ok" : "fail",
    score,
    errors,
    warnings,
    repair_suggestions: buildRepairSuggestions(errors, warnings),
    dependency_graph: dependencyGraph,
  };
}

export const RUN = runArchitectureValidatorV1;
