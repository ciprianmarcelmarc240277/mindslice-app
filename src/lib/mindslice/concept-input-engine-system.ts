import type { ThoughtState } from "@/lib/mindslice/mindslice-types";

export type InputSliceState = {
  slice_id: string;
  content: ThoughtState;
  created_at: string;
};

type CreateSliceInput = {
  authorId: string | null;
  idea: ThoughtState | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

export function createSlice({ authorId, idea }: CreateSliceInput): InputSliceState | null {
  if (!idea || !idea.thought.trim()) {
    return null;
  }

  return {
    slice_id: `slice:${authorId ?? "anonymous"}:${slugify(idea.direction || idea.thought)}`,
    content: idea,
    created_at: new Date().toISOString(),
  };
}
