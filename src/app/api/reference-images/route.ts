import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const IMAGE_PATTERN = /\.(jpg|jpeg|png|webp)$/i;
const REFERENCE_IMAGES_DIR = join(process.cwd(), "public", "reference-images");

export async function GET() {
  try {
    const entries = await readdir(REFERENCE_IMAGES_DIR, { withFileTypes: true });
    const images = entries
      .filter((entry) => entry.isFile() && IMAGE_PATTERN.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry) => `/reference-images/${encodeURIComponent(entry.name)}`);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
