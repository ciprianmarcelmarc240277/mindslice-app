import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ConceptArtifact,
  ConceptState,
  ConceptValidationResult,
} from "@/lib/mindslice/mindslice-types";

type ConceptDetailRow = {
  id: string;
  concept_key: string;
  concept_state: ConceptState;
  validation_result: ConceptValidationResult;
  created_at: string;
  updated_at: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ conceptId: string }> },
) {
  const { conceptId } = await context.params;

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase configuration error" },
      { status: 500 },
    );
  }

  const { data: concept, error: conceptError } = await supabase
    .from("concepts")
    .select("id, concept_key, concept_state, validation_result, created_at, updated_at")
    .eq("concept_key", conceptId)
    .in("stage", ["resolved", "canonical"])
    .single();

  if (conceptError || !concept) {
    return NextResponse.json({ error: "Concept not found" }, { status: 404 });
  }

  const { data: artifacts, error: artifactError } = await supabase
    .from("concept_artifacts")
    .select("id, concept_id, artifact_type, content_text, content_json, image_url, created_at, updated_at")
    .eq("concept_id", concept.id)
    .order("created_at", { ascending: false });

  if (artifactError) {
    return NextResponse.json({ error: artifactError.message }, { status: 500 });
  }

  return NextResponse.json({
    concept: concept as ConceptDetailRow,
    artifacts: (artifacts ?? []) as ConceptArtifact[],
  });
}
