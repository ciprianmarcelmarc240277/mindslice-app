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
};

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

  const profilePayload = {
    user_id: userId,
    display_name: clerkUser?.fullName ?? null,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
    avatar_url: clerkUser?.imageUrl ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" })
    .select("user_id, display_name, email, avatar_url, address_form, created_at, updated_at")
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
    return NextResponse.json(
      { error: "addressForm must be one of: domnule, doamnă, domnișoară" },
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        address_form: payload.addressForm,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("user_id, display_name, email, avatar_url, address_form, created_at, updated_at")
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
