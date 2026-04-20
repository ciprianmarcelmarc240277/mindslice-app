import { auth } from "@clerk/nextjs/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildSlicesEngineResult,
  type ContaminationSource,
  type InfluenceMode,
} from "@/lib/mindslice/engine";
import { refineSlicesWithOpenAI } from "@/lib/mindslice/openai-slices";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getActiveContamination(userId: string | null) {
  if (!userId) {
    return null;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return null;
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .select("title, excerpt, content, sense_weight, structure_weight, attention_weight, influence_mode")
    .eq("user_id", userId)
    .eq("status", "published")
    .eq("is_contaminant", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    senseWeight: Number(data.sense_weight ?? 0),
    structureWeight: Number(data.structure_weight ?? 0),
    attentionWeight: Number(data.attention_weight ?? 0),
    influenceMode: (data.influence_mode ?? "whisper") as InfluenceMode,
  } satisfies ContaminationSource;
}

export async function GET() {
  const fallback = {
    slices: [] as unknown[],
    engineMode: "MindSlice live thought scene / unavailable",
    engineProfile: {
      stage: "alpha",
      generationStrategy: "slice_file_parser",
      contaminationStrategy: "journal_contamination_overlay",
      charterAxes: [] as string[],
      sceneConstraints: [] as string[],
      activeContaminationRule: null,
      openaiStructuredGeneration: "inactive" as const,
    },
  };

  try {
    const { userId } = await auth();
    const filePath = path.resolve(process.cwd(), "..", "Slices");
    const content = await readFile(filePath, "utf8");
    const contamination = await getActiveContamination(userId);
    const baseResult = buildSlicesEngineResult(content, contamination);

    try {
      const refinedResult = await refineSlicesWithOpenAI(baseResult, contamination);
      if (refinedResult) {
        return Response.json(refinedResult);
      }
    } catch (error) {
      const fallbackResult = {
        ...baseResult,
        engineMode: `${baseResult.engineMode} / local fallback`,
        engineProfile: {
          ...baseResult.engineProfile,
          activeContaminationRule:
            error instanceof Error
              ? `OpenAI fallback: ${error.message}`
              : "OpenAI fallback: unknown refinement error",
        },
      };

      return Response.json(fallbackResult);
    }

    return Response.json(baseResult);
  } catch {
    return Response.json(fallback);
  }
}
