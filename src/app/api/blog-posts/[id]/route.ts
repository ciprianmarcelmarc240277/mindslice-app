import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type UpdateBlogPostPayload = {
  title?: string;
  excerpt?: string;
  sourceText?: string;
  content?: string;
  senseWeight?: number;
  structureWeight?: number;
  attentionWeight?: number;
  influenceMode?: "whisper" | "echo" | "rupture" | "counterpoint" | "stain";
  isContaminant?: boolean;
  isDebutSubmission?: boolean;
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
  const nextSourceText = payload.sourceText?.trim();
  const nextContent =
    payload.content === undefined ? undefined : payload.content.trim();
  const nextSenseWeight =
    payload.senseWeight === undefined ? undefined : clampWeight(payload.senseWeight);
  const nextStructureWeight =
    payload.structureWeight === undefined ? undefined : clampWeight(payload.structureWeight);
  const nextAttentionWeight =
    payload.attentionWeight === undefined ? undefined : clampWeight(payload.attentionWeight);
  const nextInfluenceMode = payload.influenceMode;

  if (!nextTitle) {
    return NextResponse.json(
      { error: "title este obligatoriu." },
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("pseudonym, subscription_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (payload.isDebutSubmission === true && profile?.subscription_status !== "active") {
    return NextResponse.json(
      { error: "Debut submission este disponibil doar cu abonament lunar activ." },
      { status: 403 },
    );
  }

  const { data: blogPost, error } = await supabase
    .from("blog_posts")
    .update({
      title: nextTitle,
      excerpt: nextExcerpt || null,
      ...(nextSourceText !== undefined ? { source_text: nextSourceText || null } : {}),
      ...(nextContent !== undefined ? { content: nextContent } : {}),
      ...(nextSenseWeight !== undefined ? { sense_weight: nextSenseWeight } : {}),
      ...(nextStructureWeight !== undefined ? { structure_weight: nextStructureWeight } : {}),
      ...(nextAttentionWeight !== undefined ? { attention_weight: nextAttentionWeight } : {}),
      ...(nextInfluenceMode !== undefined ? { influence_mode: nextInfluenceMode } : {}),
      ...(payload.isContaminant !== undefined ? { is_contaminant: payload.isContaminant } : {}),
      ...(payload.isDebutSubmission !== undefined
        ? { is_debut_submission: payload.isDebutSubmission }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select(
      "id, user_id, saved_moment_id, title, excerpt, source_text, content, ai_response_text, ai_response_generated_at, sense_weight, structure_weight, attention_weight, influence_mode, is_contaminant, is_debut_submission, is_debut_selected, is_debut_published, status, cover_image_url, published_at, created_at, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    blogPost: {
      ...blogPost,
      author_user_id: blogPost.user_id,
      author_pseudonym: profile?.pseudonym ?? null,
    },
  });
}
