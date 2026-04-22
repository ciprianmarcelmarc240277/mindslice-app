import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  activateAuthorIdentity,
  activateSubscription,
  anonymizeUser,
  createUser,
  deriveAuthorRole,
} from "@/lib/mindslice/concept-author-engine-system";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SUBSCRIPTION_STATUS_OPTIONS = [
  "inactive",
  "active",
  "past_due",
  "canceled",
] as const;

type AuthorEngineAction =
  | "create_user"
  | "activate_author_identity"
  | "activate_subscription"
  | "anonymize_user";

type AuthorEnginePayload = {
  action?: AuthorEngineAction;
  targetPseudonym?: string;
  subscriptionStatus?: (typeof SUBSCRIPTION_STATUS_OPTIONS)[number];
};

function normalizePseudonym(value: string) {
  return value.trim().replace(/^[„"']+|[”"']+$/g, "").trim();
}

function isValidFamilyAndGivenName(value: string) {
  return /^\p{L}+(?:[ '-]\p{L}+){0,2},\s\p{L}+(?:[ '-]\p{L}+){0,2}$/u.test(value);
}

function getAdminAllowlist() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getAdminAllowlist().includes(email.trim().toLowerCase());
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: AuthorEnginePayload;
  try {
    payload = (await request.json()) as AuthorEnginePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const action = payload.action;

  if (!action) {
    return NextResponse.json({ error: "action este obligatoriu." }, { status: 400 });
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

  const clerkUser = await currentUser();

  if (action === "create_user") {
    await supabase.from("users").upsert(
      {
        user_id: userId,
        provider: createUser().provider,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    await supabase.from("profiles").upsert(
      {
        user_id: userId,
        email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
        avatar_url: clerkUser?.imageUrl ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    await supabase.from("author_identities").upsert(
      {
        user_id: userId,
        type: createUser().identity,
        consent_flag: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    await supabase.from("author_roles").upsert(
      {
        user_id: userId,
        role: createUser().role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return NextResponse.json({
      user: {
        user_id: userId,
        provider: createUser().provider,
        identity_type: createUser().identity,
        author_role: createUser().role,
      },
    });
  }

  if (action === "activate_author_identity") {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, display_name, pseudonym, subscription_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile?.display_name || !isValidFamilyAndGivenName(profile.display_name)) {
      return NextResponse.json(
        { error: 'Ai nevoie de un nume valid în formatul "Nume, Prenume" înainte de activare.' },
        { status: 400 },
      );
    }

    const identity = activateAuthorIdentity({
      displayName: profile.display_name,
      pseudonym: profile.pseudonym ?? null,
      consentFlag: true,
    });
    const role = deriveAuthorRole({
      identityType: identity.identityType,
      subscriptionStatus:
        (profile.subscription_status as (typeof SUBSCRIPTION_STATUS_OPTIONS)[number] | null | undefined) ??
        "inactive",
    });

    await supabase.from("profiles").update({
      name_declaration_accepted: true,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    await supabase.from("author_identities").upsert(
      {
        user_id: userId,
        type: identity.identityType,
        pseudonym: identity.pseudonym,
        first_name: identity.firstName,
        last_name: identity.lastName,
        indexed_name: identity.indexedName,
        consent_flag: identity.consentFlag,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    await supabase.from("author_roles").upsert(
      {
        user_id: userId,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select(
        "user_id, display_name, pseudonym, email, avatar_url, name_declaration_accepted, subscription_status, subscription_expires_at, address_form, bio, artist_statement, debut_status, created_at, updated_at",
      )
      .eq("user_id", userId)
      .single();

    return NextResponse.json({
      profile: {
        ...updatedProfile,
        identity_type: identity.identityType,
        first_name: identity.firstName,
        last_name: identity.lastName,
        indexed_name: identity.indexedName,
        consent_flag: identity.consentFlag,
        author_role: role,
      },
    });
  }

  if (action === "anonymize_user") {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, pseudonym, subscription_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const identity = anonymizeUser({
      pseudonym: profile?.pseudonym ?? null,
    });
    const role = deriveAuthorRole({
      identityType: identity.identityType,
      subscriptionStatus:
        (profile?.subscription_status as (typeof SUBSCRIPTION_STATUS_OPTIONS)[number] | null | undefined) ??
        "inactive",
    });

    await supabase.from("profiles").update({
      name_declaration_accepted: false,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    await supabase.from("author_identities").upsert(
      {
        user_id: userId,
        type: identity.identityType,
        pseudonym: identity.pseudonym,
        first_name: null,
        last_name: null,
        indexed_name: null,
        consent_flag: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    await supabase.from("author_roles").upsert(
      {
        user_id: userId,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select(
        "user_id, display_name, pseudonym, email, avatar_url, name_declaration_accepted, subscription_status, subscription_expires_at, address_form, bio, artist_statement, debut_status, created_at, updated_at",
      )
      .eq("user_id", userId)
      .single();

    return NextResponse.json({
      profile: {
        ...updatedProfile,
        identity_type: identity.identityType,
        first_name: null,
        last_name: null,
        indexed_name: null,
        consent_flag: false,
        author_role: role,
      },
    });
  }

  if (action === "activate_subscription") {
    const adminEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;

    if (!isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const targetPseudonym = normalizePseudonym(payload.targetPseudonym ?? "");
    const nextStatus = payload.subscriptionStatus;

    if (!targetPseudonym) {
      return NextResponse.json({ error: "targetPseudonym este obligatoriu." }, { status: 400 });
    }

    if (!nextStatus || !SUBSCRIPTION_STATUS_OPTIONS.includes(nextStatus)) {
      return NextResponse.json({ error: "subscriptionStatus invalid." }, { status: 400 });
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

    const baseRole = deriveAuthorRole({
      identityType: (targetIdentity?.type as "pseudonym" | "indexed" | undefined) ?? "pseudonym",
      subscriptionStatus: "inactive",
    });
    const role = activateSubscription({
      currentRole: baseRole,
      subscriptionStatus: nextStatus,
    });

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

    await supabase.from("author_roles").upsert(
      {
        user_id: targetProfile.user_id,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return NextResponse.json({
      profile: updatedProfile,
      author_role: role,
    });
  }

  return NextResponse.json({ error: "Action necunoscută." }, { status: 400 });
}
