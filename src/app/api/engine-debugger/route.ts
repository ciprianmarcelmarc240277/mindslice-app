import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EngineDebugRunEntry, EngineDebuggerReport } from "@/lib/mindslice/mindslice-types";

type EngineDebugRunRow = {
  id: string;
  report: EngineDebuggerReport;
  created_at: string;
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ debugRuns: [] });
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
    .from("engine_debug_runs")
    .select("id, report, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const debugRuns: EngineDebugRunEntry[] = Array.isArray(data)
    ? (data as EngineDebugRunRow[]).map((row) => ({
        id: row.id,
        report: row.report,
        createdAt: row.created_at,
      }))
    : [];

  return NextResponse.json({ debugRuns });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { report?: EngineDebuggerReport };
  try {
    payload = (await request.json()) as { report?: EngineDebuggerReport };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.report) {
    return NextResponse.json({ error: "report este obligatoriu." }, { status: 400 });
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
    .from("engine_debug_runs")
    .insert({
      user_id: userId,
      report: payload.report,
    })
    .select("id, report, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Nu am putut salva raportul de debug." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      debugRun: {
        id: data.id,
        report: data.report,
        createdAt: data.created_at,
      } satisfies EngineDebugRunEntry,
    },
    { status: 201 },
  );
}
