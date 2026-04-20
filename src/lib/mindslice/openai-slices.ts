import type { ContaminationSource, SliceEngineResult, SliceState } from "@/lib/mindslice/engine";
import { mindsliceSystemCore, promptEvaluationRules } from "@/lib/mindslice/prompt-pack";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_SLICE_TIMEOUT_MS = 8000;

type SemanticRefinedSlice = Pick<SliceState, "direction" | "thought" | "fragments" | "mood" | "keywords">;

type StructuredRefinementResult = {
  slices: SemanticRefinedSlice[];
  refinementNote: string;
};

function compactText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function buildCompactContamination(contamination: ContaminationSource | null) {
  if (!contamination) {
    return null;
  }

  return {
    title: compactText(contamination.title, 120),
    excerpt: contamination.excerpt ? compactText(contamination.excerpt, 160) : null,
    content: compactText(contamination.content, 280),
    influenceMode: contamination.influenceMode,
    weights: {
      sense: Number(contamination.senseWeight.toFixed(2)),
      structure: Number(contamination.structureWeight.toFixed(2)),
      attention: Number(contamination.attentionWeight.toFixed(2)),
    },
  };
}

function buildCompactBaseSlices(slices: SliceState[]) {
  return slices.map((slice, index) => ({
    index,
    direction: compactText(slice.direction, 80),
    thought: compactText(slice.thought, 180),
    fragments: slice.fragments.slice(0, 3).map((fragment) => compactText(fragment, 80)),
    keywords: slice.keywords.slice(0, 5),
    mood: compactText(slice.mood, 40),
    motion: compactText(slice.motion, 40),
    visualMode: compactText(slice.visual.mode, 32),
    palette: slice.palette.slice(0, 3),
  }));
}

function buildStructuredRefinementSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      refinementNote: { type: "string" },
      slices: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            direction: { type: "string" },
            thought: { type: "string" },
            fragments: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 5,
            },
            mood: { type: "string" },
            keywords: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 8,
            },
          },
          required: [
            "direction",
            "thought",
            "fragments",
            "mood",
            "keywords",
          ],
        },
      },
    },
    required: ["refinementNote", "slices"],
  };
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof value.output_text === "string" && value.output_text.trim()) {
    return value.output_text;
  }

  const textParts =
    value.output
      ?.flatMap((entry) => entry.content ?? [])
      .filter((item) => item.type === "output_text" || item.type === "text")
      .map((item) => item.text ?? "")
      .filter(Boolean) ?? [];

  return textParts.length ? textParts.join("\n") : null;
}

function normalizeRefinedSlices(baseSlices: SliceState[], result: StructuredRefinementResult) {
  const slices = Array.isArray(result.slices) ? result.slices.slice(0, baseSlices.length) : [];

  return baseSlices.map((baseSlice, index) => {
    const refined = slices[index];

    if (!refined) {
      return baseSlice;
    }

    return {
      ...baseSlice,
      direction: compactText(refined.direction || baseSlice.direction, 120),
      thought: compactText(refined.thought || baseSlice.thought, 260),
      fragments:
        Array.isArray(refined.fragments) && refined.fragments.length
          ? refined.fragments.slice(0, 5).map((fragment) => compactText(fragment, 100))
          : baseSlice.fragments,
      mood: compactText(refined.mood || baseSlice.mood, 60),
      keywords:
        Array.isArray(refined.keywords) && refined.keywords.length
          ? refined.keywords.slice(0, 8).map((keyword) => compactText(keyword, 40))
          : baseSlice.keywords,
    } satisfies SliceState;
  });
}

export async function refineSlicesWithOpenAI(
  baseResult: SliceEngineResult,
  contamination: ContaminationSource | null,
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !baseResult.slices.length) {
    return null;
  }

  const model = process.env.OPENAI_SLICE_MODEL || "gpt-4o-mini";
  const timeoutMs = Number(process.env.OPENAI_SLICE_TIMEOUT_MS || DEFAULT_OPENAI_SLICE_TIMEOUT_MS);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  const compactContamination = buildCompactContamination(contamination);
  const compactBaseSlices = buildCompactBaseSlices(baseResult.slices);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "You are refining only the semantic layer of MindSlice live thought slices.",
                  "Preserve the number of slices and the existing conceptual direction.",
                  "Do not become generic, assistant-like, or decorative.",
                  "Refine only direction, thought, fragments, mood, and keywords.",
                  "Do not invent visual, triad, palette, material, or motion systems.",
                  `Charter axes: ${mindsliceSystemCore.axes.join("; ")}.`,
                  `Strong prompt rules: ${promptEvaluationRules.strong.join("; ")}.`,
                  "Keep the output museum-grade, typographic, tense, and conceptually alive.",
                ].join(" "),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(
                  {
                    goal: "Refine these alpha slices semantically while preserving their count and overall logic.",
                    contamination: compactContamination,
                    baseEngineMode: baseResult.engineMode,
                    baseSlices: compactBaseSlices,
                    outputContract:
                      "Return the same number of slices with only direction, thought, fragments, mood, and keywords.",
                  }
                ),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "mindslice_structured_refinement",
            strict: true,
            schema: buildStructuredRefinementSchema(),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI structured refinement failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const outputText = extractOutputText(payload);
    if (!outputText) {
      throw new Error("OpenAI structured refinement returned no output text");
    }

    const parsed = JSON.parse(outputText) as StructuredRefinementResult;
    const refinedSlices = normalizeRefinedSlices(baseResult.slices, parsed);

    if (!refinedSlices.length) {
      throw new Error("OpenAI structured refinement returned no valid slices");
    }

    return {
      slices: refinedSlices,
      engineMode: `${baseResult.engineMode} / structured refinement`,
      engineProfile: {
        ...baseResult.engineProfile,
        generationStrategy: "slice_file_parser_plus_openai_refinement" as const,
        activeContaminationRule:
          baseResult.engineProfile.activeContaminationRule || parsed.refinementNote,
        openaiStructuredGeneration: "active" as const,
      },
    } satisfies SliceEngineResult;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `OpenAI structured refinement timed out after ${Math.max(1000, timeoutMs)}ms`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
