"use client";

import { useEffect, useMemo, useState } from "react";
import type { ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type { ExecutionEngineResult } from "@/lib/mindslice/concept-execution-engine-system";
import type { VisualComposerForm } from "@/lib/mindslice/concept-visual-composer-system";
import type { BackgroundLayerKind } from "@/lib/mindslice/concept-background-layer-orchestrator-system";
import { runVisualPipelineControllerV2 } from "@/lib/mindslice/concept-visual-pipeline-controller-system";
import { runVisualPipelineControllerVNext } from "@/lib/mindslice/concept-visual-pipeline-controller-vnext-system";
import { runRuntimeBootControllerV1 } from "@/lib/mindslice/concept-runtime-boot-controller-system";
import { runSafeSvgMountV1 } from "@/lib/mindslice/concept-safe-svg-mount-system";
import { runVisualErrorBoundaryContractV1 } from "@/lib/mindslice/concept-visual-error-boundary-contract-system";
import { runTextLayoutEngineV1 } from "@/lib/mindslice/concept-text-layout-engine-system";
import {
  runPatternSvgRendererV1,
  type PatternSvgClipPathNode,
  type PatternSvgNode,
} from "@/lib/mindslice/concept-pattern-svg-renderer-system";
import {
  runTriangulationSvgRendererV1,
  type TriangulationSvgNode,
} from "@/lib/mindslice/concept-triangulation-svg-renderer-system";
import {
  runFlatAbstractPatternSvgRendererV1,
  type FlatAbstractSvgClipPathNode,
  type FlatAbstractSvgNode,
} from "@/lib/mindslice/concept-flat-abstract-pattern-svg-renderer-system";
import {
  runIsometricPatternSvgRendererV1,
  type IsometricSvgNode,
} from "@/lib/mindslice/concept-isometric-pattern-svg-renderer-system";
import {
  runZigZagPatternSvgRendererV1,
  type ZigZagSvgNode,
} from "@/lib/mindslice/concept-zigzag-pattern-svg-renderer-system";
import {
  runRetroGridPatternSvgRendererV1,
  type RetroGridSvgNode,
} from "@/lib/mindslice/concept-retro-grid-pattern-svg-renderer-system";
import type {
  ThoughtSceneEngineState,
} from "@/lib/mindslice/thought-scene-engine";
import type {
  ClockDisplayState,
  ConceptCandidate,
  EngineDebuggerReport,
  IdeaSetMainLoopResult,
  ProcessIdeaResult,
  ConceptValidationResult,
  EngineProfile,
  InfluenceMode,
  LiveInterference,
  SystemModificationState,
  ThoughtState,
  UserProfile,
} from "@/lib/mindslice/mindslice-types";
import styles from "../page.module.css";

function buildSvgFallbackParsedSlice(current: ThoughtState): ParsedSliceObject {
  return {
    identity: {
      type: "author",
      index_name: current.direction,
      pseudonym: null,
      priority: "primary",
    },
    content: {
      type: "idea_seed",
      text: current.thought,
    },
    process: {
      pipeline: ["Framework", "Design", "Memory", "Business"],
    },
    metadata: {
      language: "ro",
      intensity: current.visual.density,
      tags: [...new Set([...current.keywords, ...current.palette, ...current.materials])].slice(0, 8),
    },
    control: {
      allow_contamination: true,
      allow_transformation: true,
      visibility: "system",
    },
  };
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");

  if (normalized.length !== 6) {
    return hex;
  }

  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) {
    return hex;
  }

  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function compactSvgText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function renderSvgEngineShape(
  form: VisualComposerForm,
  index: number,
  inkColor: string,
  accentColor: string,
  backgroundColor: string,
) {
  const half = form.size / 2;
  const strokeWidth = Math.max(1.3, form.stroke_width + (form.weight === "high" ? 0.9 : 0.2));
  const strokeColor =
    form.weight === "high" || form.type === "central_shape" || form.type === "intersection"
      ? accentColor
      : inkColor;
  const fillColor =
    form.type === "central_shape" || form.type === "circle"
      ? hexToRgba(accentColor, 0.12)
      : form.type === "square"
        ? hexToRgba(backgroundColor, 0.18)
        : form.type === "close_proximity"
          ? hexToRgba(accentColor, 0.08)
          : "none";

  switch (form.type) {
    case "square":
      return (
        <rect
          key={`svg-engine-form-${form.concept}-${index}`}
          className={styles.svgEngineForm}
          x={form.x - half}
          y={form.y - half}
          width={form.size}
          height={form.size}
          rx={form.size * 0.06}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill={fillColor}
          opacity={form.opacity}
          vectorEffect="non-scaling-stroke"
        />
      );
    case "straight_line":
      return (
        <line
          key={`svg-engine-form-${form.concept}-${index}`}
          className={styles.svgEngineForm}
          x1={form.x - half}
          y1={form.y}
          x2={form.x + half}
          y2={form.y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={form.opacity}
          vectorEffect="non-scaling-stroke"
        />
      );
    case "vector_line":
      return (
        <g key={`svg-engine-form-${form.concept}-${index}`} className={styles.svgEngineForm} opacity={form.opacity}>
          <line
            x1={form.x - half}
            y1={form.y}
            x2={form.x + half * 0.78}
            y2={form.y}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${form.x + half * 0.78} ${form.y} L ${form.x + half * 0.52} ${form.y - form.size * 0.12} M ${form.x + half * 0.78} ${form.y} L ${form.x + half * 0.52} ${form.y + form.size * 0.12}`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "offset_position":
      return (
        <g key={`svg-engine-form-${form.concept}-${index}`} className={styles.svgEngineForm} opacity={form.opacity}>
          <circle
            cx={form.x}
            cy={form.y}
            r={form.size * 0.18}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={hexToRgba(accentColor, 0.1)}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={form.x + form.size * 0.22}
            cy={form.y - form.size * 0.16}
            r={form.size * 0.1}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "close_proximity":
      return (
        <g key={`svg-engine-form-${form.concept}-${index}`} className={styles.svgEngineForm} opacity={form.opacity}>
          <circle
            cx={form.x - form.size * 0.12}
            cy={form.y}
            r={form.size * 0.16}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={hexToRgba(accentColor, 0.08)}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={form.x + form.size * 0.12}
            cy={form.y}
            r={form.size * 0.16}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill={hexToRgba(backgroundColor, 0.12)}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "intersection":
      return (
        <g key={`svg-engine-form-${form.concept}-${index}`} className={styles.svgEngineForm} opacity={form.opacity}>
          <line
            x1={form.x - half * 0.75}
            y1={form.y - half * 0.75}
            x2={form.x + half * 0.75}
            y2={form.y + half * 0.75}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={form.x + half * 0.75}
            y1={form.y - half * 0.75}
            x2={form.x - half * 0.75}
            y2={form.y + half * 0.75}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    case "incomplete_shape": {
      const radius = form.size * 0.24;
      const circumference = 2 * Math.PI * radius;
      return (
        <circle
          key={`svg-engine-form-${form.concept}-${index}`}
          className={styles.svgEngineForm}
          cx={form.x}
          cy={form.y}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.74} ${circumference * 0.26}`}
          strokeLinecap="round"
          fill="none"
          opacity={form.opacity}
          vectorEffect="non-scaling-stroke"
        />
      );
    }
    case "central_shape":
    case "circle":
    default:
      return (
        <circle
          key={`svg-engine-form-${form.concept}-${index}`}
          className={styles.svgEngineForm}
          cx={form.x}
          cy={form.y}
          r={form.size * 0.24}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill={fillColor}
          opacity={form.opacity}
          vectorEffect="non-scaling-stroke"
        />
      );
  }
}

function renderPatternSvgNode(node: PatternSvgNode, key: string): React.ReactNode {
  if (node.type === "g") {
    return (
      <g key={key} id={node.id} clipPath={node.clip_path}>
        {node.children.map((child, index) => renderPatternSvgNode(child, `${key}-${index}`))}
      </g>
    );
  }

  if (node.type === "circle") {
    return (
      <circle
        key={key}
        cx={node.cx}
        cy={node.cy}
        r={node.r}
        fill={node.fill}
        opacity={node.opacity}
      />
    );
  }

  if (node.type === "line") {
    return (
      <line
        key={key}
        x1={node.x1}
        y1={node.y1}
        x2={node.x2}
        y2={node.y2}
        stroke={node.stroke}
        strokeWidth={node.stroke_width}
        strokeLinecap={node.stroke_linecap}
        opacity={node.opacity}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <polyline
      key={key}
      points={node.points}
      stroke={node.stroke}
      strokeWidth={node.stroke_width}
      strokeLinecap={node.stroke_linecap}
      strokeLinejoin={node.stroke_linejoin}
      fill={node.fill}
      opacity={node.opacity}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function renderPatternSvgDef(def: PatternSvgClipPathNode) {
  return (
    <clipPath key={def.id} id={def.id}>
      <circle cx={def.child.cx} cy={def.child.cy} r={def.child.r} />
    </clipPath>
  );
}

function renderTriangulationSvgNode(node: TriangulationSvgNode, key: string): React.ReactNode {
  if (node.type === "g") {
    return (
      <g key={key} id={node.id}>
        {node.children.map((child, index) =>
          renderTriangulationSvgNode(child, `${key}-${index}`),
        )}
      </g>
    );
  }

  if (node.type === "polygon") {
    return (
      <polygon
        key={key}
        points={node.points}
        fill={node.fill}
        opacity={node.opacity}
        stroke={node.stroke}
      />
    );
  }

  if (node.type === "line") {
    return (
      <line
        key={key}
        x1={node.x1}
        y1={node.y1}
        x2={node.x2}
        y2={node.y2}
        stroke={node.stroke}
        strokeWidth={node.stroke_width}
        opacity={node.opacity}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <circle
      key={key}
      cx={node.cx}
      cy={node.cy}
      r={node.r}
      fill={node.fill}
      opacity={node.opacity}
    />
  );
}

function renderFlatAbstractSvgNode(node: FlatAbstractSvgNode, key: string): React.ReactNode {
  if (node.type === "g") {
    return (
      <g key={key} id={node.id} clipPath={node.clip_path}>
        {node.children.map((child, index) => renderFlatAbstractSvgNode(child, `${key}-${index}`))}
      </g>
    );
  }

  if (node.type === "rect") {
    return (
      <rect
        key={key}
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        fill={node.fill}
      />
    );
  }

  if (node.type === "path") {
    return (
      <path
        key={key}
        d={node.d}
        fill={node.fill}
        stroke={node.stroke ?? undefined}
        strokeWidth={node.stroke_width ?? undefined}
        strokeDasharray={node.dasharray ?? undefined}
        opacity={node.opacity}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  if (node.type === "circle") {
    return (
      <circle
        key={key}
        cx={node.cx}
        cy={node.cy}
        r={node.r}
        fill={node.fill}
        opacity={node.opacity}
      />
    );
  }

  if (node.type === "circle_outline") {
    return (
      <circle
        key={key}
        cx={node.cx}
        cy={node.cy}
        r={node.r}
        fill={node.fill}
        stroke={node.stroke}
        strokeWidth={node.stroke_width}
        opacity={node.opacity}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  if (node.type === "line") {
    return (
      <line
        key={key}
        x1={node.x1}
        y1={node.y1}
        x2={node.x2}
        y2={node.y2}
        stroke={node.stroke}
        strokeWidth={node.stroke_width}
        strokeLinecap={node.stroke_linecap}
        strokeDasharray={node.dasharray ?? undefined}
        opacity={node.opacity}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  if (node.type === "polyline") {
    return (
      <polyline
        key={key}
        points={node.points}
        stroke={node.stroke}
        strokeWidth={node.stroke_width}
        strokeLinecap={node.stroke_linecap}
        strokeLinejoin={node.stroke_linejoin}
        fill={node.fill}
        opacity={node.opacity}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <polygon
      key={key}
      points={node.points}
      fill={node.fill}
      stroke={node.stroke}
      opacity={node.opacity}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function renderFlatAbstractSvgDef(def: FlatAbstractSvgClipPathNode) {
  return (
    <clipPath key={def.id} id={def.id}>
      <circle cx={def.child.cx} cy={def.child.cy} r={def.child.r} />
    </clipPath>
  );
}

function renderIsometricSvgNode(node: IsometricSvgNode, key: string): React.ReactNode {
  if (node.type === "g") {
    return (
      <g key={key} id={node.id}>
        {node.children.map((child, index) => renderIsometricSvgNode(child, `${key}-${index}`))}
      </g>
    );
  }

  if (node.type === "rect") {
    return (
      <rect
        key={key}
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        fill={node.fill}
      />
    );
  }

  return (
    <polygon
      key={key}
      points={node.points}
      fill={node.fill}
      stroke={node.stroke}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function renderZigZagSvgNode(node: ZigZagSvgNode, key: string): React.ReactNode {
  if (node.type === "g") {
    return (
      <g key={key} id={node.id} transform={node.transform}>
        {node.children.map((child, index) => renderZigZagSvgNode(child, `${key}-${index}`))}
      </g>
    );
  }

  if (node.type === "rect") {
    return (
      <rect
        key={key}
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        fill={node.fill}
      />
    );
  }

  return (
    <line
      key={key}
      x1={node.x1}
      y1={node.y1}
      x2={node.x2}
      y2={node.y2}
      stroke={node.stroke}
      strokeWidth={node.stroke_width}
      strokeLinecap={node.stroke_linecap}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function renderRetroGridSvgNode(node: RetroGridSvgNode, key: string): React.ReactNode {
  if (node.type === "g") {
    return (
      <g key={key} id={node.id} transform={node.transform}>
        {node.children.map((child, index) => renderRetroGridSvgNode(child, `${key}-${index}`))}
      </g>
    );
  }

  if (node.type === "rect") {
    return (
      <rect
        key={key}
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        fill={node.fill}
      />
    );
  }

  if (node.type === "polygon") {
    return <polygon key={key} points={node.points} fill={node.fill} />;
  }

  return <path key={key} d={node.d} fill={node.fill} />;
}

type LiveSceneViewProps = {
  isActive: boolean;
  engineMode: string;
  engineProfile: EngineProfile | null;
  current: ThoughtState;
  currentIndex: number;
  libraryLength: number;
  clockDisplay: ClockDisplayState | null;
  clockMemoryCount: number;
  latestClockTime: string | null;
  liveInfluenceMode: InfluenceMode | null;
  thoughtScene: ThoughtSceneEngineState;
  leadingLineStyles: ThoughtSceneEngineState["sceneGraph"]["leadingLines"];
  focalHaloStyles: ThoughtSceneEngineState["sceneGraph"]["focalHalos"];
  negativeSpaceStyles: ThoughtSceneEngineState["sceneGraph"]["negativeSpace"];
  thoughtCenterAnchor: React.CSSProperties;
  thoughtCenterFragment: string;
  interference: LiveInterference | null;
  profile: Pick<UserProfile, "user_id"> | null;
  followedUserIds: string[];
  followActionUserId: string | null;
  handleFollowToggle: (targetUserId: string, shouldFollow: boolean) => void;
  formatPublicAuthor: (value: string | null | undefined) => string;
  isThoughtOverlayVisible: boolean;
  thoughtAnimationKey: number;
  thoughtLines: string[];
  liveAiResponseLines: string[];
  systemState: SystemModificationState;
  engineDebuggerReport: EngineDebuggerReport;
  executionEngineStatus: "idle" | "loading" | "ready" | "error";
  executionEngineResult: ExecutionEngineResult | null;
  debugRunCount: number;
  comparativeDelta: {
    resolvedDelta: number;
    pooledDelta: number;
    canonicalDelta: number;
  } | null;
  ideaSetMainLoop: IdeaSetMainLoopResult;
  conceptProcess: ProcessIdeaResult;
  conceptCandidate: ConceptCandidate;
  conceptValidation: ConceptValidationResult;
  conceptPoolCount: number;
  latestPoolConceptTitle: string | null;
  colorPoolCount: number;
  latestColorPoolTitle: string | null;
  scenarioPoolCount: number;
  latestScenarioPoolTitle: string | null;
  artCompositionPoolCount: number;
  latestArtCompositionPoolTitle: string | null;
  structurePoolCount: number;
  latestStructurePoolTitle: string | null;
  shapePoolCount: number;
  latestShapePoolTitle: string | null;
  canonCount: number;
  primaryCanonTitle: string | null;
  colorCanonCount: number;
  primaryColorCanonTitle: string | null;
  narrativeCanonCount: number;
  primaryNarrativeCanonTitle: string | null;
  structureCanonCount: number;
  primaryStructureCanonTitle: string | null;
  shapeCanonCount: number;
  primaryShapeCanonTitle: string | null;
  shapeGrammarCanonCount: number;
  primaryShapeGrammarCanonTitle: string | null;
  metaSystemCanonCount: number;
  primaryMetaSystemCanonTitle: string | null;
  artCanonCount: number;
  primaryArtCanonTitle: string | null;
  conceptMemoryCount: number;
  resolvedConceptCount: number;
  latestConceptTitle: string | null;
  colorMemoryCount: number;
  resolvedColorCount: number;
  latestColorTitle: string | null;
  storyMemoryCount: number;
  resolvedScenarioCount: number;
  latestScenarioTitle: string | null;
  artMemoryCount: number;
  resolvedArtCount: number;
  latestArtTitle: string | null;
  structureMemoryCount: number;
  resolvedStructureCount: number;
  latestStructureTitle: string | null;
  shapeMemoryCount: number;
  resolvedShapeCount: number;
  latestShapeTitle: string | null;
  shapeGrammarMemoryCount: number;
  resolvedShapeGrammarCount: number;
  latestShapeGrammarTitle: string | null;
  metaSystemMemoryCount: number;
  resolvedMetaSystemCount: number;
  latestMetaSystemTitle: string | null;
  promotionStatus: string;
  canPromoteToCanonical: boolean;
  promotionNotes: string[];
};

type VisualDebugMode =
  | "full"
  | "deviation"
  | "structure_only"
  | "scenario_only"
  | "color_only"
  | "composition_only";

type VisualPresetMode =
  | "CONTROL_CALM"
  | "DEVIATION_OF_THOUGHT"
  | "FRAGMENTED_MEANING"
  | "CONSTELLATION_MEMORY"
  | "ATTENTION_FOCUS";

type VisualBackgroundMode = "auto" | BackgroundLayerKind;

export function LiveSceneView(props: LiveSceneViewProps) {
  const {
    isActive,
    engineMode,
    engineProfile,
    current,
    currentIndex,
    libraryLength,
    clockDisplay,
    clockMemoryCount,
    latestClockTime,
    liveInfluenceMode,
    thoughtScene,
    leadingLineStyles,
    focalHaloStyles,
    negativeSpaceStyles,
    thoughtCenterAnchor,
    thoughtCenterFragment,
    interference,
    profile,
    followedUserIds,
    followActionUserId,
    handleFollowToggle,
    formatPublicAuthor,
    isThoughtOverlayVisible,
    thoughtAnimationKey,
    thoughtLines,
    liveAiResponseLines,
    systemState,
    engineDebuggerReport,
    executionEngineStatus,
    executionEngineResult,
    debugRunCount,
    comparativeDelta,
    ideaSetMainLoop,
    conceptProcess,
    conceptCandidate,
    conceptValidation,
    conceptPoolCount,
    latestPoolConceptTitle,
    colorPoolCount,
    latestColorPoolTitle,
    scenarioPoolCount,
    latestScenarioPoolTitle,
    artCompositionPoolCount,
    latestArtCompositionPoolTitle,
    structurePoolCount,
    latestStructurePoolTitle,
    shapePoolCount,
    latestShapePoolTitle,
    canonCount,
    primaryCanonTitle,
    colorCanonCount,
    primaryColorCanonTitle,
    narrativeCanonCount,
    primaryNarrativeCanonTitle,
    structureCanonCount,
    primaryStructureCanonTitle,
    shapeCanonCount,
    primaryShapeCanonTitle,
    shapeGrammarCanonCount,
    primaryShapeGrammarCanonTitle,
    metaSystemCanonCount,
    primaryMetaSystemCanonTitle,
    artCanonCount,
    primaryArtCanonTitle,
    conceptMemoryCount,
    resolvedConceptCount,
    latestConceptTitle,
    colorMemoryCount,
    resolvedColorCount,
    latestColorTitle,
    storyMemoryCount,
    resolvedScenarioCount,
    latestScenarioTitle,
    artMemoryCount,
    resolvedArtCount,
    latestArtTitle,
    structureMemoryCount,
    resolvedStructureCount,
    latestStructureTitle,
    shapeMemoryCount,
    resolvedShapeCount,
    latestShapeTitle,
    shapeGrammarMemoryCount,
    resolvedShapeGrammarCount,
    latestShapeGrammarTitle,
    metaSystemMemoryCount,
    resolvedMetaSystemCount,
    latestMetaSystemTitle,
    promotionStatus,
    canPromoteToCanonical,
    promotionNotes,
  } = props;
  const executionEngineSuccess =
    executionEngineResult && !("status" in executionEngineResult) ? executionEngineResult : null;
  const executionEngineFailure =
    executionEngineResult && "status" in executionEngineResult ? executionEngineResult.message : null;
  const [activeTracePhase, setActiveTracePhase] = useState<
    "all" | "interpret" | "contamination" | "validation" | "promotion" | "pool" | "memory" | "canon" | "system"
  >("all");
  const [activeTraceLevel, setActiveTraceLevel] = useState<"all" | "info" | "warning" | "success">(
    "all",
  );
  const [activeVisualDebugMode, setActiveVisualDebugMode] = useState<VisualDebugMode>("full");
  const [activeVisualPreset, setActiveVisualPreset] = useState<VisualPresetMode>("CONTROL_CALM");
  const [activeBackgroundMode, setActiveBackgroundMode] = useState<VisualBackgroundMode>("auto");
  const runtimeBootResult = useMemo(() => {
    return runRuntimeBootControllerV1(
      {},
      {
        validation_settings: {
          require_active_runtime: true,
          smoke_test_runtime: false,
        },
      },
    );
  }, []);
  const runtimeBootStatus = runtimeBootResult.runtime_status;
  const svgRawSlice = useMemo(() => {
    const parsedSlice = buildSvgFallbackParsedSlice(current);
    return `<<<MINDSLICE_SLICE_START>>>
[IDENTITY]
TYPE: ${parsedSlice.identity.type ?? "author"}
INDEX_NAME: ${parsedSlice.identity.index_name ?? ""}
PSEUDONYM: ${parsedSlice.identity.pseudonym ?? ""}
PRIORITY: ${parsedSlice.identity.priority ?? "primary"}
[/IDENTITY]
[CONTENT]
TYPE: ${parsedSlice.content.type ?? "idea_seed"}
TEXT:
${parsedSlice.content.text}
[/CONTENT]
[PROCESS]
PIPELINE: ${parsedSlice.process.pipeline.join(", ")}
[/PROCESS]
[METADATA]
LANGUAGE: ${parsedSlice.metadata.language ?? "ro"}
INTENSITY: ${parsedSlice.metadata.intensity}
TAGS: ${parsedSlice.metadata.tags.join(", ")}
[/METADATA]
[CONTROL]
ALLOW_CONTAMINATION: ${parsedSlice.control.allow_contamination ? "true" : "false"}
ALLOW_TRANSFORMATION: ${parsedSlice.control.allow_transformation ? "true" : "false"}
VISIBILITY: ${parsedSlice.control.visibility ?? "system"}
[/CONTROL]
<<<MINDSLICE_SLICE_END>>>`;
  }, [current]);
  const svgVNextControllerResult = useMemo(() => {
    try {
      return runVisualPipelineControllerVNext(
        svgRawSlice,
        {
          width: 1080,
          height: 1080,
          margin: 120,
        },
        {
          preset_name: activeVisualPreset,
          ...(activeBackgroundMode === "auto" ? {} : { background_kind: activeBackgroundMode }),
          visual_debug_mode: activeVisualDebugMode,
          state_palette: {
            background: current.visual.background,
            ink: current.visual.ink,
            accent: current.visual.accent,
          },
          allow_repair: true,
        },
        {
          show_center_text: true,
          show_peripheral_text: true,
          show_text_constellation: activeVisualDebugMode === "full" || activeVisualDebugMode === "deviation",
          show_temporal_particles: activeVisualDebugMode === "full",
          show_grammar_particles: true,
          show_stray_letters: activeVisualDebugMode === "full",
          source_bridge: {
            thought_state: current,
            thought_scene: thoughtScene,
            shape_grammar: engineDebuggerReport.shapeGrammar,
            clock_display: clockDisplay,
          },
          source_parity_settings: {
            use_template_sources: true,
            preserve_vnext_sources: true,
            template_source_priority: "high",
          },
        },
      );
    } catch (error) {
      return {
        status: "fail" as const,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }, [
    activeBackgroundMode,
    activeVisualDebugMode,
    activeVisualPreset,
    clockDisplay,
    current,
    engineDebuggerReport.shapeGrammar,
    svgRawSlice,
    thoughtScene,
  ]);
  const svgControllerResult = useMemo(() => {
    return runVisualPipelineControllerV2(
      svgRawSlice,
      {
        width: 1080,
        height: 1080,
        margin: 120,
        background: "warm_white",
        ...(activeBackgroundMode === "auto" ? {} : { background_layer_kind: activeBackgroundMode }),
      },
      {
        mode:
          activeVisualDebugMode === "full"
            ? "final"
            : activeVisualDebugMode === "deviation"
              ? "deviation"
              : "debug",
        preset_name: activeVisualPreset,
      },
    );
  }, [activeBackgroundMode, activeVisualDebugMode, activeVisualPreset, svgRawSlice]);
  const svgVNextSuccess =
    "status" in svgVNextControllerResult ? null : svgVNextControllerResult;
  const svgVNextFailure =
    "status" in svgVNextControllerResult ? svgVNextControllerResult.message : null;
  const svgVNextPipeline = svgVNextSuccess?.pipeline_result ?? null;
  const safeSvgMountResult = useMemo(() => {
    if (!svgVNextSuccess) {
      return null;
    }

    return runSafeSvgMountV1(svgVNextSuccess.final_svg_string, "string");
  }, [svgVNextSuccess]);
  const visualErrorBoundaryResult = useMemo(() => {
    if (safeSvgMountResult?.status === "fail") {
      return runVisualErrorBoundaryContractV1(
        {
          message: `SVG mount failed: ${safeSvgMountResult.message}`,
          type: "SVG_MOUNT_FAILED",
        },
        runtimeBootResult.active_runtime?.runtime_context ?? runtimeBootResult.runtime_status,
        { width: 1080, height: 1080, background: current.visual.background, ink: current.visual.ink },
      );
    }

    if (svgVNextFailure) {
      return runVisualErrorBoundaryContractV1(
        {
          message: svgVNextFailure,
          type: "VISUAL_PIPELINE_FAILED",
        },
        runtimeBootResult.active_runtime?.runtime_context ?? runtimeBootResult.runtime_status,
        { width: 1080, height: 1080, background: current.visual.background, ink: current.visual.ink },
      );
    }

    return null;
  }, [
    current.visual.background,
    current.visual.ink,
    runtimeBootResult.active_runtime?.runtime_context,
    runtimeBootResult.runtime_status,
    safeSvgMountResult,
    svgVNextFailure,
  ]);
  const safeSvgString =
    safeSvgMountResult?.status === "ok" && safeSvgMountResult.render_mode === "string"
      ? safeSvgMountResult.sanitized_svg_string
      : visualErrorBoundaryResult
        ? visualErrorBoundaryResult.fallback_svg_string
      : null;
  const visualDiagnosticMessage =
    visualErrorBoundaryResult?.developer_diagnostics.error_message ??
    (safeSvgMountResult?.status === "fail" ? safeSvgMountResult.message : svgVNextFailure ?? "unknown");
  const svgControllerSuccess =
    "status" in svgControllerResult ? null : svgControllerResult;
  const svgConceptualPreset = svgControllerSuccess?.conceptual_preset ?? null;
  const svgStructureOutput = svgControllerSuccess?.visual_model.structure.structure_output ?? null;
  const svgScenarioOutput = svgControllerSuccess?.visual_model.scenario.scenario_output ?? null;
  const svgColorOutput = svgControllerSuccess?.visual_model.color.color_output ?? null;
  const svgCompositionOutput = svgControllerSuccess?.visual_model.composition.composition_output ?? null;
  const svgScene =
    svgControllerSuccess?.render.mode === "final" ? svgControllerSuccess.render.svg : null;
  const activeVisualDebugView =
    svgControllerSuccess?.render.mode === "debug" &&
    activeVisualDebugMode !== "deviation" &&
    activeVisualDebugMode !== "full"
      ? svgControllerSuccess.render.views[activeVisualDebugMode]
      : null;
  const svgCanvas = svgControllerSuccess?.visual_model.structure.canvas ?? null;
  const [isCompositionRulesOpen, setIsCompositionRulesOpen] = useState(false);
  const [isAiResponseOpen, setIsAiResponseOpen] = useState(false);
  const [isThoughtOverlayClosing, setIsThoughtOverlayClosing] = useState(false);
  const [isThoughtOverlayDismissed, setIsThoughtOverlayDismissed] = useState(false);
  const thoughtOverlayText = useMemo(
    () => thoughtLines.join(" ").replace(/\s+/g, " ").trim(),
    [thoughtLines],
  );

  useEffect(() => {
    setIsThoughtOverlayClosing(false);
    setIsThoughtOverlayDismissed(false);
  }, [currentIndex, current.direction, current.thought]);

  useEffect(() => {
    if (!isThoughtOverlayVisible) {
      setIsThoughtOverlayClosing(false);
      setIsThoughtOverlayDismissed(false);
    }
  }, [isThoughtOverlayVisible]);

  const handleThoughtOverlayDismiss = () => {
    setIsThoughtOverlayClosing(true);

    window.setTimeout(() => {
      setIsThoughtOverlayDismissed(true);
    }, 320);
  };
  const filteredActiveTrace = useMemo(
    () =>
      engineDebuggerReport.activeTrace.filter((event) => {
        if (activeTracePhase !== "all" && event.phase !== activeTracePhase) {
          return false;
        }

        if (activeTraceLevel !== "all" && event.level !== activeTraceLevel) {
          return false;
        }

        return true;
      }),
    [activeTraceLevel, activeTracePhase, engineDebuggerReport.activeTrace],
  );
  const clockGuideKinetics = useMemo(() => {
    if (!clockDisplay) {
      return {
        leadingLines: leadingLineStyles,
        focalHalos: focalHaloStyles,
      };
    }

    const isMemoryTrail = clockDisplay.transition === "memory_trail";
    const isLiquidStep = clockDisplay.transition === "liquid_step";
    const isSecondsPulse = clockDisplay.attentionAnchor === "seconds_pulse";
    const isExtendedAnchor = clockDisplay.attentionAnchor === "hours_minutes_seconds";
    const haloScalePrimary = isExtendedAnchor ? 1.14 : isSecondsPulse ? 1.08 : 1.02;
    const haloScaleSecondary = isMemoryTrail ? 1.18 : isLiquidStep ? 1.1 : 1.04;
    const lineRotationOne = isLiquidStep ? "rotate(6deg)" : isMemoryTrail ? "rotate(-4deg)" : "none";
    const lineRotationTwo = isSecondsPulse ? "rotate(-5deg)" : isExtendedAnchor ? "rotate(3deg)" : "none";
    const lineRotationThree = isMemoryTrail ? "rotate(9deg)" : isLiquidStep ? "rotate(-7deg)" : "none";

    return {
      leadingLines: [
        {
          ...leadingLineStyles[0],
          transform: [leadingLineStyles[0]?.transform, lineRotationOne].filter(Boolean).join(" ").trim(),
        },
        {
          ...leadingLineStyles[1],
          transform: [leadingLineStyles[1]?.transform, lineRotationTwo].filter(Boolean).join(" ").trim(),
        },
        {
          ...leadingLineStyles[2],
          transform: [leadingLineStyles[2]?.transform, lineRotationThree].filter(Boolean).join(" ").trim(),
        },
      ] as ThoughtSceneEngineState["sceneGraph"]["leadingLines"],
      focalHalos: {
        primary: {
          ...focalHaloStyles.primary,
          transform: `${focalHaloStyles.primary?.transform ?? ""} scale(${haloScalePrimary})`.trim(),
        },
        secondary: {
          ...focalHaloStyles.secondary,
          transform: `${focalHaloStyles.secondary?.transform ?? ""} scale(${haloScaleSecondary})`.trim(),
        },
      } as ThoughtSceneEngineState["sceneGraph"]["focalHalos"],
    };
  }, [clockDisplay, focalHaloStyles, leadingLineStyles]);
  const clockNegativeSpaceKinetics = useMemo(() => {
    const shapeGrammar = engineDebuggerReport.shapeGrammar;
    const grammarPrimaryTransform = [
      shapeGrammar.rulesApplied.includes("add") ? "scale(1.08) translate3d(-6px, -4px, 0)" : "",
      shapeGrammar.rulesApplied.includes("subtract") ? "scale(0.94) translate3d(8px, 6px, 0)" : "",
      shapeGrammar.ruleset.includes("scale") ? "scale(1.06)" : "",
      shapeGrammar.ruleset.includes("mirror") ? "scaleX(-1)" : "",
      shapeGrammar.ruleset.includes("merge") ? "scale(1.03) translate3d(6px, 0, 0)" : "",
      shapeGrammar.ruleset.includes("split") ? "scale(0.98) translate3d(-8px, 0, 0)" : "",
      shapeGrammar.ruleset.includes("distort") ? "skew(-4deg, 2deg)" : "",
      shapeGrammar.ruleset.includes("rotate") ? "rotate(-4deg)" : "",
      shapeGrammar.ruleset.includes("fragment") ? "skew(-3deg, 2deg)" : "",
      shapeGrammar.scores.coherence >= 0.72 ? "scale(1.05)" : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    const grammarSecondaryTransform = [
      shapeGrammar.rulesApplied.includes("add") ? "scale(1.06) translate3d(8px, 4px, 0)" : "",
      shapeGrammar.rulesApplied.includes("subtract") ? "scale(0.9) translate3d(-10px, -6px, 0)" : "",
      shapeGrammar.ruleset.includes("scale") ? "scale(1.05)" : "",
      shapeGrammar.ruleset.includes("repeat") ? "scale(1.07)" : "",
      shapeGrammar.ruleset.includes("merge") ? "scale(1.03) translate3d(-6px, 0, 0)" : "",
      shapeGrammar.ruleset.includes("split") ? "scale(0.98) translate3d(8px, 0, 0)" : "",
      shapeGrammar.ruleset.includes("distort") ? "skew(4deg, -2deg)" : "",
      shapeGrammar.ruleset.includes("rotate") ? "rotate(5deg)" : "",
      shapeGrammar.ruleset.includes("translate") ? "translateX(10px)" : "",
      shapeGrammar.ruleset.includes("fragment") ? "rotate(6deg) scale(0.96)" : "",
      shapeGrammar.scores.expressivePower >= 0.72 ? "skew(2deg, -2deg)" : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!clockDisplay) {
      return {
        primary: {
          ...negativeSpaceStyles.primary,
          transform: [negativeSpaceStyles.primary?.transform, grammarPrimaryTransform]
            .filter(Boolean)
            .join(" ")
            .trim(),
        },
        secondary: {
          ...negativeSpaceStyles.secondary,
          transform: [negativeSpaceStyles.secondary?.transform, grammarSecondaryTransform]
            .filter(Boolean)
            .join(" ")
            .trim(),
        },
      } as ThoughtSceneEngineState["sceneGraph"]["negativeSpace"];
    }

    const isMemoryTrail = clockDisplay.transition === "memory_trail";
    const isLiquidStep = clockDisplay.transition === "liquid_step";
    const isExtendedAnchor = clockDisplay.attentionAnchor === "hours_minutes_seconds";
    const isSecondsPulse = clockDisplay.attentionAnchor === "seconds_pulse";

    return {
      primary: {
        ...negativeSpaceStyles.primary,
        transform: [
          negativeSpaceStyles.primary?.transform,
          isMemoryTrail ? "rotate(-5deg) scale(1.04)" : isLiquidStep ? "rotate(3deg) scale(1.02)" : isExtendedAnchor ? "scale(1.06)" : "scale(1.01)",
          grammarPrimaryTransform,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),
      },
      secondary: {
        ...negativeSpaceStyles.secondary,
        transform: [
          negativeSpaceStyles.secondary?.transform,
          isSecondsPulse ? "rotate(6deg) scale(1.05)" : isMemoryTrail ? "rotate(4deg) scale(1.03)" : isLiquidStep ? "rotate(-3deg) scale(1.02)" : "scale(1.01)",
          grammarSecondaryTransform,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),
      },
    } as ThoughtSceneEngineState["sceneGraph"]["negativeSpace"];
  }, [clockDisplay, engineDebuggerReport.shapeGrammar, negativeSpaceStyles]);
  const clockMotionDesign = useMemo(() => {
    if (!clockDisplay) {
      return {
        memoryFieldStyle: {} as React.CSSProperties,
        textConstellationStyle: {} as React.CSSProperties,
      };
    }

    const memoryDuration =
      clockDisplay.transition === "liquid_step"
        ? "6.4s"
        : clockDisplay.transition === "memory_trail"
          ? "10.8s"
          : clockDisplay.attentionAnchor === "seconds_pulse"
            ? "7.2s"
            : "8.6s";
    const keywordDuration =
      clockDisplay.attentionAnchor === "hours_minutes_seconds"
        ? "6.8s"
        : clockDisplay.attentionAnchor === "seconds_pulse"
          ? "5.9s"
          : "7.8s";
    const memoryOpacity =
      clockDisplay.transition === "memory_trail" ? 0.82 : clockDisplay.visualStyle.includes("fractured") ? 0.72 : 0.68;
    const keywordOpacity =
      clockDisplay.attentionAnchor === "seconds_pulse" ? 0.78 : clockDisplay.visualStyle.includes("soft_orbit") ? 0.62 : 0.7;

    return {
      memoryFieldStyle: {
        "--clock-memory-duration": memoryDuration,
        "--clock-memory-tilt": clockDisplay.transition === "memory_trail" ? "1.8deg" : clockDisplay.transition === "liquid_step" ? "-1.2deg" : "0.6deg",
        "--clock-memory-opacity": String(memoryOpacity),
      } as React.CSSProperties,
      textConstellationStyle: {
        "--clock-keyword-duration": keywordDuration,
        "--clock-keyword-shift": clockDisplay.attentionAnchor === "seconds_pulse" ? "8px" : clockDisplay.attentionAnchor === "hours_minutes_seconds" ? "-6px" : "4px",
        "--clock-keyword-opacity": String(keywordOpacity),
      } as React.CSSProperties,
    };
  }, [clockDisplay]);
  const strayLetters = useMemo(() => {
    const visibleTexts = [
      current.thought,
      thoughtCenterFragment,
      ...current.fragments,
      ...current.keywords.slice(0, 6),
    ]
      .join(" ")
      .trim();

    const glyphs = Array.from(visibleTexts).filter((character) => /[\p{L}\p{N}]/u.test(character));

    if (glyphs.length === 0) {
      return [];
    }

    const selectedLetters: string[] = [];
    const step = Math.max(1, Math.floor(glyphs.length / 8));

    for (let index = 0; index < glyphs.length && selectedLetters.length < 8; index += step) {
      const nextLetter = glyphs[index];
      if (nextLetter) {
        selectedLetters.push(nextLetter);
      }
    }

    return selectedLetters;
  }, [current.fragments, current.keywords, current.thought, thoughtCenterFragment]);
  const structureSceneConfig = useMemo(() => {
    const structure = engineDebuggerReport.structure;
    const scenario = engineDebuggerReport.scenario;
    const shape = engineDebuggerReport.shape;
    const shapeGrammar = engineDebuggerReport.shapeGrammar;
    const scenarioTension = scenario.scores.tension;
    const scenarioConflict = scenario.scores.conflict;
    const scenarioProgression = scenario.scores.progression;
    const scenarioAttention = scenario.scores.attention;

    const narrativeHorizontalShift = Math.round((scenarioConflict - 0.5) * 9);
    const narrativeVerticalShift = Math.round((scenarioProgression - 0.5) * 8);
    const tensionGuideOffset = Math.round((scenarioTension - 0.5) * 7);
    const attentionGuideOffset = Math.round((scenarioAttention - 0.5) * 6);
    const shapeHorizontalShift =
      shape.positionTendency === "edge" ? 7 : shape.positionTendency === "drift" ? 5 : shape.positionTendency === "scatter" ? -4 : 0;
    const shapeVerticalShift =
      shape.behavior === "expanding" ? -5 : shape.behavior === "contracting" ? 4 : shape.behavior === "unstable" ? -2 : 0;

    const baseGuideStops = structure.grid === "golden"
      ? { v1: "38.2%", v2: "61.8%", h1: "38.2%", h2: "61.8%" }
      : structure.grid === "custom"
        ? { v1: "29%", v2: "71%", h1: "31%", h2: "69%" }
        : { v1: "33.333%", v2: "66.666%", h1: "33.333%", h2: "66.666%" };

    const adjustPercent = (value: string, offset: number) => {
      const numeric = Number.parseFloat(value);
      if (Number.isNaN(numeric)) {
        return value;
      }

      return `${Math.min(82, Math.max(18, numeric + offset)).toFixed(3)}%`;
    };

    const guideStops = {
      v1: adjustPercent(baseGuideStops.v1, -tensionGuideOffset),
      v2: adjustPercent(baseGuideStops.v2, tensionGuideOffset),
      h1: adjustPercent(baseGuideStops.h1, -attentionGuideOffset),
      h2: adjustPercent(baseGuideStops.h2, attentionGuideOffset),
    };

    const baseSubjectAnchor = (() => {
      switch (structure.subjectPosition) {
        case "upper-right-third":
          return { left: "68%", top: "31%" };
        case "left-third-entry":
          return { left: "32%", top: "40%" };
        case "center-lock":
          return { left: "50%", top: "50%" };
        case "offset-center":
        default:
          return { left: "43%", top: "47%" };
      }
    })();

    const subjectAnchor = {
      left: adjustPercent(baseSubjectAnchor.left, narrativeHorizontalShift + shapeHorizontalShift),
      top: adjustPercent(baseSubjectAnchor.top, -narrativeVerticalShift + shapeVerticalShift),
    };

    const clockPlacement = (() => {
      const attentionAnchor = clockDisplay?.attentionAnchor ?? "hours_minutes";
      const transition = clockDisplay?.transition ?? "stable_tick";
      const visualStyle = clockDisplay?.visualStyle ?? "anchored_field";

      const absolutePlacement = (
        placement: {
          top?: string;
          right?: string;
          bottom?: string;
          left?: string;
          transform?: string;
        },
        label: string,
      ) => ({
        style: {
          top: placement.top ?? "auto",
          right: placement.right ?? "auto",
          bottom: placement.bottom ?? "auto",
          left: placement.left ?? "auto",
          transform: placement.transform ?? "none",
        },
        label,
      });

      if (
        structure.centerState === "centered_intentional" &&
        (attentionAnchor === "hours_minutes_seconds" || structure.symmetryState === "symmetry_precise")
      ) {
        return absolutePlacement(
          {
            top: "18px",
            left: "50%",
            transform: "translateX(-50%)",
          },
          "top-center axis",
        );
      }

      if (transition === "memory_trail") {
        if (structure.subjectPosition === "upper-right-third") {
          return absolutePlacement(
            {
              left: "18px",
              bottom: "18px",
            },
            "memory trail lower-left",
          );
        }

        if (structure.subjectPosition === "left-third-entry") {
          return absolutePlacement(
            {
              right: "18px",
              bottom: "18px",
            },
            "memory trail lower-right",
          );
        }

        return absolutePlacement(
          {
            left: "18px",
            bottom: "18px",
          },
          "memory trail lower-left",
        );
      }

      if (transition === "liquid_step") {
        return absolutePlacement(
          {
            top: "50%",
            right: "18px",
            transform: "translateY(-50%)",
          },
          "right-mid drift",
        );
      }

      if (attentionAnchor === "seconds_pulse") {
        if (structure.subjectPosition === "upper-right-third") {
          return absolutePlacement(
            {
              right: "18px",
              bottom: "18px",
            },
            "lower-right pulse",
          );
        }

        if (structure.subjectPosition === "left-third-entry") {
          return absolutePlacement(
            {
              left: "18px",
              bottom: "18px",
            },
            "lower-left pulse",
          );
        }

        return absolutePlacement(
          {
            right: "18px",
            bottom: "18px",
          },
          "lower-right pulse",
        );
      }

      if (attentionAnchor === "hours_minutes_seconds") {
        if (visualStyle.includes("fractured")) {
          return absolutePlacement(
            {
              left: "18px",
              top: "18px",
            },
            "fractured top-left",
          );
        }

        return absolutePlacement(
          {
            left: "50%",
            bottom: "18px",
            transform: "translateX(-50%)",
          },
          "lower-center cadence",
        );
      }

      if (visualStyle.includes("soft_orbit")) {
        return absolutePlacement(
          {
            left: "18px",
            top: "50%",
            transform: "translateY(-50%)",
          },
          "left-mid orbit",
        );
      }

      if (visualStyle.includes("fractured")) {
        return absolutePlacement(
          {
            left: "18px",
            top: "18px",
          },
          "fractured top-left",
        );
      }

      if (attentionAnchor === "hours_minutes" && visualStyle.includes("anchored")) {
        if (structure.centerState === "soft_center" || structure.subjectPosition === "offset-center") {
          return absolutePlacement(
            {
              left: "18px",
              top: "18px",
            },
            "anchored top-left",
          );
        }

        return absolutePlacement(
          {
            left: "18px",
            bottom: "18px",
          },
          "anchored lower-left",
        );
      }

      if (structure.subjectPosition === "upper-right-third") {
        return absolutePlacement(
          {
            top: "18px",
            left: "16px",
          },
          "counterweight top-left",
        );
      }

      if (structure.subjectPosition === "left-third-entry") {
        return absolutePlacement(
          {
            top: "16px",
            right: "16px",
          },
          "counterweight top-right",
        );
      }

      if (structure.centerState === "decentered_tension") {
        return absolutePlacement(
          {
            right: "18px",
            bottom: "18px",
          },
          "tension lower-right",
        );
      }

      return absolutePlacement(
        {
          left: "18px",
          bottom: "18px",
        },
        "stable lower-left",
      );
    })();

    const rulesAnchor = (() => {
      const topPlacement =
        scenarioProgression >= 0.74 || scenarioAttention >= 0.76;

      if (structure.subjectPosition === "upper-right-third") {
        return topPlacement
          ? { top: "18px", right: "18px", bottom: "auto", left: "auto" }
          : { bottom: "18px", right: "18px", top: "auto", left: "auto" };
      }

      if (structure.subjectPosition === "left-third-entry") {
        return topPlacement
          ? { top: "18px", left: "18px", bottom: "auto", right: "auto" }
          : { bottom: "18px", left: "18px", top: "auto", right: "auto" };
      }

      return topPlacement
        ? { top: "18px", left: "18px", bottom: "auto", right: "auto" }
        : { bottom: "18px", left: "18px", top: "auto", right: "auto" };
    })();

    const guideClass = [
      structure.grid === "golden" ? styles.structureGuidegolden : "",
      structure.grid === "custom" ? styles.structureGuidecustom : "",
      structure.symmetryState === "symmetry_precise" ? styles.structureGuidesymmetric : "",
      structure.centerState === "decentered_tension" ? styles.structureGuidedecentered : "",
      scenarioConflict >= 0.74 ? styles.scenarioGuideescalated : "",
      scenarioAttention >= 0.74 ? styles.scenarioGuidefocused : "",
      scenarioProgression >= 0.72 ? styles.scenarioGuideprogressive : "",
    ].filter(Boolean).join(" ");

    const centerClass = [
      structure.centerState === "centered_intentional" ? styles.structureCenterlocked : "",
      structure.centerState === "decentered_tension" ? styles.structureCenterdecentered : "",
      scenarioProgression >= 0.74 ? styles.scenarioCenterirreversible : "",
      scenarioConflict >= 0.78 ? styles.scenarioCenterpressured : "",
      shape.behavior === "stable" ? styles.shapeCenterstable : "",
      shape.behavior === "unstable" ? styles.shapeCenterunstable : "",
      shape.behavior === "expanding" ? styles.shapeCenterexpanding : "",
    ].filter(Boolean).join(" ");
    const relationClass = [
      scenarioConflict >= 0.74 ? styles.scenarioRelationescalated : "",
      scenarioAttention >= 0.74 ? styles.scenarioRelationfocused : "",
      scenarioProgression >= 0.72 ? styles.scenarioRelationprogressive : "",
      shape.positionTendency === "edge" ? styles.shapeRelationedge : "",
      shape.positionTendency === "scatter" ? styles.shapeRelationscatter : "",
    ].filter(Boolean).join(" ");
    const shapeGuideClass = [
      shape.type === "geometric" ? styles.shapeGuidegeometric : "",
      shape.type === "organic" ? styles.shapeGuideorganic : "",
      shape.type === "fragment" ? styles.shapeGuidefragment : "",
      shape.type === "void" ? styles.shapeGuidevoid : "",
    ].filter(Boolean).join(" ");
    const grammarGuideClass = [
      shapeGrammar.rulesApplied.includes("add") ? styles.grammarGuideadd : "",
      shapeGrammar.rulesApplied.includes("subtract") ? styles.grammarGuidesubtract : "",
      shapeGrammar.ruleset.includes("scale") ? styles.grammarGuidescale : "",
      shapeGrammar.ruleset.includes("mirror") ? styles.grammarGuidemirror : "",
      shapeGrammar.ruleset.includes("repeat") ? styles.grammarGuiderepeat : "",
      shapeGrammar.ruleset.includes("merge") ? styles.grammarGuidemerge : "",
      shapeGrammar.ruleset.includes("split") ? styles.grammarGuidesplit : "",
      shapeGrammar.ruleset.includes("distort") ? styles.grammarGuidedistort : "",
      shapeGrammar.ruleset.includes("translate") ? styles.grammarGuidetranslate : "",
      shapeGrammar.ruleset.includes("rotate") ? styles.grammarGuiderotate : "",
      shapeGrammar.ruleset.includes("fragment") || shapeGrammar.failureReason === "transformation_rejection"
        ? styles.grammarGuidefragmented
        : "",
    ].filter(Boolean).join(" ");
    const grammarRelationClass = [
      shapeGrammar.scores.relation >= 0.72 ? styles.grammarRelationsequenced : "",
      shapeGrammar.ruleset.includes("mirror") ? styles.grammarRelationmirror : "",
    ].filter(Boolean).join(" ");
    const grammarMemoryClass = [
      shapeGrammar.scores.coherence >= 0.72 ? styles.grammarMemorycoherent : "",
      shapeGrammar.ruleset.includes("fragment") ? styles.grammarMemoryfragmented : "",
    ].filter(Boolean).join(" ");
    const grammarConstellationClass = [
      shapeGrammar.ruleset.includes("repeat") ? styles.grammarConstellationrepeat : "",
      shapeGrammar.ruleset.includes("fragment") ? styles.grammarConstellationfragmented : "",
    ].filter(Boolean).join(" ");
    const grammarCenterClass = [
      shapeGrammar.rulesApplied.includes("add") ? styles.grammarCenteradd : "",
      shapeGrammar.rulesApplied.includes("subtract") ? styles.grammarCentersubtract : "",
      shapeGrammar.ruleset.includes("scale") ? styles.grammarCenterscale : "",
      shapeGrammar.ruleset.includes("repeat") ? styles.grammarCenterrepeat : "",
      shapeGrammar.ruleset.includes("merge") ? styles.grammarCentermerge : "",
      shapeGrammar.ruleset.includes("split") ? styles.grammarCentersplit : "",
      shapeGrammar.ruleset.includes("distort") ? styles.grammarCenterdistort : "",
      shapeGrammar.ruleset.includes("rotate") ? styles.grammarCenterrotate : "",
      shapeGrammar.ruleset.includes("translate") ? styles.grammarCentertranslate : "",
      shapeGrammar.ruleset.includes("fragment") ? styles.grammarCenterfragmented : "",
      shapeGrammar.scores.coherence >= 0.72 ? styles.grammarCentercoherent : "",
    ].filter(Boolean).join(" ");
    const grammarMemoryStyle = {
      "--grammar-memory-scale": shapeGrammar.scores.coherence >= 0.72 ? "1.04" : "0.98",
      "--grammar-memory-drift": shapeGrammar.ruleset.includes("translate") ? "10px" : shapeGrammar.ruleset.includes("rotate") ? "-8px" : "4px",
    } as React.CSSProperties;
    const grammarConstellationStyle = {
      "--grammar-fragment-shift": shapeGrammar.ruleset.includes("repeat") ? "12px" : "5px",
      "--grammar-keyword-spacing": shapeGrammar.scores.expressivePower >= 0.72 ? "0.22em" : "0.14em",
    } as React.CSSProperties;
    const grammarCenterStyle = {
      "--grammar-center-tilt": shapeGrammar.ruleset.includes("rotate") ? "-4deg" : "0deg",
      "--grammar-center-scale": shapeGrammar.scores.expressivePower >= 0.72 ? "1.05" : "1",
      "--grammar-center-subtract-scale": shapeGrammar.rulesApplied.includes("subtract") ? "0.94" : "1",
      "--grammar-center-glow": shapeGrammar.ruleset.includes("repeat") ? "0.14" : shapeGrammar.ruleset.includes("fragment") ? "0.09" : "0.11",
      "--grammar-center-inner-opacity": shapeGrammar.rulesApplied.includes("add") ? "0.82" : "0.32",
      "--grammar-center-cut-opacity": shapeGrammar.rulesApplied.includes("subtract") ? "0.72" : "0.22",
      "--grammar-center-scale-opacity": shapeGrammar.ruleset.includes("scale") ? "0.82" : "0.24",
      "--grammar-center-scale-factor": shapeGrammar.ruleset.includes("scale") ? "1.08" : "1",
      "--grammar-center-mirror-opacity": shapeGrammar.ruleset.includes("mirror") ? "0.78" : "0.26",
      "--grammar-center-repeat-opacity": shapeGrammar.ruleset.includes("repeat") ? "0.78" : "0.24",
      "--grammar-center-merge-opacity": shapeGrammar.ruleset.includes("merge") ? "0.82" : "0.24",
      "--grammar-center-split-opacity": shapeGrammar.ruleset.includes("split") ? "0.82" : "0.24",
      "--grammar-center-distort-opacity": shapeGrammar.ruleset.includes("distort") ? "0.8" : "0.24",
      "--grammar-center-distort-skew": shapeGrammar.ruleset.includes("distort") ? "-4deg" : "0deg",
      "--grammar-center-rotate-opacity": shapeGrammar.ruleset.includes("rotate") ? "0.8" : "0.24",
      "--grammar-center-rotate-angle": shapeGrammar.ruleset.includes("rotate") ? "-5deg" : "0deg",
      "--grammar-center-fragment-opacity": shapeGrammar.ruleset.includes("fragment") ? "0.78" : "0.24",
      "--grammar-center-translate-opacity": shapeGrammar.ruleset.includes("translate") ? "0.78" : "0.24",
      "--grammar-center-translate-shift": shapeGrammar.ruleset.includes("translate") ? "10px" : "0px",
    } as React.CSSProperties;
    const thoughtCenterTransform = (() => {
      if (liveInfluenceMode === "rupture") {
        return "translate(-50%, -50%) rotate(-1deg)";
      }

      return "translate(-50%, -50%)";
    })();
    const anchorLeft = Number.parseFloat(subjectAnchor.left);
    const anchorTop = Number.parseFloat(subjectAnchor.top);
    const offsetPercent = (value: number, delta: number) => `${Math.min(86, Math.max(14, value + delta)).toFixed(3)}%`;
    const fragmentHorizontalBias =
      structure.subjectPosition === "upper-right-third"
        ? -1
        : structure.subjectPosition === "left-third-entry"
          ? 1
          : 0;
    const fragmentSpread =
      shapeGrammar.ruleset.includes("fragment") || liveInfluenceMode === "rupture"
        ? 12
        : shapeGrammar.ruleset.includes("repeat")
          ? 8
          : 6;
    const keywordSpread =
      shapeGrammar.ruleset.includes("translate")
        ? 10
        : shapeGrammar.ruleset.includes("mirror")
          ? 8
          : 6;
    const fragmentOffsets = [
      { x: -22 - fragmentHorizontalBias * 4, y: -18 },
      { x: 18 - fragmentHorizontalBias * 3, y: -12 },
      { x: -16 - fragmentHorizontalBias * 2, y: 20 },
      { x: 20 - fragmentHorizontalBias * 4, y: 26 },
    ];
    const keywordOffsets = [
      { x: -8, y: -26 },
      { x: -24 - fragmentHorizontalBias * 2, y: -2 },
      { x: 22 - fragmentHorizontalBias * 3, y: 0 },
      { x: 4, y: 28 },
      { x: -18 - fragmentHorizontalBias * 2, y: 34 },
      { x: 24 - fragmentHorizontalBias * 2, y: 30 },
    ];
    const fragmentAnimations = ["driftOne", "driftTwo", "driftThree", "driftFour"] as const;
    const keywordAnimations = ["shimmerOne", "shimmerTwo", "shimmerThree", "shimmerOne", "shimmerTwo", "shimmerThree"] as const;
    const fragmentLayouts = fragmentOffsets.map((offset, index) => ({
      left: offsetPercent(anchorLeft, offset.x + (index % 2 === 0 ? -fragmentSpread : fragmentSpread) * 0.18),
      top: offsetPercent(anchorTop, offset.y),
      animation: `${fragmentAnimations[index]} var(--clock-keyword-duration, ${index % 2 === 0 ? "10.2s" : "11.4s"}) infinite alternate`,
    })) as React.CSSProperties[];
    const keywordLayouts = keywordOffsets.map((offset, index) => ({
      left: offsetPercent(anchorLeft, offset.x + (shapeGrammar.scores.relation >= 0.72 ? (index % 2 === 0 ? -keywordSpread : keywordSpread) * 0.16 : 0)),
      top: offsetPercent(anchorTop, offset.y),
      animation: `${keywordAnimations[index]} var(--clock-keyword-duration, ${7 + index * 0.4}s) infinite alternate`,
    })) as React.CSSProperties[];
    const grammarParticleOffsets = [
      { x: -26, y: -28 },
      { x: 22, y: -16 },
      { x: -18, y: 24 },
      { x: 24, y: 30 },
    ];
    const grammarParticleLayouts = grammarParticleOffsets.map((offset, index) => ({
      left: offsetPercent(anchorLeft, offset.x + (shapeGrammar.ruleset.includes("translate") ? (index % 2 === 0 ? -4 : 4) : 0)),
      top: offsetPercent(anchorTop, offset.y + (shapeGrammar.ruleset.includes("rotate") ? (index < 2 ? -2 : 2) : 0)),
    })) as React.CSSProperties[];
    const strayLetterOffsets = [
      { x: -14, y: -40, size: "clamp(0.9rem, 1vw, 1.15rem)", animation: "shimmerOne calc(var(--clock-keyword-duration, 7.8s) * 0.9) infinite alternate" },
      { x: 26, y: -28, size: "clamp(1.2rem, 1.5vw, 1.8rem)", animation: "driftTwo calc(var(--clock-keyword-duration, 7.8s) * 1.05) infinite alternate" },
      { x: -30, y: -2, size: "clamp(0.76rem, 0.92vw, 1rem)", animation: "shimmerThree calc(var(--clock-keyword-duration, 7.8s) * 0.82) infinite alternate" },
      { x: 34, y: 12, size: "clamp(1.6rem, 2vw, 2.3rem)", animation: "driftFour calc(var(--clock-keyword-duration, 7.8s) * 1.15) infinite alternate" },
      { x: -2, y: 24, size: "clamp(1rem, 1.2vw, 1.4rem)", animation: "shimmerTwo calc(var(--clock-keyword-duration, 7.8s) * 0.96) infinite alternate" },
      { x: 6, y: 34, size: "clamp(0.84rem, 1vw, 1.1rem)", animation: "driftOne calc(var(--clock-keyword-duration, 7.8s) * 0.88) infinite alternate" },
      { x: -22, y: 42, size: "clamp(1.3rem, 1.6vw, 1.9rem)", animation: "shimmerOne calc(var(--clock-keyword-duration, 7.8s) * 1.08) infinite alternate" },
      { x: 20, y: 40, size: "clamp(0.72rem, 0.88vw, 0.96rem)", animation: "shimmerThree calc(var(--clock-keyword-duration, 7.8s) * 0.78) infinite alternate" },
    ];
    const strayLetterLayouts = strayLetterOffsets.map((offset, index) => ({
      left: offsetPercent(anchorLeft, offset.x + (liveInfluenceMode === "counterpoint" ? (index % 2 === 0 ? -4 : 4) : 0)),
      top: offsetPercent(anchorTop, offset.y + (liveInfluenceMode === "rupture" ? (index % 2 === 0 ? -3 : 3) : 0)),
      fontSize: offset.size,
      animation: offset.animation,
    })) as React.CSSProperties[];
    const memoryFragmentOffsets = [
      { x: -18 - fragmentHorizontalBias * 3, y: -30, rotation: "-8deg", animation: "driftOne", duration: "8.9s" },
      { x: 22 - fragmentHorizontalBias * 4, y: -16, rotation: "7deg", animation: "driftTwo", duration: "9.8s" },
      { x: -20 - fragmentHorizontalBias * 2, y: 22, rotation: "-5deg", animation: "driftThree", duration: "9.4s" },
      { x: 18 - fragmentHorizontalBias * 3, y: 34, rotation: "9deg", animation: "driftFour", duration: "10.2s" },
    ];
    const memoryTraceOffsets = [
      { x: 6, y: -18, animation: "shimmerOne", duration: "7.1s" },
      { x: -8 - fragmentHorizontalBias * 2, y: 24, animation: "shimmerTwo", duration: "7.8s" },
      { x: 20 - fragmentHorizontalBias * 2, y: 38, animation: "shimmerThree", duration: "8.4s" },
    ];
    const isFragmentedMemory = shapeGrammar.ruleset.includes("fragment");
    const memoryDrift =
      shapeGrammar.ruleset.includes("translate")
        ? 10
        : shapeGrammar.ruleset.includes("rotate")
          ? -8
          : 4;
    const liveMemoryShift = liveInfluenceMode === "rupture" ? 6 : liveInfluenceMode === "counterpoint" ? -4 : 0;
    const memoryFragmentLayouts = memoryFragmentOffsets.map((offset, index) => {
      const directionalDrift = isFragmentedMemory ? (index % 2 === 0 ? memoryDrift : -memoryDrift) : 0;
      const ruptureLift = liveInfluenceMode === "rupture" ? (index % 2 === 0 ? -4 : 6) : 0;
      return {
        left: offsetPercent(anchorLeft, offset.x + directionalDrift * 0.12 + liveMemoryShift),
        top: offsetPercent(anchorTop, offset.y + ruptureLift),
        transform: `translate(${directionalDrift}px, ${ruptureLift}px) rotate(${liveInfluenceMode === "rupture"
          ? index % 2 === 0 ? "-14deg" : "14deg"
          : offset.rotation})`,
        animation: `${offset.animation} var(--clock-memory-duration, ${offset.duration}) infinite alternate`,
      };
    }) as React.CSSProperties[];
    const memoryTraceLayouts = memoryTraceOffsets.map((offset, index) => {
      const directionalDrift = isFragmentedMemory ? (index % 2 === 0 ? -memoryDrift : memoryDrift) : 0;
      const counterpointShift = liveInfluenceMode === "counterpoint" ? (index === 1 ? -10 : index === 2 ? 10 : 0) : 0;
      return {
        left: offsetPercent(anchorLeft, offset.x + directionalDrift * 0.14 + counterpointShift),
        top: offsetPercent(anchorTop, offset.y),
        transform: `translateX(${directionalDrift + counterpointShift}px)`,
        animation: `${offset.animation} var(--clock-memory-duration, ${offset.duration}) infinite alternate`,
      };
    }) as React.CSSProperties[];
    const relationAxisLayouts = [
      {
        left: offsetPercent(anchorLeft, -32),
        top: offsetPercent(anchorTop, -3),
        width: `${Math.min(84, Math.max(34, 64 + (scenarioProgression - 0.5) * 36)).toFixed(3)}%`,
        height: "1px",
      },
      {
        left: offsetPercent(anchorLeft, -4),
        top: offsetPercent(anchorTop, -31),
        width: `${Math.min(72, Math.max(24, 46 + (shape.scores.attention - 0.5) * 28)).toFixed(3)}%`,
        height: "1px",
      },
      {
        left: offsetPercent(anchorLeft, -26 + (shape.positionTendency === "edge" ? -6 : shape.positionTendency === "scatter" ? 6 : 0)),
        top: offsetPercent(anchorTop, -22),
        width: `${Math.min(68, Math.max(22, 48 + (shapeGrammar.scores.relation - 0.5) * 24)).toFixed(3)}%`,
        height: "1px",
        transform: `rotate(${liveInfluenceMode === "rupture" ? 34 : liveInfluenceMode === "counterpoint" ? -18 : 22}deg)`,
      },
    ] as React.CSSProperties[];
    const relationLineLayouts = [
      {
        left: offsetPercent(anchorLeft, -28 + (shape.positionTendency === "scatter" ? -4 : 0)),
        top: offsetPercent(anchorTop, -16),
        width: `${Math.min(42, Math.max(16, 28 + scenarioConflict * 14)).toFixed(3)}%`,
        height: "2px",
        transform: `rotate(${liveInfluenceMode === "rupture" ? 34 : 18}deg)`,
      },
      {
        left: offsetPercent(anchorLeft, 6 + (liveInfluenceMode === "counterpoint" ? 10 : 0)),
        top: offsetPercent(anchorTop, 12),
        width: `${Math.min(32, Math.max(14, 20 + scenarioProgression * 12)).toFixed(3)}%`,
        height: "2px",
        transform: `rotate(${liveInfluenceMode === "rupture" ? 34 : -26}deg)`,
      },
      {
        left: offsetPercent(anchorLeft, -18),
        top: offsetPercent(anchorTop, 20),
        width: `${Math.min(28, Math.max(12, 16 + scenarioAttention * 10)).toFixed(3)}%`,
        height: "2px",
        transform: `rotate(${liveInfluenceMode === "rupture" ? -34 : -12}deg)`,
      },
    ] as React.CSSProperties[];
    const relationNodeOffsets = [
      { x: -30 + (shape.positionTendency === "edge" ? -5 : 0), y: -18 },
      { x: 28 + (shape.positionTendency === "edge" ? 5 : 0), y: -24 },
      { x: -20 + (shape.positionTendency === "edge" ? -7 : 0), y: 24 },
      { x: 26 + (shape.positionTendency === "edge" ? 7 : 0), y: 30 },
    ];
    const relationNodeLayouts = relationNodeOffsets.map((offset) => ({
      left: offsetPercent(anchorLeft, offset.x),
      top: offsetPercent(anchorTop, offset.y),
    })) as React.CSSProperties[];
    const relationCenterLayout = {
      left: subjectAnchor.left,
      top: subjectAnchor.top,
      transform: "translate(-50%, -50%)",
    } as React.CSSProperties;
    const temporalLineLayouts = [
      {
        left: offsetPercent(anchorLeft, -12),
        top: offsetPercent(anchorTop, -8),
        width: "18%",
        transform: "rotate(-14deg)",
      },
      {
        left: offsetPercent(anchorLeft, 12),
        top: offsetPercent(anchorTop, 28),
        width: "16%",
        transform: "rotate(18deg)",
      },
    ] as React.CSSProperties[];
    const temporalPulseLayouts = [
      {
        left: offsetPercent(anchorLeft, 4),
        top: offsetPercent(anchorTop, -10),
      },
      {
        left: offsetPercent(anchorLeft, 14),
        top: offsetPercent(anchorTop, 34),
      },
    ] as React.CSSProperties[];
    const temporalParticleOffsets = [
      { x: 22, y: -24, animation: "shimmerOne 7.1s infinite alternate" },
      { x: 30, y: 8, animation: "shimmerTwo 7.8s infinite alternate" },
      { x: 6, y: 30, animation: "shimmerThree 8.4s infinite alternate" },
      { x: 24, y: 42, animation: "shimmerOne 8.2s infinite alternate", maxWidth: "12ch", lineHeight: "1.35" },
    ];
    const temporalParticleLayouts = temporalParticleOffsets.map((offset) => ({
      left: offsetPercent(anchorLeft, offset.x + (clockDisplay?.attentionAnchor === "seconds_pulse" ? 4 : 0)),
      top: offsetPercent(anchorTop, offset.y + (clockDisplay?.transition === "memory_trail" ? 4 : 0)),
      animation: offset.animation,
      maxWidth: offset.maxWidth,
      lineHeight: offset.lineHeight,
    })) as React.CSSProperties[];
    const guideLabelLayouts = {
      primary: {
        left: offsetPercent(anchorLeft, 16 + (structure.subjectPosition === "left-third-entry" ? 6 : 0)),
        top: offsetPercent(anchorTop, -24),
      },
      secondary: {
        left: offsetPercent(anchorLeft, -28 + (structure.subjectPosition === "upper-right-third" ? -4 : 0)),
        top: offsetPercent(anchorTop, 34),
      },
    } as {
      primary: React.CSSProperties;
      secondary: React.CSSProperties;
    };
    const negativeSpaceLayouts = {
      primary: {
        left: offsetPercent(anchorLeft, structure.subjectPosition === "left-third-entry" ? -30 : -34),
        top: offsetPercent(anchorTop, shape.behavior === "expanding" ? -26 : -22),
        width: `${Math.min(42, Math.max(20, 26 + scenarioAttention * 14 + (shape.type === "void" ? 4 : 0))).toFixed(3)}%`,
        height: `${Math.min(38, Math.max(16, 18 + shape.scores.tension * 12 + (shape.behavior === "expanding" ? 4 : 0))).toFixed(3)}%`,
        borderRadius:
          shape.type === "organic"
            ? "38% 62% 44% 56% / 46% 42% 58% 54%"
            : shape.type === "void"
              ? "44% 56% 52% 48% / 52% 40% 60% 48%"
              : undefined,
      },
      secondary: {
        left: offsetPercent(anchorLeft, structure.subjectPosition === "upper-right-third" ? 6 : 10),
        top: offsetPercent(anchorTop, scenarioConflict >= 0.74 ? 8 : 12),
        width: `${Math.min(38, Math.max(18, 22 + scenarioConflict * 14 + (shapeGrammar.ruleset.includes("repeat") ? 4 : 0))).toFixed(3)}%`,
        height: `${Math.min(34, Math.max(14, 16 + shapeGrammar.scores.expressivePower * 10)).toFixed(3)}%`,
        borderRadius:
          shape.type === "organic"
            ? "42% 58% 46% 54% / 44% 48% 52% 56%"
            : shape.type === "void"
              ? "48% 52% 56% 44% / 50% 42% 58% 50%"
              : undefined,
      },
    } as {
      primary: React.CSSProperties;
      secondary: React.CSSProperties;
    };
    const guideMirrorMarkerLayouts = [
      {
        top: "22%",
        left: `calc(50% - ${structure.symmetryState === "symmetry_precise" ? "5.8rem" : "5.4rem"})`,
      },
      {
        top: "22%",
        right: `calc(50% - ${structure.symmetryState === "symmetry_precise" ? "5.8rem" : "5.4rem"})`,
      },
    ] as React.CSSProperties[];
    const guideMirrorAxisLayout = {
      top: structure.centerState === "centered_intentional" ? "8%" : "10%",
      bottom: structure.centerState === "decentered_tension" ? "14%" : "10%",
      left: "50%",
      transform: "translateX(-50%)",
    } as React.CSSProperties;
    const guideRepeatEchoLayouts = [
      { top: "16%", left: "16%" },
      { top: "32%", left: shapeGrammar.scores.coherence >= 0.72 ? "30%" : "32%" },
      { top: "48%", left: shapeGrammar.scores.expressivePower >= 0.72 ? "46%" : "48%" },
    ] as React.CSSProperties[];
    const guideTranslateTrailLayouts = [
      {
        top: "24%",
        left: structure.subjectPosition === "left-third-entry" ? "12%" : "14%",
        transform: `rotate(${shapeGrammar.ruleset.includes("translate") ? -12 : -10}deg)`,
      },
      {
        bottom: "22%",
        left: structure.subjectPosition === "upper-right-third" ? "30%" : "34%",
        transform: `rotate(${shapeGrammar.ruleset.includes("translate") ? -8 : -6}deg)`,
      },
    ] as React.CSSProperties[];
    const guideTranslateMarkerLayouts = [
      {
        top: "23%",
        left: structure.subjectPosition === "upper-right-third" ? "56%" : "58%",
      },
      {
        bottom: "20%",
        right: structure.subjectPosition === "left-third-entry" ? "14%" : "16%",
      },
    ] as React.CSSProperties[];
    const guideRotateArcLayouts = [
      {
        top: "20%",
        right: liveInfluenceMode === "counterpoint" ? "16%" : "18%",
      },
      {
        bottom: "18%",
        left: liveInfluenceMode === "counterpoint" ? "16%" : "18%",
        transform: "rotate(180deg)",
      },
    ] as React.CSSProperties[];
    const guideFragmentShardLayouts = [
      {
        top: "22%",
        left: structure.subjectPosition === "left-third-entry" ? "16%" : "18%",
        transform: `rotate(${shapeGrammar.ruleset.includes("fragment") ? -20 : -18}deg)`,
      },
      {
        top: "48%",
        right: structure.subjectPosition === "upper-right-third" ? "20%" : "22%",
        transform: `rotate(${shapeGrammar.ruleset.includes("fragment") ? 18 : 16}deg)`,
      },
      {
        bottom: "20%",
        left: shape.positionTendency === "scatter" ? "32%" : "36%",
        transform: `rotate(${shapeGrammar.ruleset.includes("fragment") ? -14 : -12}deg)`,
      },
    ] as React.CSSProperties[];
    const guideMergeBridgeLayout = {
      top: "50%",
      left: shapeGrammar.ruleset.includes("merge") ? "29%" : "31%",
      transform: "translateY(-50%)",
    } as React.CSSProperties;
    const guideMergeNodeLayouts = [
      {
        top: "calc(50% - 0.6rem)",
        left: shapeGrammar.ruleset.includes("merge") ? "22%" : "24%",
      },
      {
        top: "calc(50% - 0.6rem)",
        right: shapeGrammar.ruleset.includes("merge") ? "22%" : "24%",
      },
    ] as React.CSSProperties[];
    const guideSplitAxisLayout = {
      top: structure.centerState === "centered_intentional" ? "16%" : "18%",
      bottom: structure.centerState === "decentered_tension" ? "20%" : "18%",
      left: "50%",
      transform: "translateX(-50%)",
    } as React.CSSProperties;
    const guideSplitNodeLayouts = [
      {
        top: "calc(50% - 0.55rem)",
        left: shapeGrammar.ruleset.includes("split") ? "32%" : "34%",
      },
      {
        top: "calc(50% - 0.55rem)",
        right: shapeGrammar.ruleset.includes("split") ? "32%" : "34%",
      },
    ] as React.CSSProperties[];
    const centerTokenLayouts = [
      {
        position: "absolute",
        top: "18%",
        left: structure.subjectPosition === "left-third-entry" ? "18%" : "20%",
        transform: `translateY(${shapeGrammar.rulesApplied.includes("add") ? "-2px" : "-1px"})`,
      },
      {
        position: "absolute",
        right: structure.subjectPosition === "upper-right-third" ? "18%" : "20%",
        bottom: "18%",
        transform: `translateY(${shapeGrammar.rulesApplied.includes("subtract") ? "2px" : "1px"})`,
      },
    ] as React.CSSProperties[];
    const centerAccentLayouts = [
      {
        top: shape.behavior === "expanding" ? "16%" : "18%",
        left: structure.subjectPosition === "left-third-entry" ? "16%" : "18%",
      },
      {
        right: structure.subjectPosition === "upper-right-third" ? "16%" : "18%",
        bottom: shape.behavior === "contracting" ? "18%" : "20%",
      },
    ] as React.CSSProperties[];
    const centerCutLayouts = [
      {
        top: `${34 + (scenarioConflict - 0.5) * 8}%`,
        left: "26%",
        transform: `rotate(${liveInfluenceMode === "rupture" ? -16 : -12}deg)`,
      },
      {
        bottom: `${32 + (scenarioProgression - 0.5) * 6}%`,
        left: "24%",
        transform: `rotate(${liveInfluenceMode === "rupture" ? 14 : 10}deg)`,
      },
    ] as React.CSSProperties[];
    const centerMirrorMarkerLayouts = [
      {
        top: "24%",
        left: structure.symmetryState === "symmetry_precise" ? "16%" : "18%",
      },
      {
        top: "24%",
        right: structure.symmetryState === "symmetry_precise" ? "16%" : "18%",
      },
    ] as React.CSSProperties[];
    const centerMirrorAxisLayout = {
      top: structure.centerState === "centered_intentional" ? "14%" : "16%",
      bottom: structure.centerState === "decentered_tension" ? "20%" : "16%",
      left: "50%",
      transform: "translateX(-50%)",
    } as React.CSSProperties;
    const centerMergeBridgeLayout = {
      top: "50%",
      left: shapeGrammar.ruleset.includes("merge") ? "24%" : "28%",
      transform: "translateY(-50%)",
    } as React.CSSProperties;
    const centerMergeNodeLayouts = [
      {
        top: "calc(50% - 0.52rem)",
        left: shapeGrammar.ruleset.includes("merge") ? "18%" : "20%",
      },
      {
        top: "calc(50% - 0.52rem)",
        right: shapeGrammar.ruleset.includes("merge") ? "18%" : "20%",
      },
    ] as React.CSSProperties[];
    const centerSplitAxisLayout = {
      top: structure.centerState === "centered_intentional" ? "14%" : "16%",
      bottom: structure.centerState === "decentered_tension" ? "20%" : "16%",
      left: "50%",
      transform: "translateX(-50%)",
    } as React.CSSProperties;
    const centerSplitNodeLayouts = [
      {
        top: "calc(50% - 0.52rem)",
        left: shapeGrammar.ruleset.includes("split") ? "26%" : "28%",
      },
      {
        top: "calc(50% - 0.52rem)",
        right: shapeGrammar.ruleset.includes("split") ? "26%" : "28%",
      },
    ] as React.CSSProperties[];
    const centerRotateArcLayouts = [
      {
        top: "16%",
        right: liveInfluenceMode === "counterpoint" ? "16%" : "18%",
      },
      {
        bottom: "16%",
        left: liveInfluenceMode === "counterpoint" ? "16%" : "18%",
        transform: "rotate(180deg)",
      },
    ] as React.CSSProperties[];
    const centerTranslateTrailLayouts = [
      {
        top: "24%",
        left: "20%",
        transform: `rotate(${shapeGrammar.ruleset.includes("translate") ? -10 : -8}deg)`,
      },
      {
        bottom: "22%",
        left: "28%",
        transform: `rotate(${shapeGrammar.ruleset.includes("translate") ? -6 : -4}deg)`,
      },
    ] as React.CSSProperties[];
    const centerTranslateMarkerLayouts = [
      {
        top: "24%",
        left: structure.subjectPosition === "upper-right-third" ? "60%" : "62%",
      },
      {
        bottom: "20%",
        right: structure.subjectPosition === "left-third-entry" ? "16%" : "18%",
      },
    ] as React.CSSProperties[];
    const centerFragmentShardLayouts = [
      {
        top: "32%",
        left: "26%",
        transform: `rotate(${shapeGrammar.ruleset.includes("fragment") ? -16 : -14}deg)`,
      },
      {
        bottom: "30%",
        left: "24%",
        transform: `rotate(${shapeGrammar.ruleset.includes("fragment") ? 14 : 12}deg)`,
      },
    ] as React.CSSProperties[];
    const centerRepeatEchoLayouts = [
      { inset: shapeGrammar.scores.coherence >= 0.72 ? "14%" : "16%" },
      { inset: shapeGrammar.scores.expressivePower >= 0.72 ? "22%" : "24%" },
    ] as React.CSSProperties[];
    const overlayCoverage =
      scenarioAttention >= 0.82
        ? { inset: "0%", maxWidth: "min(62rem, 100%)" }
        : structure.centerState === "centered_intentional"
          ? { inset: "4%", maxWidth: "min(54rem, 100%)" }
          : shape.positionTendency === "edge"
            ? { inset: "6% 10% 8% 14%", maxWidth: "min(48rem, 100%)" }
            : { inset: "7% 12% 10% 12%", maxWidth: "min(50rem, 100%)" };
    const thoughtOverlayStyle = {
      "--thought-overlay-inset": overlayCoverage.inset,
      "--thought-overlay-z": scenarioAttention >= 0.74 ? "7" : "6",
      "--thought-overlay-opacity": interference ? "0.98" : "0.94",
      "--thought-overlay-padding": scenarioAttention >= 0.82 ? "clamp(28px, 4.8vw, 64px)" : "clamp(24px, 4vw, 52px)",
      "--thought-overlay-text-width": overlayCoverage.maxWidth,
      "--thought-overlay-align": structure.centerState === "centered_intentional" ? "center" : "start",
      "--thought-overlay-justify": scenarioAttention >= 0.82 ? "center" : "start",
      "--thought-overlay-text-align": structure.centerState === "centered_intentional" ? "center" : "left",
      "--thought-overlay-background": interference
        ? "color-mix(in srgb, var(--slice-ink, #181411) 92%, #15100c)"
        : "color-mix(in srgb, var(--slice-ink, #181411) 88%, #15100c)",
      "--thought-overlay-border": interference
        ? "rgba(255, 194, 168, 0.12)"
        : "color-mix(in srgb, var(--slice-accent, #b5452f) 10%, transparent)",
    } as React.CSSProperties;
    const layerOrderStyle = {
      "--z-text-backdrop": "0",
      "--z-relation-field": scenarioAttention >= 0.74 ? "2" : "1",
      "--z-composition-guide": structure.centerState === "centered_intentional" ? "3" : "2",
      "--z-memory-field": shapeGrammar.ruleset.includes("fragment") ? "3" : "4",
      "--z-text-constellation": shapeGrammar.scores.expressivePower >= 0.72 ? "5" : "4",
      "--z-thought-center": scenarioAttention >= 0.74 || structure.centerState === "centered_intentional" ? "6" : "5",
      "--z-clock-field": clockDisplay ? (clockDisplay.attentionAnchor === "hours_minutes_seconds" ? "7" : "6") : "6",
      "--z-composition-rules": "7",
      "--z-corner-signature": "8",
    } as React.CSSProperties;

    return {
      structure,
      guideStyle: {
        "--structure-v1": guideStops.v1,
        "--structure-v2": guideStops.v2,
        "--structure-h1": guideStops.h1,
        "--structure-h2": guideStops.h2,
        "--grammar-guide-accent-opacity": shapeGrammar.rulesApplied.includes("add") ? "0.92" : "0.54",
        "--grammar-guide-cut-opacity": shapeGrammar.rulesApplied.includes("subtract") ? "0.72" : "0.34",
        "--grammar-guide-third-shift": shapeGrammar.rulesApplied.includes("add") ? "6px" : shapeGrammar.rulesApplied.includes("subtract") ? "-4px" : "0px",
        "--grammar-guide-frame-scale": shapeGrammar.rulesApplied.includes("add") ? "1.05" : shapeGrammar.rulesApplied.includes("subtract") ? "0.96" : "1",
        "--grammar-guide-subtract-scale": shapeGrammar.rulesApplied.includes("subtract") ? "0.92" : "1",
        "--grammar-guide-line-opacity": shapeGrammar.rulesApplied.includes("subtract") ? "0.46" : "0.78",
        "--grammar-negative-space-opacity": shapeGrammar.rulesApplied.includes("add") ? "0.9" : shapeGrammar.rulesApplied.includes("subtract") ? "0.42" : "0.72",
        "--grammar-negative-space-radius": shapeGrammar.rulesApplied.includes("add") ? "24px" : shapeGrammar.rulesApplied.includes("subtract") ? "12px" : "18px",
        "--grammar-negative-space-subtract-scale": shapeGrammar.rulesApplied.includes("subtract") ? "0.9" : "1",
        "--grammar-scale-opacity": shapeGrammar.ruleset.includes("scale") ? "0.84" : "0.24",
        "--grammar-scale-factor": shapeGrammar.ruleset.includes("scale") ? "1.06" : "1",
        "--grammar-negative-space-scale-factor": shapeGrammar.ruleset.includes("scale") ? "1.08" : "1",
        "--grammar-negative-space-mirror-opacity": shapeGrammar.ruleset.includes("mirror") ? "0.78" : "0.24",
        "--grammar-mirror-axis-opacity": shapeGrammar.ruleset.includes("mirror") ? "0.82" : "0.3",
        "--grammar-repeat-opacity": shapeGrammar.ruleset.includes("repeat") ? "0.82" : "0.28",
        "--grammar-merge-opacity": shapeGrammar.ruleset.includes("merge") ? "0.84" : "0.24",
        "--grammar-split-opacity": shapeGrammar.ruleset.includes("split") ? "0.84" : "0.24",
        "--grammar-distort-opacity": shapeGrammar.ruleset.includes("distort") ? "0.82" : "0.24",
        "--grammar-distort-skew": shapeGrammar.ruleset.includes("distort") ? "-5deg" : "0deg",
        "--grammar-negative-space-scale-opacity": shapeGrammar.ruleset.includes("scale") ? "0.8" : "0.24",
        "--grammar-negative-space-split-opacity": shapeGrammar.ruleset.includes("split") ? "0.78" : "0.24",
        "--grammar-negative-space-merge-opacity": shapeGrammar.ruleset.includes("merge") ? "0.78" : "0.24",
        "--grammar-negative-space-distort-opacity": shapeGrammar.ruleset.includes("distort") ? "0.78" : "0.24",
        "--grammar-negative-space-distort-skew": shapeGrammar.ruleset.includes("distort") ? "-6deg" : "0deg",
        "--grammar-negative-space-repeat-opacity": shapeGrammar.ruleset.includes("repeat") ? "0.76" : "0.24",
        "--grammar-negative-space-rotate-opacity": shapeGrammar.ruleset.includes("rotate") ? "0.78" : "0.24",
        "--grammar-negative-space-rotate-angle": shapeGrammar.ruleset.includes("rotate") ? "-5deg" : "0deg",
        "--grammar-fragment-opacity": shapeGrammar.ruleset.includes("fragment") ? "0.78" : "0.24",
        "--grammar-negative-space-fragment-opacity": shapeGrammar.ruleset.includes("fragment") ? "0.76" : "0.22",
        "--grammar-translate-opacity": shapeGrammar.ruleset.includes("translate") ? "0.8" : "0.24",
        "--grammar-translate-shift": shapeGrammar.ruleset.includes("translate") ? "10px" : "0px",
        "--grammar-negative-space-translate-opacity": shapeGrammar.ruleset.includes("translate") ? "0.76" : "0.22",
        "--grammar-rotate-opacity": shapeGrammar.ruleset.includes("rotate") ? "0.8" : "0.24",
        "--grammar-rotate-angle": shapeGrammar.ruleset.includes("rotate") ? "-4deg" : "0deg",
      } as React.CSSProperties,
      thoughtCenterStyle: {
        left: subjectAnchor.left,
        top: subjectAnchor.top,
        right: "auto",
        bottom: "auto",
        marginLeft: 0,
        marginTop: 0,
        "--thought-center-transform": thoughtCenterTransform,
      } as React.CSSProperties,
      clockStyle: clockPlacement.style as React.CSSProperties,
      clockPlacementLabel: clockPlacement.label,
      rulesStyle: rulesAnchor as React.CSSProperties,
      guideLabelLayouts,
      negativeSpaceLayouts,
      guideMirrorAxisLayout,
      guideMirrorMarkerLayouts,
      guideRepeatEchoLayouts,
      guideTranslateTrailLayouts,
      guideTranslateMarkerLayouts,
      guideRotateArcLayouts,
      guideFragmentShardLayouts,
      guideMergeBridgeLayout,
      guideMergeNodeLayouts,
      guideSplitAxisLayout,
      guideSplitNodeLayouts,
      guideClass: [guideClass, shapeGuideClass, grammarGuideClass].filter(Boolean).join(" "),
      centerClass: [centerClass, grammarCenterClass].filter(Boolean).join(" "),
      relationClass: [relationClass, grammarRelationClass].filter(Boolean).join(" "),
      relationAxisLayouts,
      relationLineLayouts,
      relationNodeLayouts,
      relationCenterLayout,
      temporalLineLayouts,
      temporalPulseLayouts,
      temporalParticleLayouts,
      strayLetterLayouts,
      centerTokenLayouts,
      centerAccentLayouts,
      centerCutLayouts,
      centerMirrorAxisLayout,
      centerMirrorMarkerLayouts,
      centerMergeBridgeLayout,
      centerMergeNodeLayouts,
      centerSplitAxisLayout,
      centerSplitNodeLayouts,
      centerRotateArcLayouts,
      centerTranslateTrailLayouts,
      centerTranslateMarkerLayouts,
      centerFragmentShardLayouts,
      centerRepeatEchoLayouts,
      thoughtOverlayStyle,
      layerOrderStyle,
      grammarMemoryClass,
      grammarMemoryStyle,
      memoryFragmentLayouts,
      memoryTraceLayouts,
      grammarConstellationClass,
      grammarConstellationStyle,
      fragmentLayouts,
      keywordLayouts,
      grammarParticleLayouts,
      grammarCenterStyle,
      shapeGrammar,
    };
  }, [
    clockDisplay?.attentionAnchor,
    clockDisplay?.transition,
    clockDisplay?.visualStyle,
    engineDebuggerReport.shapeGrammar,
    engineDebuggerReport.scenario,
    engineDebuggerReport.shape,
    engineDebuggerReport.structure,
    liveInfluenceMode,
  ]);
  const svgTextLayout = useMemo(() => {
    if (!svgCanvas) {
      return null;
    }

    return runTextLayoutEngineV1({
      thought_scene: thoughtScene,
      canvas: svgCanvas,
      title: current.direction,
      fragments: current.fragments,
      keywords: current.keywords,
      stray_letters: strayLetters,
      grammar_rules: structureSceneConfig.shapeGrammar.rulesApplied,
      temporal_tokens: clockDisplay
        ? [
            clockDisplay.hours,
            clockDisplay.minutes,
            clockDisplay.seconds,
            clockDisplay.transition.replaceAll("_", " "),
          ]
        : [],
      influence_mode: liveInfluenceMode,
    });
  }, [
    clockDisplay,
    current.direction,
    current.fragments,
    current.keywords,
    liveInfluenceMode,
    strayLetters,
    structureSceneConfig.shapeGrammar.rulesApplied,
    svgCanvas,
    thoughtScene,
  ]);
  const svgPatternLayer = useMemo(() => {
    if (!svgScene) {
      return null;
    }

    return runPatternSvgRendererV1(svgScene.patterns, svgScene.canvas, svgScene.palette);
  }, [svgScene]);
  const svgTriangulationLayer = useMemo(() => {
    if (!svgScene) {
      return null;
    }

    return runTriangulationSvgRendererV1(
      svgScene.triangulation,
      svgScene.canvas,
      svgScene.palette,
    );
  }, [svgScene]);
  const svgFlatAbstractPatternLayer = useMemo(() => {
    if (!svgScene?.flat_abstract_pattern) {
      return null;
    }

    return runFlatAbstractPatternSvgRendererV1(svgScene.flat_abstract_pattern);
  }, [svgScene]);
  const svgIsometricPatternLayer = useMemo(() => {
    if (!svgScene?.isometric_pattern) {
      return null;
    }

    return runIsometricPatternSvgRendererV1(svgScene.isometric_pattern);
  }, [svgScene]);
  const svgZigZagPatternLayer = useMemo(() => {
    if (!svgScene?.zigzag_pattern) {
      return null;
    }

    return runZigZagPatternSvgRendererV1(svgScene.zigzag_pattern);
  }, [svgScene]);
  const svgRetroGridPatternLayer = useMemo(() => {
    if (!svgScene?.retro_grid_pattern) {
      return null;
    }

    return runRetroGridPatternSvgRendererV1(svgScene.retro_grid_pattern);
  }, [svgScene]);
  const svgBasePatternGroups =
    svgPatternLayer?.children.filter((child) => child.type === "g" && child.id !== "micro_glyphs") ?? [];
  const svgMicroGlyphGroup =
    svgPatternLayer?.children.find((child) => child.type === "g" && child.id === "micro_glyphs") ?? null;

  const sliceCanvasSection = (
    <div
      className={styles.canvasCard}
      style={
        {
          "--slice-background": current.visual.background,
          "--slice-accent": current.visual.accent,
          "--slice-ink": current.visual.ink,
          "--clock-accent": current.visual.accent,
          "--clock-ink": current.visual.ink,
          "--clock-background": current.visual.background,
          ...structureSceneConfig.layerOrderStyle,
        } as React.CSSProperties
      }
    >
      <span className={styles.panelMarker}>PANEL · Slice Canvas</span>
      <div className={styles.visualStage}>
        <div
          className={`${styles.textStage} ${styles.textStageStaticMotion} ${liveInfluenceMode ? styles[`textStage${liveInfluenceMode}`] : ""}`}
        >
          <div
            className={`${styles.compositionGuide} ${
              liveInfluenceMode ? styles[`compositionGuide${liveInfluenceMode}`] : ""
            } ${structureSceneConfig.guideClass}`}
            style={structureSceneConfig.guideStyle}
            aria-hidden="true"
          >
            <span className={styles.layerMarker}>LAYER · Composition Guide</span>
            <span className={`${styles.thirdLine} ${styles.thirdVerticalOne}`} />
            <span className={`${styles.thirdLine} ${styles.thirdVerticalTwo}`} />
            <span className={`${styles.thirdLine} ${styles.thirdHorizontalOne}`} />
            <span className={`${styles.thirdLine} ${styles.thirdHorizontalTwo}`} />
            {structureSceneConfig.shapeGrammar.ruleset.includes("mirror") ? (
              <>
                <span className={styles.grammarMirrorAxis} style={structureSceneConfig.guideMirrorAxisLayout} />
                <span className={`${styles.grammarMirrorMarker} ${styles.grammarMirrorMarkerLeft}`} style={structureSceneConfig.guideMirrorMarkerLayouts[0]} />
                <span className={`${styles.grammarMirrorMarker} ${styles.grammarMirrorMarkerRight}`} style={structureSceneConfig.guideMirrorMarkerLayouts[1]} />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("repeat") ? (
              <>
                <span className={`${styles.grammarRepeatEcho} ${styles.grammarRepeatEchoOne}`} style={structureSceneConfig.guideRepeatEchoLayouts[0]} />
                <span className={`${styles.grammarRepeatEcho} ${styles.grammarRepeatEchoTwo}`} style={structureSceneConfig.guideRepeatEchoLayouts[1]} />
                <span className={`${styles.grammarRepeatEcho} ${styles.grammarRepeatEchoThree}`} style={structureSceneConfig.guideRepeatEchoLayouts[2]} />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("translate") ? (
              <>
                <span className={`${styles.grammarTranslateTrail} ${styles.grammarTranslateTrailOne}`} style={structureSceneConfig.guideTranslateTrailLayouts[0]} />
                <span className={`${styles.grammarTranslateTrail} ${styles.grammarTranslateTrailTwo}`} style={structureSceneConfig.guideTranslateTrailLayouts[1]} />
                <span className={`${styles.grammarTranslateMarker} ${styles.grammarTranslateMarkerOne}`} style={structureSceneConfig.guideTranslateMarkerLayouts[0]} />
                <span className={`${styles.grammarTranslateMarker} ${styles.grammarTranslateMarkerTwo}`} style={structureSceneConfig.guideTranslateMarkerLayouts[1]} />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("rotate") ? (
              <>
                <span className={`${styles.grammarRotateArc} ${styles.grammarRotateArcOne}`} style={structureSceneConfig.guideRotateArcLayouts[0]} />
                <span className={`${styles.grammarRotateArc} ${styles.grammarRotateArcTwo}`} style={structureSceneConfig.guideRotateArcLayouts[1]} />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("fragment") ? (
              <>
                <span className={`${styles.grammarFragmentShard} ${styles.grammarFragmentShardOne}`} style={structureSceneConfig.guideFragmentShardLayouts[0]} />
                <span className={`${styles.grammarFragmentShard} ${styles.grammarFragmentShardTwo}`} style={structureSceneConfig.guideFragmentShardLayouts[1]} />
                <span className={`${styles.grammarFragmentShard} ${styles.grammarFragmentShardThree}`} style={structureSceneConfig.guideFragmentShardLayouts[2]} />
              </>
            ) : null}
            <span className={`${styles.guideLine} ${styles.leadingLineOne}`} style={clockGuideKinetics.leadingLines[0]} />
            <span className={`${styles.guideLine} ${styles.leadingLineTwo}`} style={clockGuideKinetics.leadingLines[1]} />
            <span className={`${styles.guideLine} ${styles.leadingLineThree}`} style={clockGuideKinetics.leadingLines[2]} />
            {structureSceneConfig.shapeGrammar.rulesApplied.includes("add") ? (
              <>
                <span className={`${styles.grammarGuideAccent} ${styles.grammarGuideAccentAddOne}`} />
                <span className={`${styles.grammarGuideAccent} ${styles.grammarGuideAccentAddTwo}`} />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.rulesApplied.includes("subtract") ? (
              <>
                <span className={`${styles.grammarGuideVoidCut} ${styles.grammarGuideVoidCutOne}`} />
                <span className={`${styles.grammarGuideVoidCut} ${styles.grammarGuideVoidCutTwo}`} />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("merge") ? (
              <>
                <span className={`${styles.grammarMergeBridge} ${styles.grammarMergeBridgeOne}`} style={structureSceneConfig.guideMergeBridgeLayout} />
                <span className={`${styles.grammarMergeNode} ${styles.grammarMergeNodeLeft}`} style={structureSceneConfig.guideMergeNodeLayouts[0]} />
                <span className={`${styles.grammarMergeNode} ${styles.grammarMergeNodeRight}`} style={structureSceneConfig.guideMergeNodeLayouts[1]} />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("split") ? (
              <>
                <span className={styles.grammarSplitAxis} style={structureSceneConfig.guideSplitAxisLayout} />
                <span className={`${styles.grammarSplitNode} ${styles.grammarSplitNodeLeft}`} style={structureSceneConfig.guideSplitNodeLayouts[0]} />
                <span className={`${styles.grammarSplitNode} ${styles.grammarSplitNodeRight}`} style={structureSceneConfig.guideSplitNodeLayouts[1]} />
              </>
            ) : null}
            <span className={`${styles.focalHalo} ${styles.focalHaloPrimary}`} style={clockGuideKinetics.focalHalos.primary}>
              <span className={styles.focalHaloNumber}>1</span>
            </span>
            <span className={`${styles.focalHalo} ${styles.focalHaloSecondary}`} style={clockGuideKinetics.focalHalos.secondary}>
              <span className={styles.focalHaloNumber}>2</span>
            </span>
            <span
              className={`${styles.spaceFrame} ${styles.negativeSpaceOne}`}
              style={{ ...clockNegativeSpaceKinetics.primary, ...structureSceneConfig.negativeSpaceLayouts.primary }}
            />
            <span
              className={`${styles.spaceFrame} ${styles.negativeSpaceTwo}`}
              style={{ ...clockNegativeSpaceKinetics.secondary, ...structureSceneConfig.negativeSpaceLayouts.secondary }}
            />
            <span className={styles.guideLabelPrimary} style={structureSceneConfig.guideLabelLayouts.primary}>focus</span>
            <span className={styles.guideLabelSecondary} style={structureSceneConfig.guideLabelLayouts.secondary}>
              {structureSceneConfig.structure.grid}
            </span>
            {clockDisplay ? (
              <span className={styles.guideLabelTemporal}>
                {clockDisplay.attentionAnchor.replaceAll("_", " ")}
              </span>
            ) : null}
          </div>
          <div
            className={`${styles.compositionRules} ${
              isCompositionRulesOpen ? styles.compositionRulesOpen : styles.compositionRulesCollapsed
            } ${structureSceneConfig.rulesStyle.top !== "auto" ? styles.compositionRulesTopAnchored : ""}`}
            style={structureSceneConfig.rulesStyle}
          >
            <button
              type="button"
              className={styles.compositionRulesToggle}
              onClick={() => setIsCompositionRulesOpen((currentValue) => !currentValue)}
              aria-expanded={isCompositionRulesOpen}
            >
              <span className={styles.compositionRulesTitle}>composition rules</span>
              <span className={styles.compositionRulesToggleLabel}>
                {isCompositionRulesOpen ? "ascunde" : "arată"}
              </span>
            </button>
            <div
              className={`${styles.compositionRulesBody} ${
                isCompositionRulesOpen ? styles.compositionRulesBodyOpen : styles.compositionRulesBodyClosed
              }`}
              aria-hidden={!isCompositionRulesOpen}
            >
              <ul>
                <li>grid · {structureSceneConfig.structure.grid}</li>
                <li>subject · {structureSceneConfig.structure.subjectPosition}</li>
                <li>symmetry · {structureSceneConfig.structure.symmetryState}</li>
                <li>center · {structureSceneConfig.structure.centerState}</li>
                <li>grammar · {structureSceneConfig.shapeGrammar.ruleset.slice(0, 2).join(" / ") || "none"}</li>
                {clockDisplay ? <li>clock · {structureSceneConfig.clockPlacementLabel}</li> : null}
              </ul>
            </div>
          </div>
          <div
            className={`${styles.relationField} ${liveInfluenceMode ? styles[`relationField${liveInfluenceMode}`] : ""} ${structureSceneConfig.relationClass}`}
            aria-hidden="true"
          >
            <span className={styles.layerMarker}>LAYER · Relation Field</span>
            <span className={`${styles.axisLine} ${styles.axisPrimary}`} style={structureSceneConfig.relationAxisLayouts[0]} />
            <span className={`${styles.axisLine} ${styles.axisSecondary}`} style={structureSceneConfig.relationAxisLayouts[1]} />
            <span className={`${styles.axisLine} ${styles.axisDiagonal}`} style={structureSceneConfig.relationAxisLayouts[2]} />
            <span className={`${styles.relationLine} ${styles.relationLineOne}`} style={structureSceneConfig.relationLineLayouts[0]} />
            <span className={`${styles.relationLine} ${styles.relationLineTwo}`} style={structureSceneConfig.relationLineLayouts[1]} />
            <span className={`${styles.relationLine} ${styles.relationLineThree}`} style={structureSceneConfig.relationLineLayouts[2]} />
            <span className={`${styles.relationNode} ${styles.relationNodeOne}`} style={structureSceneConfig.relationNodeLayouts[0]} />
            <span className={`${styles.relationNode} ${styles.relationNodeTwo}`} style={structureSceneConfig.relationNodeLayouts[1]} />
            <span className={`${styles.relationNode} ${styles.relationNodeThree}`} style={structureSceneConfig.relationNodeLayouts[2]} />
            <span className={`${styles.relationNode} ${styles.relationNodeFour}`} style={structureSceneConfig.relationNodeLayouts[3]} />
            <span className={`${styles.relationNode} ${styles.relationNodeCenter}`} style={structureSceneConfig.relationCenterLayout} />
            {clockDisplay ? (
              <>
                <span className={`${styles.temporalRelationLine} ${styles.temporalRelationLineOne}`} style={structureSceneConfig.temporalLineLayouts[0]} />
                <span className={`${styles.temporalRelationLine} ${styles.temporalRelationLineTwo}`} style={structureSceneConfig.temporalLineLayouts[1]} />
                <span className={`${styles.temporalRelationPulse} ${styles.temporalRelationPulseOne}`} style={structureSceneConfig.temporalPulseLayouts[0]} />
                <span className={`${styles.temporalRelationPulse} ${styles.temporalRelationPulseTwo}`} style={structureSceneConfig.temporalPulseLayouts[1]} />
              </>
            ) : null}
          </div>
          <div className={styles.textFieldBackdrop} />
          <div
            className={`${styles.memoryField} ${liveInfluenceMode ? styles[`memoryField${liveInfluenceMode}`] : ""} ${structureSceneConfig.grammarMemoryClass}`}
            style={{ ...clockMotionDesign.memoryFieldStyle, ...structureSceneConfig.grammarMemoryStyle }}
            aria-hidden="true"
          >
            <span className={styles.layerMarker}>LAYER · Memory Field</span>
            {current.fragments.slice(0, 4).map((fragment, index) => (
              <span
                key={`${current.direction}-memory-fragment-${index}-${fragment}`}
                className={styles.memoryFragment}
                style={structureSceneConfig.memoryFragmentLayouts[index]}
              >
                {fragment}
              </span>
            ))}
            {current.keywords.slice(0, 3).map((keyword, index) => (
              <span
                key={`${current.direction}-memory-keyword-${index}-${keyword}`}
                className={styles.memoryTrace}
                style={structureSceneConfig.memoryTraceLayouts[index]}
              >
                {keyword}
              </span>
            ))}
          </div>
          <div
            className={`${styles.textConstellation} ${structureSceneConfig.grammarConstellationClass}`}
            style={{ ...clockMotionDesign.textConstellationStyle, ...structureSceneConfig.grammarConstellationStyle }}
            aria-hidden="true"
          >
            <span className={styles.layerMarker}>LAYER · Text Constellation</span>
            {current.fragments.map((fragment, index) => (
              <span
                key={`${current.direction}-fragment-${index}-${fragment}`}
                className={`${styles.floatingFragment} ${
                  liveInfluenceMode ? styles[`floatingFragment${liveInfluenceMode}`] : ""
                }`}
                style={structureSceneConfig.fragmentLayouts[index]}
              >
                {fragment}
              </span>
            ))}
            {current.keywords.slice(0, 6).map((keyword, index) => (
              <span
                key={`${current.direction}-keyword-${index}-${keyword}`}
                className={`${styles.keywordParticle} ${
                  liveInfluenceMode ? styles[`keywordParticle${liveInfluenceMode}`] : ""
                }`}
                style={structureSceneConfig.keywordLayouts[index]}
              >
                {keyword}
              </span>
            ))}
            {strayLetters.map((letter, index) => (
              <span
                key={`${current.direction}-stray-letter-${index}-${letter}`}
                className={`${styles.strayLetter} ${
                  liveInfluenceMode ? styles[`strayLetter${liveInfluenceMode}`] : ""
                }`}
                style={structureSceneConfig.strayLetterLayouts[index]}
              >
                {letter}
              </span>
            ))}
            {structureSceneConfig.shapeGrammar.rulesApplied.slice(0, 4).map((rule, index) => (
              <span
                key={`${current.direction}-grammar-rule-${rule}-${index}`}
                className={styles.grammarParticle}
                style={structureSceneConfig.grammarParticleLayouts[index]}
              >
                {rule}
              </span>
            ))}
            {clockDisplay ? (
              <>
                <span className={styles.temporalParticle} style={structureSceneConfig.temporalParticleLayouts[0]}>
                  {clockDisplay.hours}
                </span>
                <span className={styles.temporalParticle} style={structureSceneConfig.temporalParticleLayouts[1]}>
                  {clockDisplay.minutes}
                </span>
                <span className={styles.temporalParticle} style={structureSceneConfig.temporalParticleLayouts[2]}>
                  {clockDisplay.seconds}
                </span>
                <span className={styles.temporalParticle} style={structureSceneConfig.temporalParticleLayouts[3]}>
                  {clockDisplay.transition.replaceAll("_", " ")}
                </span>
              </>
            ) : null}
          </div>
          <div
            className={`${styles.textStageCenter} ${liveInfluenceMode ? styles[`textStageCenter${liveInfluenceMode}`] : ""} ${structureSceneConfig.centerClass}`}
            style={
              {
                ...structureSceneConfig.thoughtCenterStyle,
                ...structureSceneConfig.grammarCenterStyle,
                "--clock-accent": current.visual.accent,
                "--clock-ink": current.visual.ink,
                "--clock-background": current.visual.background,
              } as React.CSSProperties
            }
          >
            <span className={styles.centerLayerMarker}>LAYER · Thought Center</span>
            {structureSceneConfig.shapeGrammar.ruleset.includes("mirror") ? (
              <>
                <span className={styles.grammarCenterMirrorAxis} style={structureSceneConfig.centerMirrorAxisLayout} aria-hidden="true" />
                <span className={`${styles.grammarCenterMirrorMarker} ${styles.grammarCenterMirrorMarkerLeft}`} style={structureSceneConfig.centerMirrorMarkerLayouts[0]} aria-hidden="true" />
                <span className={`${styles.grammarCenterMirrorMarker} ${styles.grammarCenterMirrorMarkerRight}`} style={structureSceneConfig.centerMirrorMarkerLayouts[1]} aria-hidden="true" />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("repeat") ? (
              <>
                <span className={`${styles.grammarCenterRepeatEcho} ${styles.grammarCenterRepeatEchoOne}`} style={structureSceneConfig.centerRepeatEchoLayouts[0]} aria-hidden="true" />
                <span className={`${styles.grammarCenterRepeatEcho} ${styles.grammarCenterRepeatEchoTwo}`} style={structureSceneConfig.centerRepeatEchoLayouts[1]} aria-hidden="true" />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("merge") ? (
              <>
                <span className={styles.grammarCenterMergeBridge} style={structureSceneConfig.centerMergeBridgeLayout} aria-hidden="true" />
                <span className={`${styles.grammarCenterMergeNode} ${styles.grammarCenterMergeNodeLeft}`} style={structureSceneConfig.centerMergeNodeLayouts[0]} aria-hidden="true" />
                <span className={`${styles.grammarCenterMergeNode} ${styles.grammarCenterMergeNodeRight}`} style={structureSceneConfig.centerMergeNodeLayouts[1]} aria-hidden="true" />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("split") ? (
              <>
                <span className={styles.grammarCenterSplitAxis} style={structureSceneConfig.centerSplitAxisLayout} aria-hidden="true" />
                <span className={`${styles.grammarCenterSplitNode} ${styles.grammarCenterSplitNodeLeft}`} style={structureSceneConfig.centerSplitNodeLayouts[0]} aria-hidden="true" />
                <span className={`${styles.grammarCenterSplitNode} ${styles.grammarCenterSplitNodeRight}`} style={structureSceneConfig.centerSplitNodeLayouts[1]} aria-hidden="true" />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("rotate") ? (
              <>
                <span className={`${styles.grammarCenterRotateArc} ${styles.grammarCenterRotateArcOne}`} style={structureSceneConfig.centerRotateArcLayouts[0]} aria-hidden="true" />
                <span className={`${styles.grammarCenterRotateArc} ${styles.grammarCenterRotateArcTwo}`} style={structureSceneConfig.centerRotateArcLayouts[1]} aria-hidden="true" />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("translate") ? (
              <>
                <span className={`${styles.grammarCenterTranslateTrail} ${styles.grammarCenterTranslateTrailOne}`} style={structureSceneConfig.centerTranslateTrailLayouts[0]} aria-hidden="true" />
                <span className={`${styles.grammarCenterTranslateTrail} ${styles.grammarCenterTranslateTrailTwo}`} style={structureSceneConfig.centerTranslateTrailLayouts[1]} aria-hidden="true" />
                <span className={`${styles.grammarCenterTranslateMarker} ${styles.grammarCenterTranslateMarkerOne}`} style={structureSceneConfig.centerTranslateMarkerLayouts[0]} aria-hidden="true" />
                <span className={`${styles.grammarCenterTranslateMarker} ${styles.grammarCenterTranslateMarkerTwo}`} style={structureSceneConfig.centerTranslateMarkerLayouts[1]} aria-hidden="true" />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.ruleset.includes("fragment") ? (
              <>
                <span className={`${styles.grammarCenterFragmentShard} ${styles.grammarCenterFragmentShardOne}`} style={structureSceneConfig.centerFragmentShardLayouts[0]} aria-hidden="true" />
                <span className={`${styles.grammarCenterFragmentShard} ${styles.grammarCenterFragmentShardTwo}`} style={structureSceneConfig.centerFragmentShardLayouts[1]} aria-hidden="true" />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.rulesApplied.includes("add") ? (
              <>
                <span className={`${styles.grammarCenterAccent} ${styles.grammarCenterAccentOne}`} style={structureSceneConfig.centerAccentLayouts[0]} aria-hidden="true" />
                <span className={`${styles.grammarCenterAccent} ${styles.grammarCenterAccentTwo}`} style={structureSceneConfig.centerAccentLayouts[1]} aria-hidden="true" />
              </>
            ) : null}
            {structureSceneConfig.shapeGrammar.rulesApplied.includes("subtract") ? (
              <>
                <span className={`${styles.grammarCenterCut} ${styles.grammarCenterCutOne}`} style={structureSceneConfig.centerCutLayouts[0]} aria-hidden="true" />
                <span className={`${styles.grammarCenterCut} ${styles.grammarCenterCutTwo}`} style={structureSceneConfig.centerCutLayouts[1]} aria-hidden="true" />
              </>
            ) : null}
            {clockDisplay ? (
              <>
                <span
                  className={`${styles.clockCenterMeta} ${
                    liveInfluenceMode ? styles[`clockCenterMeta${liveInfluenceMode}`] : ""
                  }`}
                >
                  {clockDisplay.format} · {clockDisplay.visualStyle.replaceAll("_", " ")}
                </span>
                <div className={styles.clockCenterDigits} aria-label="MindSlice Clock design trace">
                  <span>{clockDisplay.hours}</span>
                  <span className={styles.clockCenterSeparator}>:</span>
                  <span>{clockDisplay.minutes}</span>
                  <span className={styles.clockCenterSeparator}>:</span>
                  <span>{clockDisplay.seconds}</span>
                </div>
                <div className={styles.clockCenterSignalRow}>
                  <span>{clockDisplay.attentionAnchor.replaceAll("_", " ")}</span>
                  <span>{clockDisplay.transition.replaceAll("_", " ")}</span>
                </div>
              </>
            ) : null}
            <span className={styles.overlayLabel}>Din fișierul Slices</span>
            <strong>{current.direction}</strong>
            {structureSceneConfig.shapeGrammar.rulesApplied.slice(0, 2).map((rule, index) => (
              <span
                key={`${current.direction}-center-grammar-${rule}-${index}`}
                className={`${styles.grammarCenterToken} ${styles[`grammarCenterToken${index + 1}`]}`}
                style={structureSceneConfig.centerTokenLayouts[index]}
              >
                {rule}
              </span>
            ))}
            <p>{thoughtCenterFragment}</p>
          </div>
        </div>
      </div>
      <div className={styles.cornerSignature}>
        <strong>O felie de gândire</strong>
        <span>Marc, Ciprian-Marcel</span>
      </div>
      {isThoughtOverlayVisible && (!isThoughtOverlayDismissed || isThoughtOverlayClosing) ? (
        <div
          className={`${styles.thoughtOverlay} ${interference ? styles.thoughtOverlayInterference : ""} ${
            isThoughtOverlayClosing ? styles.thoughtOverlayClosing : ""
          }`}
          style={structureSceneConfig.thoughtOverlayStyle}
        >
          <>
            <div className={styles.thoughtOverlayLabelPlate}>
              <span className={styles.overlayLabel}>Acum mă gândesc la</span>
            </div>
            <div key={thoughtAnimationKey} className={styles.thoughtOverlayTextStack}>
              <div className={styles.thoughtOverlayTextPlate}>
                <p key={thoughtAnimationKey} className={styles.typewriterText}>
                  {thoughtOverlayText}
                </p>
              </div>
              <button
                type="button"
                className={styles.thoughtOverlayDismiss}
                onClick={handleThoughtOverlayDismiss}
              >
                Vreau să văd felia de gând
              </button>
            </div>
          </>
        </div>
      ) : null}
      {liveAiResponseLines.length ? (
        <div
          className={`${styles.liveAiResponseOverlay} ${
            isAiResponseOpen ? styles.liveAiResponseOverlayOpen : styles.liveAiResponseOverlayCollapsed
          }`}
        >
          <button
            type="button"
            className={styles.liveAiResponseToggle}
            onClick={() => setIsAiResponseOpen((currentValue) => !currentValue)}
            aria-expanded={isAiResponseOpen}
          >
            <span className={styles.liveAiResponseLabel}>Artist AI răspunde</span>
            <span className={styles.liveAiResponseToggleLabel}>
              {isAiResponseOpen ? "ascunde" : "arată"}
            </span>
          </button>
          <div
            className={`${styles.liveAiResponseBody} ${
              isAiResponseOpen ? styles.liveAiResponseBodyOpen : styles.liveAiResponseBodyClosed
            }`}
            aria-hidden={!isAiResponseOpen}
          >
            <div className={styles.liveAiResponseStack}>
              {liveAiResponseLines.map((line, index) => (
                <p key={`${interference?.sourceId}-ai-response-${index}-${line}`}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const svgEngineControls = (
    <>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={activeVisualDebugMode === "full" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualDebugMode("full")}
        >
          full
        </button>
        <button
          type="button"
          className={activeVisualDebugMode === "deviation" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualDebugMode("deviation")}
        >
          deviation
        </button>
        <button
          type="button"
          className={activeVisualDebugMode === "structure_only" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualDebugMode("structure_only")}
        >
          structure
        </button>
        <button
          type="button"
          className={activeVisualDebugMode === "scenario_only" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualDebugMode("scenario_only")}
        >
          scenario
        </button>
        <button
          type="button"
          className={activeVisualDebugMode === "color_only" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualDebugMode("color_only")}
        >
          color
        </button>
        <button
          type="button"
          className={activeVisualDebugMode === "composition_only" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualDebugMode("composition_only")}
        >
          composition
        </button>
      </div>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={activeVisualPreset === "CONTROL_CALM" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualPreset("CONTROL_CALM")}
        >
          control calm
        </button>
        <button
          type="button"
          className={activeVisualPreset === "DEVIATION_OF_THOUGHT" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualPreset("DEVIATION_OF_THOUGHT")}
        >
          deviation thought
        </button>
        <button
          type="button"
          className={activeVisualPreset === "FRAGMENTED_MEANING" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualPreset("FRAGMENTED_MEANING")}
        >
          fragmented meaning
        </button>
        <button
          type="button"
          className={activeVisualPreset === "CONSTELLATION_MEMORY" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualPreset("CONSTELLATION_MEMORY")}
        >
          constellation memory
        </button>
        <button
          type="button"
          className={activeVisualPreset === "ATTENTION_FOCUS" ? styles.secondary : styles.ghost}
          onClick={() => setActiveVisualPreset("ATTENTION_FOCUS")}
        >
          attention focus
        </button>
      </div>
      <div className={styles.buttonRow}>
        <button
          type="button"
          className={activeBackgroundMode === "auto" ? styles.secondary : styles.ghost}
          onClick={() => setActiveBackgroundMode("auto")}
        >
          auto bg
        </button>
        <button
          type="button"
          className={activeBackgroundMode === "triangulation" ? styles.secondary : styles.ghost}
          onClick={() => setActiveBackgroundMode("triangulation")}
        >
          triangulation
        </button>
        <button
          type="button"
          className={activeBackgroundMode === "pattern" ? styles.secondary : styles.ghost}
          onClick={() => setActiveBackgroundMode("pattern")}
        >
          pattern
        </button>
        <button
          type="button"
          className={activeBackgroundMode === "flat_abstract_pattern" ? styles.secondary : styles.ghost}
          onClick={() => setActiveBackgroundMode("flat_abstract_pattern")}
        >
          flat abstract
        </button>
        <button
          type="button"
          className={activeBackgroundMode === "isometric_pattern" ? styles.secondary : styles.ghost}
          onClick={() => setActiveBackgroundMode("isometric_pattern")}
        >
          isometric
        </button>
        <button
          type="button"
          className={activeBackgroundMode === "zigzag_pattern" ? styles.secondary : styles.ghost}
          onClick={() => setActiveBackgroundMode("zigzag_pattern")}
        >
          zigzag
        </button>
        <button
          type="button"
          className={activeBackgroundMode === "retro_grid_pattern" ? styles.secondary : styles.ghost}
          onClick={() => setActiveBackgroundMode("retro_grid_pattern")}
        >
          retro grid
        </button>
      </div>
    </>
  );

  const svgEngineSection = (
    <section className={styles.canvasCard}>
      <span className={styles.panelMarker}>PANEL · Visual Engine SVG</span>
      {safeSvgString ? (
        <>
          {svgEngineControls}
          <div
            className={styles.svgEngineStage}
            dangerouslySetInnerHTML={{ __html: safeSvgString }}
          />
          {svgVNextSuccess && svgVNextPipeline ? (
            <div className={styles.svgEngineLegend}>
              <span>mode: {activeVisualDebugMode}</span>
              <span>preset: {activeVisualPreset}</span>
              <span>background: {svgVNextPipeline.background_layer_selection.active_kind}</span>
              <span>grammar: {svgVNextPipeline.background_layer_selection.grammar_profile ?? "none"}</span>
              <span>bg reason: {svgVNextPipeline.background_selection_telemetry.reason ?? "none"}</span>
              <span>bg score: {svgVNextPipeline.background_selection_telemetry.score ?? "n/a"}</span>
              <span>bg fallback: {svgVNextPipeline.background_selection_telemetry.fallback_used ? "yes" : "no"}</span>
              <span>audit: {svgVNextPipeline.audit_result.status}</span>
              <span>warnings: {svgVNextPipeline.audit_result.warnings.length}</span>
              <span>runtime: {runtimeBootStatus.runtime_ready ? "ready" : "fallback"}</span>
              <span>modules: {runtimeBootStatus.active_modules_count}</span>
              <span>architecture: {runtimeBootStatus.audit_score ?? "n/a"}</span>
              <span>mount: safe svg string</span>
              <span>source: visual pipeline controller vNext</span>
              <span>modes: {svgVNextPipeline.conceptual_preset.conceptual_modes.join(" / ") || "none"}</span>
              <span>
                scenario:{" "}
                {svgVNextPipeline.scenario_output.scenario_output.spatial_sequence
                  .map((sequence) => sequence.id)
                  .join(" / ") ||
                  "none"}
              </span>
              <span>
                color: {svgVNextPipeline.color_output.color_output.palette.map((entry) => entry.role).join(" / ")}
              </span>
              <span>
                composition: focus {Math.round(svgVNextPipeline.composition_output.focus_field.intensity * 100)}%
              </span>
            </div>
          ) : (
            <div className={styles.svgEngineLegend}>
              <span>mode: diagnostic</span>
              <span>runtime: {runtimeBootStatus.runtime_ready ? "ready" : "fallback"}</span>
              <span>source: visual error boundary</span>
              <span>recovery: {visualErrorBoundaryResult?.recovery_action ?? "show_diagnostic_panel"}</span>
              <span>error: {visualDiagnosticMessage}</span>
            </div>
          )}
        </>
      ) : svgControllerSuccess && svgStructureOutput && svgScenarioOutput && svgColorOutput && svgCompositionOutput && svgCanvas ? (
        <>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={activeVisualDebugMode === "full" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualDebugMode("full")}
            >
              full
            </button>
            <button
              type="button"
              className={activeVisualDebugMode === "deviation" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualDebugMode("deviation")}
            >
              deviation
            </button>
            <button
              type="button"
              className={activeVisualDebugMode === "structure_only" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualDebugMode("structure_only")}
            >
              structure
            </button>
            <button
              type="button"
              className={activeVisualDebugMode === "scenario_only" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualDebugMode("scenario_only")}
            >
              scenario
            </button>
            <button
              type="button"
              className={activeVisualDebugMode === "color_only" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualDebugMode("color_only")}
            >
              color
            </button>
            <button
              type="button"
              className={activeVisualDebugMode === "composition_only" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualDebugMode("composition_only")}
            >
              composition
            </button>
          </div>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={activeVisualPreset === "CONTROL_CALM" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualPreset("CONTROL_CALM")}
            >
              control calm
            </button>
            <button
              type="button"
              className={activeVisualPreset === "DEVIATION_OF_THOUGHT" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualPreset("DEVIATION_OF_THOUGHT")}
            >
              deviation thought
            </button>
            <button
              type="button"
              className={activeVisualPreset === "FRAGMENTED_MEANING" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualPreset("FRAGMENTED_MEANING")}
            >
              fragmented meaning
            </button>
            <button
              type="button"
              className={activeVisualPreset === "CONSTELLATION_MEMORY" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualPreset("CONSTELLATION_MEMORY")}
            >
              constellation memory
            </button>
            <button
              type="button"
              className={activeVisualPreset === "ATTENTION_FOCUS" ? styles.secondary : styles.ghost}
              onClick={() => setActiveVisualPreset("ATTENTION_FOCUS")}
            >
              attention focus
            </button>
          </div>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={activeBackgroundMode === "auto" ? styles.secondary : styles.ghost}
              onClick={() => setActiveBackgroundMode("auto")}
            >
              auto bg
            </button>
            <button
              type="button"
              className={activeBackgroundMode === "triangulation" ? styles.secondary : styles.ghost}
              onClick={() => setActiveBackgroundMode("triangulation")}
            >
              triangulation
            </button>
            <button
              type="button"
              className={activeBackgroundMode === "pattern" ? styles.secondary : styles.ghost}
              onClick={() => setActiveBackgroundMode("pattern")}
            >
              pattern
            </button>
            <button
              type="button"
              className={activeBackgroundMode === "flat_abstract_pattern" ? styles.secondary : styles.ghost}
              onClick={() => setActiveBackgroundMode("flat_abstract_pattern")}
            >
              flat abstract
            </button>
            <button
              type="button"
              className={activeBackgroundMode === "isometric_pattern" ? styles.secondary : styles.ghost}
              onClick={() => setActiveBackgroundMode("isometric_pattern")}
            >
              isometric
            </button>
            <button
              type="button"
              className={activeBackgroundMode === "zigzag_pattern" ? styles.secondary : styles.ghost}
              onClick={() => setActiveBackgroundMode("zigzag_pattern")}
            >
              zigzag
            </button>
            <button
              type="button"
              className={activeBackgroundMode === "retro_grid_pattern" ? styles.secondary : styles.ghost}
              onClick={() => setActiveBackgroundMode("retro_grid_pattern")}
            >
              retro grid
            </button>
          </div>
          <div className={styles.svgEngineStage}>
            <svg
              viewBox={`0 0 ${svgCanvas.width} ${svgCanvas.height}`}
              className={styles.svgEngineSvg}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="MindSlice visual engines SVG"
            >
              <rect
                x={0}
                y={0}
                width={svgCanvas.width}
                height={svgCanvas.height}
                fill={svgColorOutput.palette.find((entry) => entry.role === "background")?.color ?? current.visual.background}
              />
              {svgPatternLayer && svgPatternLayer.defs.length > 0 ? (
                <defs>{svgPatternLayer.defs.map((def) => renderPatternSvgDef(def))}</defs>
              ) : null}
              {svgFlatAbstractPatternLayer && svgFlatAbstractPatternLayer.defs.length > 0 ? (
                <defs>{svgFlatAbstractPatternLayer.defs.map((def) => renderFlatAbstractSvgDef(def))}</defs>
              ) : null}
              {svgTriangulationLayer
                ? renderTriangulationSvgNode(svgTriangulationLayer, "svg-triangulation-layer")
                : null}
              {svgFlatAbstractPatternLayer ? (
                <g id="mind_slice_flat_abstract_pattern">
                  {svgFlatAbstractPatternLayer.children.map((node, index) =>
                    renderFlatAbstractSvgNode(node, `svg-flat-abstract-pattern-layer-${index}`),
                  )}
                </g>
              ) : null}
              {svgIsometricPatternLayer ? (
                <g id="mind_slice_isometric_pattern">
                  {svgIsometricPatternLayer.children.map((node, index) =>
                    renderIsometricSvgNode(node, `svg-isometric-pattern-layer-${index}`),
                  )}
                </g>
              ) : null}
              {svgZigZagPatternLayer ? (
                <g id="mind_slice_zigzag_pattern">
                  {svgZigZagPatternLayer.children.map((node, index) =>
                    renderZigZagSvgNode(node, `svg-zigzag-pattern-layer-${index}`),
                  )}
                </g>
              ) : null}
              {svgRetroGridPatternLayer ? (
                <g id="mind_slice_retro_grid_pattern">
                  {svgRetroGridPatternLayer.children.map((node, index) =>
                    renderRetroGridSvgNode(node, `svg-retro-grid-pattern-layer-${index}`),
                  )}
                </g>
              ) : null}
              {(activeVisualDebugView?.guides ?? []).map((guide) => {
                if ("start" in guide && "end" in guide) {
                  return (
                    <line
                      key={guide.id}
                      x1={guide.start.x}
                      y1={guide.start.y}
                      x2={guide.end.x}
                      y2={guide.end.y}
                      stroke={guide.stroke}
                      strokeWidth={guide.stroke_width}
                      opacity={guide.opacity}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                }

                if ("point" in guide) {
                  return (
                    <g key={guide.id} opacity={guide.opacity}>
                      <circle
                        cx={guide.point.x}
                        cy={guide.point.y}
                        r={guide.size}
                        fill={guide.fill}
                        stroke={guide.stroke}
                        strokeWidth={guide.stroke_width}
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  );
                }

                return (
                  <rect
                    key={guide.id}
                    x={guide.center.x - guide.width / 2}
                    y={guide.center.y - guide.height / 2}
                    width={guide.width}
                    height={guide.height}
                    rx={guide.radius ?? 0}
                    fill={guide.fill}
                    stroke={guide.stroke}
                    strokeWidth={guide.stroke_width}
                    opacity={guide.opacity}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {svgBasePatternGroups.length > 0 ? (
                <g id={svgPatternLayer?.id ?? "mind_slice_patterns"}>
                  {svgBasePatternGroups.map((group, index) =>
                    renderPatternSvgNode(group, `svg-pattern-group-${index}`),
                  )}
                </g>
              ) : null}
              {(activeVisualDebugMode === "full" || activeVisualDebugMode === "deviation") && svgScene
                ? svgScene.relations.map((element, index) => {
                    if (element.type === "thin_line") {
                      return (
                        <line
                          key={`svg-engine-line-${element.from}-${element.to}-${index}`}
                          x1={element.x1}
                          y1={element.y1}
                          x2={element.x2}
                          y2={element.y2}
                          stroke={element.stroke}
                          strokeWidth={Math.max(1, element.stroke_width)}
                          opacity={element.opacity}
                          vectorEffect="non-scaling-stroke"
                        />
                      );
                    }

                    return (
                      <g key={`svg-engine-marker-${index}`} opacity={element.opacity}>
                        <circle
                          cx={element.at.x}
                          cy={element.at.y}
                          r={8}
                          fill={hexToRgba(current.visual.accent, 0.1)}
                          stroke={current.visual.accent}
                          strokeWidth={1.2}
                          vectorEffect="non-scaling-stroke"
                        />
                      </g>
                    );
                  })
                : null}
              {(activeVisualDebugMode === "full" || activeVisualDebugMode === "deviation") && svgScene
                ? svgScene.forms.map((form, index) => {
                    return renderSvgEngineShape(
                      form,
                      index,
                      current.visual.ink,
                      current.visual.accent,
                      current.visual.background,
                    );
                })
                : null}
              {svgMicroGlyphGroup ? renderPatternSvgNode(svgMicroGlyphGroup, "svg-pattern-micro-glyphs") : null}
              {svgTextLayout ? (
                <g aria-label="MindSlice text layout">
                  {svgTextLayout.peripheral_text.map((item) => (
                    <text
                      key={item.id}
                      x={item.x}
                      y={item.y}
                      textAnchor={item.anchor}
                      dominantBaseline="middle"
                      fill={
                        item.role === "fragment"
                          ? hexToRgba(current.visual.ink, item.opacity)
                          : item.role === "stray_letter"
                            ? hexToRgba(current.visual.ink, item.opacity)
                            : item.role === "grammar_particle"
                              ? hexToRgba(current.visual.accent, item.opacity)
                              : item.role === "temporal_particle"
                                ? hexToRgba(current.visual.ink, item.opacity)
                          : hexToRgba(current.visual.accent, item.opacity)
                      }
                      fontSize={item.font_size}
                      fontFamily={
                        item.role === "fragment"
                          ? "Georgia, 'Times New Roman', serif"
                          : item.role === "stray_letter"
                            ? "Georgia, 'Times New Roman', serif"
                          : "ui-monospace, SFMono-Regular, Menlo, monospace"
                      }
                      letterSpacing={
                        item.role === "fragment"
                          ? "0.03em"
                          : item.role === "stray_letter"
                            ? "0.02em"
                            : item.role === "temporal_particle"
                              ? "0.12em"
                              : "0.16em"
                      }
                      transform={`rotate(${item.rotation} ${item.x} ${item.y})`}
                    >
                      {compactSvgText(
                        item.role === "keyword" || item.role === "grammar_particle"
                          ? item.text.toUpperCase()
                          : item.text,
                        item.role === "fragment"
                          ? 38
                          : item.role === "temporal_particle"
                            ? 24
                            : item.role === "grammar_particle"
                              ? 16
                              : 18,
                      )}
                    </text>
                  ))}
                  <g
                    transform={`translate(${svgTextLayout.center.x} ${svgTextLayout.center.y}) rotate(${svgTextLayout.center.rotation})`}
                  >
                    <ellipse
                      cx={0}
                      cy={0}
                      rx={svgTextLayout.center.width / 2}
                      ry={svgTextLayout.center.height / 2}
                      fill={hexToRgba(current.visual.background, 0.78)}
                      stroke={hexToRgba(current.visual.ink, 0.12)}
                      strokeWidth={1.4}
                      vectorEffect="non-scaling-stroke"
                    />
                    <ellipse
                      cx={26}
                      cy={22}
                      rx={48}
                      ry={42}
                      fill={hexToRgba(current.visual.accent, 0.12)}
                    />
                    <ellipse
                      cx={0}
                      cy={0}
                      rx={svgTextLayout.center.width / 2 - 22}
                      ry={svgTextLayout.center.height / 2 - 22}
                      fill="none"
                      stroke={hexToRgba(current.visual.accent, 0.2)}
                      strokeWidth={1}
                      strokeDasharray="5 8"
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={0}
                      y={-58}
                      textAnchor="middle"
                      fill={hexToRgba(current.visual.accent, 0.62)}
                      fontSize={12}
                      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                      letterSpacing="0.18em"
                    >
                      DIN FISIERUL SLICES
                    </text>
                    <text
                      x={0}
                      y={-28}
                      textAnchor="middle"
                      fill={current.visual.ink}
                      fontSize={22}
                      fontFamily="Georgia, 'Times New Roman', serif"
                      fontWeight={700}
                    >
                      {compactSvgText(svgTextLayout.center.title, 18)}
                    </text>
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fill={hexToRgba(current.visual.ink, 0.58)}
                      fontSize={13}
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                    >
                      {compactSvgText(svgTextLayout.center.fragment, 24)}
                    </text>
                    <text
                      x={0}
                      y={44}
                      textAnchor="middle"
                      fill={hexToRgba(current.visual.ink, 0.44)}
                      fontSize={12}
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                    >
                      {svgTextLayout.center.lines.slice(0, 2).map((line, index) => (
                        <tspan key={`${line}-${index}`} x={0} dy={index === 0 ? 0 : 18}>
                          {compactSvgText(line, 34)}
                        </tspan>
                      ))}
                    </text>
                  </g>
                </g>
              ) : null}
              <text
                x={48}
                y={56}
                fill={hexToRgba(current.visual.ink, 0.72)}
                fontSize={18}
                letterSpacing="0.12em"
              >
                {svgStructureOutput.grid}
              </text>
              <text
                x={48}
                y={82}
                fill={hexToRgba(current.visual.accent, 0.64)}
                fontSize={13}
                letterSpacing="0.18em"
              >
                {svgScenarioOutput.progression_flow[0]?.id ?? "progression"}
              </text>
              <text
                x={svgCanvas.width - 48}
                y={56}
                fill={hexToRgba(current.visual.ink, 0.62)}
                fontSize={14}
                letterSpacing="0.14em"
                textAnchor="end"
              >
                {svgScenarioOutput.spatial_sequence[0]?.id ?? "scenario"}
              </text>
              <text
                x={svgCanvas.width - 48}
                y={80}
                fill={hexToRgba(current.visual.accent, 0.58)}
                fontSize={12}
                letterSpacing="0.16em"
                textAnchor="end"
              >
                {`focus ${Math.round(svgCompositionOutput.focus_field.radius)}`}
              </text>
            </svg>
          </div>
          <div className={styles.svgEngineLegend}>
            <span>mode: {activeVisualDebugMode}</span>
            <span>preset: {activeVisualPreset}</span>
            <span>literary: {svgConceptualPreset?.literary_movement ?? "none"}</span>
            <span>art: {svgConceptualPreset?.art_movement ?? "none"}</span>
            <span>guides: {activeVisualDebugView?.summary.guide_count ?? 0}</span>
            <span>structure: {svgStructureOutput.grid}</span>
            <span>forms: {svgScene?.forms.length ?? 0}</span>
            <span>relations: {svgScene?.relations.length ?? 0}</span>
            <span>source: visual pipeline controller</span>
            <span>runtime: {runtimeBootStatus.runtime_ready ? "ready" : "fallback"}</span>
            <span>modes: {svgConceptualPreset?.conceptual_modes.join(" / ") ?? "none"}</span>
            <span>scenario: {svgScenarioOutput.spatial_sequence.map((sequence) => sequence.id).join(" / ") || "none"}</span>
            <span>color: {svgColorOutput.palette.map((entry) => entry.role).join(" / ")}</span>
            <span>composition: focus {Math.round(svgCompositionOutput.focus_field.strength * 100)}%</span>
            <span>
              note: {activeVisualDebugMode === "deviation"
                ? "Deviation mode applied before SVG render."
                : activeVisualDebugView?.summary.note ?? "Final SVG render."}
            </span>
          </div>
        </>
      ) : (
        <div className={styles.svgEngineEmpty}>
          {!runtimeBootStatus.runtime_ready ? (
            <div className={styles.svgEngineLegend}>
              <span>runtime: fallback</span>
              <span>{runtimeBootResult.status === "fallback" ? runtimeBootResult.runtime_status.user_safe_message : ""}</span>
            </div>
          ) : null}
          <p>
            {safeSvgMountResult?.status === "fail"
              ? `SVG-ul vNext a fost blocat de SafeSVGMount: ${safeSvgMountResult.message}`
              : svgVNextFailure
              ? `Pipeline-ul vNext nu a putut construi scena: ${svgVNextFailure}`
              : "SVG-ul motoarelor vizuale apare când controllerul vizual poate construi scena din slice-ul curent."}
          </p>
        </div>
      )}
    </section>
  );

  return (
    <>
      <section className={styles.liveCuratorNote}>
        <span className={styles.panelMarker}>PANEL · Live Curator Note</span>
        <div>
          <p className={styles.eyebrow}>Curated Live Field</p>
          <h2>Scena în care gândirea devine tipografie activă</h2>
        </div>
        <p>
          Câmpul live expune fragmente, ecouri și deviații în timp real. Jurnalul nu stă
          separat de scenă: îl bruiază, îl îndoaie și îi mută centrul de greutate.
        </p>
      </section>

      {sliceCanvasSection}
      {svgEngineSection}

      <div className={styles.statusBar}>
        <span className={styles.panelMarker}>PANEL · Live Status Bar</span>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Stare curentă</span>
          <strong className={styles.statusValue}>
            {isActive ? "artistul gândește live" : "în așteptare"}
          </strong>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Sursa thinking</span>
          <strong className={styles.statusValue}>{engineMode}</strong>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Direcție</span>
          <strong key={current.direction} className={styles.statusValue}>
            {current.direction}
          </strong>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>MindSlice Clock</span>
          <strong className={styles.statusValue}>
            {clockDisplay
              ? `${clockDisplay.hours}:${clockDisplay.minutes}:${clockDisplay.seconds}`
              : "clock fail"}
          </strong>
          <span className={styles.statusLabel}>
            {clockDisplay
              ? `${clockDisplay.visualStyle} · ${clockDisplay.transition}`
              : "display invalid"}
          </span>
        </div>
      </div>

      {engineProfile ? (
        <section className={styles.engineProfilePanel}>
          <span className={styles.panelMarker}>PANEL · Engine Profile</span>
          <div className={styles.engineProfileHeading}>
            <p className={styles.eyebrow}>Alpha Engine Profile</p>
            <h2>Motorul live se descrie singur</h2>
            <p>
              În alpha, păstrăm motorul inspectabil. Vrem să vedem clar după ce reguli
              funcționează și ce contaminare este activă în scenă.
            </p>
          </div>
          <div className={styles.engineProfileGrid}>
            <article>
              <span>Stage</span>
              <strong>{engineProfile.stage}</strong>
            </article>
            <article>
              <span>Generation</span>
              <strong>{engineProfile.generationStrategy}</strong>
            </article>
            <article>
              <span>Contamination</span>
              <strong>{engineProfile.contaminationStrategy}</strong>
            </article>
            <article>
              <span>OpenAI</span>
              <strong>
                {engineProfile.openaiStructuredGeneration === "active"
                  ? "structured refinement active"
                  : "local alpha engine"}
              </strong>
            </article>
          </div>
          <div className={styles.engineProfileColumns}>
            <article className={styles.engineProfileCard}>
              <span>Charter Axes</span>
              <ul>
                {engineProfile.charterAxes.map((axis) => (
                  <li key={axis}>{axis}</li>
                ))}
              </ul>
            </article>
            <article className={styles.engineProfileCard}>
              <span>Scene Constraints</span>
              <ul>
                {engineProfile.sceneConstraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </article>
            <article className={styles.engineProfileCard}>
              <span>Active Rule</span>
              <p>
                {engineProfile.activeContaminationRule ||
                  "Fără regulă de contaminare activă. Sistemul rulează pe câmpul live de bază."}
              </p>
            </article>
            <article className={styles.engineProfileCard}>
              <span>MindSlice Clock</span>
              <ul>
                <li>display: {clockDisplay ? `${clockDisplay.hours}:${clockDisplay.minutes}:${clockDisplay.seconds}` : "fail"}</li>
                <li>format: {clockDisplay?.format ?? "none"}</li>
                <li>stil: {clockDisplay?.visualStyle ?? "none"}</li>
                <li>ancoră: {clockDisplay?.attentionAnchor ?? "none"}</li>
                <li>tranziție: {clockDisplay?.transition ?? "none"}</li>
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      <section className={styles.alphaDebugPanel}>
        <span className={styles.panelMarker}>PANEL · Alpha Debug</span>
        <div className={styles.alphaDebugHeading}>
          <p className={styles.eyebrow}>Alpha Debug Panel</p>
          <h2>Semnalele interne ale feliei curente</h2>
          <p>
            Panoul acesta este strict pentru faza alpha: ne arată dacă motorul produce
            densitate, fractură, deriva și convergență într-un mod recognoscibil și coerent
            cu conceptul.
          </p>
        </div>
        <div className={styles.alphaDebugGrid}>
          <article>
            <span>Slice index</span>
            <strong>
              {currentIndex + 1} / {libraryLength}
            </strong>
          </article>
          <article>
            <span>Visual mode</span>
            <strong>{current.visual.mode}</strong>
          </article>
          <article>
            <span>Live influence</span>
            <strong>{liveInfluenceMode ?? "none"}</strong>
          </article>
          <article>
            <span>System memory</span>
            <strong>{systemState.modifiesSystem ? "concept-modified" : "base runtime"}</strong>
          </article>
          <article>
            <span>Density</span>
            <strong>{current.visual.density.toFixed(2)}</strong>
          </article>
          <article>
            <span>Wave</span>
            <strong>{current.visual.wave.toFixed(2)}</strong>
          </article>
          <article>
            <span>Fracture</span>
            <strong>{current.visual.fracture.toFixed(2)}</strong>
          </article>
          <article>
            <span>Drift</span>
            <strong>{current.visual.drift.toFixed(2)}</strong>
          </article>
          <article>
            <span>Convergence</span>
            <strong>{current.visual.convergence.toFixed(2)}</strong>
          </article>
          <article>
            <span>Motion</span>
            <strong>{current.motion}</strong>
          </article>
          <article>
            <span>Clock readability</span>
            <strong>{clockDisplay ? clockDisplay.runtime.scores.readability.toFixed(2) : "0.00"}</strong>
          </article>
        </div>
        <div className={styles.alphaDebugColumns}>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice Clock Runtime</span>
            <ul>
              <li>contaminare: {clockDisplay?.runtime.contaminationMode ?? "none"}</li>
              <li>acceptată: {clockDisplay?.runtime.acceptedContamination ? "da" : "nu"}</li>
              <li>iterații: {clockDisplay?.runtime.iterationCount ?? 0}</li>
              <li>format: {clockDisplay?.format ?? "none"}</li>
              <li>stil: {clockDisplay?.visualStyle ?? "none"}</li>
              <li>ancoră: {clockDisplay?.attentionAnchor ?? "none"}</li>
              <li>tranziție: {clockDisplay?.transition ?? "none"}</li>
              <li>clock valid: {clockDisplay?.runtime.isValidClockState ? "da" : "nu"}</li>
              <li>trece legea: {clockDisplay?.runtime.lawPassed ? "da" : "nu"}</li>
              <li>τr: {clockDisplay ? clockDisplay.runtime.thresholds.readability.toFixed(2) : "0.00"}</li>
              <li>τa: {clockDisplay ? clockDisplay.runtime.thresholds.attention.toFixed(2) : "0.00"}</li>
              <li>τs: {clockDisplay ? clockDisplay.runtime.thresholds.stability.toFixed(2) : "0.00"}</li>
              <li>τp: {clockDisplay ? clockDisplay.runtime.thresholds.perception.toFixed(2) : "0.00"}</li>
              <li>readability: {clockDisplay ? clockDisplay.runtime.scores.readability.toFixed(2) : "0.00"}</li>
              <li>attention: {clockDisplay ? clockDisplay.runtime.scores.attention.toFixed(2) : "0.00"}</li>
              <li>stability: {clockDisplay ? clockDisplay.runtime.scores.stability.toFixed(2) : "0.00"}</li>
              <li>perception: {clockDisplay ? clockDisplay.runtime.scores.perception.toFixed(2) : "0.00"}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Motorul scenei mentale</span>
            <ul>
              <li>
                starea câmpului:{" "}
                {thoughtScene.world.contamination.active ? "contaminat" : "câmp de bază"}
              </li>
              <li>graf de scenă: {thoughtScene.sceneGraph.entityCount} entități active</li>
              <li>sisteme: compoziție / atenție / tipografie / animație</li>
              <li>timeline: {Math.round(thoughtScene.timeline.cycleDuration / 1000)}s per ciclu</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Evaluarea gândului vizual</span>
            <ul>
              <li>sense: {current.triad.art.score.toFixed(2)} · {current.triad.art.label}</li>
              <li>organizare internă: {current.triad.design.score.toFixed(2)} · {current.triad.design.label}</li>
              <li>focalizare conceptuală: {current.triad.business.score.toFixed(2)} · {current.triad.business.label}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Palette & Materials</span>
            <ul>
              {current.palette.map((tone: string, index) => (
                <li key={`palette-${index}-${tone}`}>{tone}</li>
              ))}
              {current.materials.map((material: string, index) => (
                <li key={`material-${index}-${material}`}>{material}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Keywords</span>
            <ul>
              {current.keywords.map((keyword: string, index) => (
                <li key={`debug-keyword-${index}-${keyword}`}>{keyword}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Modificarea sistemului</span>
            <ul>
              <li>modifică sistemul: {systemState.modifiesSystem ? "da" : "nu"}</li>
              <li>concept sursă: {systemState.sourceConceptTitle ?? "niciunul"}</li>
              <li>stadiu sursă: {systemState.sourceStage ?? "niciunul"}</li>
              <li>influență preferată: {systemState.preferredInfluenceMode ?? "niciuna"}</li>
              <li>bias de probabilitate: {systemState.probabilityBias.toFixed(2)}</li>
              <li>deplasare a focalizării: {systemState.attentionShift.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Probabilități de sistem</span>
            <ul>
              <li>reutilizare de concept: {systemState.probabilities.conceptReuseWeight.toFixed(2)}</li>
              <li>prioritate semantică: {systemState.probabilities.semanticPriority.toFixed(2)}</li>
              <li>bias de convergență: {systemState.probabilities.convergenceBias.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Tipar de contaminare</span>
            <ul>
              <li>mod preferat: {systemState.contaminationPattern.preferredMode ?? "niciunul"}</li>
              <li>resistance: {systemState.contaminationPattern.resistanceWeight.toFixed(2)}</li>
              <li>recurrence: {systemState.contaminationPattern.recurrenceWeight.toFixed(2)}</li>
              <li>
                acceptă interferență externă: {systemState.contaminationPattern.acceptsExternalInterference ? "da" : "nu"}
              </li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Distribuția focalizării</span>
            <ul>
              <li>ancoră: {systemState.attentionDistribution.anchorWeight.toFixed(2)}</li>
              <li>periferie: {systemState.attentionDistribution.peripheralWeight.toFixed(2)}</li>
              <li>câmp de memorie: {systemState.attentionDistribution.memoryFieldWeight.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Main Loop</span>
            <ul>
              <li>mărime IDEA_SET: {ideaSetMainLoop.totalIdeas}</li>
              <li>index idee activă: {ideaSetMainLoop.activeIdeaIndex + 1}</li>
              <li>idei rezolvate: {ideaSetMainLoop.resolvedCount}</li>
              <li>idei în iterație: {ideaSetMainLoop.iteratingCount}</li>
              <li>idei terminate: {ideaSetMainLoop.terminatedCount}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Pâlnia debuggerului</span>
            <ul>
              <li>total: {engineDebuggerReport.funnel.total}</li>
              <li>în iterație: {engineDebuggerReport.funnel.iterating}</li>
              <li>rezolvate: {engineDebuggerReport.funnel.resolved}</li>
              <li>în pool: {engineDebuggerReport.funnel.pooled}</li>
              <li>stocate: {engineDebuggerReport.funnel.stored}</li>
              <li>canonice: {engineDebuggerReport.funnel.canonical}</li>
              <li>care schimbă sistemul: {engineDebuggerReport.funnel.systemChanging}</li>
              <li>rulări debug stocate: {debugRunCount}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Process Idea</span>
            <ul>
              <li>stare: {conceptProcess.status}</li>
              <li>acțiune următoare: {conceptProcess.nextAction}</li>
              <li>iterații: {conceptProcess.iterationCount}</li>
              <li>thinking state: {conceptProcess.thinkingEngine.state}</li>
              <li>thinking role: {conceptProcess.thinkingEngine.userRole}</li>
              <li>thinking identity: {conceptProcess.thinkingEngine.identityType}</li>
              <li>thinking structură: {conceptProcess.thinkingEngine.structure.toFixed(2)}</li>
              <li>thinking sens: {conceptProcess.thinkingEngine.sense.toFixed(2)}</li>
              <li>thinking atenție: {conceptProcess.thinkingEngine.attention.toFixed(2)}</li>
              <li>thinking coerență: {conceptProcess.thinkingEngine.coherence.toFixed(2)}</li>
              <li>presiune de memorie: {conceptProcess.interpretation.memoryPressure.toFixed(2)}</li>
              <li>
                presiune de contaminare: {conceptProcess.interpretation.contaminationPressure.toFixed(2)}
              </li>
              <li>
                contaminare: {conceptProcess.contamination.requestedMode} {"->"}{" "}
                {conceptProcess.contamination.appliedMode}
              </li>
              <li>acceptată: {conceptProcess.contamination.accepted ? "da" : "nu"}</li>
              <li>focalizare a iterației: {conceptProcess.iteration.iterationFocus}</li>
              <li>greutate a iterației: {conceptProcess.iteration.nextIterationWeight.toFixed(2)}</li>
              <li>
                praguri thinking: S {conceptProcess.thinkingEngine.thresholds.structure.toFixed(2)} / M{" "}
                {conceptProcess.thinkingEngine.thresholds.sense.toFixed(2)} / A{" "}
                {conceptProcess.thinkingEngine.thresholds.attention.toFixed(2)} / C{" "}
                {conceptProcess.thinkingEngine.thresholds.coherence.toFixed(2)}
              </li>
              <li>terminare: {conceptProcess.terminationReason}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Formarea conceptului</span>
            <ul>
              <li>stadiu: {conceptCandidate.stage}</li>
              <li>semantic: {conceptCandidate.coherenceSignals.semantic.toFixed(2)}</li>
              <li>vizual: {conceptCandidate.coherenceSignals.visual.toFixed(2)}</li>
              <li>cross-modal: {conceptCandidate.coherenceSignals.crossModal.toFixed(2)}</li>
              <li>axa de organizare internă: {conceptCandidate.evaluationAxes.structure.toFixed(2)}</li>
              <li>axa de sens: {conceptCandidate.evaluationAxes.sense.toFixed(2)}</li>
              <li>axa de focalizare conceptuală: {conceptCandidate.evaluationAxes.attention.toFixed(2)}</li>
              <li>axa de coerență: {conceptCandidate.evaluationAxes.coherence.toFixed(2)}</li>
              <li>teză: {conceptCandidate.thesisDraft}</li>
              <li>identitate vizuală: {conceptCandidate.visualIdentityDraft}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Validarea conceptului</span>
            <ul>
              <li>valid: {conceptValidation.isValidConcept ? "da" : "nu"}</li>
              <li>stare: {conceptValidation.resolutionStatus}</li>
              <li>τs organizare internă: {conceptValidation.thresholds.structure.toFixed(2)}</li>
              <li>τm sens: {conceptValidation.thresholds.sense.toFixed(2)}</li>
              <li>τa focalizare conceptuală: {conceptValidation.thresholds.attention.toFixed(2)}</li>
              <li>τc coerență: {conceptValidation.thresholds.coherence.toFixed(2)}</li>
              <li>
                stabilitate semantică: {conceptValidation.scores.semanticStability.toFixed(2)}
              </li>
              <li>
                consistență vizuală: {conceptValidation.scores.visualConsistency.toFixed(2)}
              </li>
              <li>
                cross-modal: {conceptValidation.scores.crossModalAlignment.toFixed(2)}
              </li>
              <li>
                cross-canon coherence: {conceptValidation.scores.crossCanonCoherence.toFixed(2)}
              </li>
              <li>
                time-art coherence: {conceptValidation.scores.timeArtCoherence.toFixed(2)}
              </li>
              <li>shape identity: {conceptValidation.scores.shapeIdentity.toFixed(2)}</li>
              <li>shape relation: {conceptValidation.scores.shapeRelation.toFixed(2)}</li>
              <li>shape tension: {conceptValidation.scores.shapeTension.toFixed(2)}</li>
              <li>shape attention: {conceptValidation.scores.shapeAttention.toFixed(2)}</li>
              <li>grammar coherence: {conceptValidation.scores.grammarCoherence.toFixed(2)}</li>
              <li>grammar transform: {conceptValidation.scores.grammarTransformation.toFixed(2)}</li>
              <li>grammar relation: {conceptValidation.scores.grammarRelation.toFixed(2)}</li>
              <li>grammar expressive: {conceptValidation.scores.grammarExpressivePower.toFixed(2)}</li>
              <li>
                metabolizare contaminare: {conceptValidation.scores.contaminationResolution.toFixed(2)}
              </li>
              <li>
                rezolvarea dilemei: {conceptValidation.scores.authorDilemmaResolution.toFixed(2)}
              </li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice ColorTheory Runtime</span>
            <ul>
              <li>layout hue: {engineDebuggerReport.colorTheory.compositionPalette?.hue ?? "none"}</li>
              <li>
                layout saturation: {engineDebuggerReport.colorTheory.compositionPalette?.saturation.toFixed(2) ?? "0.00"}
              </li>
              <li>
                layout brightness: {engineDebuggerReport.colorTheory.compositionPalette?.brightness.toFixed(2) ?? "0.00"}
              </li>
              <li>contaminare: {engineDebuggerReport.colorTheory.contaminationMode}</li>
              <li>acceptată: {engineDebuggerReport.colorTheory.acceptedContamination ? "da" : "nu"}</li>
              <li>iterații: {engineDebuggerReport.colorTheory.iterationCount}</li>
              <li>terminat: {engineDebuggerReport.colorTheory.terminated ? "da" : "nu"}</li>
              <li>motiv: {engineDebuggerReport.colorTheory.terminationReason}</li>
              <li>paletă validă: {engineDebuggerReport.colorTheory.isValidPalette ? "da" : "nu"}</li>
              <li>trece legea: {engineDebuggerReport.colorTheory.lawPassed ? "da" : "nu"}</li>
              <li>τh: {engineDebuggerReport.colorTheory.thresholds.hueStructure.toFixed(2)}</li>
              <li>τv: {engineDebuggerReport.colorTheory.thresholds.valueBalance.toFixed(2)}</li>
              <li>τs: {engineDebuggerReport.colorTheory.thresholds.saturationControl.toFixed(2)}</li>
              <li>τr: {engineDebuggerReport.colorTheory.thresholds.colorRelations.toFixed(2)}</li>
              <li>τa: {engineDebuggerReport.colorTheory.thresholds.attentionImpact.toFixed(2)}</li>
              <li>hue: {engineDebuggerReport.colorTheory.scores.hueStructure.toFixed(2)}</li>
              <li>value: {engineDebuggerReport.colorTheory.scores.valueBalance.toFixed(2)}</li>
              <li>saturation: {engineDebuggerReport.colorTheory.scores.saturationControl.toFixed(2)}</li>
              <li>relations: {engineDebuggerReport.colorTheory.scores.colorRelations.toFixed(2)}</li>
              <li>attention: {engineDebuggerReport.colorTheory.scores.attentionImpact.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice Scenario Runtime</span>
            <ul>
              <li>tension extracted: {engineDebuggerReport.scenario.extractedTension ?? "none"}</li>
              <li>narrative sequence: {engineDebuggerReport.scenario.narrativeSequence.join(" -> ") || "none"}</li>
              <li>contaminare: {engineDebuggerReport.scenario.contaminationMode}</li>
              <li>acceptată: {engineDebuggerReport.scenario.acceptedContamination ? "da" : "nu"}</li>
              <li>iterații: {engineDebuggerReport.scenario.iterationCount}</li>
              <li>terminat: {engineDebuggerReport.scenario.terminated ? "da" : "nu"}</li>
              <li>motiv: {engineDebuggerReport.scenario.terminationReason}</li>
              <li>scenariu valid: {engineDebuggerReport.scenario.isValidScenario ? "da" : "nu"}</li>
              <li>trece legea: {engineDebuggerReport.scenario.lawPassed ? "da" : "nu"}</li>
              <li>τc: {engineDebuggerReport.scenario.thresholds.conflict.toFixed(2)}</li>
              <li>τt: {engineDebuggerReport.scenario.thresholds.tension.toFixed(2)}</li>
              <li>τp: {engineDebuggerReport.scenario.thresholds.progression.toFixed(2)}</li>
              <li>τm: {engineDebuggerReport.scenario.thresholds.meaning.toFixed(2)}</li>
              <li>τa: {engineDebuggerReport.scenario.thresholds.attention.toFixed(2)}</li>
              <li>conflict: {engineDebuggerReport.scenario.scores.conflict.toFixed(2)}</li>
              <li>tension: {engineDebuggerReport.scenario.scores.tension.toFixed(2)}</li>
              <li>progression: {engineDebuggerReport.scenario.scores.progression.toFixed(2)}</li>
              <li>meaning: {engineDebuggerReport.scenario.scores.meaning.toFixed(2)}</li>
              <li>attention: {engineDebuggerReport.scenario.scores.attention.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice ArtComposition Runtime</span>
            <ul>
              <li>
                visual output: {engineDebuggerReport.artComposition.visualOutput
                  ? `${engineDebuggerReport.artComposition.visualOutput.geometry.base.type} -> ${engineDebuggerReport.artComposition.visualOutput.geometry.evolved} / ${engineDebuggerReport.artComposition.visualOutput.composition.layout} / ${engineDebuggerReport.artComposition.visualOutput.color.hue}`
                  : "none"}
              </li>
              <li>visual score: {engineDebuggerReport.artComposition.visualScore?.toFixed(2) ?? "0.00"}</li>
              <li>visual refined: {engineDebuggerReport.artComposition.visualRefined ? "da" : "nu"}</li>
              <li>contaminare: {engineDebuggerReport.artComposition.contaminationMode}</li>
              <li>acceptată: {engineDebuggerReport.artComposition.acceptedContamination ? "da" : "nu"}</li>
              <li>iterații: {engineDebuggerReport.artComposition.iterationCount}</li>
              <li>terminat: {engineDebuggerReport.artComposition.terminated ? "da" : "nu"}</li>
              <li>motiv: {engineDebuggerReport.artComposition.terminationReason}</li>
              <li>compoziție validă: {engineDebuggerReport.artComposition.isValidComposition ? "da" : "nu"}</li>
              <li>trece legea: {engineDebuggerReport.artComposition.lawPassed ? "da" : "nu"}</li>
              <li>focus node: {engineDebuggerReport.artComposition.focusNode}</li>
              <li>τu: {engineDebuggerReport.artComposition.thresholds.unity.toFixed(2)}</li>
              <li>τb: {engineDebuggerReport.artComposition.thresholds.balance.toFixed(2)}</li>
              <li>τr: {engineDebuggerReport.artComposition.thresholds.rhythm.toFixed(2)}</li>
              <li>τm: {engineDebuggerReport.artComposition.thresholds.movement.toFixed(2)}</li>
              <li>τc: {engineDebuggerReport.artComposition.thresholds.contrast.toFixed(2)}</li>
              <li>τp: {engineDebuggerReport.artComposition.thresholds.proportion.toFixed(2)}</li>
              <li>τf: {engineDebuggerReport.artComposition.thresholds.focus.toFixed(2)}</li>
              <li>unity: {engineDebuggerReport.artComposition.scores.unity.toFixed(2)}</li>
              <li>balance: {engineDebuggerReport.artComposition.scores.balance.toFixed(2)}</li>
              <li>rhythm: {engineDebuggerReport.artComposition.scores.rhythm.toFixed(2)}</li>
              <li>movement: {engineDebuggerReport.artComposition.scores.movement.toFixed(2)}</li>
              <li>contrast: {engineDebuggerReport.artComposition.scores.contrast.toFixed(2)}</li>
              <li>proportion: {engineDebuggerReport.artComposition.scores.proportion.toFixed(2)}</li>
              <li>focus: {engineDebuggerReport.artComposition.scores.focus.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice CompositionStructure Runtime</span>
            <ul>
              <li>contaminare: {engineDebuggerReport.structure.contaminationMode}</li>
              <li>acceptată: {engineDebuggerReport.structure.acceptedContamination ? "da" : "nu"}</li>
              <li>iterații: {engineDebuggerReport.structure.iterationCount}</li>
              <li>terminat: {engineDebuggerReport.structure.terminated ? "da" : "nu"}</li>
              <li>motiv: {engineDebuggerReport.structure.terminationReason}</li>
              <li>structură validă: {engineDebuggerReport.structure.isValidStructure ? "da" : "nu"}</li>
              <li>trece legea: {engineDebuggerReport.structure.lawPassed ? "da" : "nu"}</li>
              <li>strategy: {engineDebuggerReport.structure.selectedStrategy ?? "none"}</li>
              <li>composition layout: {engineDebuggerReport.structure.compositionLayout?.layout ?? "none"}</li>
              <li>
                composition balance: {engineDebuggerReport.structure.compositionLayout?.balanceScore.toFixed(2) ?? "0.00"}
              </li>
              <li>generated layout: {engineDebuggerReport.structure.generatedLayout?.layout ?? "none"}</li>
              <li>
                balance: {engineDebuggerReport.structure.generatedLayout?.balanceScore.toFixed(2) ?? "0.00"}
              </li>
              <li>grid: {engineDebuggerReport.structure.grid}</li>
              <li>subject: {engineDebuggerReport.structure.subjectPosition}</li>
              <li>τt: {engineDebuggerReport.structure.thresholds.thirds.toFixed(2)}</li>
              <li>τg: {engineDebuggerReport.structure.thresholds.golden.toFixed(2)}</li>
              <li>τs: {engineDebuggerReport.structure.thresholds.symmetry.toFixed(2)}</li>
              <li>τc: {engineDebuggerReport.structure.thresholds.center.toFixed(2)}</li>
              <li>τa: {engineDebuggerReport.structure.thresholds.attention.toFixed(2)}</li>
              <li>thirds: {engineDebuggerReport.structure.scores.thirds.toFixed(2)}</li>
              <li>golden: {engineDebuggerReport.structure.scores.golden.toFixed(2)}</li>
              <li>symmetry: {engineDebuggerReport.structure.scores.symmetry.toFixed(2)}</li>
              <li>center: {engineDebuggerReport.structure.scores.center.toFixed(2)}</li>
              <li>attention: {engineDebuggerReport.structure.scores.attention.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice ShapeTheory Runtime</span>
            <ul>
              <li>contaminare: {engineDebuggerReport.shape.contaminationMode}</li>
              <li>acceptată: {engineDebuggerReport.shape.acceptedContamination ? "da" : "nu"}</li>
              <li>hard fail mode: {engineDebuggerReport.shape.hardFailureMode}</li>
              <li>hard fail triggered: {engineDebuggerReport.shape.hardFailureTriggered ? "da" : "nu"}</li>
              <li>shape ideas: {engineDebuggerReport.shape.shapeIdeaSet.length}</li>
              <li>iterații: {engineDebuggerReport.shape.iterationCount}</li>
              <li>terminat: {engineDebuggerReport.shape.terminated ? "da" : "nu"}</li>
              <li>motiv: {engineDebuggerReport.shape.terminationReason}</li>
              <li>fail: {engineDebuggerReport.shape.failed ? "da" : "nu"}</li>
              <li>fail reason: {engineDebuggerReport.shape.failureReason ?? "none"}</li>
              <li>formă validă: {engineDebuggerReport.shape.isValidShape ? "da" : "nu"}</li>
              <li>trece legea: {engineDebuggerReport.shape.lawPassed ? "da" : "nu"}</li>
              <li>primitive: {engineDebuggerReport.shape.detectedPrimitiveShape ?? "none"}</li>
              <li>
                primitive orientation: {engineDebuggerReport.shape.primitiveShapeStructure?.orientation ?? "none"}
              </li>
              <li>
                primitive complexity: {engineDebuggerReport.shape.primitiveShapeStructure?.complexity.toFixed(2) ?? "0.00"}
              </li>
              <li>type: {engineDebuggerReport.shape.type}</li>
              <li>mass: {engineDebuggerReport.shape.mass}</li>
              <li>behavior: {engineDebuggerReport.shape.behavior}</li>
              <li>position: {engineDebuggerReport.shape.positionTendency}</li>
              <li>τi: {engineDebuggerReport.shape.thresholds.identity.toFixed(2)}</li>
              <li>τr: {engineDebuggerReport.shape.thresholds.relation.toFixed(2)}</li>
              <li>τt: {engineDebuggerReport.shape.thresholds.tension.toFixed(2)}</li>
              <li>τa: {engineDebuggerReport.shape.thresholds.attention.toFixed(2)}</li>
              <li>identity: {engineDebuggerReport.shape.scores.identity.toFixed(2)}</li>
              <li>relation: {engineDebuggerReport.shape.scores.relation.toFixed(2)}</li>
              <li>tension: {engineDebuggerReport.shape.scores.tension.toFixed(2)}</li>
              <li>attention: {engineDebuggerReport.shape.scores.attention.toFixed(2)}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice ShapeGrammar Runtime</span>
            <ul>
              <li>seed: {engineDebuggerReport.shapeGrammar.seedShape}</li>
              <li>primitive base: {engineDebuggerReport.shapeGrammar.primitiveBaseShape ?? "none"}</li>
              <li>primitive evolved: {engineDebuggerReport.shapeGrammar.primitiveEvolvedShape ?? "none"}</li>
              <li>
                generated form: {engineDebuggerReport.shapeGrammar.generatedForm
                  ? `${engineDebuggerReport.shapeGrammar.generatedForm.base.type} -> ${engineDebuggerReport.shapeGrammar.generatedForm.evolved}`
                  : "none"}
              </li>
              <li>
                form orientation: {engineDebuggerReport.shapeGrammar.generatedForm?.base.orientation ?? "none"}
              </li>
              <li>
                form complexity: {engineDebuggerReport.shapeGrammar.generatedForm?.base.complexity.toFixed(2) ?? "0.00"}
              </li>
              <li>rules: {engineDebuggerReport.shapeGrammar.ruleset.length}</li>
              <li>constraints: {engineDebuggerReport.shapeGrammar.constraints.length}</li>
              <li>hard fail mode: {engineDebuggerReport.shapeGrammar.hardFailureMode}</li>
              <li>hard fail triggered: {engineDebuggerReport.shapeGrammar.hardFailureTriggered ? "da" : "nu"}</li>
              <li>iterații: {engineDebuggerReport.shapeGrammar.iterationCount}</li>
              <li>max: {engineDebuggerReport.shapeGrammar.maxIterations}</li>
              <li>terminated: {engineDebuggerReport.shapeGrammar.terminated ? "da" : "nu"}</li>
              <li>termination: {engineDebuggerReport.shapeGrammar.terminationReason}</li>
              <li>fail: {engineDebuggerReport.shapeGrammar.failed ? "da" : "nu"}</li>
              <li>motiv: {engineDebuggerReport.shapeGrammar.failureReason ?? "none"}</li>
              <li>lege: {engineDebuggerReport.shapeGrammar.lawPassed ? "da" : "nu"}</li>
              <li>coherence: {engineDebuggerReport.shapeGrammar.scores.coherence.toFixed(2)}</li>
              <li>transform: {engineDebuggerReport.shapeGrammar.scores.transformation.toFixed(2)}</li>
              <li>relation: {engineDebuggerReport.shapeGrammar.scores.relation.toFixed(2)}</li>
              <li>expressive: {engineDebuggerReport.shapeGrammar.scores.expressivePower.toFixed(2)}</li>
              <li>dominant rule: {engineDebuggerReport.shapeGrammar.systemStateUpdate.rulePriorities.dominantRule}</li>
              <li>priority queue: {engineDebuggerReport.shapeGrammar.systemStateUpdate.rulePriorities.rankedRules.join(" / ") || "none"}</li>
              <li>constraint bias: {engineDebuggerReport.shapeGrammar.systemStateUpdate.rulePriorities.constraintBias.toFixed(2)}</li>
              <li>suppressed: {engineDebuggerReport.shapeGrammar.systemStateUpdate.rulePriorities.suppressedRules.join(" / ") || "none"}</li>
              <li>recovered: {engineDebuggerReport.shapeGrammar.systemStateUpdate.rulePriorities.recoveredRules.join(" / ") || "none"}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice MetaSystem</span>
            <ul>
              <li>intent: {engineDebuggerReport.metaSystem.framework.intent}</li>
              <li>function: {engineDebuggerReport.metaSystem.framework.function}</li>
              <li>target: {engineDebuggerReport.metaSystem.framework.target}</li>
              <li>differentiator: {engineDebuggerReport.metaSystem.framework.differentiator}</li>
              <li>domains: {engineDebuggerReport.metaSystem.framework.domain.join(" / ") || "none"}</li>
              <li>exploration map: {Object.keys(engineDebuggerReport.metaSystem.labyrinth.explorationMap.explorations).join(" / ") || "none"}</li>
              <li>labyrinth explorations: {Object.keys(engineDebuggerReport.metaSystem.labyrinth.explorations).join(" / ") || "none"}</li>
              <li>labyrinth connections: {engineDebuggerReport.metaSystem.labyrinth.connections.join(" / ") || "none"}</li>
              <li>mode: {engineDebuggerReport.metaSystem.conductor.mode}</li>
              <li>targets: {engineDebuggerReport.metaSystem.conductor.targetModules.join(" > ") || "none"}</li>
              <li>labyrinth pressure: {engineDebuggerReport.metaSystem.conductor.labyrinthPressure.toFixed(2)}</li>
              <li>pipeline pressure: {engineDebuggerReport.metaSystem.conductor.pipelinePressure.toFixed(2)}</li>
              <li>relation pressure: {engineDebuggerReport.metaSystem.conductor.relationPressure.toFixed(2)}</li>
              <li>conductor notes: {engineDebuggerReport.metaSystem.conductor.notes.join(" / ") || "none"}</li>
              <li>design direction: {engineDebuggerReport.metaSystem.designOutput.direction}</li>
              <li>design style: {engineDebuggerReport.metaSystem.designOutput.style}</li>
              <li>design layout: {engineDebuggerReport.metaSystem.designOutput.layout}</li>
              <li>design motion: {engineDebuggerReport.metaSystem.designOutput.motion}</li>
              <li>pipeline: {engineDebuggerReport.metaSystem.activePipeline.join(" > ") || "none"}</li>
              <li>executed: {engineDebuggerReport.metaSystem.designState.executedModules.join(" > ") || "none"}</li>
              <li>reordered: {engineDebuggerReport.metaSystem.designState.reorderedPipeline.join(" > ") || "none"}</li>
              <li>suppressed: {engineDebuggerReport.metaSystem.designState.suppressedModules.join(" / ") || "none"}</li>
              <li>suppression: {engineDebuggerReport.metaSystem.designState.suppressionNotes.join(" / ") || "none"}</li>
              <li>recovered: {engineDebuggerReport.metaSystem.designState.recoveredModules.join(" / ") || "none"}</li>
              <li>recovery: {engineDebuggerReport.metaSystem.designState.recoveryNotes.join(" / ") || "none"}</li>
              <li>weights: {Object.entries(engineDebuggerReport.metaSystem.designState.moduleWeights).map(([key, value]) => `${key}:${value.toFixed(2)}`).join(" / ") || "none"}</li>
              <li>reweight: {engineDebuggerReport.metaSystem.designState.reweightNotes.join(" / ") || "none"}</li>
              <li>design fail: {engineDebuggerReport.metaSystem.designState.failed ? "da" : "nu"}</li>
              <li>failure module: {engineDebuggerReport.metaSystem.designState.failureModule ?? "none"}</li>
              <li>failure reason: {engineDebuggerReport.metaSystem.designState.failureReason ?? "none"}</li>
              <li>meta fail: {engineDebuggerReport.metaSystem.failed ? "da" : "nu"}</li>
              <li>meta fail reason: {engineDebuggerReport.metaSystem.failureReason ?? "none"}</li>
              <li>validation: {engineDebuggerReport.metaSystem.validationPassed ? "da" : "nu"}</li>
              <li>lege: {engineDebuggerReport.metaSystem.lawPassed ? "da" : "nu"}</li>
              <li>structure: {engineDebuggerReport.metaSystem.scores.structure.toFixed(2)}</li>
              <li>coherence: {engineDebuggerReport.metaSystem.scores.coherence.toFixed(2)}</li>
              <li>attention: {engineDebuggerReport.metaSystem.scores.attention.toFixed(2)}</li>
              <li>integration: {engineDebuggerReport.metaSystem.scores.integration.toFixed(2)}</li>
              <li>memory: {engineDebuggerReport.metaSystem.memory.globalWeight.toFixed(2)}</li>
              <li>memory influence: {engineDebuggerReport.metaSystem.memory.influenceWeight.toFixed(2)}</li>
              <li>stored concept: {engineDebuggerReport.metaSystem.memory.storedConcept}</li>
              <li>memory canonical: {engineDebuggerReport.metaSystem.memory.canonical ? "da" : "nu"}</li>
              <li>memory reuse: {engineDebuggerReport.metaSystem.memory.canonicalReuse.toFixed(2)}</li>
              <li>memory impact: {engineDebuggerReport.metaSystem.memory.canonicalImpact.toFixed(2)}</li>
              <li>memory stability: {engineDebuggerReport.metaSystem.memory.canonicalStability.toFixed(2)}</li>
              <li>memory notes: {engineDebuggerReport.metaSystem.memory.influenceNotes.join(" / ") || "none"}</li>
              <li>global canon: {engineDebuggerReport.metaSystem.canon.globalCandidate ? "candidate" : "nu"}</li>
              <li>domain canon: {engineDebuggerReport.metaSystem.canon.domainCandidates.join(" / ") || "none"}</li>
              <li>canon influence: {engineDebuggerReport.metaSystem.canon.influenceWeight.toFixed(2)}</li>
              <li>canon notes: {engineDebuggerReport.metaSystem.canon.influenceNotes.join(" / ") || "none"}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MindSlice ExecutionEngine v3</span>
            <ul>
              <li>status: {executionEngineStatus}</li>
              <li>
                parser:{" "}
                {executionEngineSuccess
                  ? executionEngineSuccess.parsed_slice.content.type ?? "parsed"
                  : executionEngineFailure ?? "none"}
              </li>
              <li>
                importance: {executionEngineSuccess?.analytic_profile.importance ?? "none"}
              </li>
              <li>subject: {executionEngineSuccess?.analytic_profile.subject ?? "none"}</li>
              <li>
                context: {executionEngineSuccess?.analytic_profile.context.join(" / ") ?? "none"}
              </li>
              <li>nature: {executionEngineSuccess?.analytic_profile.nature ?? "none"}</li>
              <li>
                presentation: {executionEngineSuccess?.analytic_profile.presentation ?? "none"}
              </li>
              <li>
                difficulty: {executionEngineSuccess?.analytic_profile.difficulty ?? 0}
              </li>
              <li>quote: {executionEngineSuccess?.analytic_profile.quote ?? "none"}</li>
              <li>
                total score: {executionEngineSuccess?.score.total.toFixed(2) ?? "0.00"}
              </li>
              <li>
                clarity: {executionEngineSuccess?.score.clarity.toFixed(2) ?? "0.00"}
              </li>
              <li>
                impact: {executionEngineSuccess?.score.impact.toFixed(2) ?? "0.00"}
              </li>
              <li>
                reusability: {executionEngineSuccess?.score.reusability.toFixed(2) ?? "0.00"}
              </li>
              <li>
                expansion: {executionEngineSuccess?.score.expansion.toFixed(2) ?? "0.00"}
              </li>
              <li>
                executed steps: {executionEngineSuccess?.execution_log.map((entry) => entry.step).join(" > ") || "none"}
              </li>
              <li>
                successful: {executionEngineSuccess?.learning_state.successful_steps.join(" / ") || "none"}
              </li>
              <li>
                weak steps: {executionEngineSuccess?.learning_state.weak_steps.join(" / ") || "none"}
              </li>
              <li>
                adjustments: {executionEngineSuccess?.learning_state.pipeline_adjustments.join(" / ") || "none"}
              </li>
              <li>
                thresholds: {executionEngineSuccess ? Object.entries(executionEngineSuccess.learning_state.new_thresholds).map(([key, value]) => `${key}:${value}`).join(" / ") || "none" : "none"}
              </li>
              <li>
                threshold classification: {executionEngineSuccess?.threshold_model.threshold_state.classification ?? "none"}
              </li>
              <li>
                threshold next action: {executionEngineSuccess?.threshold_model.threshold_state.next_action ?? "none"}
              </li>
              <li>
                threshold flags: {executionEngineSuccess ? Object.keys(executionEngineSuccess.threshold_model.flags).join(" / ") || "none" : "none"}
              </li>
              <li>
                τs: {executionEngineSuccess?.threshold_model.threshold_state.thresholds["τs"].toFixed(2) ?? "0.00"} · τm:{" "}
                {executionEngineSuccess?.threshold_model.threshold_state.thresholds["τm"].toFixed(2) ?? "0.00"} · τa:{" "}
                {executionEngineSuccess?.threshold_model.threshold_state.thresholds["τa"].toFixed(2) ?? "0.00"} · τc:{" "}
                {executionEngineSuccess?.threshold_model.threshold_state.thresholds["τc"].toFixed(2) ?? "0.00"}
              </li>
              <li>
                current state: structure {executionEngineSuccess?.threshold_model.threshold_state.state.structure.toFixed(2) ?? "0.00"} · sense{" "}
                {executionEngineSuccess?.threshold_model.threshold_state.state.sense.toFixed(2) ?? "0.00"} · attention{" "}
                {executionEngineSuccess?.threshold_model.threshold_state.state.attention.toFixed(2) ?? "0.00"} · coherence{" "}
                {executionEngineSuccess?.threshold_model.threshold_state.state.coherence.toFixed(2) ?? "0.00"}
              </li>
              <li>
                updated thresholds: τs {executionEngineSuccess?.threshold_model.updated_thresholds["τs"].toFixed(2) ?? "0.00"} · τm{" "}
                {executionEngineSuccess?.threshold_model.updated_thresholds["τm"].toFixed(2) ?? "0.00"} · τa{" "}
                {executionEngineSuccess?.threshold_model.updated_thresholds["τa"].toFixed(2) ?? "0.00"} · τc{" "}
                {executionEngineSuccess?.threshold_model.updated_thresholds["τc"].toFixed(2) ?? "0.00"}
              </li>
              <li>
                learning loop: {executionEngineSuccess
                  ? "status" in executionEngineSuccess.learning_loop
                    ? executionEngineSuccess.learning_loop.message
                    : executionEngineSuccess.learning_loop.learning_cycle_output.threshold.threshold_state.classification
                  : "none"}
              </li>
              <li>
                learning canon: {executionEngineSuccess && !("status" in executionEngineSuccess.learning_loop)
                  ? executionEngineSuccess.learning_loop.canonical_state
                    ? "true"
                    : "false"
                  : "none"}
              </li>
              <li>
                canon status: {executionEngineSuccess && !("status" in executionEngineSuccess.learning_loop)
                  ? "status" in executionEngineSuccess.learning_loop.learning_cycle_output.canon_result
                    ? executionEngineSuccess.learning_loop.learning_cycle_output.canon_result.message
                    : `${executionEngineSuccess.learning_loop.learning_cycle_output.canon_result.canon_status} · ${executionEngineSuccess.learning_loop.learning_cycle_output.canon_result.action}`
                  : "none"}
              </li>
              <li>
                learning score: {executionEngineSuccess && !("status" in executionEngineSuccess.learning_loop)
                  ? executionEngineSuccess.learning_loop.learning_cycle_output.score.total.toFixed(2)
                  : "0.00"}
              </li>
              <li>
                learning bias: {executionEngineSuccess && !("status" in executionEngineSuccess.learning_loop)
                  ? executionEngineSuccess.learning_loop.updated_state.behavioral_bias.join(" / ") || "none"
                  : "none"}
              </li>
              <li>
                learning next context: {executionEngineSuccess && !("status" in executionEngineSuccess.learning_loop)
                  ? executionEngineSuccess.learning_loop.updated_state.next_context.focus
                  : "none"}
              </li>
              <li>
                slice learning loop: {executionEngineSuccess
                  ? "status" in executionEngineSuccess.slice_learning_loop
                    ? executionEngineSuccess.slice_learning_loop.message
                    : executionEngineSuccess.slice_learning_loop.learning_cycle_output.threshold.threshold_state.classification
                  : "none"}
              </li>
              <li>
                slice learning canon: {executionEngineSuccess && !("status" in executionEngineSuccess.slice_learning_loop)
                  ? executionEngineSuccess.slice_learning_loop.canonical_state
                  : "none"}
              </li>
              <li>
                slice learning score: {executionEngineSuccess && !("status" in executionEngineSuccess.slice_learning_loop)
                  ? executionEngineSuccess.slice_learning_loop.learning_cycle_output.score
                    ? executionEngineSuccess.slice_learning_loop.learning_cycle_output.score.total.toFixed(2)
                    : "0.00"
                  : "0.00"}
              </li>
              <li>
                scoring engine: {executionEngineSuccess
                  ? executionEngineSuccess.scoring_engine_result.total.toFixed(2)
                  : "0.00"}
              </li>
              <li>
                scoring C/I/F/R/E: {executionEngineSuccess
                  ? `C ${executionEngineSuccess.scoring_engine_result.clarity.toFixed(2)} · I ${executionEngineSuccess.scoring_engine_result.impact.toFixed(2)} · F ${executionEngineSuccess.scoring_engine_result.frequency.toFixed(2)} · R ${executionEngineSuccess.scoring_engine_result.reusability.toFixed(2)} · E ${executionEngineSuccess.scoring_engine_result.expansion.toFixed(2)}`
                  : "none"}
              </li>
              <li>
                slice learning bias: {executionEngineSuccess && !("status" in executionEngineSuccess.slice_learning_loop)
                  ? `${executionEngineSuccess.slice_learning_loop.updated_state.semantic_bias} · ${executionEngineSuccess.slice_learning_loop.updated_state.repetition_bias}`
                  : "none"}
              </li>
              <li>
                slice learning next context: {executionEngineSuccess && !("status" in executionEngineSuccess.slice_learning_loop)
                  ? `${executionEngineSuccess.slice_learning_loop.updated_state.next_context.focus} · ${executionEngineSuccess.slice_learning_loop.updated_state.next_context.cluster_id}`
                  : "none"}
              </li>
              <li>
                slice repetition: {executionEngineSuccess
                  ? `${executionEngineSuccess.slice_repetition_result.repetition_type} · ${executionEngineSuccess.slice_repetition_result.semantic_axis}`
                  : "none"}
              </li>
              <li>
                slice cluster: {executionEngineSuccess
                  ? `${executionEngineSuccess.slice_repetition_result.cluster_id} · similarity ${executionEngineSuccess.slice_repetition_result.similarity.toFixed(2)}`
                  : "none"}
              </li>
              <li>
                slice evolution: {executionEngineSuccess
                  ? executionEngineSuccess.slice_repetition_result.evolution
                    ? `magnitude ${executionEngineSuccess.slice_repetition_result.evolution.magnitude.toFixed(2)} · structure ${executionEngineSuccess.slice_repetition_result.evolution.structure.toFixed(2)} · concepts ${executionEngineSuccess.slice_repetition_result.evolution.concepts.toFixed(2)} · intent ${executionEngineSuccess.slice_repetition_result.evolution.intent.toFixed(2)}`
                    : "none"
                  : "none"}
              </li>
              <li>
                slice context: {executionEngineSuccess
                  ? `${executionEngineSuccess.slice_repetition_result.context.total_slices} slices · axis ${executionEngineSuccess.slice_repetition_result.context.dominant_axis}`
                  : "none"}
              </li>
              <li>
                author value: {executionEngineSuccess
                  ? `${executionEngineSuccess.author_value_profile.total_value.toFixed(2)} · contribution ${executionEngineSuccess.author_value_profile.contribution.toFixed(2)} · consistency ${executionEngineSuccess.author_value_profile.consistency.toFixed(2)}`
                  : "none"}
              </li>
              <li>
                author influence: {executionEngineSuccess
                  ? `${executionEngineSuccess.author_value_profile.influence.toFixed(2)} · growth ${executionEngineSuccess.author_value_profile.growth.toFixed(2)} · canon ${executionEngineSuccess.author_value_profile.canon.toFixed(2)}`
                  : "none"}
              </li>
              <li>
                author rank: {executionEngineSuccess
                  ? `${executionEngineSuccess.author_reputation_result.current_rank} -> ${executionEngineSuccess.author_reputation_result.next_rank}`
                  : "none"}
              </li>
              <li>
                author promotion: {executionEngineSuccess
                  ? executionEngineSuccess.author_reputation_result.promoted
                    ? executionEngineSuccess.author_reputation_result.promotion_event
                      ? `${executionEngineSuccess.author_reputation_result.promotion_event.from_rank} -> ${executionEngineSuccess.author_reputation_result.promotion_event.to_rank}`
                      : "true"
                    : "false"
                  : "none"}
              </li>
              <li>
                unlocked identity: {executionEngineSuccess
                  ? `${executionEngineSuccess.author_reputation_result.unlocked_identity.display_name ?? "none"} · ${executionEngineSuccess.author_reputation_result.unlocked_identity.layout}`
                  : "none"}
              </li>
              <li>
                identity meta: {executionEngineSuccess
                  ? `${executionEngineSuccess.author_reputation_result.unlocked_identity.meta.tier} · weight ${executionEngineSuccess.author_reputation_result.unlocked_identity.meta.visual_weight} · prestige ${executionEngineSuccess.author_reputation_result.unlocked_identity.meta.prestige_level}`
                  : "none"}
              </li>
              <li>
                unlocked permissions: {executionEngineSuccess
                  ? Object.entries(executionEngineSuccess.author_reputation_result.unlocked_permissions)
                      .filter(([, value]) => value === true)
                      .map(([key]) => key)
                      .join(" / ") || "none"
                  : "none"}
              </li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Concept Pool</span>
            <ul>
              <li>concepte în pool: {conceptPoolCount}</li>
              <li>ultimul concept din pool: {latestPoolConceptTitle ?? "niciunul"}</li>
              <li>rolul pool-ului: zonă de trecere înainte de persistența în memorie</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Color Pool</span>
            <ul>
              <li>palete în pool: {colorPoolCount}</li>
              <li>ultima paletă: {latestColorPoolTitle ?? "niciuna"}</li>
              <li>rolul pool-ului: zonă de filtrare cromatică înainte de memorie</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Scenario Pool</span>
            <ul>
              <li>scenarii în pool: {scenarioPoolCount}</li>
              <li>ultimul scenariu: {latestScenarioPoolTitle ?? "niciunul"}</li>
              <li>rolul pool-ului: zonă de filtrare narativă înainte de memorie</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Art Composition Pool</span>
            <ul>
              <li>compoziții în pool: {artCompositionPoolCount}</li>
              <li>ultima compoziție: {latestArtCompositionPoolTitle ?? "niciuna"}</li>
              <li>rolul pool-ului: zonă de filtrare compozițională înainte de memorie</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Structure Pool</span>
            <ul>
              <li>structuri în pool: {structurePoolCount}</li>
              <li>ultima structură: {latestStructurePoolTitle ?? "niciuna"}</li>
              <li>rolul pool-ului: zonă de filtrare a suprafeței înainte de memorie</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Shape Pool</span>
            <ul>
              <li>forme în pool: {shapePoolCount}</li>
              <li>ultima formă: {latestShapePoolTitle ?? "niciuna"}</li>
              <li>rolul pool-ului: zonă de filtrare formală înainte de memorie</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Canon</span>
            <ul>
              <li>concepte canonice: {canonCount}</li>
              <li>canon principal: {primaryCanonTitle ?? "niciunul"}</li>
              <li>rolul canonului: doctrină activă pentru modificarea sistemului</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Color Canon</span>
            <ul>
              <li>palete canonice: {colorCanonCount}</li>
              <li>canon cromatic principal: {primaryColorCanonTitle ?? "niciunul"}</li>
              <li>rolul canonului: doctrină cromatică activă pentru percepție</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Narrative Canon</span>
            <ul>
              <li>scenarii canonice: {narrativeCanonCount}</li>
              <li>canon narativ principal: {primaryNarrativeCanonTitle ?? "niciunul"}</li>
              <li>rolul canonului: doctrină narativă activă pentru structură</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Art Canon</span>
            <ul>
              <li>compoziții canonice: {artCanonCount}</li>
              <li>canon compozițional principal: {primaryArtCanonTitle ?? "niciuna"}</li>
              <li>rolul canonului: doctrină compozițională activă pentru percepție</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Structure Canon</span>
            <ul>
              <li>structuri canonice: {structureCanonCount}</li>
              <li>canon structural principal: {primaryStructureCanonTitle ?? "niciuna"}</li>
              <li>rolul canonului: doctrină de ecran activă pentru poziționare</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Shape Canon</span>
            <ul>
              <li>forme canonice: {shapeCanonCount}</li>
              <li>canon formal principal: {primaryShapeCanonTitle ?? "niciuna"}</li>
              <li>rolul canonului: doctrină formală activă pentru percepția spațială</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Shape Grammar Canon</span>
            <ul>
              <li>gramatici canonice: {shapeGrammarCanonCount}</li>
              <li>canon gramatical principal: {primaryShapeGrammarCanonTitle ?? "niciuna"}</li>
              <li>rolul canonului: doctrină de transformare activă pentru evoluția formelor</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>MetaSystem Canon</span>
            <ul>
              <li>metasisteme canonice: {metaSystemCanonCount}</li>
              <li>canon metasistemic principal: {primaryMetaSystemCanonTitle ?? "niciunul"}</li>
              <li>rolul canonului: doctrină de orchestrare activă pentru toate subsistemele</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria conceptelor</span>
            <ul>
              <li>concepte stocate: {conceptMemoryCount}</li>
              <li>concepte rezolvate: {resolvedConceptCount}</li>
              <li>ultimul concept: {latestConceptTitle ?? "niciunul"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria culorilor</span>
            <ul>
              <li>palete stocate: {colorMemoryCount}</li>
              <li>palete rezolvate: {resolvedColorCount}</li>
              <li>ultima paletă: {latestColorTitle ?? "niciuna"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria scenariilor</span>
            <ul>
              <li>scenarii stocate: {storyMemoryCount}</li>
              <li>scenarii rezolvate: {resolvedScenarioCount}</li>
              <li>ultimul scenariu: {latestScenarioTitle ?? "niciunul"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria compozițiilor</span>
            <ul>
              <li>compoziții stocate: {artMemoryCount}</li>
              <li>compoziții rezolvate: {resolvedArtCount}</li>
              <li>ultima compoziție: {latestArtTitle ?? "niciuna"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria structurilor</span>
            <ul>
              <li>structuri stocate: {structureMemoryCount}</li>
              <li>structuri rezolvate: {resolvedStructureCount}</li>
              <li>ultima structură: {latestStructureTitle ?? "niciuna"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria formelor</span>
            <ul>
              <li>forme stocate: {shapeMemoryCount}</li>
              <li>forme rezolvate: {resolvedShapeCount}</li>
              <li>ultima formă: {latestShapeTitle ?? "niciuna"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria gramaticilor de formă</span>
            <ul>
              <li>gramatici stocate: {shapeGrammarMemoryCount}</li>
              <li>gramatici rezolvate: {resolvedShapeGrammarCount}</li>
              <li>ultima gramatică: {latestShapeGrammarTitle ?? "niciuna"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Memoria MetaSystem</span>
            <ul>
              <li>metasisteme stocate: {metaSystemMemoryCount}</li>
              <li>metasisteme rezolvate: {resolvedMetaSystemCount}</li>
              <li>ultimul metasistem: {latestMetaSystemTitle ?? "niciunul"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Clock Memory</span>
            <ul>
              <li>display-uri stocate: {clockMemoryCount}</li>
              <li>ultimul display: {latestClockTime ?? "niciunul"}</li>
              <li>output: {clockDisplay?.outputVisual ?? "niciun output activ"}</li>
              <li>mod de memorie: acumulare locală alpha</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Promovarea conceptului</span>
            <ul>
              <li>stadiul curent promovat: {promotionStatus}</li>
              <li>pregătit pentru canon: {canPromoteToCanonical ? "da" : "nu"}</li>
              {promotionNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        </div>
        <div className={styles.alphaDebugColumns}>
          <article className={styles.alphaDebugCard}>
            <span>Note de proces</span>
            <ul>
              {conceptProcess.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Note de sistem</span>
            <ul>
              {systemState.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Note de validare</span>
            <ul>
              {conceptValidation.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Color Theory Notes</span>
            <ul>
              <li>{engineDebuggerReport.colorTheory.interpretation}</li>
              <li>{engineDebuggerReport.colorTheory.outputText}</li>
              <li>{engineDebuggerReport.colorTheory.outputVisual}</li>
              <li>{engineDebuggerReport.colorTheory.lawNote}</li>
              {engineDebuggerReport.colorTheory.systemStateUpdate ? (
                <>
                  <li>
                    probability update: reuse {engineDebuggerReport.colorTheory.systemStateUpdate.probabilities.conceptReuseWeight.toFixed(2)} / semantic {engineDebuggerReport.colorTheory.systemStateUpdate.probabilities.semanticPriority.toFixed(2)} / convergence {engineDebuggerReport.colorTheory.systemStateUpdate.probabilities.convergenceBias.toFixed(2)}
                  </li>
                  <li>
                    hierarchy update: anchor {engineDebuggerReport.colorTheory.systemStateUpdate.hierarchyRules.anchorWeight.toFixed(2)} / periphery {engineDebuggerReport.colorTheory.systemStateUpdate.hierarchyRules.peripheralWeight.toFixed(2)} / bias {engineDebuggerReport.colorTheory.systemStateUpdate.hierarchyRules.hierarchyBias.toFixed(2)}
                  </li>
                  <li>
                    attention update: focus {engineDebuggerReport.colorTheory.systemStateUpdate.attentionBehavior.focusWeight.toFixed(2)} / memory {engineDebuggerReport.colorTheory.systemStateUpdate.attentionBehavior.memoryFieldWeight.toFixed(2)} / contamination {engineDebuggerReport.colorTheory.systemStateUpdate.attentionBehavior.contaminationLift.toFixed(2)}
                  </li>
                </>
              ) : null}
              {engineDebuggerReport.colorTheory.notes.slice(0, 6).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Scenario Notes</span>
            <ul>
              <li>{engineDebuggerReport.scenario.interpretation}</li>
              <li>{engineDebuggerReport.scenario.outputText}</li>
              <li>{engineDebuggerReport.scenario.outputStructure}</li>
              <li>{engineDebuggerReport.scenario.lawNote}</li>
              {engineDebuggerReport.scenario.systemStateUpdate ? (
                <>
                  <li>
                    conflict update: escalation {engineDebuggerReport.scenario.systemStateUpdate.conflictPatterns.escalationWeight.toFixed(2)}
                  </li>
                  <li>
                    tension update: suspense {engineDebuggerReport.scenario.systemStateUpdate.tensionBehavior.suspenseWeight.toFixed(2)} / retention {engineDebuggerReport.scenario.systemStateUpdate.tensionBehavior.retentionWeight.toFixed(2)}
                  </li>
                  <li>
                    story update: irreversibility {engineDebuggerReport.scenario.systemStateUpdate.storyProbabilities.irreversibilityBias.toFixed(2)} / symbolic {engineDebuggerReport.scenario.systemStateUpdate.storyProbabilities.symbolicDepth.toFixed(2)} / sequence {engineDebuggerReport.scenario.systemStateUpdate.storyProbabilities.sequenceBias.toFixed(2)}
                  </li>
                </>
              ) : null}
              {engineDebuggerReport.scenario.notes.slice(0, 6).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Art Composition Notes</span>
            <ul>
              <li>{engineDebuggerReport.artComposition.interpretation}</li>
              <li>{engineDebuggerReport.artComposition.outputText}</li>
              <li>{engineDebuggerReport.artComposition.outputVisual}</li>
              <li>{engineDebuggerReport.artComposition.lawNote}</li>
              {engineDebuggerReport.artComposition.systemStateUpdate ? (
                <>
                  <li>
                    unity update: cohesion {engineDebuggerReport.artComposition.systemStateUpdate.unityPatterns.cohesionWeight.toFixed(2)}
                  </li>
                  <li>
                    balance update: redistribution {engineDebuggerReport.artComposition.systemStateUpdate.balanceLogic.redistributionWeight.toFixed(2)}
                  </li>
                  <li>
                    attention update: focus {engineDebuggerReport.artComposition.systemStateUpdate.attentionBehavior.focusWeight.toFixed(2)} / path {engineDebuggerReport.artComposition.systemStateUpdate.attentionBehavior.pathWeight.toFixed(2)}
                  </li>
                  <li>
                    proportion update: hierarchy {engineDebuggerReport.artComposition.systemStateUpdate.proportionRules.hierarchyWeight.toFixed(2)}
                  </li>
                </>
              ) : null}
              {engineDebuggerReport.artComposition.notes.slice(0, 6).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Structure Notes</span>
            <ul>
              <li>{engineDebuggerReport.structure.interpretation}</li>
              <li>{engineDebuggerReport.structure.outputText}</li>
              <li>{engineDebuggerReport.structure.outputVisual}</li>
              <li>{engineDebuggerReport.structure.lawNote}</li>
              {engineDebuggerReport.structure.systemStateUpdate ? (
                <>
                  <li>
                    grid update: thirds {engineDebuggerReport.structure.systemStateUpdate.gridPreferences.thirdsWeight.toFixed(2)} / golden {engineDebuggerReport.structure.systemStateUpdate.gridPreferences.goldenWeight.toFixed(2)}
                  </li>
                  <li>
                    alignment update: symmetry {engineDebuggerReport.structure.systemStateUpdate.alignmentLogic.symmetryWeight.toFixed(2)} / center {engineDebuggerReport.structure.systemStateUpdate.alignmentLogic.centerWeight.toFixed(2)}
                  </li>
                  <li>
                    attention update: anchor {engineDebuggerReport.structure.systemStateUpdate.attentionFlow.anchorWeight.toFixed(2)} / tension {engineDebuggerReport.structure.systemStateUpdate.attentionFlow.tensionWeight.toFixed(2)}
                  </li>
                </>
              ) : null}
              {engineDebuggerReport.structure.notes.slice(0, 6).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Analiza eșecului</span>
            <ul>
              <li>{engineDebuggerReport.failureAnalysis.currentBlocker}</li>
              <li>{engineDebuggerReport.failureAnalysis.topFailurePattern}</li>
              <li>următoarea promovare probabilă: {engineDebuggerReport.failureAnalysis.nextLikelyPromotion}</li>
              <li>{engineDebuggerReport.failureAnalysis.systemPressureSummary}</li>
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Rulări comparative</span>
            <ul>
              {comparativeDelta ? (
                <>
                  <li>delta rezolvate: {comparativeDelta.resolvedDelta}</li>
                  <li>delta pool: {comparativeDelta.pooledDelta}</li>
                  <li>delta canonice: {comparativeDelta.canonicalDelta}</li>
                </>
              ) : (
                <li>Nu există încă o rulare anterioară persistată.</li>
              )}
              {engineDebuggerReport.comparativeRuns.slice(0, 4).map((run) => (
                <li key={run.ideaDirection}>
                  {run.ideaDirection}: {run.status} / forță {run.validationStrength.toFixed(2)} / presiune canon {run.canonWeightPressure.toFixed(2)} / blocaj {run.blocker}
                </li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Ponderi canonice</span>
            <ul>
              <li>canon dominant: {engineDebuggerReport.canonInfluence.dominantCanon ?? "none"}</li>
              <li>influență totală: {engineDebuggerReport.canonInfluence.totalInfluence.toFixed(2)}</li>
              <li>
                raw weights: N {engineDebuggerReport.canonInfluence.activeWeights.narrative.toFixed(2)} / A {engineDebuggerReport.canonInfluence.activeWeights.art.toFixed(2)} / S {engineDebuggerReport.canonInfluence.activeWeights.structure.toFixed(2)} / C {engineDebuggerReport.canonInfluence.activeWeights.color.toFixed(2)}
              </li>
              <li>
                normalized: N {engineDebuggerReport.canonInfluence.normalizedWeights.narrative.toFixed(2)} / A {engineDebuggerReport.canonInfluence.normalizedWeights.art.toFixed(2)} / S {engineDebuggerReport.canonInfluence.normalizedWeights.structure.toFixed(2)} / C {engineDebuggerReport.canonInfluence.normalizedWeights.color.toFixed(2)}
              </li>
              {engineDebuggerReport.canonInfluence.notes.slice(0, 3).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Note Main Loop</span>
            <ul>
              {ideaSetMainLoop.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Trasare automată</span>
            <div className={styles.modeTabs}>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTracePhase === "all" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTracePhase("all")}
              >
                Toate fazele
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTracePhase === "validation" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTracePhase("validation")}
              >
                Validation
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTracePhase === "promotion" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTracePhase("promotion")}
              >
                Promotion
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTracePhase === "system" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTracePhase("system")}
              >
                System
              </button>
            </div>
            <div className={styles.modeTabs}>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTraceLevel === "all" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTraceLevel("all")}
              >
                Toate nivelele
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTraceLevel === "success" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTraceLevel("success")}
              >
                Success
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTraceLevel === "warning" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTraceLevel("warning")}
              >
                Warning
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${activeTraceLevel === "info" ? styles.modeTabActive : ""}`}
                onClick={() => setActiveTraceLevel("info")}
              >
                Info
              </button>
            </div>
            <ul>
              <li>
                filtered events: {filteredActiveTrace.length} / {engineDebuggerReport.activeTrace.length}
              </li>
              {filteredActiveTrace.slice(0, 8).map((event) => (
                <li key={event.id}>
                  <strong>{event.phase}</strong> [{event.level}]: {event.summary} · {event.detail}
                </li>
              ))}
            </ul>
          </article>
          <article className={styles.alphaDebugCard}>
            <span>Timeline</span>
            <ul>
              {engineDebuggerReport.timeline.slice(0, 8).map((point) => (
                <li key={`${point.sequence}:${point.label}`}>
                  #{point.sequence} · {point.status} · {point.ideaDirection ?? "global"} · {point.label}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {interference ? (
        <section className={styles.interferencePanel}>
          <span className={styles.panelMarker}>PANEL · Live Interference</span>
          <div className={styles.interferenceHeading}>
            <p className={styles.eyebrow}>Interferență activă</p>
            <h2>Jurnalul perturbă Artistul AI</h2>
            <p>{interference.note}</p>
          </div>
          <div className={styles.interferenceGrid}>
            <article>
              <span>Contaminat de</span>
              <strong>{interference.title}</strong>
            </article>
            <article>
              <span>Sub pseudonim</span>
              <strong>{formatPublicAuthor(interference.authorPseudonym)}</strong>
              {interference.authorUserId && profile?.user_id !== interference.authorUserId ? (
                <button
                  type="button"
                  className={styles.followButton}
                  onClick={() =>
                    handleFollowToggle(
                      interference.authorUserId!,
                      !followedUserIds.includes(interference.authorUserId!),
                    )
                  }
                  disabled={followActionUserId === interference.authorUserId}
                >
                  {followActionUserId === interference.authorUserId
                    ? "..."
                    : followedUserIds.includes(interference.authorUserId)
                      ? "Unfollow"
                      : "Follow"}
                </button>
              ) : null}
            </article>
            <article>
              <span>Mod</span>
              <strong>{interference.influenceMode}</strong>
            </article>
            <article>
              <span>Sens</span>
              <strong>{interference.senseWeight.toFixed(2)}</strong>
            </article>
            <article>
              <span>Organizare internă</span>
              <strong>{interference.structureWeight.toFixed(2)}</strong>
            </article>
            <article>
              <span>Focalizare conceptuală</span>
              <strong>{interference.attentionWeight.toFixed(2)}</strong>
            </article>
          </div>
          {interference.excerpt ? <p className={styles.interferenceExcerpt}>{interference.excerpt}</p> : null}
          {interference.aiResponseText?.trim() ? (
            <div className={styles.blogAiResponse}>
              <span className={styles.blogAiResponseLabel}>Răspuns Artist AI</span>
              <p>{interference.aiResponseText}</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
