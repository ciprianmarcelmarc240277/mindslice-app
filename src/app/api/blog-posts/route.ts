import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreateDraftPayload = {
  savedMomentId?: string;
};

const DEFAULT_INFLUENCE_MODE = "whisper";

function buildDraftTitle(direction: string) {
  return direction.trim() || "Draft de jurnal";
}

function buildDraftExcerpt(thought: string) {
  return thought.trim().slice(0, 220);
}

function buildDraftContent(direction: string, thought: string) {
  return [
    `Direcție: ${direction}`,
    "",
    "Fragment de gândire live:",
    thought,
    "",
    "Nota editorială:",
    "Dezvoltă acest moment într-o intrare de jurnal care poate contamina Artistul AI live(post-generative art).",
  ].join("\n");
}

async function getAuthorPseudonym(supabase: ReturnType<typeof createServerSupabaseClient>, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("pseudonym")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return profile?.pseudonym ?? null;
}

function withAuthorPseudonym<T extends Record<string, unknown>>(blogPost: T, pseudonym: string | null) {
  return {
    ...blogPost,
    author_user_id: blogPost.user_id,
    author_pseudonym: pseudonym,
  };
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

  let authorPseudonym: string | null = null;
  try {
    authorPseudonym = await getAuthorPseudonym(supabase, userId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca pseudonimul." },
      { status: 500 },
    );
  }

  const { data: blogPosts, error } = await supabase
    .from("blog_posts")
    .select(
      "id, user_id, saved_moment_id, title, excerpt, source_text, content, ai_response_text, ai_response_generated_at, sense_weight, structure_weight, attention_weight, influence_mode, is_contaminant, is_debut_submission, is_debut_selected, is_debut_published, status, cover_image_url, published_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    blogPosts: (blogPosts ?? []).map((entry) => withAuthorPseudonym(entry, authorPseudonym)),
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateDraftPayload;
  try {
    payload = (await request.json()) as CreateDraftPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.savedMomentId) {
    return NextResponse.json({ error: "savedMomentId este obligatoriu." }, { status: 400 });
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

  let authorPseudonym: string | null = null;
  try {
    authorPseudonym = await getAuthorPseudonym(supabase, userId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nu am putut încărca pseudonimul." },
      { status: 500 },
    );
  }

  const { data: existingDraft, error: existingDraftError } = await supabase
    .from("blog_posts")
    .select(
      "id, user_id, saved_moment_id, title, excerpt, source_text, content, ai_response_text, ai_response_generated_at, sense_weight, structure_weight, attention_weight, influence_mode, is_contaminant, is_debut_submission, is_debut_selected, is_debut_published, status, cover_image_url, published_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("saved_moment_id", payload.savedMomentId)
    .limit(1)
    .maybeSingle();

  if (existingDraftError) {
    return NextResponse.json({ error: existingDraftError.message }, { status: 500 });
  }

  if (existingDraft) {
    return NextResponse.json({
      blogPost: withAuthorPseudonym(existingDraft, authorPseudonym),
      reused: true,
    });
  }

  const { data: savedMoment, error: savedMomentError } = await supabase
    .from("saved_moments")
    .select("id, direction, thought, prompt, image_url")
    .eq("user_id", userId)
    .eq("id", payload.savedMomentId)
    .maybeSingle();

  if (savedMomentError) {
    return NextResponse.json({ error: savedMomentError.message }, { status: 500 });
  }

  if (!savedMoment) {
    return NextResponse.json({ error: "Momentul salvat nu a fost gasit." }, { status: 404 });
  }

  const { data: blogPost, error } = await supabase
    .from("blog_posts")
    .insert({
      user_id: userId,
      saved_moment_id: savedMoment.id,
      title: buildDraftTitle(savedMoment.direction),
      excerpt: buildDraftExcerpt(savedMoment.thought),
      source_text: buildDraftContent(savedMoment.direction, savedMoment.thought),
      content: "",
      cover_image_url: savedMoment.image_url,
      sense_weight: 0.4,
      structure_weight: 0.3,
      attention_weight: 0.3,
      influence_mode: DEFAULT_INFLUENCE_MODE,
      is_contaminant: true,
      is_debut_submission: false,
      status: "draft",
    })
    .select(
      "id, user_id, saved_moment_id, title, excerpt, source_text, content, ai_response_text, ai_response_generated_at, sense_weight, structure_weight, attention_weight, influence_mode, is_contaminant, is_debut_submission, is_debut_selected, is_debut_published, status, cover_image_url, published_at, created_at, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { blogPost: withAuthorPseudonym(blogPost, authorPseudonym) },
    { status: 201 },
  );
}
