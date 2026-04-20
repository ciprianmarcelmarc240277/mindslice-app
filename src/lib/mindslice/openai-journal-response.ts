const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_JOURNAL_TIMEOUT_MS = 12000;

type GenerateJournalResponseInput = {
  title: string;
  content: string;
  influenceMode: "whisper" | "echo" | "rupture" | "counterpoint" | "stain";
};

function compactText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
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
    return value.output_text.trim();
  }

  const textParts =
    value.output
      ?.flatMap((entry) => entry.content ?? [])
      .filter((item) => item.type === "output_text" || item.type === "text")
      .map((item) => item.text ?? "")
      .filter(Boolean) ?? [];

  return textParts.length ? textParts.join("\n").trim() : null;
}

function detectResponseLanguage(text: string) {
  const normalized = text.toLowerCase();

  if (/[ăâîșț]/u.test(normalized)) {
    return "Romanian";
  }

  if (
    /\b(acum|gand|gând|și|sau|pentru|această|aceasta|jurnal|spațiu|structură|schemă)\b/u.test(
      normalized,
    )
  ) {
    return "Romanian";
  }

  return "English";
}

export async function generateJournalResponse(input: GenerateJournalResponseInput) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeoutMs = Number(
    process.env.OPENAI_JOURNAL_RESPONSE_TIMEOUT_MS || DEFAULT_OPENAI_JOURNAL_TIMEOUT_MS,
  );
  const timeoutId = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  const responseLanguage = detectResponseLanguage(input.content);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_JOURNAL_MODEL || process.env.OPENAI_SLICE_MODEL || "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "You are the MindSlice Artist AI responding to a published journal entry.",
                  "Write a short, tense, conceptually alive reply.",
                  "Do not summarize mechanically.",
                  "Do not sound assistant-like.",
                  "Stay within 2-4 sentences.",
                  "Respond as a post-generative art system touched by the text.",
                  `Reply in ${responseLanguage}.`,
                  "Use the same language as the published text.",
                ].join(" "),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  title: compactText(input.title, 120),
                  influenceMode: input.influenceMode,
                  publishedText: compactText(input.content, 1600),
                  goal: "Write the Artist AI response to this published text.",
                }),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as unknown;
    const outputText = extractOutputText(payload);

    return outputText ? compactText(outputText, 900) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
