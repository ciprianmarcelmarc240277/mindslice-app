import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ADDRESS_FORM_OPTIONS = ["domnule", "doamnă", "domnișoară"] as const;
const DEBUT_STATUS_OPTIONS = [
  "aspirant",
  "in_program",
  "selected",
  "published",
  "alumni",
] as const;
const SUBSCRIPTION_STATUS_OPTIONS = [
  "inactive",
  "active",
  "past_due",
  "canceled",
] as const;

type SaveMomentPayload = {
  direction?: string;
  thought?: string;
  prompt?: string;
  imageUrl?: string | null;
};

type UpdateProfilePayload = {
  addressForm?: string;
  displayName?: string;
  pseudonym?: string;
  nameDeclarationAccepted?: boolean;
  bio?: string;
  artistStatement?: string;
  debutStatus?: (typeof DEBUT_STATUS_OPTIONS)[number];
};

function normalizePseudonym(value: string) {
  return value.trim().replace(/^[„"']+|[”"']+$/g, "").trim();
}

function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeArtistStatement(value: string) {
  return value.trim().replace(/\r\n/g, "\n");
}

function normalizeBio(value: string) {
  return value.trim().replace(/\r\n/g, "\n");
}

function isValidFamilyAndGivenName(value: string) {
  return /^\p{L}+(?:[ '-]\p{L}+){0,2},\s\p{L}+(?:[ '-]\p{L}+){0,2}$/u.test(value);
}

function isAdminEmail(email: string | null | undefined) {
  const allowlist = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

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

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase configuration error" },
      { status: 500 },
    );
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select(
      "user_id, display_name, pseudonym, email, avatar_url, name_declaration_accepted, subscription_status, subscription_expires_at, address_form, bio, artist_statement, debut_status, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const profilePayload = {
    user_id: userId,
    display_name: existingProfile?.display_name ?? null,
    pseudonym: existingProfile?.pseudonym ?? null,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? existingProfile?.email ?? null,
    avatar_url: clerkUser?.imageUrl ?? existingProfile?.avatar_url ?? null,
    name_declaration_accepted: existingProfile?.name_declaration_accepted ?? false,
    subscription_status:
      existingProfile?.subscription_status &&
      SUBSCRIPTION_STATUS_OPTIONS.includes(
        existingProfile.subscription_status as (typeof SUBSCRIPTION_STATUS_OPTIONS)[number],
      )
        ? existingProfile.subscription_status
        : "inactive",
    subscription_expires_at: existingProfile?.subscription_expires_at ?? null,
    address_form: existingProfile?.address_form ?? null,
    bio: existingProfile?.bio ?? null,
    artist_statement: existingProfile?.artist_statement ?? null,
    debut_status: existingProfile?.debut_status ?? "aspirant",
    updated_at: new Date().toISOString(),
  };
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" })
    .select(
      "user_id, display_name, pseudonym, email, avatar_url, name_declaration_accepted, subscription_status, subscription_expires_at, address_form, bio, artist_statement, debut_status, created_at, updated_at",
    )
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data: savedMoments, error: momentsError } = await supabase
    .from("saved_moments")
    .select("id, direction, thought, prompt, image_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (momentsError) {
    return NextResponse.json({ error: momentsError.message }, { status: 500 });
  }

  return NextResponse.json({
    profile,
    savedMoments: savedMoments ?? [],
    isAdmin: isAdminEmail(clerkUser?.primaryEmailAddress?.emailAddress),
  });
}

export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: UpdateProfilePayload;
  try {
    payload = (await request.json()) as UpdateProfilePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.addressForm || !ADDRESS_FORM_OPTIONS.includes(payload.addressForm as (typeof ADDRESS_FORM_OPTIONS)[number])) {
    if (payload.addressForm !== undefined) {
      return NextResponse.json(
        { error: "addressForm must be one of: domnule, doamnă, domnișoară" },
        { status: 400 },
      );
    }
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

  const nextDisplayName =
    payload.displayName === undefined ? undefined : normalizeDisplayName(payload.displayName);
  const nextPseudonym =
    payload.pseudonym === undefined ? undefined : normalizePseudonym(payload.pseudonym);
  const nextNameDeclarationAccepted =
    payload.nameDeclarationAccepted === undefined
      ? undefined
      : Boolean(payload.nameDeclarationAccepted);
  const nextBio = payload.bio === undefined ? undefined : normalizeBio(payload.bio);
  const nextArtistStatement =
    payload.artistStatement === undefined
      ? undefined
      : normalizeArtistStatement(payload.artistStatement);
  const nextDebutStatus = payload.debutStatus;

  if (nextDisplayName !== undefined && !nextDisplayName) {
    return NextResponse.json(
      { error: "displayName nu poate fi gol." },
      { status: 400 },
    );
  }

  if (nextDisplayName !== undefined && !isValidFamilyAndGivenName(nextDisplayName)) {
    return NextResponse.json(
      {
        error:
          'Numele trebuie să fie în formatul "Nume de familie, Prenume", fără alias sau alte entități.',
      },
      { status: 400 },
    );
  }

  if (nextPseudonym !== undefined && !nextPseudonym) {
    return NextResponse.json(
      { error: "Pseudonimul nu poate fi gol dacă este trimis." },
      { status: 400 },
    );
  }

  if (
    nextDebutStatus !== undefined &&
    !DEBUT_STATUS_OPTIONS.includes(nextDebutStatus)
  ) {
    return NextResponse.json(
      { error: "debutStatus invalid." },
      { status: 400 },
    );
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("user_id", userId)
    .maybeSingle();

  const hasActiveSubscription = existingProfile?.subscription_status === "active";

  if (
    !hasActiveSubscription &&
    (nextArtistStatement !== undefined || nextDebutStatus !== undefined)
  ) {
    return NextResponse.json(
      {
        error:
          "Programul de debut artistic este disponibil doar cu abonament lunar activ.",
      },
      { status: 403 },
    );
  }

  if (
    payload.addressForm === undefined &&
    nextDisplayName === undefined &&
    nextPseudonym === undefined &&
    nextNameDeclarationAccepted === undefined &&
    nextBio === undefined &&
    nextArtistStatement === undefined &&
    nextDebutStatus === undefined
  ) {
    return NextResponse.json(
      {
        error:
          "Trimite cel puțin addressForm, displayName, pseudonym, nameDeclarationAccepted, bio, artistStatement sau debutStatus.",
      },
      { status: 400 },
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        ...(payload.addressForm !== undefined ? { address_form: payload.addressForm } : {}),
        ...(nextDisplayName !== undefined ? { display_name: nextDisplayName } : {}),
        ...(nextPseudonym !== undefined ? { pseudonym: nextPseudonym } : {}),
        ...(nextNameDeclarationAccepted !== undefined
          ? { name_declaration_accepted: nextNameDeclarationAccepted }
          : {}),
        ...(nextBio !== undefined ? { bio: nextBio || null } : {}),
        ...(nextArtistStatement !== undefined
          ? { artist_statement: nextArtistStatement || null }
          : {}),
        ...(nextDebutStatus !== undefined ? { debut_status: nextDebutStatus } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select(
      "user_id, display_name, pseudonym, email, avatar_url, name_declaration_accepted, subscription_status, subscription_expires_at, address_form, bio, artist_statement, debut_status, created_at, updated_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SaveMomentPayload;
  try {
    payload = (await request.json()) as SaveMomentPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.direction || !payload.thought || !payload.prompt) {
    return NextResponse.json(
      { error: "direction, thought and prompt are required" },
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
    .from("saved_moments")
    .insert({
      user_id: userId,
      direction: payload.direction,
      thought: payload.thought,
      prompt: payload.prompt,
      image_url: payload.imageUrl ?? null,
    })
    .select("id, direction, thought, prompt, image_url, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ savedMoment: data }, { status: 201 });
}
