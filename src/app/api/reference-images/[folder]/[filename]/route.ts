import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ folder: string; filename: string }> },
) {
  const { folder, filename } = await params;

  if (!["img", "img_used"].includes(folder)) {
    return new NextResponse("Invalid folder", { status: 404 });
  }

  const extension = Object.keys(MIME_BY_EXTENSION).find((suffix) =>
    filename.toLowerCase().endsWith(suffix),
  );

  if (!extension) {
    return new NextResponse("Unsupported file type", { status: 404 });
  }

  try {
    const file = await readFile(
      join(/* turbopackIgnore: true */ process.cwd(), "..", folder, filename),
    );
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": MIME_BY_EXTENSION[extension],
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
