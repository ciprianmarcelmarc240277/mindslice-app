import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type UpdateBlogPostPayload = {
  title?: string;
  excerpt?: string;
  content?: string;
  senseWeight?: number;
  structureWeight?: number;
  attentionWeight?: number;
  influenceMode?: "whisper" | "echo" | "rupture" | "counterpoint" | "stain";
  isContaminant?: boolean;
};

const INFLUENCE_MODES = ["whisper", "echo", "rupture", "counterpoint", "stain"] as const;

function clampWeight(value: number) {
  return Math.min(1, Math.max(0, value));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let payload: UpdateBlogPostPayload;
  try {
    payload = (await request.json()) as UpdateBlogPostPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const nextTitle = payload.title?.trim();
  const nextExcerpt = payload.excerpt?.trim();
  const nextContent = payload.content?.trim();
  const nextSenseWeight =
    payload.senseWeight === undefined ? undefined : clampWeight(payload.senseWeight);
  const nextStructureWeight =
    payload.structureWeight === undefined ? undefined : clampWeight(payload.structureWeight);
  const nextAttentionWeight =
    payload.attentionWeight === undefined ? undefined : clampWeight(payload.attentionWeight);
  const nextInfluenceMode = payload.influenceMode;

  if (!nextTitle || !nextContent) {
    return NextResponse.json(
      { error: "title si content sunt obligatorii." },
      { status: 400 },
    );
  }

  if (
    nextInfluenceMode !== undefined &&
    !INFLUENCE_MODES.includes(nextInfluenceMode)
  ) {
    return NextResponse.json(
      { error: "influenceMode invalid." },
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

  const { data: blogPost, error } = await supabase
    .from("blog_posts")
    .update({
      title: nextTitle,
      excerpt: nextExcerpt || null,
      content: nextContent,
      ...(nextSenseWeight !== undefined ? { sense_weight: nextSenseWeight } : {}),
      ...(nextStructureWeight !== undefined ? { structure_weight: nextStructureWeight } : {}),
      ...(nextAttentionWeight !== undefined ? { attention_weight: nextAttentionWeight } : {}),
      ...(nextInfluenceMode !== undefined ? { influence_mode: nextInfluenceMode } : {}),
      ...(payload.isContaminant !== undefined ? { is_contaminant: payload.isContaminant } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select("id, saved_moment_id, title, excerpt, content, sense_weight, structure_weight, attention_weight, influence_mode, is_contaminant, status, cover_image_url, published_at, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ blogPost });
}
