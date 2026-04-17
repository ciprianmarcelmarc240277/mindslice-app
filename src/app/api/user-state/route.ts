import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ADDRESS_FORM_OPTIONS = ["domnule", "doamnă", "domnișoară"] as const;

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
};

function normalizePseudonym(value: string) {
  return value.trim().replace(/^[„"']+|[”"']+$/g, "").trim();
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
    .select("user_id, display_name, pseudonym, email, avatar_url, address_form, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  const profilePayload = {
    user_id: userId,
    display_name: existingProfile?.display_name ?? null,
    pseudonym: existingProfile?.pseudonym ?? null,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? existingProfile?.email ?? null,
    avatar_url: clerkUser?.imageUrl ?? existingProfile?.avatar_url ?? null,
    address_form: existingProfile?.address_form ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" })
    .select("user_id, display_name, pseudonym, email, avatar_url, address_form, created_at, updated_at")
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
    payload.displayName === undefined ? undefined : payload.displayName.trim();
  const nextPseudonym =
    payload.pseudonym === undefined ? undefined : normalizePseudonym(payload.pseudonym);

  if (nextDisplayName !== undefined && !nextDisplayName) {
    return NextResponse.json(
      { error: "displayName nu poate fi gol." },
      { status: 400 },
    );
  }

  if (nextDisplayName !== undefined && !nextDisplayName.includes(",")) {
    return NextResponse.json(
      { error: 'Numele afișat trebuie să fie în formatul "Nume, Prenume".' },
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
    payload.addressForm === undefined &&
    nextDisplayName === undefined &&
    nextPseudonym === undefined
  ) {
    return NextResponse.json(
      { error: "Trimite cel puțin addressForm, displayName sau pseudonym." },
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("user_id, display_name, pseudonym, email, avatar_url, address_form, created_at, updated_at")
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
