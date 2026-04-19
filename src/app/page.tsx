"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type Triad = {
  art: {
    score: number;
    label: string;
  };
  design: {
    score: number;
    label: string;
  };
  business: {
    score: number;
    label: string;
  };
};

type VisualState = {
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

type ThoughtState = {
  direction: string;
  thought: string;
  fragments: string[];
  mood: string;
  palette: string[];
  materials: string[];
  motion: string;
  triad: Triad;
  visual: VisualState;
  keywords: string[];
};

type HistoryEntry = {
  time: string;
  text: string;
};

type SavedMoment = {
  id: string;
  direction: string;
  thought: string;
  prompt: string;
  image_url: string | null;
  created_at: string;
};

type ThoughtMemoryEntry = {
  id: string;
  source_type: "live_slice" | "journal_contamination";
  direction: string;
  thought: string;
  fragments: string[];
  keywords: string[];
  sense_score: number;
  structure_score: number;
  attention_score: number;
  influence_mode: "whisper" | "echo" | "rupture" | "counterpoint" | "stain" | null;
  memory_weight: number;
  created_at: string;
};

type BlogPostDraft = {
  id: string;
  author_user_id?: string;
  saved_moment_id: string | null;
  author_pseudonym?: string | null;
  title: string;
  excerpt: string | null;
  content: string;
  sense_weight: number;
  structure_weight: number;
  attention_weight: number;
  influence_mode: "whisper" | "echo" | "rupture" | "counterpoint" | "stain";
  is_contaminant: boolean;
  is_debut_submission?: boolean;
  is_debut_selected?: boolean;
  is_debut_published?: boolean;
  status: "draft" | "published";
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type LiveInterference = {
  sourceId: string;
  authorUserId?: string;
  title: string;
  authorPseudonym?: string | null;
  excerpt: string | null;
  senseWeight: number;
  structureWeight: number;
  attentionWeight: number;
  influenceMode: "whisper" | "echo" | "rupture" | "counterpoint" | "stain";
  note: string;
  publishedAt: string;
};

type InteriorChatMessage = {
  id: string;
  author_user_id: string;
  message: string;
  message_body?: string;
  created_at: string;
  author_pseudonym: string | null;
  is_current_user: boolean;
  address_mode?: "all" | "direct" | "legacy";
  address_label?: string | null;
  target_pseudonym?: string | null;
};

type AddressForm = "domnule" | "doamnă" | "domnișoară";

type UserProfile = {
  user_id: string;
  display_name?: string | null;
  pseudonym?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  name_declaration_accepted?: boolean | null;
  subscription_status?: "inactive" | "active" | "past_due" | "canceled" | null;
  subscription_expires_at?: string | null;
  address_form?: AddressForm | null;
  bio?: string | null;
  artist_statement?: string | null;
  debut_status?: "aspirant" | "in_program" | "selected" | "published" | "alumni" | null;
};

type AdminSubscriptionProfile = {
  user_id: string;
  pseudonym: string | null;
  subscription_status: "inactive" | "active" | "past_due" | "canceled";
  subscription_expires_at: string | null;
};

type AdminSubscriptionOption = {
  user_id: string;
  pseudonym: string | null;
  subscription_status: "inactive" | "active" | "past_due" | "canceled";
  subscription_expires_at: string | null;
};

type ViewMode = "live" | "journal" | "archive";

type EngineProfile = {
  stage: "alpha";
  generationStrategy: "slice_file_parser" | "slice_file_parser_plus_openai_refinement";
  contaminationStrategy: "journal_contamination_overlay";
  charterAxes: string[];
  sceneConstraints: string[];
  activeContaminationRule: string | null;
  openaiStructuredGeneration: "inactive" | "active";
};

const THOUGHT_OVERLAY_HOLD_MS = 8000;
const THOUGHT_STAGE_REST_MS = 15000;

function formatDebutStatusLabel(
  value: UserProfile["debut_status"] | null | undefined,
) {
  switch (value) {
    case "in_program":
      return "în program";
    case "selected":
      return "selectat";
    case "published":
      return "publicat";
    case "alumni":
      return "alumni";
    case "aspirant":
    default:
      return "aspirant";
  }
}

function formatSubscriptionStatusLabel(
  value: UserProfile["subscription_status"] | null | undefined,
) {
  switch (value) {
    case "active":
      return "activ";
    case "past_due":
      return "restanță";
    case "canceled":
      return "anulat";
    case "inactive":
    default:
      return "inactiv";
  }
}

function getTypewriterDelay(
  character: string,
  influenceMode: LiveInterference["influenceMode"] | null,
) {
  if (character === "," || character === ";") {
    return influenceMode === "stain" ? 150 : 110;
  }

  if (character === "." || character === ":" || character === "!") {
    return influenceMode === "rupture" ? 240 : 180;
  }

  if (influenceMode === "echo") {
    return 28;
  }

  if (influenceMode === "rupture") {
    return 16;
  }

  return 22;
}

function getThoughtDrawDuration(
  text: string,
  influenceMode: LiveInterference["influenceMode"] | null,
) {
  if (!text.length) {
    return 0;
  }

  let duration = 160;

  for (let index = 0; index < text.length - 1; index += 1) {
    duration += getTypewriterDelay(text[index], influenceMode);
  }

  return duration;
}

function formatQuotedPseudonym(value: string) {
  return `„${value}”`;
}

function formatPublicAuthor(pseudonym: string | null | undefined) {
  return pseudonym?.trim() ? formatQuotedPseudonym(pseudonym.trim()) : "Pseudonim nesetat";
}

function normalizeDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isValidFamilyAndGivenName(value: string) {
  return /^\p{L}+(?:[ '-]\p{L}+){0,2},\s\p{L}+(?:[ '-]\p{L}+){0,2}$/u.test(value);
}

const fallbackStateLibrary: ThoughtState[] = [
  {
    direction: "Slice Thinking Visual Core",
    thought:
      "Acum mă gândesc la postmodernism ca memorie spartă, unde tipografia devine arhitectura emoțională.",
    fragments: [
      "postmodernism",
      "memorie spartă",
      "tipografie",
      "arhitectură emoțională",
    ],
    mood: "intens, intelectual, introspectiv, viu",
    palette: ["ivory", "charcoal", "ember", "steel"],
    materials: ["ink", "warm paper", "pencil dust", "glass"],
    motion: "radial drift with fracture pulses",
    triad: {
      art: { score: 0.74, label: "charged" },
      design: { score: 0.71, label: "structured" },
      business: { score: 0.44, label: "emergent" },
    },
    visual: {
      background: "#f0e6d8",
      accent: "#b5452f",
      ink: "#181411",
      mode: "fractured_field",
      density: 1.2,
      wave: 0.8,
      fracture: 0.42,
      drift: 0.48,
      convergence: 0.7,
    },
    keywords: [
      "structura",
      "schelet",
      "schema",
      "fractura",
      "plan",
      "logigrama",
      "perspectiva",
    ],
  },
  {
    direction: "Attention Architecture",
    thought:
      "Acum mă gândesc la modul în care atenția poate fi dirijată ca o scenă: intrări lente, tensiuni mici, convergență finală.",
    fragments: ["atenție", "scenă", "intrări lente", "convergență finală"],
    mood: "clar, strategic, cinematic, tensionat",
    palette: ["bone", "graphite", "signal red", "fog"],
    materials: ["screen glow", "paper grain", "soft steel"],
    motion: "slow directional sweeps with focus locks",
    triad: {
      art: { score: 0.62, label: "luminous" },
      design: { score: 0.69, label: "anchored" },
      business: { score: 0.78, label: "focused" },
    },
    visual: {
      background: "#ebe3d7",
      accent: "#c85135",
      ink: "#111111",
      mode: "balanced_orbit",
      density: 0.95,
      wave: 0.45,
      fracture: 0.26,
      drift: 0.58,
      convergence: 0.64,
    },
    keywords: ["focus", "signal", "sequence", "attention", "anchor", "drift"],
  },
  {
    direction: "Cognitive Typographic System",
    thought:
      "Acum mă gândesc la un sistem cognitiv desenat de mână, unde fiecare cuvânt e o particulă care caută centru și rezistă în același timp.",
    fragments: [
      "sistem cognitiv",
      "desenat de mână",
      "particulă",
      "caută centru",
    ],
    mood: "organic, dens, controlat, febril",
    palette: ["paper", "soot", "rust", "chalk"],
    materials: ["ink bleed", "graphite", "dust", "vellum"],
    motion: "circular pull with collisions and return paths",
    triad: {
      art: { score: 0.81, label: "charged" },
      design: { score: 0.73, label: "structured" },
      business: { score: 0.33, label: "diffuse" },
    },
    visual: {
      background: "#efe7dc",
      accent: "#8d3929",
      ink: "#201915",
      mode: "study_lattice",
      density: 1.5,
      wave: 1.1,
      fracture: 0.6,
      drift: 0.42,
      convergence: 0.82,
    },
    keywords: ["densitate", "text", "conflict", "convergență", "particule"],
  },
];

function buildPrompt(snapshotMode: boolean, current: ThoughtState) {
  const modeLine = snapshotMode
    ? "Create a still image prompt based on this exact live artistic moment."
    : "Create a cinematic art prompt for a live generative visual system.";

  return [
    modeLine,
    "",
    `Concept: ${current.direction}.`,
    `Live thought: ${current.thought}`,
    `Mood: ${current.mood}.`,
    `Palette: ${current.palette.join(", ")}.`,
    `Materials: ${current.materials.join(", ")}.`,
    `Motion: ${current.motion}.`,
    `Visual thought evaluation: sense ${current.triad.art.score.toFixed(2)} · ${current.triad.art.label}, structure ${current.triad.design.score.toFixed(2)} · ${current.triad.design.label}, attention ${current.triad.business.score.toFixed(2)} · ${current.triad.business.label}.`,
    "Visual behavior: hand-drawn conceptual map, density gradients, text fragments converging toward a dominant anchor, visible tension zones, imperfect spacing, controlled chaos, no decorative polish.",
    `Keywords: ${current.keywords.join(", ")}.`,
    "Output style: sophisticated post-generative art direction, museum-grade conceptual aesthetics, layered typography, warm paper texture, subtle ink bleed, high compositional intelligence.",
  ].join("\n");
}

function getThoughtCenterAnchor(current: ThoughtState, currentIndex: number) {
  const intersections = [
    { left: "33.333%", top: "33.333%" },
    { left: "66.666%", top: "33.333%" },
    { left: "33.333%", top: "66.666%" },
    { left: "66.666%", top: "66.666%" },
  ] as const;

  const seed = `${current.direction}|${current.thought}|${currentIndex}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
  }

  return intersections[hash % intersections.length];
}

function splitThoughtIntoLines(text: string, seedSource: string) {
  if (!text.trim()) {
    return [];
  }

  let seed = 0;
  for (let index = 0; index < seedSource.length; index += 1) {
    seed = (seed * 33 + seedSource.charCodeAt(index)) % 2147483647;
  }

  const lineTargets = [
    20 + (seed % 5),
    28 + (seed % 4),
    24 + ((seed >> 2) % 5),
    30 + ((seed >> 3) % 4),
  ];

  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  let targetIndex = 0;

  words.forEach((word) => {
    const maxChars = lineTargets[targetIndex % lineTargets.length];
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxChars || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
    targetIndex += 1;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function getFocalHaloStyles(
  current: ThoughtState,
  anchor: { left: string; top: string },
  influenceMode: LiveInterference["influenceMode"] | null,
) {
  const fragmentFactor = Math.min(current.fragments.length, 5);
  const keywordFactor = Math.min(current.keywords.length, 8);
  const primaryWidth = 128 + current.triad.business.score * 68 + current.visual.convergence * 54;
  const primaryHeight = 128 + current.triad.art.score * 54 + current.visual.wave * 22;
  const secondaryWidth =
    primaryWidth + 56 + current.visual.density * 24 + fragmentFactor * 6 + keywordFactor * 2;
  const secondaryHeight =
    primaryHeight + 44 + current.visual.drift * 26 + fragmentFactor * 4;
  const offsetX = Math.round((current.visual.drift - 0.5) * 28);
  const offsetY = Math.round((current.visual.wave - 0.7) * 18);
  const primaryRotation = `${Math.round((current.visual.fracture - 0.35) * 10)}deg`;
  const secondaryRotation = `${Math.round((current.visual.drift - 0.45) * 12 + (current.triad.design.score - 0.5) * 10)}deg`;
  const secondaryLeft = anchor.left === "33.333%" ? "84%" : "16%";
  const secondaryTop = anchor.top === "33.333%" ? "84%" : "16%";
  const secondaryOffsetX =
    Math.round((current.visual.drift - 0.5) * 16) +
    (influenceMode === "counterpoint" ? 10 : 0);
  const secondaryOffsetY =
    Math.round((current.visual.wave - 0.7) * 12) +
    (influenceMode === "stain" ? 8 : 0);

  return {
    primary: {
      left: anchor.left,
      top: anchor.top,
      width: `${primaryWidth}px`,
      height: `${primaryHeight}px`,
      marginLeft: `${offsetX}px`,
      marginTop: `${offsetY}px`,
      transform: `translate(-50%, -50%) rotate(${primaryRotation})`,
    },
    secondary: {
      left: secondaryLeft,
      top: secondaryTop,
      width: `${secondaryWidth}px`,
      height: `${secondaryHeight}px`,
      marginLeft: `${secondaryOffsetX}px`,
      marginTop: `${secondaryOffsetY}px`,
      transform: `translate(-50%, -50%) rotate(${secondaryRotation})`,
    },
  };
}

function getLeadingLineStyles(
  current: ThoughtState,
  anchor: { left: string; top: string },
  influenceMode: LiveInterference["influenceMode"] | null,
) {
  const anchorX = Number(anchor.left.replace("%", ""));
  const anchorY = Number(anchor.top.replace("%", ""));
  const structurePull = current.triad.design.score;
  const attentionPull = current.triad.business.score;
  const artPull = current.triad.art.score;

  const startPoints = [
    {
      x: 6 + current.visual.drift * 7,
      y: 79 - current.visual.wave * 8,
      reach: 0.94,
    },
    {
      x: 92 - current.visual.convergence * 10,
      y: 14 + current.visual.fracture * 18,
      reach: 0.88,
    },
    {
      x: 82 - attentionPull * 10,
      y: 88 - structurePull * 14,
      reach: 0.82,
    },
  ];

  const modeScale =
    influenceMode === "rupture"
      ? 1.08
      : influenceMode === "counterpoint"
        ? 0.92
        : influenceMode === "echo"
          ? 0.98
          : 1;

  return startPoints.map((point, index) => {
    const targetX =
      anchorX +
      (index === 1 ? (artPull - 0.5) * 6 : 0) +
      (influenceMode === "counterpoint" && index === 2 ? -8 : 0);
    const targetY =
      anchorY +
      (index === 0 ? (attentionPull - 0.5) * 5 : 0) +
      (influenceMode === "stain" ? 3 : 0);
    const dx = targetX - point.x;
    const dy = targetY - point.y;
    const length = Math.sqrt(dx * dx + dy * dy) * point.reach * modeScale;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return {
      left: `${point.x}%`,
      top: `${point.y}%`,
      width: `${length}%`,
      transform: `rotate(${angle}deg)`,
      opacity: 0.6 + structurePull * 0.16 + (index === 1 ? artPull * 0.08 : 0),
    };
  });
}

function getNegativeSpaceStyles(
  current: ThoughtState,
  anchor: { left: string; top: string },
  influenceMode: LiveInterference["influenceMode"] | null,
) {
  const anchorX = Number(anchor.left.replace("%", ""));
  const anchorY = Number(anchor.top.replace("%", ""));
  const centerOnLeft = anchorX < 50;
  const centerOnTop = anchorY < 50;
  const density = current.visual.density;
  const structure = current.triad.design.score;
  const attention = current.triad.business.score;
  const fracture = current.visual.fracture;

  const safeWidth = 14 + (1 - structure) * 10 + (1 - attention) * 6;
  const safeHeight = 10 + (1 - density / 2) * 8 + (1 - fracture) * 4;
  const secondaryWidth = safeWidth - 3 + current.visual.drift * 4;
  const secondaryHeight = safeHeight - 1 + current.visual.wave * 3;

  const primary = {
    left: centerOnLeft ? "72%" : "7%",
    top: centerOnTop ? "70%" : "8%",
    width: `${Math.max(12, safeWidth)}%`,
    height: `${Math.max(8, safeHeight)}%`,
    transform: `rotate(${Math.round((current.visual.drift - 0.5) * 8)}deg)`,
  };

  const secondary = {
    left: centerOnLeft ? "8%" : "70%",
    top: centerOnTop ? "10%" : "74%",
    width: `${Math.max(10, secondaryWidth)}%`,
    height: `${Math.max(7, secondaryHeight)}%`,
    transform: `rotate(${
      Math.round((current.visual.fracture - 0.4) * 10) + (influenceMode === "counterpoint" ? -4 : 0)
    }deg)`,
  };

  return { primary, secondary };
}

export default function Home() {
  const [stateLibrary, setStateLibrary] = useState<ThoughtState[]>(fallbackStateLibrary);
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("live");
  const [isActive, setIsActive] = useState(true);
  const [engineMode, setEngineMode] = useState("mock local");
  const [engineProfile, setEngineProfile] = useState<EngineProfile | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedMoments, setSavedMoments] = useState<SavedMoment[]>([]);
  const [thoughtMemory, setThoughtMemory] = useState<ThoughtMemoryEntry[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPostDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountMessage, setAccountMessage] = useState("Conectează-te pentru a salva momente.");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [draftingMomentId, setDraftingMomentId] = useState<string | null>(null);
  const [draftTitleInput, setDraftTitleInput] = useState("");
  const [draftExcerptInput, setDraftExcerptInput] = useState("");
  const [draftContentInput, setDraftContentInput] = useState("");
  const [senseWeightInput, setSenseWeightInput] = useState("0.4");
  const [structureWeightInput, setStructureWeightInput] = useState("0.3");
  const [attentionWeightInput, setAttentionWeightInput] = useState("0.3");
  const [influenceModeInput, setInfluenceModeInput] = useState<
    "whisper" | "echo" | "rupture" | "counterpoint" | "stain"
  >("whisper");
  const [isContaminantInput, setIsContaminantInput] = useState(true);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishingDraft, setIsPublishingDraft] = useState(false);
  const [interference, setInterference] = useState<LiveInterference | null>(null);
  const [interiorChatMessages, setInteriorChatMessages] = useState<InteriorChatMessage[]>([]);
  const [interiorChatInput, setInteriorChatInput] = useState("");
  const [isSendingInteriorChatMessage, setIsSendingInteriorChatMessage] = useState(false);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>([]);
  const [followActionUserId, setFollowActionUserId] = useState<string | null>(null);
  const [isSavingAddressForm, setIsSavingAddressForm] = useState(false);
  const [isEditingAddressForm, setIsEditingAddressForm] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [pseudonymInput, setPseudonymInput] = useState("");
  const [isSavingPseudonym, setIsSavingPseudonym] = useState(false);
  const [isEditingPseudonym, setIsEditingPseudonym] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [bioSaveState, setBioSaveState] = useState<"idle" | "saved">("idle");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isSavingNameDeclaration, setIsSavingNameDeclaration] = useState(false);
  const [artistStatementInput, setArtistStatementInput] = useState("");
  const [debutStatusInput, setDebutStatusInput] = useState<
    "aspirant" | "in_program" | "selected" | "published" | "alumni"
  >("aspirant");
  const [isSavingDebutProgram, setIsSavingDebutProgram] = useState(false);
  const [isDebutSubmissionInput, setIsDebutSubmissionInput] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSubscriptionOptions, setAdminSubscriptionOptions] = useState<
    AdminSubscriptionOption[]
  >([]);
  const [adminTargetPseudonymInput, setAdminTargetPseudonymInput] = useState("");
  const [adminSubscriptionStatusInput, setAdminSubscriptionStatusInput] = useState<
    "inactive" | "active" | "past_due" | "canceled"
  >("inactive");
  const [isSavingAdminSubscription, setIsSavingAdminSubscription] = useState(false);
  const [adminSubscriptionResult, setAdminSubscriptionResult] =
    useState<AdminSubscriptionProfile | null>(null);
  const [hasLoadedUserState, setHasLoadedUserState] = useState(false);
  const [animatedThought, setAnimatedThought] = useState(fallbackStateLibrary[0].thought);
  const [isThoughtOverlayVisible, setIsThoughtOverlayVisible] = useState(true);
  const [thoughtAnimationKey, setThoughtAnimationKey] = useState(0);
  const [promptOutput, setPromptOutput] = useState(() =>
    buildPrompt(false, fallbackStateLibrary[0]),
  );
  const lastPersistedThoughtRef = useRef<string | null>(null);
  const { isSignedIn } = useAuth();
  const libraryLength = stateLibrary.length;
  const current = stateLibrary[currentIndex];
  const currentImageUrl = referenceImageUrls.length
    ? referenceImageUrls[imageIndex % referenceImageUrls.length]
    : null;
  const publishedPosts = blogPosts.filter((entry) => entry.status === "published");
  const liveInfluenceMode = interference?.influenceMode ?? null;
  const normalizedDisplayNameInput = normalizeDisplayName(displayNameInput);
  const hasDisplayNameInput = normalizedDisplayNameInput.length > 0;
  const canSaveDisplayName = isValidFamilyAndGivenName(normalizedDisplayNameInput);
  const normalizedProfileDisplayName = normalizeDisplayName(profile?.display_name ?? "");
  const normalizedBioInput = bioInput.trim();
  const normalizedArtistStatementInput = artistStatementInput.trim();
  const hasAcceptedNameDeclaration = Boolean(profile?.name_declaration_accepted);
  const hasPseudonym = Boolean(profile?.pseudonym?.trim());
  const hasActiveSubscription = profile?.subscription_status === "active";
  const hasRequiredDisplayName =
    !isSignedIn ||
    (Boolean(normalizedProfileDisplayName) &&
      isValidFamilyAndGivenName(normalizedProfileDisplayName));
  const hasProfileAccess =
    !isSignedIn || (hasRequiredDisplayName && hasAcceptedNameDeclaration);
  const isApplicationLocked = isSignedIn && hasLoadedUserState && !hasProfileAccess;
  const currentDebutStatus = profile?.debut_status ?? "aspirant";
  const hasDebutProgramChanges =
    normalizedArtistStatementInput !== (profile?.artist_statement ?? "").trim() ||
    debutStatusInput !== currentDebutStatus;
  const hasBioChanges = normalizedBioInput !== (profile?.bio ?? "").trim();
  const thoughtCenterAnchor = getThoughtCenterAnchor(current, currentIndex);
  const thoughtCenterFragment = current.fragments[0] ?? current.keywords[0] ?? "anchor";
  const focalHaloStyles = getFocalHaloStyles(current, thoughtCenterAnchor, liveInfluenceMode);
  const leadingLineStyles = getLeadingLineStyles(current, thoughtCenterAnchor, liveInfluenceMode);
  const negativeSpaceStyles = getNegativeSpaceStyles(
    current,
    thoughtCenterAnchor,
    liveInfluenceMode,
  );
  const thoughtLines = splitThoughtIntoLines(
    animatedThought,
    `${current.direction}|${current.thought}|${currentIndex}`,
  );

  useEffect(() => {
    let ignore = false;

    async function loadSlices() {
      try {
        const response = await fetch("/api/slices", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Slices request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as {
          slices?: ThoughtState[];
          engineMode?: string;
          engineProfile?: EngineProfile;
        };
        const slices = Array.isArray(payload.slices) ? payload.slices : [];
        if (!slices.length || ignore) {
          return;
        }

        setStateLibrary(slices);
        setCurrentIndex(0);
        setEngineMode(payload.engineMode || "Slices file");
        setEngineProfile(payload.engineProfile || null);
      } catch {
        if (!ignore) {
          setStateLibrary(fallbackStateLibrary);
          setEngineMode("mock local");
          setEngineProfile(null);
        }
      }
    }

    loadSlices();

    return () => {
      ignore = true;
    };
  }, [isSignedIn, interference?.sourceId, interference?.publishedAt, interference?.influenceMode]);

  useEffect(() => {
    let cancelled = false;

    async function loadReferenceImages() {
      try {
        const response = await fetch("/api/reference-images", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Reference images request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as { images?: string[] };
        const urls = Array.isArray(payload.images) ? payload.images : [];
        if (!urls.length || cancelled) {
          return;
        }

        if (!cancelled) {
          setReferenceImageUrls(urls);
          setImageIndex(0);
        }
      } catch {
        if (!cancelled) {
          setReferenceImageUrls([]);
        }
      }
    }

    loadReferenceImages();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const time = new Date().toLocaleTimeString("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setHistory((previous) => {
      const next = [{ time, text: current.thought }, ...previous];
      return next.slice(0, 5);
    });
  }, [current.thought]);

  useEffect(() => {
    setPromptOutput(buildPrompt(false, current));
  }, [current, currentIndex]);

  useEffect(() => {
    let cancelled = false;
    const timeoutIds: number[] = [];

    setThoughtAnimationKey((previous) => previous + 1);
    setAnimatedThought("");
    setIsThoughtOverlayVisible(true);

    const nextThought = current.thought;
    const influenceMode = interference?.influenceMode ?? null;

    const writeCharacter = (index: number) => {
      if (cancelled) {
        return;
      }

      setAnimatedThought(nextThought.slice(0, index + 1));

      if (index >= nextThought.length - 1) {
        const holdTimeoutId = window.setTimeout(() => eraseCharacter(nextThought.length - 1), THOUGHT_OVERLAY_HOLD_MS);
        timeoutIds.push(holdTimeoutId);
        return;
      }

      const nextTimeoutId = window.setTimeout(
        () => writeCharacter(index + 1),
        getTypewriterDelay(nextThought[index], influenceMode),
      );
      timeoutIds.push(nextTimeoutId);
    };

    const eraseCharacter = (index: number) => {
      if (cancelled) {
        return;
      }

      setAnimatedThought(nextThought.slice(0, index));

      if (index <= 0) {
        setIsThoughtOverlayVisible(false);
        return;
      }

      const nextTimeoutId = window.setTimeout(
        () => eraseCharacter(index - 1),
        getTypewriterDelay(nextThought[index - 1], influenceMode),
      );
      timeoutIds.push(nextTimeoutId);
    };

    const initialTimeoutId = window.setTimeout(() => writeCharacter(0), 160);
    timeoutIds.push(initialTimeoutId);

    return () => {
      cancelled = true;
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [current.thought, interference?.influenceMode]);

  useEffect(() => {
    if (!isSignedIn) {
      setHasLoadedUserState(true);
      setSavedMoments([]);
      setThoughtMemory([]);
      setBlogPosts([]);
      setProfile(null);
      setIsAdmin(false);
      setAccountMessage("Conectează-te pentru a salva momente.");
      return;
    }

    let cancelled = false;
    setHasLoadedUserState(false);

    async function loadUserState() {
      try {
        const response = await fetch("/api/user-state", { cache: "no-store" });
        const payload = (await response.json()) as {
          profile?: UserProfile;
          savedMoments?: SavedMoment[];
          blogPosts?: BlogPostDraft[];
          isAdmin?: boolean;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut încărca datele utilizatorului.");
        }

        if (!cancelled) {
          setProfile(payload.profile ?? null);
          setIsAdmin(Boolean(payload.isAdmin));
          setDisplayNameInput(payload.profile?.display_name ?? "");
          setPseudonymInput(payload.profile?.pseudonym ?? "");
          setBioInput(payload.profile?.bio ?? "");
          setBioSaveState("idle");
          setArtistStatementInput(payload.profile?.artist_statement ?? "");
          setDebutStatusInput(payload.profile?.debut_status ?? "aspirant");
          setSavedMoments(Array.isArray(payload.savedMoments) ? payload.savedMoments : []);
          setAccountMessage(
            payload.profile?.display_name &&
              isValidFamilyAndGivenName(normalizeDisplayName(payload.profile.display_name)) &&
              payload.profile?.name_declaration_accepted
              ? "Momentele tale salvate sunt sincronizate cu Supabase."
              : 'Setează numele în formatul "Nume de familie, Prenume" și bifează declarația din PANEL · Account Profile pentru a intra în aplicație.',
          );
          setHasLoadedUserState(true);
        }
      } catch (error) {
        if (!cancelled) {
          setIsAdmin(false);
          setAccountMessage(
            error instanceof Error ? error.message : "Nu am putut încărca datele utilizatorului.",
          );
          setHasLoadedUserState(true);
        }
      }
    }

    loadUserState();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setFollowedUserIds([]);
      return;
    }

    let cancelled = false;

    async function loadFollows() {
      try {
        const response = await fetch("/api/pseudonym-follows", { cache: "no-store" });
        const payload = (await response.json()) as {
          followedUserIds?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut încărca relațiile de follow.");
        }

        if (!cancelled) {
          setFollowedUserIds(Array.isArray(payload.followedUserIds) ? payload.followedUserIds : []);
        }
      } catch {
        if (!cancelled) {
          setFollowedUserIds([]);
        }
      }
    }

    loadFollows();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !isAdmin) {
      setAdminSubscriptionOptions([]);
      return;
    }

    let cancelled = false;

    async function loadAdminSubscriptionOptions() {
      try {
        const response = await fetch("/api/admin/subscriptions", { cache: "no-store" });
        const payload = (await response.json()) as {
          profiles?: AdminSubscriptionOption[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut încărca lista de pseudonime.");
        }

        if (!cancelled) {
          setAdminSubscriptionOptions(Array.isArray(payload.profiles) ? payload.profiles : []);
        }
      } catch (error) {
        if (!cancelled) {
          setAdminSubscriptionOptions([]);
          setAccountMessage(
            error instanceof Error ? error.message : "Nu am putut încărca lista de pseudonime.",
          );
        }
      }
    }

    loadAdminSubscriptionOptions();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setInteriorChatMessages([]);
      return;
    }

    let cancelled = false;

    async function loadInteriorChat() {
      try {
        const response = await fetch("/api/interior-chat", { cache: "no-store" });
        const payload = (await response.json()) as {
          messages?: InteriorChatMessage[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut încărca chatul interior.");
        }

        if (!cancelled) {
          setInteriorChatMessages(Array.isArray(payload.messages) ? payload.messages : []);
        }
      } catch {
        if (!cancelled) {
          setInteriorChatMessages([]);
        }
      }
    }

    loadInteriorChat();
    const interval = window.setInterval(loadInteriorChat, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setThoughtMemory([]);
      return;
    }

    let cancelled = false;

    async function loadThoughtMemory() {
      try {
        const response = await fetch("/api/thought-memory", { cache: "no-store" });
        const payload = (await response.json()) as {
          thoughtMemory?: ThoughtMemoryEntry[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut încărca memoria gândurilor.");
        }

        if (!cancelled) {
          setThoughtMemory(Array.isArray(payload.thoughtMemory) ? payload.thoughtMemory : []);
        }
      } catch {
        if (!cancelled) {
          setThoughtMemory([]);
        }
      }
    }

    loadThoughtMemory();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, currentIndex, liveInfluenceMode]);

  useEffect(() => {
    if (!isSignedIn) {
      setBlogPosts([]);
      return;
    }

    let cancelled = false;

    async function loadBlogPosts() {
      try {
        const response = await fetch("/api/blog-posts", { cache: "no-store" });
        const payload = (await response.json()) as {
          blogPosts?: BlogPostDraft[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut încărca drafturile de jurnal.");
        }

        if (!cancelled) {
          const nextPosts = Array.isArray(payload.blogPosts) ? payload.blogPosts : [];
          setBlogPosts(nextPosts);
          setActiveDraftId((previous) => previous ?? nextPosts[0]?.id ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setAccountMessage(
            error instanceof Error ? error.message : "Nu am putut încărca drafturile de jurnal.",
          );
        }
      }
    }

    loadBlogPosts();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    let cancelled = false;

    async function loadInterference() {
      try {
        const response = await fetch("/api/live-interference", { cache: "no-store" });
        const payload = (await response.json()) as {
          interference?: LiveInterference | null;
        };

        if (!cancelled) {
          setInterference(payload.interference ?? null);
        }
      } catch {
        if (!cancelled) {
          setInterference(null);
        }
      }
    }

    loadInterference();

    return () => {
      cancelled = true;
    };
  }, [blogPosts]);

  useEffect(() => {
    const activeDraft = blogPosts.find((entry) => entry.id === activeDraftId);
    if (!activeDraft) {
      return;
    }

    setDraftTitleInput(activeDraft.title);
    setDraftExcerptInput(activeDraft.excerpt ?? "");
    setDraftContentInput(activeDraft.content);
    setSenseWeightInput(String(activeDraft.sense_weight ?? 0));
    setStructureWeightInput(String(activeDraft.structure_weight ?? 0));
    setAttentionWeightInput(String(activeDraft.attention_weight ?? 0));
    setInfluenceModeInput(activeDraft.influence_mode);
    setIsContaminantInput(activeDraft.is_contaminant);
    setIsDebutSubmissionInput(Boolean(activeDraft.is_debut_submission));
  }, [activeDraftId, blogPosts]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const cycleDuration =
      getThoughtDrawDuration(current.thought, liveInfluenceMode) * 2 +
      THOUGHT_OVERLAY_HOLD_MS +
      THOUGHT_STAGE_REST_MS;

    const timeout = window.setTimeout(() => {
      setCurrentIndex((previous) => (previous + 1) % libraryLength);
    }, cycleDuration);

    return () => window.clearTimeout(timeout);
  }, [isActive, libraryLength, current.thought, liveInfluenceMode]);

  useEffect(() => {
    if (!isActive || referenceImageUrls.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setImageIndex((previous) => (previous + 1) % referenceImageUrls.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [isActive, referenceImageUrls.length]);

  useEffect(() => {
    if (!isSignedIn || !isActive || !hasProfileAccess) {
      return;
    }

    const fingerprint = [
      current.direction,
      current.thought,
      currentIndex,
      liveInfluenceMode ?? "none",
    ].join("::");

    if (lastPersistedThoughtRef.current === fingerprint) {
      return;
    }

    lastPersistedThoughtRef.current = fingerprint;

    void fetch("/api/thought-memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceType: liveInfluenceMode ? "journal_contamination" : "live_slice",
        direction: current.direction,
        thought: current.thought,
        fragments: current.fragments,
        keywords: current.keywords,
        senseScore: current.triad.art.score,
        structureScore: current.triad.design.score,
        attentionScore: current.triad.business.score,
        influenceMode: liveInfluenceMode,
        memoryWeight: liveInfluenceMode ? 0.7 : 0.4,
      }),
    }).catch(() => {
      // Alpha-safe: memoria nu trebuie să rupă scena live dacă persistarea eșuează.
    });
  }, [current, currentIndex, hasProfileAccess, isActive, isSignedIn, liveInfluenceMode]);

  const handleSaveMoment = async () => {
    setPromptOutput(buildPrompt(true, current));

    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să poți salva momente în contul tău.");
      setSaveState("error");
      return;
    }

    if (!hasRequiredDisplayName) {
      setAccountMessage(
        'Setează mai întâi numele în formatul "Nume de familie, Prenume" în PANEL · Account Profile ca să poți intra în aplicație.',
      );
      setSaveState("error");
      return;
    }

    if (!hasAcceptedNameDeclaration) {
      setAccountMessage(
        "Bifează declarația din PANEL · Account Profile ca să poți intra în aplicație.",
      );
      setSaveState("error");
      return;
    }

    setSaveState("saving");
    try {
      const response = await fetch("/api/user-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction: current.direction,
          thought: current.thought,
          prompt: buildPrompt(true, current),
          imageUrl: currentImageUrl,
        }),
      });

      const payload = (await response.json()) as {
        savedMoment?: SavedMoment;
        error?: string;
      };

      if (!response.ok || !payload.savedMoment) {
        throw new Error(payload.error || "Nu am putut salva momentul.");
      }

      setSavedMoments((previous) => [payload.savedMoment!, ...previous].slice(0, 6));
      setAccountMessage("Momentul a fost salvat in Supabase.");
      setSaveState("saved");
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut salva momentul.",
      );
      setSaveState("error");
    }
  };

  const handleCreateDraftFromMoment = async (savedMomentId: string) => {
    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să poți transforma momentul în draft.");
      return;
    }

    if (!hasProfileAccess) {
      setAccountMessage(
        "Completează numele și declarația din PANEL · Account Profile ca să poți continua.",
      );
      return;
    }

    setDraftingMomentId(savedMomentId);

    try {
      const response = await fetch("/api/blog-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ savedMomentId }),
      });

      const payload = (await response.json()) as {
        blogPost?: BlogPostDraft;
        reused?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.blogPost) {
        throw new Error(payload.error || "Nu am putut crea draftul de jurnal.");
      }

      setBlogPosts((previous) => {
        const next = previous.filter((entry) => entry.id !== payload.blogPost!.id);
        return [payload.blogPost!, ...next];
      });
      setActiveDraftId(payload.blogPost.id);
      setViewMode("journal");
      setDraftTitleInput(payload.blogPost.title);
      setDraftExcerptInput(payload.blogPost.excerpt ?? "");
      setDraftContentInput(payload.blogPost.content);
      setSenseWeightInput(String(payload.blogPost.sense_weight ?? 0));
      setStructureWeightInput(String(payload.blogPost.structure_weight ?? 0));
      setAttentionWeightInput(String(payload.blogPost.attention_weight ?? 0));
      setInfluenceModeInput(payload.blogPost.influence_mode);
      setIsContaminantInput(payload.blogPost.is_contaminant);
      setIsDebutSubmissionInput(Boolean(payload.blogPost.is_debut_submission));

      setAccountMessage(
        payload.reused
          ? "Draftul de jurnal exista deja si a fost readus in lista."
          : "Momentul a fost transformat în draft de jurnal.",
      );
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut crea draftul de jurnal.",
      );
    } finally {
      setDraftingMomentId(null);
    }
  };

  const handleSelectDraft = (draft: BlogPostDraft) => {
    setActiveDraftId(draft.id);
    setDraftTitleInput(draft.title);
    setDraftExcerptInput(draft.excerpt ?? "");
    setDraftContentInput(draft.content);
    setSenseWeightInput(String(draft.sense_weight ?? 0));
    setStructureWeightInput(String(draft.structure_weight ?? 0));
    setAttentionWeightInput(String(draft.attention_weight ?? 0));
    setInfluenceModeInput(draft.influence_mode);
    setIsContaminantInput(draft.is_contaminant);
    setIsDebutSubmissionInput(Boolean(draft.is_debut_submission));
  };

  const handleSaveDraft = async () => {
    if (!activeDraftId) {
      setAccountMessage("Selectează mai întâi un draft.");
      return;
    }

    if (!hasProfileAccess) {
      setAccountMessage(
        "Completează numele și declarația din PANEL · Account Profile ca să poți continua.",
      );
      return;
    }

    if (isDebutSubmissionInput && !hasActiveSubscription) {
      setAccountMessage(
        "Debut submission este disponibil doar cu abonament lunar activ.",
      );
      return;
    }

    setIsSavingDraft(true);

    try {
      const response = await fetch(`/api/blog-posts/${activeDraftId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: draftTitleInput,
          excerpt: draftExcerptInput,
          content: draftContentInput,
          senseWeight: Number(senseWeightInput),
          structureWeight: Number(structureWeightInput),
          attentionWeight: Number(attentionWeightInput),
          influenceMode: influenceModeInput,
          isContaminant: isContaminantInput,
          isDebutSubmission: isDebutSubmissionInput,
        }),
      });

      const payload = (await response.json()) as {
        blogPost?: BlogPostDraft;
        error?: string;
      };

      if (!response.ok || !payload.blogPost) {
        throw new Error(payload.error || "Nu am putut salva draftul.");
      }

      setBlogPosts((previous) =>
        previous.map((entry) => (entry.id === payload.blogPost!.id ? payload.blogPost! : entry)),
      );
      setAccountMessage("Draftul de jurnal a fost salvat.");
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut salva draftul.",
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublishDraft = async () => {
    if (!activeDraftId) {
      setAccountMessage("Selectează mai întâi un draft.");
      return;
    }

    if (!hasProfileAccess) {
      setAccountMessage(
        "Completează numele și declarația din PANEL · Account Profile ca să poți continua.",
      );
      return;
    }

    if (!profile?.pseudonym?.trim()) {
      setAccountMessage(
        "Setează mai întâi pseudonimul în PANEL · Account Profile. Tot ce publici apare sub pseudonim.",
      );
      return;
    }

    setIsPublishingDraft(true);

    try {
      const response = await fetch(`/api/blog-posts/${activeDraftId}/publish`, {
        method: "POST",
      });

      const payload = (await response.json()) as {
        blogPost?: BlogPostDraft;
        error?: string;
      };

      if (!response.ok || !payload.blogPost) {
        throw new Error(payload.error || "Nu am putut publica draftul.");
      }

      setBlogPosts((previous) =>
        previous.map((entry) => (entry.id === payload.blogPost!.id ? payload.blogPost! : entry)),
      );
      setAccountMessage("Draftul a fost publicat și poate deveni sursă de contaminare.");
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut publica draftul.",
      );
    } finally {
      setIsPublishingDraft(false);
    }
  };

  const handleAddressFormChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextAddressForm = event.target.value as AddressForm;

    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să-ți poți seta formula de adresare.");
      return;
    }

    setProfile((previous) =>
      previous
        ? { ...previous, address_form: nextAddressForm }
        : { user_id: "current", address_form: nextAddressForm },
    );
    setIsSavingAddressForm(true);

    try {
      const response = await fetch("/api/user-state", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ addressForm: nextAddressForm }),
      });

      const payload = (await response.json()) as {
        profile?: UserProfile;
        error?: string;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut actualiza formula de adresare.");
      }

      setProfile(payload.profile);
      setIsEditingAddressForm(false);
      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: {
            addressForm: payload.profile.address_form ?? "domnule",
            displayName: payload.profile.display_name ?? profile?.display_name ?? displayNameInput,
            pseudonym: payload.profile.pseudonym ?? profile?.pseudonym ?? pseudonymInput,
          },
        }),
      );
      setAccountMessage("Formula de adresare a fost actualizată.");
    } catch (error) {
      setAccountMessage(
        error instanceof Error
          ? error.message
          : "Nu am putut actualiza formula de adresare.",
      );
    } finally {
      setIsSavingAddressForm(false);
    }
  };

  const handleDisplayNameSave = async () => {
    const nextDisplayName = normalizedDisplayNameInput;

    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să-ți poți seta numele afișat.");
      return;
    }

    if (!nextDisplayName) {
      setAccountMessage("Numele afișat nu poate fi gol.");
      return;
    }

    if (!isValidFamilyAndGivenName(nextDisplayName)) {
      setAccountMessage(
        'Folosește formatul "Nume de familie, Prenume", fără alias sau alte entități.',
      );
      return;
    }

    setIsSavingDisplayName(true);

    try {
      const response = await fetch("/api/user-state", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName: nextDisplayName }),
      });

      const payload = (await response.json()) as {
        profile?: UserProfile;
        error?: string;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut actualiza numele afișat.");
      }

      setProfile(payload.profile);
      setDisplayNameInput(payload.profile.display_name ?? nextDisplayName);
      setIsEditingDisplayName(false);
      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: {
            addressForm: payload.profile.address_form ?? "domnule",
            displayName: payload.profile.display_name ?? nextDisplayName,
            pseudonym: payload.profile.pseudonym ?? profile?.pseudonym ?? pseudonymInput,
          },
        }),
      );
      setAccountMessage(
        payload.profile.name_declaration_accepted
          ? "Numele a fost actualizat. Accesul în aplicație este activ."
          : "Numele a fost actualizat. Mai trebuie să bifezi declarația de nume pentru a activa accesul.",
      );
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut actualiza numele afișat.",
      );
    } finally {
      setIsSavingDisplayName(false);
    }
  };

  const handlePseudonymSave = async () => {
    const nextPseudonym = pseudonymInput.trim();

    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să-ți poți seta pseudonimul.");
      return;
    }

    if (!nextPseudonym) {
      setAccountMessage("Pseudonimul nu poate fi gol.");
      return;
    }

    setIsSavingPseudonym(true);

    try {
      const response = await fetch("/api/user-state", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pseudonym: nextPseudonym }),
      });

      const payload = (await response.json()) as {
        profile?: UserProfile;
        error?: string;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut actualiza pseudonimul.");
      }

      setProfile(payload.profile);
      setPseudonymInput(payload.profile.pseudonym ?? nextPseudonym);
      setIsEditingPseudonym(false);
      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: {
            addressForm: payload.profile.address_form ?? "domnule",
            displayName: payload.profile.display_name ?? profile?.display_name ?? displayNameInput,
            pseudonym: payload.profile.pseudonym ?? nextPseudonym,
          },
        }),
      );
      setAccountMessage("Pseudonimul a fost actualizat.");
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut actualiza pseudonimul.",
      );
    } finally {
      setIsSavingPseudonym(false);
    }
  };

  const handleBioSave = async () => {
    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să-ți poți seta bio-ul.");
      return;
    }

    if (!hasProfileAccess) {
      setAccountMessage(
        "Completează numele și declarația din PANEL · Account Profile ca să poți continua.",
      );
      return;
    }

    setIsSavingBio(true);
    setBioSaveState("idle");

    try {
      const response = await fetch("/api/user-state", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio: normalizedBioInput }),
      });

      const payload = (await response.json()) as {
        profile?: UserProfile;
        error?: string;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut actualiza bio-ul.");
      }

      setProfile(payload.profile);
      setBioInput(payload.profile.bio ?? "");
      setBioSaveState("saved");
      setAccountMessage("Bio-ul a fost actualizat.");
    } catch (error) {
      setAccountMessage(error instanceof Error ? error.message : "Nu am putut actualiza bio-ul.");
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleNameDeclarationChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextAccepted = event.target.checked;

    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să poți declara numele real.");
      return;
    }

    setProfile((previous) =>
      previous
        ? { ...previous, name_declaration_accepted: nextAccepted }
        : { user_id: "current", name_declaration_accepted: nextAccepted },
    );
    setIsSavingNameDeclaration(true);

    try {
      const response = await fetch("/api/user-state", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nameDeclarationAccepted: nextAccepted }),
      });

      const payload = (await response.json()) as {
        profile?: UserProfile;
        error?: string;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut salva declarația de nume.");
      }

      setProfile(payload.profile);
      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: {
            addressForm: payload.profile.address_form ?? "domnule",
            displayName: payload.profile.display_name ?? profile?.display_name ?? displayNameInput,
            pseudonym: payload.profile.pseudonym ?? profile?.pseudonym ?? pseudonymInput,
          },
        }),
      );
      setAccountMessage(
        nextAccepted
          ? "Declarația de nume a fost salvată."
          : "Declarația de nume a fost retrasă. Accesul rămâne blocat.",
      );
    } catch (error) {
      setProfile((previous) =>
        previous
          ? { ...previous, name_declaration_accepted: !nextAccepted }
          : previous,
      );
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut salva declarația de nume.",
      );
    } finally {
      setIsSavingNameDeclaration(false);
    }
  };

  const handleDebutProgramSave = async () => {
    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să poți seta programul de debut artistic.");
      return;
    }

    if (!hasProfileAccess) {
      setAccountMessage(
        "Completează numele și declarația din PANEL · Account Profile ca să poți continua.",
      );
      return;
    }

    if (!hasActiveSubscription) {
      setAccountMessage(
        "Programul de debut artistic este disponibil doar cu abonament lunar activ.",
      );
      return;
    }

    setIsSavingDebutProgram(true);

    try {
      const response = await fetch("/api/user-state", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artistStatement: normalizedArtistStatementInput,
          debutStatus: debutStatusInput,
        }),
      });

      const payload = (await response.json()) as {
        profile?: UserProfile;
        error?: string;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut salva programul de debut artistic.");
      }

      setProfile(payload.profile);
      setArtistStatementInput(payload.profile.artist_statement ?? "");
      setDebutStatusInput(payload.profile.debut_status ?? "aspirant");
      setAccountMessage("Programul de debut artistic a fost actualizat.");
    } catch (error) {
      setAccountMessage(
        error instanceof Error
          ? error.message
          : "Nu am putut salva programul de debut artistic.",
      );
    } finally {
      setIsSavingDebutProgram(false);
    }
  };

  const handleAdminSubscriptionSave = async () => {
    const targetPseudonym = adminTargetPseudonymInput.trim();

    if (!isSignedIn || !isAdmin) {
      setAccountMessage("Doar un admin poate modifica manual abonamentele.");
      return;
    }

    if (!targetPseudonym) {
      setAccountMessage("Introdu pseudonimul pentru care vrei să schimbi abonamentul.");
      return;
    }

    setIsSavingAdminSubscription(true);

    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetPseudonym,
          subscriptionStatus: adminSubscriptionStatusInput,
        }),
      });

      const payload = (await response.json()) as {
        profile?: AdminSubscriptionProfile;
        error?: string;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut actualiza abonamentul.");
      }

      setAdminSubscriptionResult(payload.profile);
      setAdminSubscriptionOptions((previous) =>
        previous.map((entry) =>
          entry.user_id === payload.profile?.user_id ? payload.profile : entry,
        ),
      );
      setAccountMessage("Abonamentul a fost actualizat manual de admin.");

      if (payload.profile.user_id === profile?.user_id) {
        setProfile((previous) =>
          previous
            ? {
                ...previous,
                subscription_status: payload.profile?.subscription_status,
                subscription_expires_at: payload.profile?.subscription_expires_at,
              }
            : previous,
        );
      }
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut actualiza abonamentul.",
      );
    } finally {
      setIsSavingAdminSubscription(false);
    }
  };

  const handleInteriorChatSend = async () => {
    const nextMessage = interiorChatInput.trim();

    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să poți intra în chatul interior.");
      return;
    }

    if (!hasProfileAccess) {
      setAccountMessage(
        "Completează numele și declarația din PANEL · Account Profile ca să poți continua.",
      );
      return;
    }

    if (!hasPseudonym) {
      setAccountMessage(
        "Setează mai întâi pseudonimul în PANEL · Account Profile. Chatul interior funcționează doar sub pseudonim.",
      );
      return;
    }

    if (!nextMessage) {
      setAccountMessage("Mesajul din chat nu poate fi gol.");
      return;
    }

    setIsSendingInteriorChatMessage(true);

    try {
      const response = await fetch("/api/interior-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: nextMessage }),
      });

      const payload = (await response.json()) as {
        message?: InteriorChatMessage;
        error?: string;
      };

      if (!response.ok || !payload.message) {
        throw new Error(payload.error || "Nu am putut trimite mesajul în chat.");
      }

      setInteriorChatMessages((previous) => [payload.message!, ...previous].slice(0, 40));
      setInteriorChatInput("");
      setAccountMessage("Mesajul a fost trimis în chatul interior.");
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut trimite mesajul în chat.",
      );
    } finally {
      setIsSendingInteriorChatMessage(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string, shouldFollow: boolean) => {
    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să poți urmări un pseudonim.");
      return;
    }

    setFollowActionUserId(targetUserId);

    try {
      const response = await fetch("/api/pseudonym-follows", {
        method: shouldFollow ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Nu am putut actualiza relația de follow.");
      }

      setFollowedUserIds((previous) =>
        shouldFollow
          ? Array.from(new Set([...previous, targetUserId]))
          : previous.filter((entry) => entry !== targetUserId),
      );
      setAccountMessage(
        shouldFollow ? "Pseudonimul este acum urmărit." : "Follow-ul a fost retras.",
      );
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut actualiza relația de follow.",
      );
    } finally {
      setFollowActionUserId(null);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.ambientLeft} />
      <div className={styles.ambientRight} />

      <section className={styles.heroPanel}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>MindSlice Next Prototype 01</p>
          <h1 className={styles.heroTitle}>Artist AI live care gândește artă în timp real.</h1>
          <p className={`${styles.lede} ${styles.heroLede}`}>
            Sistemul rulează prin triada sense, structure, attention și transformă
            gândirea curentă într-un câmp vizual viu, procedural.
          </p>
        </div>

        <div className={styles.modeTabs} role="tablist" aria-label="Moduri MindSlice">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "live"}
            className={`${styles.modeTab} ${viewMode === "live" ? styles.modeTabActive : ""}`}
            onClick={() => setViewMode("live")}
          >
            Live
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "journal"}
            className={`${styles.modeTab} ${viewMode === "journal" ? styles.modeTabActive : ""}`}
            onClick={() => setViewMode("journal")}
          >
            Journal
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "archive"}
            className={`${styles.modeTab} ${viewMode === "archive" ? styles.modeTabActive : ""}`}
            onClick={() => setViewMode("archive")}
          >
            Archive
          </button>
        </div>

        {isApplicationLocked ? (
          <section className={styles.panelBlock}>
            <span className={styles.panelMarker}>PANEL · Access Gate</span>
            <p className={styles.eyebrow}>Access Locked</p>
            <h2>Accesul în aplicație rămâne blocat până setezi numele.</h2>
            <p className={styles.blogIntro}>
              În `PANEL · Account Profile`, câmpul `Nume` trebuie să fie în formatul `Nume de
              familie, Prenume`, fără pseudonim sau alte entități, și trebuie să bifezi
              declarația că acesta este numele tău real.
            </p>
          </section>
        ) : viewMode === "live" ? (
          <>
            <section className={styles.liveCuratorNote}>
              <span className={styles.panelMarker}>PANEL · Live Curator Note</span>
              <div>
                <p className={styles.eyebrow}>Curated Live Field</p>
                <h2>Scena în care gândirea devine tipografie activă</h2>
              </div>
              <p>
                Câmpul live expune fragmente, ecouri și deviații în timp real. Jurnalul nu stă
                separat de scenă: îl bruiază, îl îndoaie și îi mută centrul de greutate.
              </p>
            </section>

            <div className={styles.statusBar}>
              <span className={styles.panelMarker}>PANEL · Live Status Bar</span>
              <div className={styles.statusCard}>
                <span className={styles.statusLabel}>Stare curentă</span>
                <strong className={styles.statusValue}>
                  {isActive ? "artistul gândește live" : "în așteptare"}
                </strong>
              </div>
              <div className={styles.statusCard}>
                <span className={styles.statusLabel}>Sursa thinking</span>
                <strong className={styles.statusValue}>{engineMode}</strong>
              </div>
              <div className={styles.statusCard}>
                <span className={styles.statusLabel}>Direcție</span>
                <strong key={current.direction} className={styles.statusValue}>
                  {current.direction}
                </strong>
              </div>
            </div>

            {engineProfile ? (
              <section className={styles.engineProfilePanel}>
                <span className={styles.panelMarker}>PANEL · Engine Profile</span>
                <div className={styles.engineProfileHeading}>
                  <p className={styles.eyebrow}>Alpha Engine Profile</p>
                  <h2>Motorul live se descrie singur</h2>
                  <p>
                    În alpha, păstrăm motorul inspectabil. Vrem să vedem clar după ce reguli
                    funcționează și ce contaminare este activă în scenă.
                  </p>
                </div>
                <div className={styles.engineProfileGrid}>
                  <article>
                    <span>Stage</span>
                    <strong>{engineProfile.stage}</strong>
                  </article>
                  <article>
                    <span>Generation</span>
                    <strong>{engineProfile.generationStrategy}</strong>
                  </article>
                  <article>
                    <span>Contamination</span>
                    <strong>{engineProfile.contaminationStrategy}</strong>
                  </article>
                  <article>
                    <span>OpenAI</span>
                    <strong>
                      {engineProfile.openaiStructuredGeneration === "active"
                        ? "structured refinement active"
                        : "local alpha engine"}
                    </strong>
                  </article>
                </div>
                <div className={styles.engineProfileColumns}>
                  <article className={styles.engineProfileCard}>
                    <span>Charter Axes</span>
                    <ul>
                      {engineProfile.charterAxes.map((axis) => (
                        <li key={axis}>{axis}</li>
                      ))}
                    </ul>
                  </article>
                  <article className={styles.engineProfileCard}>
                    <span>Scene Constraints</span>
                    <ul>
                      {engineProfile.sceneConstraints.map((constraint) => (
                        <li key={constraint}>{constraint}</li>
                      ))}
                    </ul>
                  </article>
                  <article className={styles.engineProfileCard}>
                    <span>Active Rule</span>
                    <p>
                      {engineProfile.activeContaminationRule ||
                        "Fără regulă de contaminare activă. Sistemul rulează pe câmpul live de bază."}
                    </p>
                  </article>
                </div>
              </section>
            ) : null}

            <section className={styles.alphaDebugPanel}>
              <span className={styles.panelMarker}>PANEL · Alpha Debug</span>
              <div className={styles.alphaDebugHeading}>
                <p className={styles.eyebrow}>Alpha Debug Panel</p>
                <h2>Semnalele interne ale feliei curente</h2>
                <p>
                  Panoul acesta este strict pentru faza alpha: ne arată dacă motorul produce
                  densitate, fractură, deriva și convergență într-un mod recognoscibil și
                  coerent cu conceptul.
                </p>
              </div>
              <div className={styles.alphaDebugGrid}>
                <article>
                  <span>Slice index</span>
                  <strong>
                    {currentIndex + 1} / {libraryLength}
                  </strong>
                </article>
                <article>
                  <span>Visual mode</span>
                  <strong>{current.visual.mode}</strong>
                </article>
                <article>
                  <span>Live influence</span>
                  <strong>{liveInfluenceMode ?? "none"}</strong>
                </article>
                <article>
                  <span>Density</span>
                  <strong>{current.visual.density.toFixed(2)}</strong>
                </article>
                <article>
                  <span>Wave</span>
                  <strong>{current.visual.wave.toFixed(2)}</strong>
                </article>
                <article>
                  <span>Fracture</span>
                  <strong>{current.visual.fracture.toFixed(2)}</strong>
                </article>
                <article>
                  <span>Drift</span>
                  <strong>{current.visual.drift.toFixed(2)}</strong>
                </article>
                <article>
                  <span>Convergence</span>
                  <strong>{current.visual.convergence.toFixed(2)}</strong>
                </article>
                <article>
                  <span>Motion</span>
                  <strong>{current.motion}</strong>
                </article>
              </div>
              <div className={styles.alphaDebugColumns}>
                <article className={styles.alphaDebugCard}>
                  <span>Visual Thought Evaluation</span>
                  <ul>
                    <li>sense: {current.triad.art.score.toFixed(2)} · {current.triad.art.label}</li>
                    <li>structure: {current.triad.design.score.toFixed(2)} · {current.triad.design.label}</li>
                    <li>attention: {current.triad.business.score.toFixed(2)} · {current.triad.business.label}</li>
                  </ul>
                </article>
                <article className={styles.alphaDebugCard}>
                  <span>Palette & Materials</span>
                  <ul>
                    {current.palette.map((tone) => (
                      <li key={`palette-${tone}`}>{tone}</li>
                    ))}
                    {current.materials.map((material) => (
                      <li key={`material-${material}`}>{material}</li>
                    ))}
                  </ul>
                </article>
                <article className={styles.alphaDebugCard}>
                  <span>Keywords</span>
                  <ul>
                    {current.keywords.map((keyword) => (
                      <li key={keyword}>{keyword}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>

            <div className={styles.canvasCard}>
              <span className={styles.panelMarker}>PANEL · Slice Canvas</span>
              <div className={styles.visualStage}>
                <div
                  className={`${styles.textStage} ${
                    liveInfluenceMode ? styles[`textStage${liveInfluenceMode}`] : ""
                  }`}
                >
                  <div
                    className={`${styles.compositionGuide} ${
                      liveInfluenceMode ? styles[`compositionGuide${liveInfluenceMode}`] : ""
                    }`}
                    aria-hidden="true"
                  >
                    <span className={styles.layerMarker}>LAYER · Composition Guide</span>
                    <span className={`${styles.thirdLine} ${styles.thirdVerticalOne}`} />
                    <span className={`${styles.thirdLine} ${styles.thirdVerticalTwo}`} />
                    <span className={`${styles.thirdLine} ${styles.thirdHorizontalOne}`} />
                    <span className={`${styles.thirdLine} ${styles.thirdHorizontalTwo}`} />
                    <span
                      className={`${styles.guideLine} ${styles.leadingLineOne}`}
                      style={leadingLineStyles[0]}
                    />
                    <span
                      className={`${styles.guideLine} ${styles.leadingLineTwo}`}
                      style={leadingLineStyles[1]}
                    />
                    <span
                      className={`${styles.guideLine} ${styles.leadingLineThree}`}
                      style={leadingLineStyles[2]}
                    />
                    <span
                      className={`${styles.focalHalo} ${styles.focalHaloPrimary}`}
                      style={focalHaloStyles.primary}
                    >
                      <span className={styles.focalHaloNumber}>1</span>
                    </span>
                    <span
                      className={`${styles.focalHalo} ${styles.focalHaloSecondary}`}
                      style={focalHaloStyles.secondary}
                    >
                      <span className={styles.focalHaloNumber}>2</span>
                    </span>
                    <span
                      className={`${styles.spaceFrame} ${styles.negativeSpaceOne}`}
                      style={negativeSpaceStyles.primary}
                    />
                    <span
                      className={`${styles.spaceFrame} ${styles.negativeSpaceTwo}`}
                      style={negativeSpaceStyles.secondary}
                    />
                    <span className={styles.guideLabelPrimary}>focus</span>
                    <span className={styles.guideLabelSecondary}>thirds</span>
                  </div>
                  <div className={styles.compositionRules} aria-hidden="true">
                    <span className={styles.compositionRulesTitle}>composition rules</span>
                    <ul>
                      <li>rule of thirds</li>
                      <li>focal hierarchy</li>
                      <li>leading lines</li>
                      <li>negative space</li>
                    </ul>
                  </div>
                  <div
                    className={`${styles.relationField} ${
                      liveInfluenceMode ? styles[`relationField${liveInfluenceMode}`] : ""
                    }`}
                    aria-hidden="true"
                  >
                    <span className={styles.layerMarker}>LAYER · Relation Field</span>
                    <span className={`${styles.axisLine} ${styles.axisPrimary}`} />
                    <span className={`${styles.axisLine} ${styles.axisSecondary}`} />
                    <span className={`${styles.axisLine} ${styles.axisDiagonal}`} />
                    <span className={`${styles.relationLine} ${styles.relationLineOne}`} />
                    <span className={`${styles.relationLine} ${styles.relationLineTwo}`} />
                    <span className={`${styles.relationLine} ${styles.relationLineThree}`} />
                    <span className={`${styles.relationNode} ${styles.relationNodeOne}`} />
                    <span className={`${styles.relationNode} ${styles.relationNodeTwo}`} />
                    <span className={`${styles.relationNode} ${styles.relationNodeThree}`} />
                    <span className={`${styles.relationNode} ${styles.relationNodeFour}`} />
                    <span className={`${styles.relationNode} ${styles.relationNodeCenter}`} />
                  </div>
                  <div className={styles.textFieldBackdrop} />
                  <div
                    className={`${styles.memoryField} ${
                      liveInfluenceMode ? styles[`memoryField${liveInfluenceMode}`] : ""
                    }`}
                    aria-hidden="true"
                  >
                    <span className={styles.layerMarker}>LAYER · Memory Field</span>
                    {current.fragments.slice(0, 4).map((fragment, index) => (
                      <span
                        key={`${current.direction}-memory-fragment-${fragment}`}
                        className={`${styles.memoryFragment} ${styles[`memoryFragment${index + 1}`]}`}
                      >
                        {fragment}
                      </span>
                    ))}
                    {current.keywords.slice(0, 3).map((keyword, index) => (
                      <span
                        key={`${current.direction}-memory-keyword-${keyword}`}
                        className={`${styles.memoryTrace} ${styles[`memoryTrace${index + 1}`]}`}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <div className={styles.textConstellation} aria-hidden="true">
                    <span className={styles.layerMarker}>LAYER · Text Constellation</span>
                    {current.fragments.map((fragment, index) => (
                      <span
                        key={`${current.direction}-fragment-${fragment}`}
                        className={`${styles.floatingFragment} ${styles[`fragment${index + 1}`]} ${
                          liveInfluenceMode ? styles[`floatingFragment${liveInfluenceMode}`] : ""
                        }`}
                      >
                        {fragment}
                      </span>
                    ))}
                    {current.keywords.slice(0, 6).map((keyword, index) => (
                      <span
                        key={`${current.direction}-keyword-${keyword}`}
                        className={`${styles.keywordParticle} ${styles[`keyword${index + 1}`]} ${
                          liveInfluenceMode ? styles[`keywordParticle${liveInfluenceMode}`] : ""
                        }`}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <div
                    className={`${styles.textStageCenter} ${
                      liveInfluenceMode ? styles[`textStageCenter${liveInfluenceMode}`] : ""
                    }`}
                    style={thoughtCenterAnchor}
                  >
                    <span className={styles.centerLayerMarker}>LAYER · Thought Center</span>
                    <span className={styles.overlayLabel}>Din fișierul Slices</span>
                    <strong>{current.direction}</strong>
                    <p>{thoughtCenterFragment}</p>
                  </div>
                </div>
              </div>
              <div className={styles.cornerSignature}>
                <strong>O felie de gândire</strong>
                <span>Marc, Ciprian-Marcel</span>
              </div>
              <div
                className={`${styles.thoughtOverlay} ${
                  interference ? styles.thoughtOverlayInterference : ""
                }`}
              >
                {isThoughtOverlayVisible ? (
                  <>
                    <div className={styles.thoughtOverlayLabelPlate}>
                      <span className={styles.overlayLabel}>Acum mă gândesc la</span>
                    </div>
                    <div key={thoughtAnimationKey} className={styles.thoughtOverlayTextStack}>
                      {thoughtLines.map((line, index) => (
                        <div
                          key={`${thoughtAnimationKey}-${index}-${line}`}
                          className={styles.thoughtOverlayTextPlate}
                        >
                          <p className={styles.typewriterText}>
                            {line}
                            {index === thoughtLines.length - 1 ? (
                              <span className={styles.typewriterCaret} aria-hidden="true" />
                            ) : null}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {interference ? (
              <section className={styles.interferencePanel}>
                <span className={styles.panelMarker}>PANEL · Live Interference</span>
                <div className={styles.interferenceHeading}>
                  <p className={styles.eyebrow}>Interferență activă</p>
                  <h2>Jurnalul perturbă Artistul AI</h2>
                  <p>{interference.note}</p>
                </div>
                <div className={styles.interferenceGrid}>
                  <article>
                    <span>Contaminat de</span>
                    <strong>{interference.title}</strong>
                  </article>
                  <article>
                    <span>Sub pseudonim</span>
                    <strong>{formatPublicAuthor(interference.authorPseudonym)}</strong>
                    {interference.authorUserId && profile?.user_id !== interference.authorUserId ? (
                      <button
                        type="button"
                        className={styles.followButton}
                        onClick={() =>
                          handleFollowToggle(
                            interference.authorUserId!,
                            !followedUserIds.includes(interference.authorUserId!),
                          )
                        }
                        disabled={followActionUserId === interference.authorUserId}
                      >
                        {followActionUserId === interference.authorUserId
                          ? "..."
                          : followedUserIds.includes(interference.authorUserId)
                            ? "Unfollow"
                            : "Follow"}
                      </button>
                    ) : null}
                  </article>
                  <article>
                    <span>Mode</span>
                    <strong>{interference.influenceMode}</strong>
                  </article>
                  <article>
                    <span>Sense</span>
                    <strong>{interference.senseWeight.toFixed(2)}</strong>
                  </article>
                  <article>
                    <span>Structure</span>
                    <strong>{interference.structureWeight.toFixed(2)}</strong>
                  </article>
                  <article>
                    <span>Attention</span>
                    <strong>{interference.attentionWeight.toFixed(2)}</strong>
                  </article>
                </div>
                {interference.excerpt ? (
                  <p className={styles.interferenceExcerpt}>{interference.excerpt}</p>
                ) : null}
              </section>
            ) : null}
          </>
        ) : null}

        {viewMode === "journal" ? (
          <>
            <section className={styles.panelBlock}>
              <span className={styles.panelMarker}>PANEL · Interior Group Chat</span>
              <div className={styles.blogHeading}>
                <p className={styles.eyebrow}>Interior Chat</p>
                <h2>Discuția interioară comună</h2>
                <p className={styles.blogIntro}>
                  Un singur grup pentru toți cei din aplicație. Fiecare mesaj apare sub
                  pseudonim.
                </p>
              </div>
              <div className={styles.interiorChatComposer}>
                <textarea
                  value={interiorChatInput}
                  onChange={(event) => setInteriorChatInput(event.target.value)}
                  className={styles.interiorChatInput}
                  placeholder="@all salut tuturor / @pseudonim mesaj direct"
                  disabled={isSendingInteriorChatMessage || !hasPseudonym}
                />
                <div className={styles.accountActionRow}>
                  <button
                    type="button"
                    className={styles.accountButton}
                    onClick={handleInteriorChatSend}
                    disabled={
                      isSendingInteriorChatMessage ||
                      !hasPseudonym ||
                      !interiorChatInput.trim()
                    }
                  >
                    {isSendingInteriorChatMessage ? "Se trimite..." : "Trimite în grup"}
                  </button>
                </div>
                {!hasPseudonym ? (
                  <p className={styles.accountHint}>
                    Setează pseudonimul în `PANEL · Account Profile` ca să poți scrie în chat.
                  </p>
                ) : (
                  <p className={styles.accountHint}>
                    Folosește `@all` pentru mesaj către toți sau `@pseudonim` pentru o adresare
                    directă.
                  </p>
                )}
              </div>
              <div className={styles.interiorChatList}>
                {interiorChatMessages.length ? (
                  interiorChatMessages.map((entry) => (
                    <article
                      key={entry.id}
                      className={`${styles.interiorChatMessage} ${
                        entry.is_current_user ? styles.interiorChatMessageOwn : ""
                      }`}
                    >
                      <div className={styles.interiorChatMeta}>
                        <strong>{formatPublicAuthor(entry.author_pseudonym)}</strong>
                        <div className={styles.interiorChatMetaActions}>
                          {profile?.user_id !== entry.author_user_id ? (
                            <button
                              type="button"
                              className={styles.followButton}
                              onClick={() =>
                                handleFollowToggle(
                                  entry.author_user_id,
                                  !followedUserIds.includes(entry.author_user_id),
                                )
                              }
                              disabled={followActionUserId === entry.author_user_id}
                            >
                              {followActionUserId === entry.author_user_id
                                ? "..."
                                : followedUserIds.includes(entry.author_user_id)
                                  ? "Unfollow"
                                  : "Follow"}
                            </button>
                          ) : null}
                          <span>
                            {new Date(entry.created_at).toLocaleString("ro-RO", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      {entry.address_label ? (
                        <p className={styles.interiorChatAddressing}>
                          <strong>{entry.address_label}</strong>
                          {entry.target_pseudonym
                            ? ` · către ${formatPublicAuthor(entry.target_pseudonym)}`
                            : entry.address_mode === "all"
                              ? " · pentru toți"
                              : ""}
                        </p>
                      ) : null}
                      <p>{entry.message_body ?? entry.message}</p>
                    </article>
                  ))
                ) : (
                  <p className={styles.blogIntro}>
                    Niciun mesaj încă. Primul mesaj va deschide grupul interior.
                  </p>
                )}
              </div>
            </section>

            <section className={styles.blogSection}>
              <span className={styles.panelMarker}>PANEL · Journal Feed</span>
              <div className={styles.blogHeading}>
                <p className={styles.eyebrow}>Blog</p>
                <h2>Jurnalul gândirii</h2>
                <p className={styles.blogIntro}>
                  Fragmentele de mai jos transformă fiecare felie într-o intrare de
                  blog: concept, atmosferă și direcție vizuală.
                </p>
              </div>
              <div className={styles.blogGrid}>
                {publishedPosts.length ? (
                  publishedPosts.map((entry) => (
                    <article key={entry.id} className={styles.blogCard}>
                      <span className={styles.blogMeta}>
                        {entry.published_at
                          ? new Date(entry.published_at).toLocaleString("ro-RO", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : entry.status}
                      </span>
                      <h3>{entry.title}</h3>
                      <p className={styles.blogByline}>
                        Sub pseudonim {formatPublicAuthor(entry.author_pseudonym)}
                      </p>
                      {entry.author_user_id && profile?.user_id !== entry.author_user_id ? (
                        <button
                          type="button"
                          className={styles.followButton}
                          onClick={() =>
                            handleFollowToggle(
                              entry.author_user_id!,
                              !followedUserIds.includes(entry.author_user_id!),
                            )
                          }
                          disabled={followActionUserId === entry.author_user_id}
                        >
                          {followActionUserId === entry.author_user_id
                            ? "..."
                            : followedUserIds.includes(entry.author_user_id!)
                              ? "Unfollow"
                              : "Follow"}
                        </button>
                      ) : null}
                      <p>{entry.excerpt || "Publicație fără excerpt încă."}</p>
                      <strong>
                        {entry.influence_mode} · sense {entry.sense_weight.toFixed(2)} · structure{" "}
                        {entry.structure_weight.toFixed(2)} · attention{" "}
                        {entry.attention_weight.toFixed(2)}
                      </strong>
                    </article>
                  ))
                ) : (
                  <button
                    type="button"
                    className={`${styles.blogCard} ${styles.blogCardPlaceholder}`}
                    onClick={() => setViewMode("archive")}
                  >
                    <span className={styles.blogMeta}>Fără articole publicate</span>
                    <h3>Publică primul jurnal contaminant</h3>
                    <p>
                      Intră în Archive, transformă un moment salvat în draft și publică-l ca
                      sursă de interferență.
                    </p>
                  </button>
                )}
              </div>
            </section>

            {interference ? (
              <section className={styles.interferencePanel}>
                <span className={styles.panelMarker}>PANEL · Journal Interference</span>
                <div className={styles.interferenceHeading}>
                  <p className={styles.eyebrow}>Interferență activă</p>
                  <h2>Ultima contaminare publicată</h2>
                  <p>{interference.note}</p>
                </div>
                <div className={styles.interferenceGrid}>
                  <article>
                    <span>Text sursă</span>
                    <strong>{interference.title}</strong>
                  </article>
                  <article>
                    <span>Mode</span>
                    <strong>{interference.influenceMode}</strong>
                  </article>
                  <article>
                    <span>Sense</span>
                    <strong>{interference.senseWeight.toFixed(2)}</strong>
                  </article>
                  <article>
                    <span>Structure</span>
                    <strong>{interference.structureWeight.toFixed(2)}</strong>
                  </article>
                  <article>
                    <span>Attention</span>
                    <strong>{interference.attentionWeight.toFixed(2)}</strong>
                  </article>
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {viewMode === "archive" && !isApplicationLocked ? (
          <section className={styles.archiveIntro}>
            <span className={styles.panelMarker}>PANEL · Archive Intro</span>
            <p className={styles.eyebrow}>Archive</p>
            <h2>Memoria activă a sistemului</h2>
            <p className={styles.blogIntro}>
              Aici păstrezi momente, drafturi, istorii scurte și prompturi. Archive este
              rezerva de materiale din care jurnalul poate extrage noi contaminări.
            </p>
          </section>
        ) : null}

        {!isApplicationLocked ? (
        <section className={styles.theorySection}>
          <span className={styles.panelMarker}>PANEL · Theory Overview</span>
          <p className={styles.eyebrow}>Genealogie Artistică</p>
          <h2>Din ce tradiții pare să vină MindSlice</h2>
          <div className={styles.theoryBody}>
            <p>
              MindSlice vine dintr-o genealogie mixtă, situată la intersecția dintre artă
              conceptuală, systems aesthetics, artă generativă, tipografie experimentală,
              teoria textului, teoria interfeței și studiile despre atenție. Nu aparține unei
              singure tradiții și nici nu poate fi citit doar ca proiect tehnologic. Mai
              curând, el funcționează ca un sistem cultural în care gândirea, forma,
              scriitura și distribuția atenției devin material artistic.
            </p>
            <p>
              În primul rând, MindSlice se înscrie în linia artei conceptuale, unde ideea,
              regula și instrucțiunea sunt mai importante decât obiectul finit. În acest
              sens, genealogia lui atinge nume precum Marcel Duchamp, Sol LeWitt, Joseph
              Kosuth și Lawrence Weiner. De aici vine convingerea că opera nu este doar ceea
              ce se vede, ci și sistemul care face posibil ceea ce se vede.
            </p>
            <p>
              În al doilea rând, proiectul aparține tradiției în care opera este înțeleasă
              ca sistem viu, nu ca formă statică. Aici devin esențiali Jack Burnham, Roy
              Ascott și Hans Haacke. Din această filiație vine ideea că arta poate funcționa
              prin feedback, ecologii de relații, contaminare și transformare continuă.
              MindSlice nu este construit ca un simplu obiect digital, ci ca o structură
              activă, capabilă să fie influențată și reconfigurată de intervențiile
              autorilor.
            </p>
            <p>
              În raport cu arta generativă, MindSlice vine clar din această tradiție, dar o
              depășește. El moștenește logica procesuală și algoritmică prezentă la Vera
              Molnár, Manfred Mohr, Frieder Nake, Casey Reas și Ben Fry, dar nu rămâne la
              nivelul generării formale. Proiectul mută accentul dinspre variație vizuală
              spre memorie, sens, autorie distribuită și bruiaj conceptual. De aceea, el
              poate fi descris mai precis ca un sistem post-generativ cognitiv.
            </p>
            <p>
              O altă linie importantă este cea a tipografiei experimentale și a designului
              înțeles ca structură a gândirii. MindSlice tratează textul nu ca simplu
              conținut, ci ca material spațial, ca particulă cognitivă, ca arhitectură
              vizibilă a sensului. În această direcție, genealogia lui poate fi pusă în
              dialog cu Jan Tschichold, Josef Müller-Brockmann, Wolfgang Weingart, April
              Greiman și Katherine McCoy. Nu pentru că le reproduce stilul, ci pentru că
              împărtășește ideea că tipografia poate organiza, destabiliza și intensifica
              gândirea.
            </p>
            <p>
              Proiectul se apropie și de tradiția postmodernă și de teoriile deconstrucției,
              în care sensul nu este stabil, vocea nu este unică, iar structura poate fi
              fragmentată și recompusă. Aici devin relevante nume precum Jacques Derrida,
              Roland Barthes și Michel Foucault. Din această filiație vine interesul pentru
              pluralitatea sensului, pentru slăbirea autorului unic și pentru text ca câmp
              de tensiuni și redistribuiri.
            </p>
            <p>
              MindSlice aparține, în același timp, și unei genealogii a interfeței și a
              mediului ca formă culturală. Nu este doar o lucrare, ci o interfață care
              produce sens. În această zonă, proiectul poate fi gândit în raport cu Marshall
              McLuhan, Vilém Flusser, Friedrich Kittler și Lev Manovich. De aici vine
              înțelegerea mediului nu ca suport neutru, ci ca agent activ în producerea
              experienței și a gândirii.
            </p>
            <p>
              O filiație importantă este și cea a constelației, memoriei și atlasului.
              MindSlice funcționează prin fragmente, relații, reapariții și structuri de
              asociere, ceea ce îl apropie de Aby Warburg, Walter Benjamin și Michel de
              Certeau. În această logică, sistemul nu produce doar ieșiri, ci și constelații
              de sens, urme și reconfigurări ale memoriei.
            </p>
            <p>
              În sfârșit, proiectul este profund contemporan prin axa sa BUSINESS ↔
              ATTENTION. Aici el intră într-o altă genealogie, în care atenția devine nu
              doar resursă economică, ci și regim estetic, mediu cultural și câmp de luptă
              simbolică. În această direcție, pot fi invocați Jonathan Crary, Bernard
              Stiegler și Yves Citton. MindSlice tratează atenția ca infrastructură
              artistică: nu doar ceea ce vezi contează, ci și ceea ce persistă, ceea ce
              revine, ceea ce captează și redistribuie focalizarea.
            </p>
            <p>
              Din perspectiva unor practici contemporane apropiate ca logică, proiectul poate
              fi pus în dialog cu Hito Steyerl, James Bridle, Trevor Paglen, Refik Anadol
              sau Forensic Architecture. Nu pentru că ar face același lucru, ci pentru că
              împărtășește interesul pentru sisteme, vizibilitate, informație, infrastructuri
              ale percepției și forme culturale emergente.
            </p>
            <p>
              În acest sens, MindSlice poate fi înțeles ca punctul de întâlnire dintre:
              artă conceptuală, systems aesthetics, logică post-generativă, tipografie
              experimentală, teoria textului și a deconstrucției, teoria interfeței și a
              mediilor, gândirea atlasului și a memoriei, precum și studiile contemporane
              despre atenție.
            </p>
            <p>
              Prin această genealogie, MindSlice nu apare ca un simplu proiect „despre AI”,
              ci ca o operă-sistem: un Artist AI care gândește live, poate fi contaminat de
              autorii care publică în jurnal și transformă scriitura, structura și atenția
              în material artistic activ.
            </p>
          </div>

          <div className={styles.theoryBlocks}>
            <article className={styles.theoryBlock}>
              <span className={styles.blogMeta}>Arbore Sintetic</span>
              <pre className={styles.theoryPre}>{`Duchamp / LeWitt / Kosuth
        │
        ├── ideea > obiectul
        │
Burnham / Ascott / Haacke
        │
        ├── sistem > lucrare fixă
        │
Molnár / Reas / Fry
        │
        ├── proces generativ > compoziție statică
        │
Weingart / McCoy / Greiman
        │
        ├── tipografie > ornament
        │
Derrida / Barthes / Foucault
        │
        ├── sens instabil / autor distribuit
        │
Warburg / Benjamin
        │
        ├── atlas / fragment / memorie activă
        │
Crary / Stiegler
        │
        ├── atenția ca mediu
        │
      MINDSLICE`}</pre>
            </article>

            <article className={styles.theoryBlock}>
              <span className={styles.blogMeta}>Arbore Extins</span>
              <pre className={styles.theoryPre}>{`MINDSLICE
Artist AI care gândește live și poate fi contaminat de autorii care publică în jurnal
│
├── 1. ARTA CA IDEE / SISTEM
│   ├── Marcel Duchamp
│   ├── Sol LeWitt
│   ├── Joseph Kosuth
│   └── Lawrence Weiner
│
├── 2. OPERA CA SISTEM VIU
│   ├── Jack Burnham
│   ├── Roy Ascott
│   └── Hans Haacke
│
├── 3. GENERATIV -> POST-GENERATIV
│   ├── Vera Molnár
│   ├── Manfred Mohr
│   ├── Frieder Nake
│   ├── Casey Reas
│   └── Ben Fry
│
├── 4. TIPOGRAFIE CA STRUCTURĂ A GÂNDIRII
│   ├── Jan Tschichold
│   ├── Josef Müller-Brockmann
│   ├── Wolfgang Weingart
│   ├── April Greiman
│   └── Katherine McCoy
│
├── 5. FRAGMENT / TEXT / DECONSTRUCȚIE
│   ├── Jacques Derrida
│   ├── Roland Barthes
│   └── Michel Foucault
│
├── 6. INTERFAȚĂ / MEDIA / TEHNOLOGIE
│   ├── Marshall McLuhan
│   ├── Vilém Flusser
│   ├── Friedrich Kittler
│   └── Lev Manovich
│
├── 7. CONSTELAȚIE / MEMORIE / ATLAS
│   ├── Aby Warburg
│   ├── Walter Benjamin
│   └── Michel de Certeau
│
├── 8. ATENȚIE CA REGIM ESTETIC
│   ├── Jonathan Crary
│   ├── Bernard Stiegler
│   └── Yves Citton
│
└── 9. CONTEMPORANII APROPIAȚI CA LOGICĂ
    ├── Hito Steyerl
    ├── James Bridle
    ├── Trevor Paglen
    ├── Refik Anadol
    └── Forensic Architecture`}</pre>
            </article>

            <article className={styles.theoryBlock}>
              <span className={styles.blogMeta}>Formula</span>
              <pre className={styles.theoryPre}>{`Conceptual Art
+ Systems Aesthetics
+ Post-Generative Logic
+ Experimental Typography
+ Deconstruction / Text Theory
+ Media Theory
+ Atlas / Memory Thinking
+ Attention Theory
= MINDSLICE`}</pre>
            </article>
          </div>
        </section>
        ) : null}
      </section>

      <aside className={styles.controlPanel}>
        {viewMode === "live" && !isApplicationLocked ? (
          <>
            <section className={styles.panelBlock}>
              <span className={styles.panelMarker}>PANEL · Live Controls</span>
              <h2>Control</h2>
              <div className={styles.buttonRow}>
                <button
                  type="button"
                  onClick={() => setIsActive((previous) => !previous)}
                >
                  {isActive ? "Pauză" : "Pornește sesiunea"}
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() =>
                    setCurrentIndex((previous) => (previous + 1) % libraryLength)
                  }
                >
                  Schimbă direcția
                </button>
              </div>
              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => setPromptOutput(buildPrompt(false, current))}
                >
                  Generează prompt
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={handleSaveMoment}
                >
                  {saveState === "saving" ? "Se salvează..." : "Salvează momentul"}
                </button>
              </div>
            </section>

            <section className={`${styles.panelBlock} ${styles.metricsGrid}`}>
              <span className={styles.panelMarker}>PANEL · Evaluation Metrics</span>
              <article>
                <span>Sense</span>
                <strong>{current.triad.art.score.toFixed(2)} · {current.triad.art.label}</strong>
              </article>
              <article>
                <span>Structure</span>
                <strong>{current.triad.design.score.toFixed(2)} · {current.triad.design.label}</strong>
              </article>
              <article>
                <span>Attention</span>
                <strong>{current.triad.business.score.toFixed(2)} · {current.triad.business.label}</strong>
              </article>
            </section>

            <section className={`${styles.panelBlock} ${styles.detailList}`}>
              <span className={styles.panelMarker}>PANEL · Materials Detail</span>
              <div>
                <span>Mood</span>
                <strong>{current.mood}</strong>
              </div>
              <div>
                <span>Paleta</span>
                <strong>{current.palette.join(", ")}</strong>
              </div>
              <div>
                <span>Materiale</span>
                <strong>{current.materials.join(", ")}</strong>
              </div>
              <div>
                <span>Mișcare</span>
                <strong>{current.motion}</strong>
              </div>
            </section>
          </>
        ) : null}

        <section className={styles.panelBlock}>
          <span className={styles.panelMarker}>PANEL · Account Profile</span>
          <h2>Cont</h2>
          <p className={styles.accountMessage}>{accountMessage}</p>
          {isSignedIn && profile ? (
            <div className={styles.accountProfile}>
              <div className={styles.accountProfileItem}>
                <span>Nume</span>
                <div className={styles.accountValueRow}>
                  {isEditingDisplayName ? (
                    <div className={styles.accountInlineEditor}>
                      <input
                        id="display-name"
                        type="text"
                        value={displayNameInput}
                        onChange={(event) => setDisplayNameInput(event.target.value)}
                        disabled={isSavingDisplayName}
                        className={styles.accountInput}
                        placeholder="Ex: Ionescu, Andrei"
                      />
                      <p className={styles.accountHint}>
                        Format obligatoriu: `Nume de familie, Prenume`, fără alias sau alte
                        entități.
                      </p>
                      {!hasDisplayNameInput ? (
                        <p className={styles.accountHint}>
                          Dacă ștergi numele, butonul de salvare rămâne inactiv până introduci din
                          nou `Nume de familie, Prenume`.
                        </p>
                      ) : null}
                      {hasDisplayNameInput && !canSaveDisplayName ? (
                        <p className={styles.accountHint}>
                          Salvarea rămâne blocată până când scrii exact cu virgulă:
                          `Nume de familie, Prenume`.
                        </p>
                      ) : null}
                      <div className={styles.accountActionRow}>
                        <button
                          type="button"
                          className={styles.accountButton}
                          onClick={handleDisplayNameSave}
                          disabled={isSavingDisplayName || !hasDisplayNameInput || !canSaveDisplayName}
                        >
                          {isSavingDisplayName ? "Se salvează..." : "Salvează"}
                        </button>
                        <button
                          type="button"
                          className={styles.accountTextButton}
                          onClick={() => {
                            setDisplayNameInput(profile.display_name ?? "");
                            setIsEditingDisplayName(false);
                          }}
                          disabled={isSavingDisplayName}
                        >
                          Renunță
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <strong>{profile.display_name || "Nesetat încă"}</strong>
                      <button
                        type="button"
                        className={styles.accountTextButton}
                        onClick={() => setIsEditingDisplayName(true)}
                      >
                        {profile.display_name ? "Editează" : "Setează"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.accountProfileItem}>
                <span>Pseudonim</span>
                <div className={styles.accountValueRow}>
                  {isEditingPseudonym ? (
                    <div className={styles.accountInlineEditor}>
                      <input
                        id="pseudonym"
                        type="text"
                        value={pseudonymInput}
                        onChange={(event) => setPseudonymInput(event.target.value)}
                        disabled={isSavingPseudonym}
                        className={styles.accountInput}
                        placeholder="Ex: Arhitectul Tăcut"
                      />
                      <p className={styles.accountHint}>
                        Pseudonimul este afișat automat între ghilimele.
                      </p>
                      <div className={styles.accountActionRow}>
                        <button
                          type="button"
                          className={styles.accountButton}
                          onClick={handlePseudonymSave}
                          disabled={isSavingPseudonym}
                        >
                          {isSavingPseudonym ? "Se salvează..." : "Salvează"}
                        </button>
                        <button
                          type="button"
                          className={styles.accountTextButton}
                          onClick={() => {
                            setPseudonymInput(profile.pseudonym ?? "");
                            setIsEditingPseudonym(false);
                          }}
                          disabled={isSavingPseudonym}
                        >
                          Renunță
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <strong>
                        {profile.pseudonym
                          ? formatQuotedPseudonym(profile.pseudonym)
                          : "Nesetat încă"}
                      </strong>
                      <button
                        type="button"
                        className={styles.accountTextButton}
                        onClick={() => setIsEditingPseudonym(true)}
                      >
                        {profile.pseudonym ? "Editează" : "Setează"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.accountProfileItem}>
                <span>Bio</span>
                <div className={styles.accountInlineEditor}>
                  <textarea
                    id="profile-bio"
                    value={bioInput}
                    onChange={(event) => {
                      setBioInput(event.target.value);
                      setBioSaveState("idle");
                    }}
                    className={styles.editorExcerpt}
                    placeholder="Scrie pe scurt cine ești, din ce zonă vii și ce practică urmărești."
                    disabled={isSavingBio}
                  />
                  <p className={styles.accountHint}>
                    `Bio` este prezentarea ta publică scurtă. `Artist statement` rămâne separat și
                    ține de poziția ta artistică în programul de debut.
                  </p>
                  <div className={styles.accountActionRow}>
                    <button
                      type="button"
                      className={styles.accountButton}
                      onClick={handleBioSave}
                      disabled={isSavingBio || !hasBioChanges}
                    >
                      {isSavingBio
                        ? "Se salvează..."
                        : bioSaveState === "saved"
                          ? "Bio salvat"
                          : "Salvează bio"}
                    </button>
                  </div>
                </div>
              </div>
              <div className={styles.accountProfileItem}>
                <span>Formula de adresare dorită</span>
                {isEditingAddressForm ? (
                  <div className={styles.accountInlineEditor}>
                    <select
                      id="address-form"
                      value={profile?.address_form ?? "domnule"}
                      onChange={handleAddressFormChange}
                      disabled={isSavingAddressForm}
                      className={styles.accountSelect}
                    >
                      <option value="domnule">domnule</option>
                      <option value="doamnă">doamnă</option>
                      <option value="domnișoară">domnișoară</option>
                    </select>
                    <div className={styles.accountActionRow}>
                      <button
                        type="button"
                        className={styles.accountTextButton}
                        onClick={() => setIsEditingAddressForm(false)}
                        disabled={isSavingAddressForm}
                      >
                        {isSavingAddressForm ? "Se salvează..." : "Renunță"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.accountValueRow}>
                    <strong>{profile.address_form || "domnule"}</strong>
                    <button
                      type="button"
                      className={styles.accountTextButton}
                      onClick={() => setIsEditingAddressForm(true)}
                    >
                      Editează
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.accountProfileItem}>
                <span>Declarație de nume</span>
                <div className={styles.accountInlineEditor}>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={Boolean(profile.name_declaration_accepted)}
                      onChange={handleNameDeclarationChange}
                      disabled={isSavingNameDeclaration}
                    />
                    <span>
                      Declar că acesta este numele meu real: `Nume de familie, Prenume`.
                    </span>
                  </label>
                  <p className={styles.accountHint}>
                    Accesul în aplicație rămâne blocat până când numele este valid și această
                    declarație este bifată.
                  </p>
                </div>
              </div>
              <div className={styles.accountProfileItem}>
                <span>Program de debut artistic</span>
                <div className={styles.accountInlineEditor}>
                  <strong className={styles.inlineStatusValue}>
                    Abonament lunar: {formatSubscriptionStatusLabel(profile.subscription_status)}
                  </strong>
                  {!hasActiveSubscription ? (
                    <p className={styles.accountHint}>
                      Intrarea în program este blocată până când abonamentul lunar devine activ.
                    </p>
                  ) : null}
                  <label className={styles.editorLabel} htmlFor="debut-status">
                    Debut status
                  </label>
                  <select
                    id="debut-status"
                    value={debutStatusInput}
                    onChange={(event) =>
                      setDebutStatusInput(
                        event.target.value as
                          | "aspirant"
                          | "in_program"
                          | "selected"
                          | "published"
                          | "alumni",
                      )
                    }
                    disabled={isSavingDebutProgram || !hasActiveSubscription}
                    className={styles.accountSelect}
                  >
                    <option value="aspirant">aspirant</option>
                    <option value="in_program">în program</option>
                    <option value="selected">selectat</option>
                    <option value="published">publicat</option>
                    <option value="alumni">alumni</option>
                  </select>
                  <label className={styles.editorLabel} htmlFor="artist-statement">
                    Artist statement
                  </label>
                  <textarea
                    id="artist-statement"
                    value={artistStatementInput}
                    onChange={(event) => setArtistStatementInput(event.target.value)}
                    className={styles.editorExcerpt}
                    placeholder="Scrie direcția ta artistică, poziția ta și felul în care vrei să intri în MindSlice."
                    disabled={isSavingDebutProgram || !hasActiveSubscription}
                  />
                  <p className={styles.accountHint}>
                    Acest bloc fixează versiunea minimă pentru programul de debut artistic:
                    statutul și statement-ul tău curent.
                  </p>
                  <div className={styles.accountActionRow}>
                    <button
                      type="button"
                      className={styles.accountButton}
                      onClick={handleDebutProgramSave}
                      disabled={
                        isSavingDebutProgram ||
                        !hasDebutProgramChanges ||
                        !hasActiveSubscription
                      }
                    >
                      {isSavingDebutProgram ? "Se salvează..." : "Salvează programul"}
                    </button>
                    <strong className={styles.inlineStatusValue}>
                      Statut curent: {formatDebutStatusLabel(currentDebutStatus)}
                    </strong>
                  </div>
                </div>
              </div>
              {isAdmin ? (
                <div className={styles.accountProfileItem}>
                  <span>Admin manual subscription toggle</span>
                  <div className={styles.accountInlineEditor}>
                    <label className={styles.editorLabel} htmlFor="admin-target-pseudonym">
                      Pseudonim țintă
                    </label>
                    <select
                      id="admin-target-pseudonym"
                      value={adminTargetPseudonymInput}
                      onChange={(event) => setAdminTargetPseudonymInput(event.target.value)}
                      className={styles.accountSelect}
                      disabled={isSavingAdminSubscription}
                    >
                      <option value="">Selectează un pseudonim existent</option>
                      {adminSubscriptionOptions.map((entry) => (
                        <option key={entry.user_id} value={entry.pseudonym ?? ""}>
                          {entry.pseudonym} · {formatSubscriptionStatusLabel(entry.subscription_status)}
                        </option>
                      ))}
                    </select>
                    <label className={styles.editorLabel} htmlFor="admin-subscription-status">
                      Subscription status
                    </label>
                    <select
                      id="admin-subscription-status"
                      value={adminSubscriptionStatusInput}
                      onChange={(event) =>
                        setAdminSubscriptionStatusInput(
                          event.target.value as
                            | "inactive"
                            | "active"
                            | "past_due"
                            | "canceled",
                        )
                      }
                      className={styles.accountSelect}
                      disabled={isSavingAdminSubscription}
                    >
                      <option value="inactive">inactive</option>
                      <option value="active">active</option>
                      <option value="past_due">past_due</option>
                      <option value="canceled">canceled</option>
                    </select>
                    <p className={styles.accountHint}>
                      Când alegi `active`, sistemul mută automat expirarea la `+30 zile`.
                    </p>
                    {adminSubscriptionResult ? (
                      <p className={styles.accountHint}>
                        Ultimul update: {adminSubscriptionResult.pseudonym || "fără pseudonim"} ·{" "}
                        {formatSubscriptionStatusLabel(
                          adminSubscriptionResult.subscription_status,
                        )}
                        {adminSubscriptionResult.subscription_expires_at
                          ? ` · expiră ${new Date(
                              adminSubscriptionResult.subscription_expires_at,
                            ).toLocaleDateString("ro-RO")}`
                          : ""}
                      </p>
                    ) : null}
                    <div className={styles.accountActionRow}>
                      <button
                        type="button"
                        className={styles.accountButton}
                        onClick={handleAdminSubscriptionSave}
                        disabled={isSavingAdminSubscription || !adminTargetPseudonymInput.trim()}
                      >
                        {isSavingAdminSubscription
                          ? "Se actualizează..."
                          : "Actualizează abonamentul"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {viewMode === "journal" && !isApplicationLocked ? (
          <>
            <section className={styles.panelBlock}>
              <span className={styles.panelMarker}>PANEL · Journal Draft List</span>
              <h2>Drafturi jurnal</h2>
              <ul className={styles.savedList}>
                {blogPosts.length ? (
                  blogPosts.map((entry) => (
                    <li
                      key={entry.id}
                      className={entry.id === activeDraftId ? styles.activeDraftItem : undefined}
                    >
                      <span className={styles.historyTime}>
                        {new Date(entry.updated_at).toLocaleString("ro-RO", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <strong>{entry.title}</strong>
                      <p>{entry.excerpt || "Draft de jurnal fără excerpt încă."}</p>
                      <span className={styles.draftStatus}>{entry.status}</span>
                      {entry.is_debut_submission ? (
                        <span className={styles.draftFlag}>debut submission</span>
                      ) : null}
                      <button
                        type="button"
                        className={styles.savedAction}
                        onClick={() => handleSelectDraft(entry)}
                      >
                        {entry.id === activeDraftId ? "Draft deschis" : "Deschide draftul"}
                      </button>
                    </li>
                  ))
                ) : (
                  <li>
                    <p>Niciun draft de jurnal încă.</p>
                  </li>
                )}
              </ul>
            </section>

            <section className={styles.panelBlock}>
              <span className={styles.panelMarker}>PANEL · Draft Editor</span>
              <h2>Editor draft</h2>
              {activeDraftId ? (
                <div className={styles.draftEditor}>
                  <label className={styles.editorLabel} htmlFor="draft-title">
                    Titlu
                  </label>
                  <input
                    id="draft-title"
                    type="text"
                    value={draftTitleInput}
                    onChange={(event) => setDraftTitleInput(event.target.value)}
                    className={styles.accountInput}
                  />
                  <label className={styles.editorLabel} htmlFor="draft-excerpt">
                    Excerpt
                  </label>
                  <textarea
                    id="draft-excerpt"
                    value={draftExcerptInput}
                    onChange={(event) => setDraftExcerptInput(event.target.value)}
                    className={styles.editorExcerpt}
                  />
                  <label className={styles.editorLabel} htmlFor="draft-content">
                    Conținut
                  </label>
                  <textarea
                    id="draft-content"
                    value={draftContentInput}
                    onChange={(event) => setDraftContentInput(event.target.value)}
                    className={styles.editorContent}
                  />
                  <div className={styles.influenceEditorGrid}>
                    <div>
                      <label className={styles.editorLabel} htmlFor="sense-weight">
                        Sense
                      </label>
                      <input
                        id="sense-weight"
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={senseWeightInput}
                        onChange={(event) => setSenseWeightInput(event.target.value)}
                        className={styles.accountInput}
                      />
                    </div>
                    <div>
                      <label className={styles.editorLabel} htmlFor="structure-weight">
                        Structure
                      </label>
                      <input
                        id="structure-weight"
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={structureWeightInput}
                        onChange={(event) => setStructureWeightInput(event.target.value)}
                        className={styles.accountInput}
                      />
                    </div>
                    <div>
                      <label className={styles.editorLabel} htmlFor="attention-weight">
                        Attention
                      </label>
                      <input
                        id="attention-weight"
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={attentionWeightInput}
                        onChange={(event) => setAttentionWeightInput(event.target.value)}
                        className={styles.accountInput}
                      />
                    </div>
                  </div>
                  <label className={styles.editorLabel} htmlFor="influence-mode">
                    Influence mode
                  </label>
                  <select
                    id="influence-mode"
                    value={influenceModeInput}
                    onChange={(event) =>
                      setInfluenceModeInput(
                        event.target.value as
                          | "whisper"
                          | "echo"
                          | "rupture"
                          | "counterpoint"
                          | "stain",
                      )
                    }
                    className={styles.accountSelect}
                  >
                    <option value="whisper">whisper</option>
                    <option value="echo">echo</option>
                    <option value="rupture">rupture</option>
                    <option value="counterpoint">counterpoint</option>
                    <option value="stain">stain</option>
                  </select>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={isContaminantInput}
                      onChange={(event) => setIsContaminantInput(event.target.checked)}
                    />
                    <span>Postarea poate contamina Artistul AI live</span>
                  </label>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={isDebutSubmissionInput}
                      onChange={(event) => setIsDebutSubmissionInput(event.target.checked)}
                      disabled={!hasActiveSubscription}
                    />
                    <span>Marchează postarea ca debut submission</span>
                  </label>
                  {!hasActiveSubscription ? (
                    <p className={styles.accountHint}>
                      Debut submission este disponibil doar cu abonament lunar activ.
                    </p>
                  ) : null}
                  <div className={styles.accountActionRow}>
                    <button
                      type="button"
                      className={styles.accountButton}
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft}
                    >
                      {isSavingDraft ? "Se salvează..." : "Salvează draftul"}
                    </button>
                    <button
                      type="button"
                      className={styles.savedAction}
                      onClick={handlePublishDraft}
                      disabled={isPublishingDraft}
                    >
                      {isPublishingDraft ? "Se publică..." : "Publică"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className={styles.accountMessage}>
                  Creează sau selectează un draft pentru a începe redactarea.
                </p>
              )}
            </section>
          </>
        ) : null}

        {viewMode === "archive" ? (
          <>
            <section className={styles.panelBlock}>
              <span className={styles.panelMarker}>PANEL · History Log</span>
              <h2>Istoric scurt</h2>
              <ul className={styles.historyList}>
                {history.map((entry, index) => (
                  <li
                    key={`${entry.time}-${entry.text}`}
                    className={styles.historyItem}
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <span className={styles.historyTime}>{entry.time}</span>
                    <p>{entry.text}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.panelBlock}>
              <span className={styles.panelMarker}>PANEL · Thought Memory</span>
              <h2>Memoria gândurilor</h2>
              <ul className={styles.savedList}>
                {thoughtMemory.length ? (
                  thoughtMemory.map((entry) => (
                    <li key={entry.id}>
                      <span className={styles.historyTime}>
                        {new Date(entry.created_at).toLocaleString("ro-RO", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <strong>{entry.direction}</strong>
                      <p>{entry.thought}</p>
                      <span className={styles.draftStatus}>
                        {entry.source_type} · sense {entry.sense_score.toFixed(2)} · structure{" "}
                        {entry.structure_score.toFixed(2)} · attention{" "}
                        {entry.attention_score.toFixed(2)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li>
                    <p>Memoria cognitivă este încă goală.</p>
                  </li>
                )}
              </ul>
            </section>

            <section className={styles.panelBlock}>
              <span className={styles.panelMarker}>PANEL · Saved Moments</span>
              <h2>Momente salvate</h2>
              <ul className={styles.savedList}>
                {savedMoments.length ? (
                  savedMoments.map((entry) => (
                    <li key={entry.id}>
                      <span className={styles.historyTime}>
                        {new Date(entry.created_at).toLocaleString("ro-RO", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <strong>{entry.direction}</strong>
                      <p>{entry.thought}</p>
                      <button
                        type="button"
                        className={styles.savedAction}
                        onClick={() => handleCreateDraftFromMoment(entry.id)}
                        disabled={draftingMomentId === entry.id}
                      >
                        {draftingMomentId === entry.id
                          ? "Se transformă..."
                          : "Transformă în draft de jurnal"}
                      </button>
                    </li>
                  ))
                ) : (
                  <li>
                    <p>Niciun moment salvat încă.</p>
                  </li>
                )}
              </ul>
            </section>

            <section className={styles.panelBlock}>
              <span className={styles.panelMarker}>PANEL · Prompt Output</span>
              <h2>Prompt final</h2>
              <textarea readOnly value={promptOutput} className={styles.promptOutput} />
            </section>
          </>
        ) : null}
      </aside>
    </main>
  );
}
