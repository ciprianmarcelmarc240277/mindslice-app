import type { ContaminationSource, SliceEngineResult, SliceState } from "@/lib/mindslice/engine";
import { mindsliceSystemCore, promptEvaluationRules } from "@/lib/mindslice/prompt-pack";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

type StructuredRefinementResult = {
  slices: SliceState[];
  refinementNote: string;
};

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
            palette: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 4,
            },
            materials: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 4,
            },
            motion: { type: "string" },
            triad: {
              type: "object",
              additionalProperties: false,
              properties: {
                art: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    score: { type: "number" },
                    label: { type: "string" },
                  },
                  required: ["score", "label"],
                },
                design: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    score: { type: "number" },
                    label: { type: "string" },
                  },
                  required: ["score", "label"],
                },
                business: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    score: { type: "number" },
                    label: { type: "string" },
                  },
                  required: ["score", "label"],
                },
              },
              required: ["art", "design", "business"],
            },
            visual: {
              type: "object",
              additionalProperties: false,
              properties: {
                background: { type: "string" },
                accent: { type: "string" },
                ink: { type: "string" },
                mode: { type: "string" },
                density: { type: "number" },
                wave: { type: "number" },
                fracture: { type: "number" },
                drift: { type: "number" },
                convergence: { type: "number" },
              },
              required: [
                "background",
                "accent",
                "ink",
                "mode",
                "density",
                "wave",
                "fracture",
                "drift",
                "convergence",
              ],
            },
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
            "palette",
            "materials",
            "motion",
            "triad",
            "visual",
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

function normalizeRefinedSlices(result: StructuredRefinementResult, expectedCount: number) {
  const slices = Array.isArray(result.slices) ? result.slices.slice(0, expectedCount) : [];

  return slices.map((slice) => ({
    ...slice,
    triad: {
      art: {
        score: Math.max(0, Math.min(1, Number(slice.triad.art.score))),
        label: slice.triad.art.label,
      },
      design: {
        score: Math.max(0, Math.min(1, Number(slice.triad.design.score))),
        label: slice.triad.design.label,
      },
      business: {
        score: Math.max(0, Math.min(1, Number(slice.triad.business.score))),
        label: slice.triad.business.label,
      },
    },
  }));
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

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are refining MindSlice live thought slices.",
                "Preserve the number of slices and the existing conceptual direction.",
                "Do not become generic, assistant-like, or decorative.",
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
                  goal: "Refine these alpha slices with structured generation while preserving their count and overall logic.",
                  contamination,
                  baseEngineMode: baseResult.engineMode,
                  baseSlices: baseResult.slices,
                },
                null,
                2,
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
  const refinedSlices = normalizeRefinedSlices(parsed, baseResult.slices.length);

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
}
