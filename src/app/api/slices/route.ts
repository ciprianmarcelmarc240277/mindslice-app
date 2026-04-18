import { auth } from "@clerk/nextjs/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  contaminationModeRules,
  liveThoughtSceneRules,
  mindsliceSystemCore,
} from "@/lib/mindslice/prompt-pack";

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

type InfluenceMode = "whisper" | "echo" | "rupture" | "counterpoint" | "stain";

type ContaminationSource = {
  title: string;
  excerpt: string | null;
  content: string;
  senseWeight: number;
  structureWeight: number;
  attentionWeight: number;
  influenceMode: InfluenceMode;
};

type SliceState = {
  direction: string;
  thought: string;
  fragments: string[];
  mood: string;
  palette: string[];
  materials: string[];
  motion: string;
  triad: {
    art: string;
    design: string;
    business: string;
  };
  visual: {
    background: string;
    accent: string;
    ink: string;
    mode: string;
    density: number;
    wave: number;
    fracture: number;
    drift: number;
    convergence: number;
  };
  keywords: string[];
};

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

function sentenceCase(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildMindSliceKeywords(keywords: string[]) {
  const prioritySet = new Set<string>(liveThoughtSceneRules.structuralKeywordPriority);
  const prioritized = keywords.filter((keyword) => prioritySet.has(keyword));
  const combined = [...prioritized, ...keywords];

  liveThoughtSceneRules.fallbackKeywords.forEach((keyword) => {
    if (!combined.includes(keyword)) {
      combined.push(keyword);
    }
  });

  return combined.slice(0, 8);
}

function buildFragments(lines: string[], keywords: string[]) {
  const fragments: string[] = [];

  lines.slice(0, 3).forEach((line) => {
    if (!fragments.includes(line)) {
      fragments.push(line);
    }
  });

  keywords.slice(0, 3).forEach((keyword) => {
    const structuralFragment = sentenceCase(keyword.replace(/-/g, " "));
    if (!fragments.includes(structuralFragment)) {
      fragments.push(structuralFragment);
    }
  });

  return fragments.slice(0, 5);
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

function buildThought(line: string, keywords: string[]) {
  const normalized = line.charAt(0).toLowerCase() + line.slice(1).replace(/[.]+$/, "");
  const dominantAnchor = keywords[0]?.replace(/-/g, " ") ?? "structură";
  const peripheralTraces = keywords
    .slice(1, 3)
    .map((keyword) => keyword.replace(/-/g, " "))
    .join(" și ");

  if (peripheralTraces) {
    return `Acum mă gândesc la ${normalized}, cu ${dominantAnchor} ca axă și ${peripheralTraces} rămase în periferie.`;
  }

  return `Acum mă gândesc la ${normalized}, cu ${dominantAnchor} ca axă dominantă.`;
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

function parseSliceBlock(block: string, index: number): SliceState | null {
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
  const extractedKeywords = extractKeywords(uniqueLines);
  const keywords = buildMindSliceKeywords(extractedKeywords);
  const direction = extractedKeywords.length
    ? titleCase(extractedKeywords.slice(0, 3).join(" / "))
    : `Slice ${index + 1}`;
  const palette = inferPalette(keywords, density, fracture);
  const materials = inferMaterials(keywords, fracture);
  const colors = inferColors(keywords, fracture, density);
  const mode = inferMode(keywords);

  return {
    direction,
    thought: buildThought(uniqueLines[0], keywords),
    fragments: buildFragments(uniqueLines, keywords),
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
    keywords,
  };
}

function parseSlicesContent(content: string): SliceState[] {
  const blockMatches = content.match(/\[SLICE_START\]([\s\S]*?)\[SLICE_END\]/g) || [];
  if (!blockMatches.length) {
    return [];
  }

  return blockMatches
    .map(parseSliceBlock)
    .filter((slice): slice is SliceState => slice !== null);
}

function buildContaminationKeywords(source: ContaminationSource) {
  const text = [source.title, source.excerpt ?? "", source.content].join(" ");
  const unique = [...new Set(tokenize(text))];
  return unique.slice(0, 8);
}

function buildContaminationFragment(source: ContaminationSource) {
  const excerpt = (source.excerpt ?? source.content).trim();
  if (!excerpt) {
    return source.title;
  }

  return excerpt.split(/[.!?]/)[0]?.trim() || source.title;
}

function blendUnique(base: string[], additions: string[], limit: number) {
  const merged = [...base];

  additions.forEach((item) => {
    if (!merged.includes(item)) {
      merged.push(item);
    }
  });

  return merged.slice(0, limit);
}

function applyContamination(slice: SliceState, source: ContaminationSource, index: number): SliceState {
  const contaminationKeywords = buildContaminationKeywords(source);
  const contaminationFragment = buildContaminationFragment(source);
  const pickedKeyword =
    contaminationKeywords[index % contaminationKeywords.length] ?? tokenize(source.title)[0] ?? "interferență";
  const pickedPhrase = sentenceCase(pickedKeyword.replace(/-/g, " "));
  const modeRule = contaminationModeRules[source.influenceMode];

  const nextThoughtBase = slice.thought.replace(/[.]+$/, "");
  let thought = `${nextThoughtBase}.`;
  let direction = slice.direction;
  let mood = slice.mood;
  let motion = slice.motion;
  const triad = { ...slice.triad };

  switch (source.influenceMode) {
    case "echo":
      thought = `${nextThoughtBase}, iar jurnalul face să revină ${pickedPhrase.toLowerCase()} ca ecou activ. ${modeRule}`;
      mood = `${slice.mood}, reverberant`;
      motion = `${slice.motion} with recursive returns`;
      triad.art = source.senseWeight >= 0.55 ? "charged" : triad.art;
      triad.business = source.attentionWeight >= 0.55 ? "locked" : triad.business;
      break;
    case "rupture":
      direction = `${slice.direction} / Ruptură ${pickedPhrase}`;
      thought = `${nextThoughtBase}, dar jurnalul rupe direcția și introduce ${pickedPhrase.toLowerCase()}. ${modeRule}`;
      mood = `${slice.mood}, deviat`;
      motion = `${slice.motion} with abrupt fractures`;
      triad.design = "fractured";
      break;
    case "counterpoint":
      thought = `${nextThoughtBase}, însă jurnalul opune ${pickedPhrase.toLowerCase()} ca tensiune secundară. ${modeRule}`;
      mood = `${slice.mood}, tensionat`;
      motion = `${slice.motion} with counterpoint resistance`;
      triad.art = source.senseWeight >= 0.45 ? "tense" : triad.art;
      triad.design = source.structureWeight >= 0.45 ? "countered" : triad.design;
      break;
    case "stain":
      thought = `${nextThoughtBase}, iar jurnalul lasă urme persistente de ${pickedPhrase.toLowerCase()}. ${modeRule}`;
      mood = `${slice.mood}, pătat`;
      motion = `${slice.motion} with lingering residue`;
      triad.art = "stained";
      triad.business = source.attentionWeight >= 0.5 ? "retained" : triad.business;
      break;
    case "whisper":
    default:
      thought = `${nextThoughtBase}, cu o abatere discretă spre ${pickedPhrase.toLowerCase()}. ${modeRule}`;
      mood = `${slice.mood}, contaminat fin`;
      motion = `${slice.motion} with soft interference`;
      triad.art = source.senseWeight >= 0.6 ? "lit" : triad.art;
      break;
  }

  const nextPalette = blendUnique(
    slice.palette,
    source.senseWeight > 0.55 ? ["signal red"] : ["mist"],
    4,
  );
  const nextMaterials = blendUnique(
    slice.materials,
    source.structureWeight > 0.55 ? ["cut paper"] : ["paper grain"],
    4,
  );
  const nextFragments = blendUnique(slice.fragments, [contaminationFragment, pickedPhrase], 5);
  const nextKeywords = buildMindSliceKeywords(blendUnique(slice.keywords, contaminationKeywords, 8));

  return {
    ...slice,
    direction,
    thought,
    fragments: nextFragments,
    mood,
    palette: nextPalette,
    materials: nextMaterials,
    motion,
    triad,
    visual: {
      ...slice.visual,
      density: clamp(slice.visual.density + source.senseWeight * 0.18, 0.9, 1.95),
      wave: clamp(slice.visual.wave + source.attentionWeight * 0.22, 0.35, 1.55),
      fracture: clamp(
        slice.visual.fracture +
          (source.influenceMode === "rupture" ? 0.18 : source.structureWeight * 0.08),
        0.18,
        0.95,
      ),
      drift: clamp(
        slice.visual.drift +
          (source.influenceMode === "counterpoint" ? 0.1 : source.attentionWeight * 0.06),
        0.25,
        1.2,
      ),
      convergence: clamp(
        slice.visual.convergence +
          (source.influenceMode === "echo" ? 0.08 : source.structureWeight * 0.05),
        0.45,
        0.95,
      ),
    },
    keywords: nextKeywords,
  };
}

async function getActiveContamination(userId: string | null) {
  if (!userId) {
    return null;
  }

  let supabase;
  try {
    supabase = createServerSupabaseClient();
  } catch {
    return null;
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .select("title, excerpt, content, sense_weight, structure_weight, attention_weight, influence_mode")
    .eq("user_id", userId)
    .eq("status", "published")
    .eq("is_contaminant", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    senseWeight: Number(data.sense_weight ?? 0),
    structureWeight: Number(data.structure_weight ?? 0),
    attentionWeight: Number(data.attention_weight ?? 0),
    influenceMode: (data.influence_mode ?? "whisper") as InfluenceMode,
  } satisfies ContaminationSource;
}

export async function GET() {
  const fallback = { slices: [] as unknown[] };

  try {
    const { userId } = await auth();
    const filePath = path.resolve(process.cwd(), "..", "Slices");
    const content = await readFile(filePath, "utf8");
    const baseSlices = parseSlicesContent(content);
    const contamination = await getActiveContamination(userId);
    const slices = contamination
      ? baseSlices.map((slice, index) => applyContamination(slice, contamination, index))
      : baseSlices;

    return Response.json({
      slices,
      engineMode: contamination
        ? `MindSlice live thought scene / ${contamination.influenceMode} contamination`
        : `MindSlice live thought scene / ${mindsliceSystemCore.axes[1]}`,
    });
  } catch {
    return Response.json(fallback);
  }
}
