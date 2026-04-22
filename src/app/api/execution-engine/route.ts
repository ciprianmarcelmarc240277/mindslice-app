import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runExecutionEngineV3 } from "@/lib/mindslice/concept-execution-engine-system";
import type { UserProfile } from "@/lib/mindslice/mindslice-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ExecutionEnginePayload = {
  rawSliceText?: string;
  raw_slice_text?: string;
};

async function loadProfile(userId: string | null): Promise<UserProfile | null> {
  if (!userId) {
    return null;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return null;
  }

  const [{ data: profile }, { data: identity }, { data: role }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "user_id, display_name, pseudonym, email, avatar_url, name_declaration_accepted, subscription_status, subscription_expires_at, address_form, bio, artist_statement, debut_status",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("author_identities")
      .select("type, first_name, last_name, indexed_name, consent_flag")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("author_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    identity_type: (identity?.type as UserProfile["identity_type"]) ?? "pseudonym",
    first_name: identity?.first_name ?? null,
    last_name: identity?.last_name ?? null,
    indexed_name: identity?.indexed_name ?? null,
    consent_flag: identity?.consent_flag ?? false,
    author_role: role?.role ?? "free",
  };
}

export async function POST(request: Request) {
  let payload: ExecutionEnginePayload;
  try {
    payload = (await request.json()) as ExecutionEnginePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const rawSliceText = payload.rawSliceText ?? payload.raw_slice_text;

  if (!rawSliceText?.trim()) {
    return NextResponse.json(
      { error: "rawSliceText este obligatoriu." },
      { status: 400 },
    );
  }

  const { userId } = await auth();
  const profile = await loadProfile(userId);
  const result = runExecutionEngineV3({
    rawSliceText,
    user: profile,
  });

  if ("status" in result && result.status === "fail") {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result);
}
