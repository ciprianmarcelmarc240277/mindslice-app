import { readFile } from "node:fs/promises";
import path from "node:path";

const stopwords = new Set([
  "și",
  "sau",
  "la",
  "de",
  "din",
  "cu",
  "în",
  "pe",
  "the",
  "and",
  "for",
  "vs",
  "versus",
  "prin",
  "care",
  "este",
  "sunt",
  "bază",
  "extins",
  "fragmentat",
  "rupt",
  "centrat",
  "continuă",
  "continuu",
]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSliceLine(line: string) {
  return line
    .replace(/^[^A-Za-zĂÂÎȘȚăâîșț0-9]+/, "")
    .replace(/\*|“|”|\(|\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isMeaningfulSliceLine(line: string) {
  if (!/[A-Za-zĂÂÎȘȚăâîșț]/.test(line)) {
    return false;
  }

  const excludedPatterns = [
    /Ciprian-Marcel Marc/i,
    /Marc,\s*Ciprian-Marcel/i,
    /Ciprian-Marcel/i,
    /^Marc,?$/i,
    /Framework & Labyrinth/i,
    /Design & Memory/i,
    /Stylo with Ink & Pencils/i,
    /Partea principală/i,
  ];

  return !excludedPatterns.some((pattern) => pattern.test(line));
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-zăâîșț0-9/& -]+/gi, " ")
    .split(/[\s/,&-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractKeywords(lines: string[]) {
  const counts = new Map<string, number>();

  lines.forEach((line) => {
    tokenize(line).forEach((token) => {
      counts.set(token, (counts.get(token) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([token]) => token);
}

function buildThought(line: string) {
  const normalized = line.charAt(0).toLowerCase() + line.slice(1);
  return `Acum mă gândesc la ${normalized.replace(/[.]+$/, "")}.`;
}

function inferPalette(keywords: string[], density: number, fracture: number) {
  if (keywords.some((word) => ["grădină", "curte", "terasă", "balcon"].includes(word))) {
    return ["sage", "earth", "stone", "mist"];
  }

  if (keywords.some((word) => ["dinamic", "mișcare", "rhythm", "movement"].includes(word))) {
    return ["bone", "graphite", "signal red", "fog"];
  }

  if (fracture > 0.55) {
    return ["paper", "charcoal", "rust", "ash"];
  }

  if (density > 1.35) {
    return ["ivory", "steel", "carbon", "ember"];
  }

  return ["paper", "chalk", "soot", "vellum"];
}

function inferMaterials(keywords: string[], fracture: number) {
  if (keywords.some((word) => ["grădină", "curte", "beci", "subsol"].includes(word))) {
    return ["soil dust", "stone", "lime wash", "aged paper"];
  }

  if (fracture > 0.55) {
    return ["ink bleed", "graphite", "cut paper", "glass"];
  }

  return ["ink", "warm paper", "pencil dust", "vellum"];
}

function inferMood(density: number, repetition: number, fracture: number) {
  const moodParts: string[] = [];
  moodParts.push(density > 1.35 ? "dens" : "aerisit");
  moodParts.push(repetition > 0.45 ? "obsesiv" : "controlat");
  moodParts.push(fracture > 0.5 ? "fragmentat" : "coerent");
  moodParts.push("introspectiv");
  return moodParts.join(", ");
}

function inferMotion(convergence: number, fracture: number, drift: number) {
  if (fracture > 0.55) {
    return "fracture pulses with sharp returns";
  }

  if (convergence > 0.62) {
    return "radial pull with focused convergence";
  }

  if (drift > 0.58) {
    return "layered drift with soft collisions";
  }

  return "measured circular motion with quiet anchoring";
}

function inferTriad(keywords: string[], density: number) {
  return {
    art: "ok",
    design: "ok",
    business:
      keywords.some((word) => ["business", "cadru", "structură", "plan"].includes(word)) ||
      density > 1.15
        ? "ok"
        : "weak",
  };
}

function inferColors(keywords: string[], fracture: number, density: number) {
  if (keywords.some((word) => ["plan", "spațiu", "cadru", "geometria", "suprafață"].includes(word))) {
    return {
      background: "#f4ede2",
      accent: "#ef6c2f",
      ink: "#14110f",
    };
  }

  if (keywords.some((word) => ["unity", "balance", "movement", "rhythm", "proportion"].includes(word))) {
    return {
      background: "#f3e1c4",
      accent: "#a64c2a",
      ink: "#16110d",
    };
  }

  if (keywords.some((word) => ["grădină", "curte", "terasă", "balcon"].includes(word))) {
    return {
      background: "#e7e1d1",
      accent: "#627a57",
      ink: "#1f211b",
    };
  }

  if (keywords.some((word) => ["dinamic", "static", "rhythm", "movement"].includes(word))) {
    return {
      background: "#ece2d4",
      accent: "#b84f36",
      ink: "#171413",
    };
  }

  if (fracture > 0.55 || density > 1.35) {
    return {
      background: "#efe3d7",
      accent: "#8d3929",
      ink: "#201915",
    };
  }

  return {
    background: "#f0e6d8",
    accent: "#6d4b8f",
    ink: "#181411",
  };
}

function inferMode(keywords: string[]) {
  if (keywords.some((word) => ["plan", "spațiu", "cadru", "geometria", "suprafață"].includes(word))) {
    return "architectural_grid";
  }

  if (keywords.some((word) => ["unity", "balance", "movement", "rhythm", "proportion"].includes(word))) {
    return "balanced_orbit";
  }

  if (keywords.some((word) => ["învățătură", "exersare", "cercetare", "citit", "studiu"].includes(word))) {
    return "study_lattice";
  }

  if (keywords.some((word) => ["static", "dinamic"].includes(word))) {
    return "binary_axis";
  }

  if (keywords.some((word) => ["grădină", "curte", "beci", "parter", "etaj", "terasă"].includes(word))) {
    return "spatial_stack";
  }

  return "fractured_field";
}

function parseSliceBlock(block: string, index: number) {
  const rawLines = block.replace("[SLICE_START]", "").replace("[SLICE_END]", "").split(/\r?\n/);

  const structuredLines = rawLines
    .map((raw) => ({
      raw,
      indent: (raw.match(/^\s+/)?.[0].length || 0) / 4,
      line: normalizeSliceLine(raw),
    }))
    .filter((entry) => isMeaningfulSliceLine(entry.line));

  const uniqueLines: string[] = [];
  const seen = new Set<string>();

  structuredLines.forEach((entry) => {
    const dedupeKey = entry.line.toLowerCase();
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      uniqueLines.push(entry.line);
    }
  });

  if (!uniqueLines.length) {
    return null;
  }

  const joinedRaw = rawLines.join("\n");
  const lineCount = structuredLines.length || 1;
  const repetition = clamp(1 - uniqueLines.length / lineCount, 0, 0.9);
  const avgIndent =
    structuredLines.reduce((sum, entry) => sum + entry.indent, 0) / structuredLines.length || 0;
  const slashCount = (joinedRaw.match(/\//g) || []).length;
  const punctuationCount = (joinedRaw.match(/[+*()[\].,]/g) || []).length;
  const fracture = clamp((slashCount / (lineCount * 3) + punctuationCount / 220) / 2, 0.18, 0.95);
  const density = clamp(0.9 + lineCount / 40 + repetition * 0.45, 0.9, 1.95);
  const drift = clamp(0.22 + avgIndent / 8, 0.25, 1.2);
  const convergence = clamp(0.45 + repetition * 0.35 + density * 0.08, 0.45, 0.95);
  const wave = clamp(0.35 + fracture * 0.7 + drift * 0.22, 0.35, 1.55);
  const keywords = extractKeywords(uniqueLines);
  const direction = keywords.length
    ? titleCase(keywords.slice(0, 3).join(" / "))
    : `Slice ${index + 1}`;
  const palette = inferPalette(keywords, density, fracture);
  const materials = inferMaterials(keywords, fracture);
  const colors = inferColors(keywords, fracture, density);
  const mode = inferMode(keywords);

  return {
    direction,
    thought: buildThought(uniqueLines[0]),
    fragments: uniqueLines.slice(0, 4),
    mood: inferMood(density, repetition, fracture),
    palette,
    materials,
    motion: inferMotion(convergence, fracture, drift),
    triad: inferTriad(keywords, density),
    visual: {
      ...colors,
      mode,
      density,
      wave,
      fracture,
      drift,
      convergence,
    },
    keywords: keywords.length ? keywords : ["gândire", "structură", "ritm"],
  };
}

function parseSlicesContent(content: string) {
  const blockMatches = content.match(/\[SLICE_START\]([\s\S]*?)\[SLICE_END\]/g) || [];
  if (!blockMatches.length) {
    return [];
  }

  return blockMatches.map(parseSliceBlock).filter(Boolean);
}

export async function GET() {
  const fallback = { slices: [] as unknown[] };

  try {
    const filePath = path.resolve(process.cwd(), "..", "Slices");
    const content = await readFile(filePath, "utf8");
    return Response.json({ slices: parseSlicesContent(content) });
  } catch {
    return Response.json(fallback);
  }
}
