import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreateThoughtMemoryPayload = {
  sourceType?: "live_slice" | "journal_contamination";
  direction?: string;
  thought?: string;
  fragments?: string[];
  keywords?: string[];
  senseScore?: number;
  structureScore?: number;
  attentionScore?: number;
  influenceMode?: "whisper" | "echo" | "rupture" | "counterpoint" | "stain" | null;
  memoryWeight?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase configuration error" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("thought_memory")
    .select(
      "id, source_type, direction, thought, fragments, keywords, sense_score, structure_score, attention_score, influence_mode, memory_weight, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ thoughtMemory: data ?? [] });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateThoughtMemoryPayload;
  try {
    payload = (await request.json()) as CreateThoughtMemoryPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.direction || !payload.thought) {
    return NextResponse.json(
      { error: "direction și thought sunt obligatorii." },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase configuration error" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("thought_memory")
    .insert({
      user_id: userId,
      source_type: payload.sourceType ?? "live_slice",
      direction: payload.direction.trim(),
      thought: payload.thought.trim(),
      fragments: (payload.fragments ?? []).slice(0, 6),
      keywords: (payload.keywords ?? []).slice(0, 8),
      sense_score: clamp(Number(payload.senseScore ?? 0), 0, 1),
      structure_score: clamp(Number(payload.structureScore ?? 0), 0, 1),
      attention_score: clamp(Number(payload.attentionScore ?? 0), 0, 1),
      influence_mode: payload.influenceMode ?? null,
      memory_weight: clamp(Number(payload.memoryWeight ?? 0.4), 0, 1),
    })
    .select(
      "id, source_type, direction, thought, fragments, keywords, sense_score, structure_score, attention_score, influence_mode, memory_weight, created_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ thoughtMemory: data }, { status: 201 });
}
