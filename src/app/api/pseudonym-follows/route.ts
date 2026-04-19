import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type FollowPayload = {
  targetUserId?: string;
};

async function getSupabase() {
  return createServerSupabaseClient();
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = await getSupabase();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase configuration error" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("pseudonym_follows")
    .select("followed_user_id")
    .eq("follower_user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    followedUserIds: (data ?? []).map((entry) => entry.followed_user_id as string),
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: FollowPayload;
  try {
    payload = (await request.json()) as FollowPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.targetUserId?.trim()) {
    return NextResponse.json({ error: "targetUserId este obligatoriu." }, { status: 400 });
  }

  if (payload.targetUserId === userId) {
    return NextResponse.json({ error: "Nu te poți urmări pe tine însuți." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await getSupabase();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase configuration error" },
      { status: 500 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("pseudonym")
    .eq("user_id", payload.targetUserId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile?.pseudonym?.trim()) {
    return NextResponse.json(
      { error: "Poți urmări doar un utilizator care are pseudonim setat." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("pseudonym_follows").upsert(
    {
      follower_user_id: userId,
      followed_user_id: payload.targetUserId,
    },
    { onConflict: "follower_user_id,followed_user_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ followedUserId: payload.targetUserId });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: FollowPayload;
  try {
    payload = (await request.json()) as FollowPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.targetUserId?.trim()) {
    return NextResponse.json({ error: "targetUserId este obligatoriu." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await getSupabase();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Supabase configuration error" },
      { status: 500 },
    );
  }

  const { error } = await supabase
    .from("pseudonym_follows")
    .delete()
    .eq("follower_user_id", userId)
    .eq("followed_user_id", payload.targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ unfollowedUserId: payload.targetUserId });
}
