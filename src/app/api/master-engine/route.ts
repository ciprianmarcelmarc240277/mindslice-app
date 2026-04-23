import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { runMasterEngine } from "@/lib/mindslice/concept-master-engine-system";
import type { ThoughtState, UserProfile } from "@/lib/mindslice/mindslice-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type MasterEnginePayload = {
  idea?: ThoughtState | null;
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
      .select(
        "type, first_name, middle_name, last_name, indexed_name, executive_name, executive_index, consent_flag",
      )
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
    middle_name: identity?.middle_name ?? null,
    last_name: identity?.last_name ?? null,
    indexed_name: identity?.indexed_name ?? null,
    executive_name: identity?.executive_name ?? null,
    executive_index: identity?.executive_index ?? null,
    consent_flag: identity?.consent_flag ?? false,
    author_role: role?.role ?? "free",
  };
}

export async function POST(request: Request) {
  let payload: MasterEnginePayload;
  try {
    payload = (await request.json()) as MasterEnginePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.idea) {
    return NextResponse.json({ error: "idea este obligatorie." }, { status: 400 });
  }

  const { userId } = await auth();
  const profile = await loadProfile(userId);
  const result = runMasterEngine({
    user: profile,
    idea: payload.idea,
  });

  if (result.status === "fail") {
    return NextResponse.json(result, { status: 422 });
  }

  return NextResponse.json(result);
}
