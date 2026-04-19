import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreateInteriorChatPayload = {
  message?: string;
};

function normalizeMessage(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildPseudonymHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseAddressing(
  message: string,
  pseudonymByHandle: Map<string, string>,
) {
  const mentionMatch = message.match(/^@([^\s]+)\s+(.+)$/u);

  if (!mentionMatch) {
    return {
      ok: false,
      error:
        "Mesajul trebuie să înceapă cu @all sau @pseudonim, urmat de conținut.",
    } as const;
  }

  const [, rawTarget, rawBody] = mentionMatch;
  const target = rawTarget.trim().toLowerCase();
  const body = rawBody.trim();

  if (!body) {
    return {
      ok: false,
      error: "După @all sau @pseudonim trebuie să existe și mesajul.",
    } as const;
  }

  if (target === "all") {
    return {
      ok: true,
      address_mode: "all" as const,
      address_label: "@all",
      message_body: body,
    };
  }

  const targetPseudonym = pseudonymByHandle.get(target);

  if (!targetPseudonym) {
    return {
      ok: false,
      error: "Pseudonimul țintă nu a fost găsit. Folosește @all sau un @pseudonim existent.",
    } as const;
  }

  return {
    ok: true,
    address_mode: "direct" as const,
    address_label: `@${target}`,
    target_pseudonym: targetPseudonym,
    message_body: body,
  };
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { data: messages, error } = await supabase
    .from("interior_chat_messages")
    .select("id, user_id, message, created_at")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = Array.from(new Set((messages ?? []).map((entry) => entry.user_id)));
  let pseudonymMap = new Map<string, string | null>();
  let pseudonymByHandle = new Map<string, string>();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, pseudonym");

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  pseudonymMap = new Map(
    (profiles ?? [])
      .filter((profile) => userIds.includes(profile.user_id as string))
      .map((profile) => [profile.user_id as string, (profile.pseudonym as string | null) ?? null]),
  );
  pseudonymByHandle = new Map(
    (profiles ?? [])
      .filter((profile) => typeof profile.pseudonym === "string" && profile.pseudonym.trim())
      .map((profile) => [
        buildPseudonymHandle(profile.pseudonym as string),
        profile.pseudonym as string,
      ]),
  );

  return NextResponse.json({
    messages: (messages ?? []).map((entry) => {
      const parsed = parseAddressing(entry.message, pseudonymByHandle);

      return {
        id: entry.id,
        author_user_id: entry.user_id,
        message: entry.message,
        created_at: entry.created_at,
        author_pseudonym: pseudonymMap.get(entry.user_id) ?? null,
        is_current_user: entry.user_id === userId,
        address_mode: parsed.ok ? parsed.address_mode : "legacy",
        address_label: parsed.ok ? parsed.address_label : null,
        target_pseudonym:
          parsed.ok && parsed.address_mode === "direct" ? parsed.target_pseudonym : null,
        message_body: parsed.ok ? parsed.message_body : entry.message,
      };
    }),
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateInteriorChatPayload;
  try {
    payload = (await request.json()) as CreateInteriorChatPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const nextMessage = payload.message ? normalizeMessage(payload.message) : "";

  if (!nextMessage) {
    return NextResponse.json({ error: "Mesajul nu poate fi gol." }, { status: 400 });
  }

  if (nextMessage.length > 500) {
    return NextResponse.json(
      { error: "Mesajul nu poate depăși 500 de caractere." },
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, pseudonym")
    .not("pseudonym", "is", null);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const currentProfile = (profile ?? []).find((entry) => entry.user_id === userId);

  if (!currentProfile?.pseudonym?.trim()) {
    return NextResponse.json(
      { error: "Setează mai întâi pseudonimul în PANEL · Account Profile înainte de a scrie în chat." },
      { status: 400 },
    );
  }

  const pseudonymByHandle = new Map(
    (profile ?? [])
      .filter((entry) => typeof entry.pseudonym === "string" && entry.pseudonym.trim())
      .map((entry) => [buildPseudonymHandle(entry.pseudonym as string), entry.pseudonym as string]),
  );

  const parsed = parseAddressing(nextMessage, pseudonymByHandle);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from("interior_chat_messages")
    .insert({
      user_id: userId,
      message: nextMessage,
    })
    .select("id, message, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      message: {
        ...message,
        author_user_id: userId,
        author_pseudonym: currentProfile.pseudonym,
        is_current_user: true,
        address_mode: parsed.address_mode,
        address_label: parsed.address_label,
        target_pseudonym: parsed.address_mode === "direct" ? parsed.target_pseudonym : null,
        message_body: parsed.message_body,
      },
    },
    { status: 201 },
  );
}
