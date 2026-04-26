import type {
  CanonConcept,
  CanonEngineResult,
} from "@/lib/mindslice/concept-canon-engine-system";

export type CanonPersistenceDomain =
  | "narrative"
  | "art"
  | "structure"
  | "color"
  | "shape"
  | "shape_grammar"
  | "meta_system";

type SupabaseErrorLike = {
  message: string;
};

type SupabaseQueryResult<Data = unknown> = {
  data?: Data | null;
  error?: SupabaseErrorLike | null;
};

type SupabaseFilterBuilder<Data = unknown> = {
  select: (columns: string) => SupabaseFilterBuilder<Data>;
  eq: (column: string, value: unknown) => SupabaseFilterBuilder<Data>;
  single: () => Promise<SupabaseQueryResult<Data>>;
  maybeSingle: () => Promise<SupabaseQueryResult<Data>>;
};

type SupabaseQueryBuilder<Data = unknown> = {
  select: (columns: string) => SupabaseFilterBuilder<Data>;
  upsert: (payload: unknown, options?: unknown) => SupabaseFilterBuilder<Data>;
  update: (payload: unknown) => SupabaseFilterBuilder<Data>;
};

type SupabaseLike = {
  from: (table: string) => unknown;
};

type ExistingConceptRecord = {
  id?: unknown;
  promoted_at?: unknown;
  concept_state?: unknown;
};

export type PersistCanonEngineResultInput = {
  supabase: SupabaseLike;
  userId: string;
  concept: CanonConcept;
  canonResult: CanonEngineResult;
  domain?: CanonPersistenceDomain;
};

export type PersistCanonEngineResultOutput =
  | {
      status: "stored";
      entryId: string;
      domain: CanonPersistenceDomain;
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "fail";
      message: string;
    };

export type SyncCanonicalConceptRecordOutput =
  | {
      status: "updated";
      conceptId: string;
      conceptKey: string;
      canonical: boolean;
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "fail";
      message: string;
    };

function conceptEntryId(concept: CanonConcept, canonResult: Exclude<CanonEngineResult, { status: "fail" }>) {
  return canonResult.concept_id || concept.concept_id || concept.conceptId || "anonymous_concept";
}

function shouldPersistCanonResult(canonResult: CanonEngineResult) {
  return !("status" in canonResult) && canonResult.canon_status !== "NON_CANON";
}

function isSupabaseQueryBuilder(value: unknown): value is SupabaseQueryBuilder {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.select === "function" &&
    typeof candidate.upsert === "function" &&
    typeof candidate.update === "function"
  );
}

function queryBuilderFor(supabase: SupabaseLike, table: string) {
  const builder = supabase.from(table);

  return isSupabaseQueryBuilder(builder) ? builder : null;
}

function buildConceptStatePatch(existingState: unknown, canonResult: Exclude<CanonEngineResult, { status: "fail" }>) {
  const timestamp = new Date().toISOString();
  const currentState =
    typeof existingState === "object" && existingState !== null
      ? ({ ...(existingState as Record<string, unknown>) } satisfies Record<string, unknown>)
      : {};

  currentState.canon = {
    status: canonResult.canon_status,
    action: canonResult.action,
    effect: canonResult.effect,
    scores: {
      reuse: canonResult.reuse_score,
      impact: canonResult.impact_score,
      stability: canonResult.stability_score,
      recurrence: canonResult.recurrence_score,
    },
    updatedAt: timestamp,
  };

  if (canonResult.canon_status === "CANONICAL") {
    currentState.stage = "canonical";
    currentState.promotedAt = currentState.promotedAt ?? timestamp;
  }

  return currentState;
}

export async function persistCanonEngineResult({
  supabase,
  userId,
  concept,
  canonResult,
  domain = "meta_system",
}: PersistCanonEngineResultInput): Promise<PersistCanonEngineResultOutput> {
  if ("status" in canonResult) {
    return {
      status: "skipped",
      reason: canonResult.message,
    };
  }

  if (!shouldPersistCanonResult(canonResult)) {
    return {
      status: "skipped",
      reason: "NON_CANON",
    };
  }

  const entryId = conceptEntryId(concept, canonResult);
  const entryPayload = {
    ...concept,
    canonEngine: canonResult,
    canonStatus: canonResult.canon_status,
    canonAction: canonResult.action,
    canonEffect: canonResult.effect,
    canonizedAt: new Date().toISOString(),
  };

  const canonStatesQuery = queryBuilderFor(supabase, "mindslice_canon_states");

  if (!canonStatesQuery) {
    return {
      status: "fail",
      message: "CANON_STATE_PERSISTENCE_UNSUPPORTED",
    };
  }

  const { error } = await canonStatesQuery
    .upsert(
      {
        user_id: userId,
        domain,
        entry_id: entryId,
        entry_payload: entryPayload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,domain,entry_id" },
    )
    .select("id")
    .single();

  if (error) {
    return {
      status: "fail",
      message: error.message,
    };
  }

  return {
    status: "stored",
    entryId,
    domain,
  };
}

export async function syncCanonicalConceptRecord({
  supabase,
  userId,
  canonResult,
}: {
  supabase: SupabaseLike;
  userId: string;
  canonResult: CanonEngineResult;
}): Promise<SyncCanonicalConceptRecordOutput> {
  if ("status" in canonResult) {
    return {
      status: "skipped",
      reason: canonResult.message,
    };
  }

  const conceptsQuery = queryBuilderFor(supabase, "concepts");

  if (!conceptsQuery) {
    return {
      status: "skipped",
      reason: "CONCEPT_SYNC_UNSUPPORTED",
    };
  }

  const conceptKey = canonResult.concept_id;
  const { data: selectedConcept, error: selectError } = await conceptsQuery
    .select("id, concept_key, promoted_at, concept_state")
    .eq("user_id", userId)
    .eq("concept_key", conceptKey)
    .maybeSingle();

  if (selectError) {
    return {
      status: "fail",
      message: selectError.message,
    };
  }

  if (!selectedConcept || typeof selectedConcept !== "object") {
    return {
      status: "skipped",
      reason: "CONCEPT_NOT_FOUND",
    };
  }

  const existingConcept = selectedConcept as ExistingConceptRecord;
  const canonical = canonResult.canon_status === "CANONICAL";
  const promotedAt =
    canonical
      ? (typeof existingConcept.promoted_at === "string" && existingConcept.promoted_at) || new Date().toISOString()
      : existingConcept.promoted_at ?? null;
  const conceptState = buildConceptStatePatch(existingConcept.concept_state, canonResult);
  const updatePayload = canonical
    ? {
        is_canonical: true,
        stage: "canonical",
        promoted_at: promotedAt,
        concept_state: conceptState,
        updated_at: new Date().toISOString(),
      }
    : {
        is_canonical: false,
        concept_state: conceptState,
        updated_at: new Date().toISOString(),
      };

  const { error: updateError } = await conceptsQuery
    .update(updatePayload)
    .eq("user_id", userId)
    .eq("concept_key", conceptKey)
    .select("id, concept_key")
    .maybeSingle();

  if (updateError) {
    return {
      status: "fail",
      message: updateError.message,
    };
  }

  return {
    status: "updated",
    conceptId: typeof existingConcept.id === "string" ? existingConcept.id : conceptKey,
    conceptKey,
    canonical,
  };
}
