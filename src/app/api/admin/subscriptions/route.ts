import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { activateSubscription, deriveAuthorRole } from "@/lib/mindslice/concept-author-engine-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SUBSCRIPTION_STATUS_OPTIONS = [
  "inactive",
  "active",
  "past_due",
  "canceled",
] as const;

type UpdateSubscriptionPayload = {
  targetPseudonym?: string;
  subscriptionStatus?: (typeof SUBSCRIPTION_STATUS_OPTIONS)[number];
};

function getAdminAllowlist() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function normalizePseudonym(value: string) {
  return value.trim().replace(/^[„"']+|[”"']+$/g, "").trim();
}

function isAdminEmail(email: string | null | undefined) {
  const allowlist = getAdminAllowlist();

  if (!email) {
    return false;
  }

  return allowlist.includes(email.trim().toLowerCase());
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const adminEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;

  if (!isAdminEmail(adminEmail)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
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

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, pseudonym, subscription_status, subscription_expires_at")
    .not("pseudonym", "is", null)
    .order("pseudonym", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profiles: (profiles ?? []).filter((entry) => entry.pseudonym?.trim()),
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const adminEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;

  if (!isAdminEmail(adminEmail)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let payload: UpdateSubscriptionPayload;
  try {
    payload = (await request.json()) as UpdateSubscriptionPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const targetPseudonym = normalizePseudonym(payload.targetPseudonym ?? "");
  const nextStatus = payload.subscriptionStatus;

  if (!targetPseudonym) {
    return NextResponse.json({ error: "targetPseudonym este obligatoriu." }, { status: 400 });
  }

  if (!nextStatus || !SUBSCRIPTION_STATUS_OPTIONS.includes(nextStatus)) {
    return NextResponse.json({ error: "subscriptionStatus invalid." }, { status: 400 });
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

  const { data: targetProfile, error: targetProfileError } = await supabase
    .from("profiles")
    .select("user_id, pseudonym, subscription_status, subscription_expires_at")
    .eq("pseudonym", targetPseudonym)
    .maybeSingle();

  if (targetProfileError) {
    return NextResponse.json({ error: targetProfileError.message }, { status: 500 });
  }

  if (!targetProfile) {
    return NextResponse.json({ error: "Pseudonimul țintă nu a fost găsit." }, { status: 404 });
  }

  const { data: targetIdentity, error: targetIdentityError } = await supabase
    .from("author_identities")
    .select("type")
    .eq("user_id", targetProfile.user_id)
    .maybeSingle();

  if (targetIdentityError) {
    return NextResponse.json({ error: targetIdentityError.message }, { status: 500 });
  }

  const nextExpiresAt =
    nextStatus === "active"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({
      subscription_status: nextStatus,
      subscription_expires_at: nextExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", targetProfile.user_id)
    .select("user_id, pseudonym, subscription_status, subscription_expires_at")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const baseRole = deriveAuthorRole({
    identityType: (targetIdentity?.type as "pseudonym" | "indexed" | undefined) ?? "pseudonym",
    subscriptionStatus: "inactive",
  });
  const role = activateSubscription({
    currentRole: baseRole,
    subscriptionStatus: nextStatus,
  });

  await supabase.from("author_roles").upsert(
    {
      user_id: targetProfile.user_id,
      role,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return NextResponse.json({
    profile: {
      ...updatedProfile,
      author_role: role,
    },
  });
}
