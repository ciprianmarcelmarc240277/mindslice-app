import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  runLearningLoopEngineV2Slices,
  type SliceLearningLoopResult,
} from "@/lib/mindslice/concept-learning-loop-engine-slices-system";
import { runParserEngine, type ParsedSliceObject } from "@/lib/mindslice/concept-parser-engine-system";
import type { SliceRepetitionInput } from "@/lib/mindslice/concept-slice-repetition-engine-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SliceLearningLoopPayload = {
  rawSliceText?: string;
  raw_slice_text?: string;
  parsed_slice?: ParsedSliceObject;
};

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

async function loadHistoricalMemory(userId: string | null) {
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
    .from("mindslice_learning_cycles")
    .select("score_total, learning_summary, updated_state")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(48);

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry) => {
    const learningSummary =
      typeof entry.learning_summary === "object" && entry.learning_summary !== null
        ? (entry.learning_summary as Record<string, unknown>)
        : {};
    const updatedState =
      typeof entry.updated_state === "object" && entry.updated_state !== null
        ? (entry.updated_state as Record<string, unknown>)
        : {};

    return {
      success: typeof entry.score_total === "number" ? entry.score_total >= 12 : false,
      failure: typeof entry.score_total === "number" ? entry.score_total < 8 : false,
      reuse: typeof learningSummary.slice_similarity === "number" ? learningSummary.slice_similarity : 0,
      stability: typeof updatedState.score_weight === "number" ? updatedState.score_weight / 25 : 0,
      impact: typeof entry.score_total === "number" ? entry.score_total / 25 : 0,
    };
  });
}

async function saveSliceLearningLoop(
  userId: string | null,
  parsedSlice: ParsedSliceObject,
  result: SliceLearningLoopResult,
) {
  if (!userId) {
    return;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return;
  }

  const sliceId =
    "status" in result
      ? parsedSlice.content.text.slice(0, 64)
      : result.learning_cycle_output.present.slice_id;

  await supabase.from("mindslice_slice_learning_cycles").upsert(
    {
      user_id: userId,
      slice_id: sliceId,
      cluster_id:
        "status" in result ? null : result.learning_cycle_output.repetition.cluster_id,
      cycle_status:
        "status" in result
          ? "failure"
          : result.canonical_state === "CANONICAL"
            ? "canonical_candidate"
            : result.learning_cycle_output.threshold.threshold_state.classification === "FRAGMENT"
              ? "fragment"
              : "success",
      classification:
        "status" in result
          ? "NOISE"
          : result.learning_cycle_output.threshold.threshold_state.classification,
      canonical_state: "status" in result ? "NON_CANON" : result.canonical_state,
      score_total:
        "status" in result || !result.learning_cycle_output.score
          ? null
          : result.learning_cycle_output.score.total,
      repetition_type:
        "status" in result ? null : result.learning_cycle_output.repetition.repetition_type,
      updated_state: "status" in result ? {} : result.updated_state,
      learning_summary:
        "status" in result
          ? { status: result.status, message: result.message }
          : {
              semantic_axis: result.learning_cycle_output.repetition.semantic_axis,
              repetition_type: result.learning_cycle_output.repetition.repetition_type,
              threshold_classification:
                result.learning_cycle_output.threshold.threshold_state.classification,
              next_context: result.updated_state.next_context,
            },
      full_payload: "status" in result ? null : result,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,slice_id" },
  );
}

export async function POST(request: Request) {
  let payload: SliceLearningLoopPayload;
  try {
    payload = (await request.json()) as SliceLearningLoopPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsedSlice =
    payload.parsed_slice ??
    (payload.rawSliceText || payload.raw_slice_text
      ? runParserEngine(payload.rawSliceText ?? payload.raw_slice_text ?? "")
      : null);

  if (!parsedSlice) {
    return NextResponse.json({ error: "parsed_slice sau rawSliceText este obligatoriu." }, { status: 400 });
  }

  const { userId } = await auth();
  const [historicalSlices, historicalMemory] = await Promise.all([
    loadSliceRepetitionHistory(userId),
    loadHistoricalMemory(userId),
  ]);

  const result = runLearningLoopEngineV2Slices({
    parsed_slice: parsedSlice,
    historical_slices: historicalSlices,
    system_memory: {
      legacy: [],
      canon: [],
    },
    historical_memory: historicalMemory,
  });

  await saveSliceLearningLoop(userId, parsedSlice, result);

  if ("status" in result) {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result);
}
