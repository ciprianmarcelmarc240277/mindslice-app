import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
    .select("pseudonym")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile?.pseudonym?.trim()) {
    return NextResponse.json(
      { error: "Setează mai întâi pseudonimul în PANEL · Account Profile înainte de publicare." },
      { status: 400 },
    );
  }

  const { data: blogPost, error } = await supabase
    .from("blog_posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select(
      "id, user_id, saved_moment_id, title, excerpt, content, sense_weight, structure_weight, attention_weight, influence_mode, is_contaminant, is_debut_submission, is_debut_selected, is_debut_published, status, cover_image_url, published_at, created_at, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    blogPost: {
      ...blogPost,
      author_user_id: blogPost.user_id,
      author_pseudonym: profile.pseudonym,
    },
  });
}
