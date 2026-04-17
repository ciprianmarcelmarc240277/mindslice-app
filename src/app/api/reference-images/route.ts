import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const ALLOWED_FOLDERS = ["img_used", "img"] as const;
const IMAGE_PATTERN = /\.(jpg|jpeg|png|webp)$/i;

export async function GET() {
  const workspaceRoot = join(/* turbopackIgnore: true */ process.cwd(), "..");
  const images: string[] = [];

  for (const folder of ALLOWED_FOLDERS) {
    try {
      const entries = await readdir(join(workspaceRoot, folder), { withFileTypes: true });

      entries
        .filter((entry) => entry.isFile() && IMAGE_PATTERN.test(entry.name))
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((entry) => {
          images.push(`/api/reference-images/${folder}/${encodeURIComponent(entry.name)}`);
        });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ images });
}
