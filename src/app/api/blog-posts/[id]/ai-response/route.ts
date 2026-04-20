import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateJournalResponse } from "@/lib/mindslice/openai-journal-response";
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

  const { data: blogPost, error: fetchBlogPostError } = await supabase
    .from("blog_posts")
    .select("title, content, influence_mode, status")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (fetchBlogPostError) {
    return NextResponse.json({ error: fetchBlogPostError.message }, { status: 500 });
  }

  if (!blogPost) {
    return NextResponse.json({ error: "Postarea nu a fost găsită." }, { status: 404 });
  }

  if (blogPost.status !== "published") {
    return NextResponse.json(
      { error: "Răspunsul AI poate fi regenerat doar pentru postări publicate." },
      { status: 400 },
    );
  }

  if (!blogPost.content?.trim()) {
    return NextResponse.json(
      { error: "Postarea nu are text editorial final pentru răspunsul AI." },
      { status: 400 },
    );
  }

  const aiResponseText = await generateJournalResponse({
    title: blogPost.title ?? "Jurnal publicat",
    content: blogPost.content,
    influenceMode: (blogPost.influence_mode ?? "whisper") as
      | "whisper"
      | "echo"
      | "rupture"
      | "counterpoint"
      | "stain",
  });

  if (!aiResponseText) {
    return NextResponse.json(
      { error: "Artistul AI nu a reușit să genereze un răspuns nou acum." },
      { status: 502 },
    );
  }

  const { data: updatedBlogPost, error: updateError } = await supabase
    .from("blog_posts")
    .update({
      ai_response_text: aiResponseText,
      ai_response_generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select(
      "id, user_id, saved_moment_id, title, excerpt, source_text, content, ai_response_text, ai_response_generated_at, sense_weight, structure_weight, attention_weight, influence_mode, is_contaminant, is_debut_submission, is_debut_selected, is_debut_published, status, cover_image_url, published_at, created_at, updated_at",
    )
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    blogPost: {
      ...updatedBlogPost,
      author_user_id: updatedBlogPost.user_id,
      author_pseudonym: profile?.pseudonym ?? null,
    },
  });
}
