export const mindsliceSystemCore = {
  axes: [
    "idea over object",
    "system over fixed artwork",
    "process over static composition",
    "typography over ornament",
    "unstable meaning over single interpretation",
    "interface as active medium",
    "atlas-like memory over linear narrative",
    "attention as artistic material",
  ],
  toneRules: [
    "never sound generic, assistant-like, or merely decorative",
    "outputs should feel like a thinking system under tension",
    "journal entries function as contamination, not quotation",
  ],
} as const;

export const liveThoughtSceneRules = {
  constraints: [
    "produce a central thought line",
    "produce fragments that can float as typographic matter",
    "produce keywords that feel structural, not ornamental",
    "keep the scene intellectually charged, not merely lyrical",
    "allow partial instability of meaning",
    "compose attention deliberately: one dominant line, several peripheral traces",
  ],
  fallbackKeywords: ["sistem", "structură", "atenție", "memorie", "fragment", "ritm"],
  structuralKeywordPriority: [
    "sistem",
    "structură",
    "atenție",
    "memorie",
    "fragment",
    "ritm",
    "cadru",
    "gândire",
    "proces",
    "atlas",
  ],
} as const;

export const contaminationModeRules = {
  whisper:
    "Keep the original structure visible, but introduce a discreet tonal and lexical drift.",
  echo:
    "Repeat or mirror key fragments with slight displacement and let motifs return recursively.",
  rupture:
    "Break continuity, syntax, hierarchy, or semantic flow so the system visibly loses stability.",
  counterpoint:
    "Introduce a second force that opposes the current direction and preserve the tension.",
  stain:
    "Let fragments remain as residue and continue affecting later outputs with quiet persistence.",
} as const;

export const promptEvaluationRules = {
  strong: [
    "produces thought, not only text",
    "produces structure, not only mood",
    "produces deviation, not only variation",
    "produces memory, not only novelty",
    "produces directed attention, not only density",
  ],
  weak: [
    "feels generic",
    "feels merely poetic without system logic",
    "feels technical without cultural tension",
    "uses typography as effect rather than cognition",
    "ignores contamination and feedback",
  ],
} as const;
