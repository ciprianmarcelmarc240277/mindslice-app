import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  runCanonEngineV1,
  type CanonConcept,
  type CanonHistoricalMemory,
  type CanonScoreProfile,
} from "@/lib/mindslice/concept-canon-engine-system";
import type { ThresholdModelResult } from "@/lib/mindslice/concept-threshold-model-system";
import {
  persistCanonEngineResult,
  type CanonPersistenceDomain,
} from "@/lib/mindslice/canon-engine-persistence-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CanonEnginePayload = {
  concept?: CanonConcept | null;
  score_profile?: CanonScoreProfile;
  threshold_state?: ThresholdModelResult;
  historical_memory?: CanonHistoricalMemory[];
  system_canon?: CanonConcept[];
  domain?: CanonPersistenceDomain;
  persist?: boolean;
};

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CanonEnginePayload;
  try {
    payload = (await request.json()) as CanonEnginePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.concept || !payload.score_profile || !payload.threshold_state) {
    return NextResponse.json(
      { error: "concept, score_profile și threshold_state sunt obligatorii." },
      { status: 400 },
    );
  }

  const canonResult = runCanonEngineV1(
    payload.concept,
    payload.score_profile,
    payload.threshold_state,
    payload.historical_memory ?? [],
    payload.system_canon ?? [],
  );

  let persistence = null;

  if (payload.persist !== false) {
    let supabase;
    try {
      supabase = createServerSupabaseClient();
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Supabase configuration error" },
        { status: 500 },
      );
    }

    persistence = await persistCanonEngineResult({
      supabase,
      userId,
      concept: payload.concept,
      canonResult,
      domain: payload.domain ?? "meta_system",
    });
  }

  return NextResponse.json({
    canon_result: canonResult,
    persistence,
  });
}
