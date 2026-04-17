import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type InfluenceMode = "whisper" | "echo" | "rupture" | "counterpoint" | "stain";

function buildInterferenceNote(influenceMode: InfluenceMode) {
  switch (influenceMode) {
    case "echo":
      return "Jurnalul repeta si amplifica un motiv activ in gandirea live.";
    case "rupture":
      return "Jurnalul rupe directia curenta si introduce o deviatie brusca.";
    case "counterpoint":
      return "Jurnalul introduce opozitie si tensiune fata de gandirea curenta.";
    case "stain":
      return "Jurnalul lasa urme persistente in campul de gandire.";
    case "whisper":
    default:
      return "Jurnalul injecteaza o influenta subtila in gandirea live.";
  }
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ interference: null });
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return NextResponse.json({ interference: null });
  }

  const { data: blogPost, error } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, sense_weight, structure_weight, attention_weight, influence_mode, published_at, updated_at")
    .eq("user_id", userId)
    .eq("status", "published")
    .eq("is_contaminant", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !blogPost) {
    return NextResponse.json({ interference: null });
  }

  return NextResponse.json({
    interference: {
      sourceId: blogPost.id,
      title: blogPost.title,
      excerpt: blogPost.excerpt,
      senseWeight: Number(blogPost.sense_weight ?? 0),
      structureWeight: Number(blogPost.structure_weight ?? 0),
      attentionWeight: Number(blogPost.attention_weight ?? 0),
      influenceMode: blogPost.influence_mode,
      note: buildInterferenceNote(blogPost.influence_mode as InfluenceMode),
      publishedAt: blogPost.published_at ?? blogPost.updated_at,
    },
  });
}
