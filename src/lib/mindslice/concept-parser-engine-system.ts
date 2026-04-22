export type ParsedSliceIdentity = {
  type: string | null;
  index_name: string | null;
  pseudonym: string | null;
  priority: string | null;
};

export type ParsedSliceContent = {
  type: string | null;
  text: string;
};

export type ParsedSliceProcess = {
  pipeline: string[];
};

export type ParsedSliceMetadata = {
  language: string | null;
  intensity: number;
  tags: string[];
};

export type ParsedSliceControl = {
  allow_contamination: boolean;
  allow_transformation: boolean;
  visibility: string | null;
};

export type ParsedSliceObject = {
  identity: ParsedSliceIdentity;
  content: ParsedSliceContent;
  process: ParsedSliceProcess;
  metadata: ParsedSliceMetadata;
  control: ParsedSliceControl;
};

const MINDSLICE_SLICE_START = "<<<MINDSLICE_SLICE_START>>>";
const MINDSLICE_SLICE_END = "<<<MINDSLICE_SLICE_END>>>";

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, "\n");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractValue(block: string | null, key: string) {
  if (!block) {
    return null;
  }

  const pattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*:\\s*(.+?)\\s*$`, "im");
  const match = block.match(pattern);

  return match?.[1]?.trim() ?? null;
}

function extractMultiline(block: string | null, key: string) {
  if (!block) {
    return "";
  }

  const pattern = new RegExp(
    `^\\s*${escapeRegExp(key)}\\s*:\\s*\\n([\\s\\S]*?)(?=^\\s*[A-Z_]+\\s*:|$)`,
    "im",
  );
  const match = block.match(pattern);

  return match?.[1]?.trim() ?? "";
}

function extractList(block: string | null, key: string) {
  const rawValue = extractValue(block, key);

  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(/[,\n|]+/u)
    .map((entry) => entry.replace(/^[-*]\s*/u, "").trim())
    .filter(Boolean);
}

function parseBoolean(value: string | null, fallback: boolean) {
  if (value == null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "yes", "1", "da"].includes(normalized)) {
    return true;
  }

  if (["false", "no", "0", "nu"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseNumber(value: string | null, fallback: number) {
  if (value == null) {
    return fallback;
  }

  const normalized = Number.parseFloat(value.replace(",", "."));

  return Number.isFinite(normalized) ? normalized : fallback;
}

export function validateStructure(raw: string) {
  const normalized = normalizeLineEndings(raw);
  const hasMarkers =
    normalized.includes(MINDSLICE_SLICE_START) && normalized.includes(MINDSLICE_SLICE_END);
  const requiredBlocks = ["IDENTITY", "CONTENT", "PROCESS"];
  const hasBlocks = requiredBlocks.every(
    (blockName) =>
      normalized.includes(`[${blockName}]`) && normalized.includes(`[/${blockName}]`),
  );

  return hasMarkers && hasBlocks;
}

export function extractBlock(raw: string, blockName: string) {
  const normalized = normalizeLineEndings(raw);
  const pattern = new RegExp(
    `\\[${escapeRegExp(blockName)}\\]([\\s\\S]*?)\\[\\/${escapeRegExp(blockName)}\\]`,
    "i",
  );
  const match = normalized.match(pattern);

  return match?.[1]?.trim() ?? null;
}

export function parseIdentity(block: string | null): ParsedSliceIdentity {
  return {
    type: extractValue(block, "TYPE"),
    index_name: extractValue(block, "INDEX_NAME"),
    pseudonym: extractValue(block, "PSEUDONYM"),
    priority: extractValue(block, "PRIORITY"),
  };
}

export function parseContent(block: string | null): ParsedSliceContent {
  return {
    type: extractValue(block, "TYPE"),
    text: extractMultiline(block, "TEXT"),
  };
}

export function parseProcess(block: string | null): ParsedSliceProcess {
  return {
    pipeline: extractList(block, "PIPELINE"),
  };
}

export function defaultMetadata(): ParsedSliceMetadata {
  return {
    language: "ro",
    intensity: 0.5,
    tags: [],
  };
}

export function parseMetadata(block: string | null): ParsedSliceMetadata {
  if (!block) {
    return defaultMetadata();
  }

  return {
    language: extractValue(block, "LANGUAGE"),
    intensity: parseNumber(extractValue(block, "INTENSITY"), 0.5),
    tags: extractList(block, "TAGS"),
  };
}

export function defaultControl(): ParsedSliceControl {
  return {
    allow_contamination: true,
    allow_transformation: true,
    visibility: "private",
  };
}

export function parseControl(block: string | null): ParsedSliceControl {
  if (!block) {
    return defaultControl();
  }

  return {
    allow_contamination: parseBoolean(extractValue(block, "ALLOW_CONTAMINATION"), true),
    allow_transformation: parseBoolean(extractValue(block, "ALLOW_TRANSFORMATION"), true),
    visibility: extractValue(block, "VISIBILITY"),
  };
}

export function normalizeParsedSlice(parsed: ParsedSliceObject): ParsedSliceObject {
  const normalized = {
    ...parsed,
    identity: {
      ...parsed.identity,
      type: parsed.identity.type ?? "anonymous",
    },
    metadata: {
      ...parsed.metadata,
      intensity:
        typeof parsed.metadata.intensity === "number" ? parsed.metadata.intensity : 0.5,
    },
    control: {
      ...parsed.control,
      allow_contamination:
        typeof parsed.control.allow_contamination === "boolean"
          ? parsed.control.allow_contamination
          : true,
    },
  };

  return normalized;
}

export function buildParsedSliceObject(
  identity: ParsedSliceIdentity,
  content: ParsedSliceContent,
  process: ParsedSliceProcess,
  metadata: ParsedSliceMetadata,
  control: ParsedSliceControl,
): ParsedSliceObject {
  return {
    identity,
    content,
    process,
    metadata,
    control,
  };
}

export function runParserEngine(rawSliceText: string): ParsedSliceObject | null {
  if (!validateStructure(rawSliceText)) {
    return null;
  }

  const identityBlock = extractBlock(rawSliceText, "IDENTITY");
  const contentBlock = extractBlock(rawSliceText, "CONTENT");
  const processBlock = extractBlock(rawSliceText, "PROCESS");
  const metadataBlock = extractBlock(rawSliceText, "METADATA");
  const controlBlock = extractBlock(rawSliceText, "CONTROL");

  const identity = parseIdentity(identityBlock);
  const content = parseContent(contentBlock);
  const process = parseProcess(processBlock);
  const metadata = parseMetadata(metadataBlock);
  const control = parseControl(controlBlock);
  const parsed = buildParsedSliceObject(identity, content, process, metadata, control);

  return normalizeParsedSlice(parsed);
}
