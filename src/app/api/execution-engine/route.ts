import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  persistCanonEngineResult,
  syncCanonicalConceptRecord,
} from "@/lib/mindslice/canon-engine-persistence-system";
import {
  runCanonEngineV1,
  type CanonConcept,
  type CanonHistoricalMemory,
  type CanonScoreProfile,
} from "@/lib/mindslice/concept-canon-engine-system";
import type { AuthorHistoricalDataPoint } from "@/lib/mindslice/concept-author-value-system";
import { runExecutionEngineV3, type ExecutionEngineResult } from "@/lib/mindslice/concept-execution-engine-system";
import type { SliceRepetitionInput } from "@/lib/mindslice/concept-slice-repetition-engine-system";
import type { UserProfile } from "@/lib/mindslice/mindslice-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ExecutionEnginePayload = {
  rawSliceText?: string;
  raw_slice_text?: string;
};

const FULL_PAYLOAD_LIMIT_BYTES = 200_000;

async function loadProfile(userId: string | null): Promise<UserProfile | null> {
  if (!userId) {
    return null;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return null;
  }

  const [{ data: profile }, { data: identity }, { data: role }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "user_id, display_name, pseudonym, email, avatar_url, name_declaration_accepted, subscription_status, subscription_expires_at, address_form, bio, artist_statement, debut_status",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("author_identities")
      .select(
        "type, first_name, middle_name, last_name, indexed_name, executive_name, executive_index, consent_flag",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("author_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    identity_type: (identity?.type as UserProfile["identity_type"]) ?? "pseudonym",
    first_name: identity?.first_name ?? null,
    middle_name: identity?.middle_name ?? null,
    last_name: identity?.last_name ?? null,
    indexed_name: identity?.indexed_name ?? null,
    executive_name: identity?.executive_name ?? null,
    executive_index: identity?.executive_index ?? null,
    consent_flag: identity?.consent_flag ?? false,
    author_role: role?.role ?? "free",
  };
}

async function loadAuthorValueHistory(userId: string | null): Promise<AuthorHistoricalDataPoint[]> {
  if (!userId) {
    return [];
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return [];
  }

  const { data } = await supabase
    .from("mindslice_author_value_states")
    .select(
      "total_value, contribution_score, consistency_score, canon_score, influence_score, growth_score, journal_score, structure_score, slice_score, coordination_score, decision_score, canonical_state, classification, current_rank, next_rank, promoted, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(48);

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry) => ({
    rank:
      typeof entry.next_rank === "string"
        ? entry.next_rank
        : typeof entry.current_rank === "string"
          ? entry.current_rank
          : undefined,
    total: typeof entry.total_value === "number" ? entry.total_value : 0,
    average_score:
      typeof entry.contribution_score === "number" &&
      typeof entry.consistency_score === "number" &&
      typeof entry.influence_score === "number"
        ? (entry.contribution_score + entry.consistency_score + entry.influence_score) / 3
        : 0,
    canonical: entry.canonical_state ?? false,
    canon_status:
      entry.canonical_state ? "CANONICAL" : typeof entry.classification === "string" ? entry.classification : undefined,
    journal_score: typeof entry.journal_score === "number" ? entry.journal_score : 0,
    structure_score: typeof entry.structure_score === "number" ? entry.structure_score : 0,
    slice_score: typeof entry.slice_score === "number" ? entry.slice_score : 0,
    coordination_score: typeof entry.coordination_score === "number" ? entry.coordination_score : 0,
    decision_score: typeof entry.decision_score === "number" ? entry.decision_score : 0,
    reuse_by_others: typeof entry.influence_score === "number" ? entry.influence_score : 0,
    score_over_time: [
      typeof entry.contribution_score === "number" ? entry.contribution_score : 0,
      typeof entry.consistency_score === "number" ? entry.consistency_score : 0,
      typeof entry.total_value === "number" ? entry.total_value : 0,
    ],
    created_at: typeof entry.created_at === "string" ? entry.created_at : undefined,
  }));
}

async function loadSliceRepetitionHistory(userId: string | null): Promise<SliceRepetitionInput[]> {
  if (!userId) {
    return [];
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return [];
  }

  const { data } = await supabase
    .from("mindslice_slice_repetition_states")
    .select("slice_id, cluster_id, slice_text, created_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(96);

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry) => ({
    id: typeof entry.slice_id === "string" ? entry.slice_id : undefined,
    text: typeof entry.slice_text === "string" ? entry.slice_text : "",
    cluster_id: typeof entry.cluster_id === "string" ? entry.cluster_id : null,
    created_at: typeof entry.created_at === "string" ? entry.created_at : undefined,
  }));
}

function byteSize(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function decisionFromClassification(classification: string) {
  if (classification === "NOISE") {
    return "RESTART";
  }
  if (classification === "FRAGMENT") {
    return "LOOP_BACK";
  }
  if (classification === "PRE_CONCEPT") {
    return "REFINE";
  }
  if (classification === "CANONICAL_CANDIDATE") {
    return "CANON_CHECK";
  }
  return "STORE";
}

function isExecutionFailure(result: ExecutionEngineResult): result is Extract<ExecutionEngineResult, { status: "fail" }> {
  return "status" in result && result.status === "fail";
}

function buildLearningCycleRow(userId: string, result: ExecutionEngineResult) {
  if (isExecutionFailure(result)) {
    const compactPayload = {
      status: result.status,
      message: result.message,
    };

    return {
      user_id: userId,
      cycle_status: "failure",
      classification: "NOISE",
      decision: "RESTART",
      score_total: 0,
      canonical_state: false,
      failure_reason: result.message,
      payload_mode: "compact",
      payload_size: byteSize(compactPayload),
      retention_tier: "short",
      threshold_state: {},
      decision_flags: {},
      updated_state: {},
      slice_repetition_state: {},
      learning_summary: compactPayload,
      full_payload: null,
    };
  }

  const learningLoop = result.learning_loop;
  const learningLoopFailed = "status" in learningLoop;
  const thresholdState = learningLoopFailed
    ? result.threshold_model.threshold_state
    : learningLoop.learning_cycle_output.threshold.threshold_state;
  const classification = thresholdState.classification;
  const canonicalState = learningLoopFailed ? false : learningLoop.canonical_state;
  const cycleStatus = learningLoopFailed
    ? "failure"
    : canonicalState || classification === "CANONICAL_CANDIDATE"
      ? "canonical_candidate"
      : classification === "PRE_CONCEPT"
        ? "refined"
        : "success";
  const decision = decisionFromClassification(classification);
  const compactPayload = {
    parsed_content_type: result.parsed_slice.content.type,
    analytic_subject: result.analytic_profile.subject,
    analytic_importance: result.analytic_profile.importance,
    slice_cluster_id: result.slice_repetition_result.cluster_id,
    slice_semantic_axis: result.slice_repetition_result.semantic_axis,
    slice_repetition_type: result.slice_repetition_result.repetition_type,
    slice_similarity: result.slice_repetition_result.similarity,
    executed_steps: result.execution_log.map((entry) => entry.step),
    weak_steps: result.learning_state.weak_steps,
    learning_loop_status: learningLoopFailed ? learningLoop.message : "ok",
    next_action: thresholdState.next_action,
  };
  const fullPayloadSize = byteSize(result);
  const shouldStoreFullPayload = fullPayloadSize <= FULL_PAYLOAD_LIMIT_BYTES;

  return {
    user_id: userId,
    cycle_status: cycleStatus,
    classification,
    decision,
    score_total: result.score.total,
    canonical_state: canonicalState,
    failure_reason: learningLoopFailed ? learningLoop.message : null,
    payload_mode: shouldStoreFullPayload ? "full" : "compact",
    payload_size: shouldStoreFullPayload ? fullPayloadSize : byteSize(compactPayload),
    retention_tier: canonicalState ? "canonical" : shouldStoreFullPayload ? "long" : "standard",
    threshold_state: thresholdState,
    decision_flags: result.threshold_model.flags,
    updated_state: learningLoopFailed ? {} : learningLoop.updated_state,
    slice_repetition_state: result.slice_repetition_result,
    learning_summary: compactPayload,
    full_payload: shouldStoreFullPayload ? result : null,
  };
}

async function saveLearningCycle(userId: string | null, result: ExecutionEngineResult) {
  if (!userId) {
    return;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return;
  }

  await supabase
    .from("mindslice_learning_cycles")
    .insert(buildLearningCycleRow(userId, result));
}

async function saveSliceRepetitionMemory(userId: string | null, result: ExecutionEngineResult) {
  if (!userId || isExecutionFailure(result)) {
    return;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return;
  }

  const sliceRepetition = result.slice_repetition_result;
  const sliceId = sliceRepetition.slice_id || result.parsed_slice.content.text.slice(0, 64);
  const sliceText = result.parsed_slice.content.text;

  await supabase.from("mindslice_slice_clusters").upsert(
    {
      user_id: userId,
      cluster_id: sliceRepetition.cluster_id,
      semantic_axis: sliceRepetition.semantic_axis,
      dominant_axis: sliceRepetition.context.dominant_axis,
      total_slices: sliceRepetition.context.total_slices,
      evolution_path: sliceRepetition.context.evolution_path,
      cluster_payload: sliceRepetition,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,cluster_id" },
  );

  await supabase.from("mindslice_slice_repetition_states").upsert(
    {
      user_id: userId,
      slice_id: sliceId,
      cluster_id: sliceRepetition.cluster_id,
      semantic_axis: sliceRepetition.semantic_axis,
      similarity: sliceRepetition.similarity,
      repetition_type: sliceRepetition.repetition_type,
      evolution: sliceRepetition.evolution ?? {},
      context: sliceRepetition.context,
      slice_text: sliceText,
      slice_payload: sliceRepetition,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,slice_id" },
  );
}

async function saveSliceLearningCycle(
  userId: string | null,
  result: ExecutionEngineResult,
) {
  if (!userId || isExecutionFailure(result)) {
    return;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return;
  }

  const sliceLearningLoop = result.slice_learning_loop;
  const cycleStatus =
    "status" in sliceLearningLoop
      ? "failure"
      : sliceLearningLoop.canonical_state === "CANONICAL"
        ? "canonical_candidate"
        : sliceLearningLoop.learning_cycle_output.threshold.threshold_state.classification === "FRAGMENT"
          ? "fragment"
          : "success";
  const classification =
    "status" in sliceLearningLoop
      ? "NOISE"
      : sliceLearningLoop.learning_cycle_output.threshold.threshold_state.classification;
  const sliceId = result.slice_repetition_result.slice_id || result.parsed_slice.content.text.slice(0, 64);

  await supabase.from("mindslice_slice_learning_cycles").upsert(
    {
      user_id: userId,
      slice_id: sliceId,
      cluster_id: result.slice_repetition_result.cluster_id,
      cycle_status: cycleStatus,
      classification,
      canonical_state: "status" in sliceLearningLoop ? "NON_CANON" : sliceLearningLoop.canonical_state,
      score_total:
        "status" in sliceLearningLoop || !sliceLearningLoop.learning_cycle_output.score
          ? null
          : sliceLearningLoop.learning_cycle_output.score.total,
      repetition_type: result.slice_repetition_result.repetition_type,
      updated_state: "status" in sliceLearningLoop ? {} : sliceLearningLoop.updated_state,
      learning_summary:
        "status" in sliceLearningLoop
          ? { status: sliceLearningLoop.status, message: sliceLearningLoop.message }
          : {
              semantic_axis: result.slice_repetition_result.semantic_axis,
              repetition_type: result.slice_repetition_result.repetition_type,
              threshold_classification:
                sliceLearningLoop.learning_cycle_output.threshold.threshold_state.classification,
              next_context: sliceLearningLoop.updated_state.next_context,
            },
      full_payload: "status" in sliceLearningLoop ? null : sliceLearningLoop,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,slice_id" },
  );
}

async function saveAuthorValueProfile(userId: string | null, result: ExecutionEngineResult) {
  if (!userId || isExecutionFailure(result)) {
    return;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return;
  }

  const learningLoop = result.learning_loop;
  const classification =
    "status" in learningLoop
      ? result.threshold_model.threshold_state.classification
      : learningLoop.learning_cycle_output.threshold.threshold_state.classification;
  const canonicalState =
    !("status" in learningLoop) &&
    !("status" in learningLoop.learning_cycle_output.canon_result) &&
    learningLoop.learning_cycle_output.canon_result.canon_status === "CANONICAL";
  const conceptId =
    !("status" in learningLoop) && !("status" in learningLoop.learning_cycle_output.canon_result)
      ? learningLoop.learning_cycle_output.canon_result.concept_id
      : result.parsed_slice.content.text.slice(0, 64);

  await supabase.from("mindslice_author_value_states").insert({
    user_id: userId,
    author_id: result.author_value_profile.author_id || userId,
    concept_id: conceptId,
    classification,
    current_rank: result.author_reputation_result.current_rank,
    next_rank: result.author_reputation_result.next_rank,
    promoted: result.author_reputation_result.promoted,
    canonical_state: canonicalState,
    contribution_score: result.author_value_profile.contribution,
    consistency_score: result.author_value_profile.consistency,
    canon_score: result.author_value_profile.canon,
    influence_score: result.author_value_profile.influence,
    growth_score: result.author_value_profile.growth,
    journal_score: result.author_reputation_result.scores.journal_score,
    structure_score: result.author_reputation_result.scores.structure_score,
    slice_score: result.author_reputation_result.scores.slice_score,
    coordination_score: result.author_reputation_result.scores.coordination_score,
    decision_score: result.author_reputation_result.scores.decision_score,
    total_value: result.author_value_profile.total_value,
    profile_payload: result.author_value_profile,
    reputation_payload: result.author_reputation_result,
  });
}

async function saveAuthorReputationEvent(userId: string | null, result: ExecutionEngineResult) {
  if (!userId || isExecutionFailure(result) || !result.author_reputation_result.promoted) {
    return;
  }

  const promotionEvent = result.author_reputation_result.promotion_event;

  if (!promotionEvent) {
    return;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return;
  }

  const learningLoop = result.learning_loop;
  const conceptId =
    !("status" in learningLoop) && !("status" in learningLoop.learning_cycle_output.canon_result)
      ? learningLoop.learning_cycle_output.canon_result.concept_id
      : result.parsed_slice.content.text.slice(0, 64);

  await supabase.from("author_reputation_events").insert({
    user_id: userId,
    author_id: result.author_reputation_result.author_id || userId,
    concept_id: conceptId,
    from_rank: promotionEvent.from_rank,
    to_rank: promotionEvent.to_rank,
    event_type: promotionEvent.event_type,
    event_payload: promotionEvent,
  });
}

async function loadCanonHistoricalMemory(userId: string, supabase: ReturnType<typeof createServerSupabaseClient>) {
  const [{ data: learningCycles }, { data: canonStates }] = await Promise.all([
    supabase
      .from("mindslice_learning_cycles")
      .select("classification, canonical_state, score_total, learning_summary, updated_state, threshold_state, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(48),
    supabase
      .from("mindslice_canon_states")
      .select("entry_id, entry_payload, created_at, updated_at")
      .eq("user_id", userId)
      .eq("domain", "meta_system")
      .order("updated_at", { ascending: false })
      .limit(48),
  ]);

  const fromLearningCycles: CanonHistoricalMemory[] = Array.isArray(learningCycles)
    ? learningCycles.map((entry) => {
        const learningSummary =
          typeof entry.learning_summary === "object" && entry.learning_summary !== null
            ? (entry.learning_summary as Record<string, unknown>)
            : {};
        const updatedState =
          typeof entry.updated_state === "object" && entry.updated_state !== null
            ? (entry.updated_state as Record<string, unknown>)
            : {};

        return {
          canonical: entry.canonical_state ?? false,
          impact: typeof entry.score_total === "number" ? entry.score_total / 5 : 0,
          reuse: Array.isArray(learningSummary.executed_steps) ? learningSummary.executed_steps.length / 10 : 0,
          stability: typeof updatedState.scoring_weight === "number" ? updatedState.scoring_weight / 25 : 0,
          subject:
            typeof learningSummary.analytic_subject === "string" ? learningSummary.analytic_subject : undefined,
          keywords:
            Array.isArray(learningSummary.executed_steps)
              ? learningSummary.executed_steps.filter((step): step is string => typeof step === "string")
              : [],
          patterns:
            Array.isArray(learningSummary.weak_steps)
              ? learningSummary.weak_steps.filter((step): step is string => typeof step === "string")
              : [],
        };
      })
    : [];

  const fromCanonStates: CanonHistoricalMemory[] = Array.isArray(canonStates)
    ? canonStates.map((entry) => {
        const payload =
          typeof entry.entry_payload === "object" && entry.entry_payload !== null
            ? (entry.entry_payload as Record<string, unknown>)
            : {};
        const canonEngine =
          typeof payload.canonEngine === "object" && payload.canonEngine !== null
            ? (payload.canonEngine as Record<string, unknown>)
            : {};

        return {
          concept_id: typeof entry.entry_id === "string" ? entry.entry_id : undefined,
          canonical:
            typeof payload.canonStatus === "string" ? payload.canonStatus === "CANONICAL" : false,
          reuse:
            typeof canonEngine.reuse_score === "number" ? canonEngine.reuse_score / 10 : 0,
          stability:
            typeof canonEngine.stability_score === "number" ? canonEngine.stability_score : 0,
          impact:
            typeof canonEngine.impact_score === "number" ? canonEngine.impact_score : 0,
          subject: typeof payload.subject === "string" ? payload.subject : undefined,
          title: typeof payload.title === "string" ? payload.title : undefined,
          keywords: Array.isArray(payload.keywords)
            ? payload.keywords.filter((item): item is string => typeof item === "string")
            : [],
          patterns: Array.isArray(payload.patterns)
            ? payload.patterns.filter((item): item is string => typeof item === "string")
            : [],
        };
      })
    : [];

  return [...fromLearningCycles, ...fromCanonStates];
}

async function saveCanonResult(userId: string | null, result: ExecutionEngineResult) {
  if (!userId || isExecutionFailure(result) || "status" in result.learning_loop) {
    return;
  }

  const initialCanonResult = result.learning_loop.learning_cycle_output.canon_result;

  if ("status" in initialCanonResult) {
    return;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return;
  }

  const concept: CanonConcept = {
    concept_id: initialCanonResult.concept_id,
    title: result.analytic_profile.subject,
    subject: result.analytic_profile.subject,
    keywords: [
      result.analytic_profile.subject,
      ...result.parsed_slice.metadata.tags,
      ...result.execution_log.map((entry) => entry.step),
    ].filter(Boolean),
    patterns: result.learning_loop.learning_cycle_output.legacy.patterns,
  };
  const historicalMemory = await loadCanonHistoricalMemory(userId, supabase);
  const scoreProfile: CanonScoreProfile = result.score;
  const canonResult = runCanonEngineV1(
    concept,
    scoreProfile,
    result.threshold_model,
    historicalMemory,
    [],
  );

  await persistCanonEngineResult({
    supabase,
    userId,
    concept,
    canonResult,
    domain: "meta_system",
  });

  await syncCanonicalConceptRecord({
    supabase,
    userId,
    canonResult,
  });
}

export async function POST(request: Request) {
  let payload: ExecutionEnginePayload;
  try {
    payload = (await request.json()) as ExecutionEnginePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const rawSliceText = payload.rawSliceText ?? payload.raw_slice_text;

  if (!rawSliceText?.trim()) {
    return NextResponse.json(
      { error: "rawSliceText este obligatoriu." },
      { status: 400 },
    );
  }

  const { userId } = await auth();
  const [profile, authorValueHistory, sliceRepetitionHistory] = await Promise.all([
    loadProfile(userId),
    loadAuthorValueHistory(userId),
    loadSliceRepetitionHistory(userId),
  ]);
  const result = runExecutionEngineV3({
    rawSliceText,
    user: profile,
    authorValueHistory,
    sliceRepetitionHistory,
  });

  await saveLearningCycle(userId, result);
  await saveSliceLearningCycle(userId, result);
  await saveSliceRepetitionMemory(userId, result);
  await saveAuthorValueProfile(userId, result);
  await saveAuthorReputationEvent(userId, result);
  await saveCanonResult(userId, result);

  if (isExecutionFailure(result)) {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result);
}
