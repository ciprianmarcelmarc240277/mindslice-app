import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ConceptMemoryEntry,
  ConceptState,
  ConceptValidationResult,
} from "@/lib/mindslice/mindslice-types";

type PersistConceptPayload = {
  concept?: ConceptState;
  validation?: ConceptValidationResult;
};

type ConceptRow = {
  id: string;
  concept_key: string;
  concept_state: ConceptState;
  validation_result: ConceptValidationResult;
  created_at: string;
  updated_at: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mapConceptRow(row: ConceptRow): ConceptMemoryEntry {
  return {
    id: row.concept_state.id || row.concept_key,
    concept: row.concept_state,
    validation: row.validation_result,
    storedAt: row.created_at,
    lastSeenAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  const { userId } = await auth();
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") ?? "public";

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase configuration error" },
      { status: 500 },
    );
  }

  if (scope === "memory") {
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("concepts")
      .select("id, concept_key, concept_state, validation_result, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(24);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const conceptMemory = Array.isArray(data)
      ? (data as ConceptRow[]).map(mapConceptRow)
      : [];

    return NextResponse.json({ conceptMemory });
  }

  const { data, error } = await supabase
    .from("concepts")
    .select("id, concept_key, concept_state, validation_result, created_at, updated_at")
    .in("stage", ["resolved", "canonical"])
    .order("updated_at", { ascending: false })
    .limit(24);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const conceptMemory = Array.isArray(data)
    ? (data as ConceptRow[]).map(mapConceptRow)
    : [];

  return NextResponse.json({ conceptArchive: conceptMemory });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: PersistConceptPayload;
  try {
    payload = (await request.json()) as PersistConceptPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.concept || !payload.validation) {
    return NextResponse.json(
      { error: "concept și validation sunt obligatorii." },
      { status: 400 },
    );
  }

  const { concept, validation } = payload;

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase configuration error" },
      { status: 500 },
    );
  }

  const timestamp = new Date().toISOString();
  const conceptRecord = {
    user_id: userId,
    concept_key: concept.id,
    source_idea_id: concept.provenance.sourceIdeaId,
    title: concept.core.title,
    one_line_definition: concept.core.oneLineDefinition,
    thesis: concept.core.thesis,
    tension: concept.core.tension,
    resolution_claim: concept.core.resolutionClaim,
    stage: concept.stage,
    resolution_status: validation.resolutionStatus,
    semantic_score: clamp(validation.scores.semanticStability, 0, 1),
    visual_score: clamp(validation.scores.visualConsistency, 0, 1),
    cross_modal_score: clamp(validation.scores.crossModalAlignment, 0, 1),
    contamination_score: clamp(validation.scores.contaminationResolution, 0, 1),
    author_alignment_score: clamp(validation.scores.authorDilemmaResolution, 0, 1),
    overall_score: clamp(concept.confidence.overall, 0, 1),
    is_canonical: concept.stage === "canonical",
    promoted_at: concept.promotedAt,
    concept_state: concept,
    validation_result: validation,
    updated_at: timestamp,
  };

  const { data: persistedConcept, error: conceptError } = await supabase
    .from("concepts")
    .upsert(conceptRecord, {
      onConflict: "user_id,concept_key",
    })
    .select("id, concept_key, concept_state, validation_result, created_at, updated_at")
    .single();

  if (conceptError || !persistedConcept) {
    return NextResponse.json(
      { error: conceptError?.message || "Nu am putut salva conceptul." },
      { status: 500 },
    );
  }

  const textArtifact = {
    concept_id: persistedConcept.id,
    artifact_type: "text",
    content_text: [
      concept.core.title,
      concept.core.oneLineDefinition,
      concept.core.thesis,
      concept.core.resolutionClaim,
    ]
      .filter(Boolean)
      .join("\n\n"),
    content_json: {
      title: concept.core.title,
      oneLineDefinition: concept.core.oneLineDefinition,
      thesis: concept.core.thesis,
      tension: concept.core.tension,
      resolutionClaim: concept.core.resolutionClaim,
      keywords: concept.core.keywords,
    },
    updated_at: timestamp,
  };

  const graphArtifact = {
    concept_id: persistedConcept.id,
    artifact_type: "graph_state",
    content_text: concept.expression.visualSignature,
    content_json: {
      expression: concept.expression,
      contamination: concept.contamination,
      validation,
    },
    updated_at: timestamp,
  };

  const systemArtifact = {
    concept_id: persistedConcept.id,
    artifact_type: "hybrid",
    content_text: concept.systemEffect?.modifiesSystem
      ? `Conceptul modifică sistemul prin ${concept.systemEffect.sourceConceptTitle ?? concept.core.title}.`
      : "Conceptul nu a produs încă o modificare persistentă de sistem.",
    content_json: {
      systemEffect: concept.systemEffect,
      modifiesSystem: concept.systemEffect?.modifiesSystem ?? false,
    },
    updated_at: timestamp,
  };

  const { error: artifactError } = await supabase.from("concept_artifacts").upsert(
    [textArtifact, graphArtifact, systemArtifact],
    {
      onConflict: "concept_id,artifact_type",
    },
  );

  if (artifactError) {
    return NextResponse.json({ error: artifactError.message }, { status: 500 });
  }

  return NextResponse.json(
    { conceptMemory: mapConceptRow(persistedConcept as ConceptRow) },
    { status: 201 },
  );
}
