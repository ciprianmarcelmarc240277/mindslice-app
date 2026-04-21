import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  MindsliceStateDomain,
  MindsliceStateScope,
} from "@/lib/mindslice/mindslice-state-persistence";

type PersistMindsliceStatePayload = {
  scope?: MindsliceStateScope;
  domain?: MindsliceStateDomain;
  entries?: Array<{ id: string } & Record<string, unknown>>;
};

type PersistedStateRow = {
  entry_id: string;
  entry_payload: Record<string, unknown> | null;
  updated_at: string;
};

const VALID_SCOPES = new Set<MindsliceStateScope>(["memory", "canon"]);
const VALID_DOMAINS = new Set<MindsliceStateDomain>(["narrative", "art", "structure", "color", "shape", "shape_grammar", "meta_system"]);

function isValidScope(value: string | null): value is MindsliceStateScope {
  return value !== null && VALID_SCOPES.has(value as MindsliceStateScope);
}

function isValidDomain(value: string | null): value is MindsliceStateDomain {
  return value !== null && VALID_DOMAINS.has(value as MindsliceStateDomain);
}

function resolveTable(scope: MindsliceStateScope) {
  return scope === "memory" ? "mindslice_memory_states" : "mindslice_canon_states";
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const domain = url.searchParams.get("domain");

  if (!isValidScope(scope) || !isValidDomain(domain)) {
    return NextResponse.json(
      { error: "scope și domain sunt obligatorii și trebuie să fie valide." },
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

  const { data, error } = await supabase
    .from(resolveTable(scope))
    .select("entry_id, entry_payload, updated_at")
    .eq("user_id", userId)
    .eq("domain", domain)
    .order("updated_at", { ascending: false })
    .limit(24);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries = Array.isArray(data)
    ? (data as PersistedStateRow[])
        .map((row) => row.entry_payload)
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    : [];

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: PersistMindsliceStatePayload;
  try {
    payload = (await request.json()) as PersistMindsliceStatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const scope = payload.scope ?? null;
  const domain = payload.domain ?? null;
  const entries = Array.isArray(payload.entries) ? payload.entries : null;

  if (!isValidScope(scope) || !isValidDomain(domain) || !entries) {
    return NextResponse.json(
      { error: "scope, domain și entries sunt obligatorii." },
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

  const table = resolveTable(scope);
  const entryIds = entries.map((entry) => entry.id);

  const { data: existingRows, error: existingError } = await supabase
    .from(table)
    .select("entry_id")
    .eq("user_id", userId)
    .eq("domain", domain);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const staleEntryIds = (Array.isArray(existingRows) ? existingRows : [])
    .map((row) => row.entry_id as string)
    .filter((entryId) => !entryIds.includes(entryId));

  if (staleEntryIds.length) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .eq("domain", domain)
      .in("entry_id", staleEntryIds);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  if (entries.length) {
    const timestamp = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from(table)
      .upsert(
        entries.map((entry) => ({
          user_id: userId,
          domain,
          entry_id: entry.id,
          entry_payload: entry,
          updated_at: timestamp,
        })),
        {
          onConflict: "user_id,domain,entry_id",
        },
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from(table)
    .select("entry_id, entry_payload, updated_at")
    .eq("user_id", userId)
    .eq("domain", domain)
    .order("updated_at", { ascending: false })
    .limit(24);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const syncedEntries = Array.isArray(data)
    ? (data as PersistedStateRow[])
        .map((row) => row.entry_payload)
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    : [];

  return NextResponse.json({ entries: syncedEntries });
}
