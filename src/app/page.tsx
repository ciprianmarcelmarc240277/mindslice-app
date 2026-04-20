"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  buildThoughtSceneEngine,
  getThoughtCycleDuration,
} from "@/lib/mindslice/thought-scene-engine";
import { processIdea } from "@/lib/mindslice/concept-process-system";
import { useAccountProfileSystem } from "@/lib/mindslice/use-account-profile-system";
import { AccountPanel } from "@/app/components/account-panel";
import { ArchivePanel } from "@/app/components/archive-panel";
import { ConceptArchivePanel } from "@/app/components/concept-archive-panel";
import { ConceptArchiveView } from "@/app/components/concept-archive-view";
import { JournalDraftPanel } from "@/app/components/journal-draft-panel";
import { JournalView } from "@/app/components/journal-view";
import { LiveControlsPanel } from "@/app/components/live-controls-panel";
import { LiveSceneView } from "@/app/components/live-scene-view";
import { useConceptArchiveSystem } from "@/lib/mindslice/use-concept-archive-system";
import { useLiveRuntimeSystem } from "@/lib/mindslice/use-live-runtime-system";
import { useConceptMemorySystem } from "@/lib/mindslice/use-concept-memory-system";
import { useSystemModificationState } from "@/lib/mindslice/use-system-modification-state";
import { useJournalEditorSystem } from "@/lib/mindslice/use-journal-editor-system";
import type {
  BlogPostDraft,
  EngineProfile,
  InteriorChatMessage,
  SavedMoment,
  ThoughtState,
  UserProfile,
  ViewMode,
} from "@/lib/mindslice/mindslice-types";
import { useThoughtMemorySystem } from "@/lib/mindslice/use-thought-memory-system";
import { useThoughtSceneLoop } from "@/lib/mindslice/use-thought-scene-loop";
import { useSlicesEngineSystem } from "@/lib/mindslice/use-slices-engine-system";
import styles from "./page.module.css";

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

function normalizeLegacyDraftContent(content: string) {
  return content
    .replace(/\n*Prompt generat:\n[\s\S]*?\nNota editoriala:\n/giu, "\n\nNota editorială:\n")
    .replace(/\n*Prompt generat:\n[\s\S]*?\nNota editorială:\n/giu, "\n\nNota editorială:\n")
    .replace(/^Directie:/u, "Direcție:")
    .replace(/\nFragment de gandire live:/gu, "\nFragment de gândire live:")
    .replace(/\nNota editoriala:/gu, "\nNota editorială:");
}

function deriveLegacySourceText(entry: BlogPostDraft) {
  if (entry.source_text?.trim()) {
    return entry.source_text;
  }

  const normalized = normalizeLegacyDraftContent(entry.content);

  if (normalized.includes("Fragment de gândire live:") && normalized.includes("Nota editorială:")) {
    return normalized;
  }

  return "";
}

function deriveLegacyEditorialText(entry: BlogPostDraft) {
  if (entry.source_text !== undefined && entry.source_text !== null) {
    return entry.content;
  }

  const normalized = normalizeLegacyDraftContent(entry.content);

  if (normalized.includes("Fragment de gândire live:") && normalized.includes("Nota editorială:")) {
    return "";
  }

  return entry.content;
}

function getPublishedEntryPreview(entry: BlogPostDraft) {
  const finalText = entry.content.trim();

  if (finalText) {
    return finalText;
  }

  const excerpt = entry.excerpt?.trim();
  if (excerpt) {
    return excerpt;
  }

  return "Publicație fără text final încă.";
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

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("live");
  const [isActive, setIsActive] = useState(true);
  const [accountMessage, setAccountMessage] = useState("Conectează-te pentru a salva momente.");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [draftingMomentId, setDraftingMomentId] = useState<string | null>(null);
  const [draftEditorMessage, setDraftEditorMessage] = useState<string | null>(null);
  const [draftEditorMessageTone, setDraftEditorMessageTone] = useState<
    "neutral" | "success" | "error"
  >("neutral");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishingDraft, setIsPublishingDraft] = useState(false);
  const [interiorChatMessages, setInteriorChatMessages] = useState<InteriorChatMessage[]>([]);
  const [interiorChatInput, setInteriorChatInput] = useState("");
  const [isSendingInteriorChatMessage, setIsSendingInteriorChatMessage] = useState(false);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>([]);
  const [followActionUserId, setFollowActionUserId] = useState<string | null>(null);
  const [regeneratingAiResponsePostId, setRegeneratingAiResponsePostId] = useState<string | null>(
    null,
  );
  const [promptOutput, setPromptOutput] = useState(() =>
    buildPrompt(false, fallbackStateLibrary[0]),
  );
  const { isSignedIn } = useAuth();
  const isUserSignedIn = Boolean(isSignedIn);
  const {
    profile,
    savedMoments,
    setSavedMoments,
    isAdmin,
    hasLoadedUserState,
    isSavingAddressForm,
    isEditingAddressForm,
    setIsEditingAddressForm,
    displayNameInput,
    setDisplayNameInput,
    isSavingDisplayName,
    isEditingDisplayName,
    setIsEditingDisplayName,
    pseudonymInput,
    setPseudonymInput,
    isSavingPseudonym,
    isEditingPseudonym,
    setIsEditingPseudonym,
    bioInput,
    setBioInput,
    bioSaveState,
    setBioSaveState,
    isSavingBio,
    isSavingNameDeclaration,
    artistStatementInput,
    setArtistStatementInput,
    debutStatusInput,
    setDebutStatusInput,
    isSavingDebutProgram,
    adminSubscriptionOptions,
    adminTargetPseudonymInput,
    setAdminTargetPseudonymInput,
    adminSubscriptionStatusInput,
    setAdminSubscriptionStatusInput,
    isSavingAdminSubscription,
    adminSubscriptionResult,
    handleAddressFormChange,
    handleDisplayNameSave,
    handlePseudonymSave,
    handleBioSave,
    handleNameDeclarationChange,
    handleDebutProgramSave,
    handleAdminSubscriptionSave,
  } = useAccountProfileSystem({
    isSignedIn: isUserSignedIn,
    onMessage: setAccountMessage,
    normalizeDisplayName,
    isValidFamilyAndGivenName,
  });
  const {
    blogPosts,
    activeDraftId,
    draftTitleInput,
    setDraftTitleInput,
    draftExcerptInput,
    setDraftExcerptInput,
    draftSourceTextInput,
    draftContentInput,
    setDraftContentInput,
    senseWeightInput,
    setSenseWeightInput,
    structureWeightInput,
    setStructureWeightInput,
    attentionWeightInput,
    setAttentionWeightInput,
    influenceModeInput,
    setInfluenceModeInput,
    isContaminantInput,
    setIsContaminantInput,
    isDebutSubmissionInput,
    setIsDebutSubmissionInput,
    hydrateDraft,
    prependOrReplaceDraft,
    replaceDraft,
  } = useJournalEditorSystem<BlogPostDraft>({
    isSignedIn: isUserSignedIn,
    onLoadError: setAccountMessage,
    deriveSourceText: deriveLegacySourceText,
    deriveEditorialText: deriveLegacyEditorialText,
  });
  const publishedPosts = blogPosts.filter((entry) => entry.status === "published");
  const interferenceRefreshKey = publishedPosts
    .map((entry) => `${entry.id}:${entry.updated_at}:${entry.published_at ?? "draft"}`)
    .join("|");
  const {
    referenceImageUrls,
    currentImageUrl,
    interference,
    liveInfluenceMode,
    liveAiResponseLines,
    setImageIndex,
  } = useLiveRuntimeSystem({
    isSignedIn: isUserSignedIn,
    interferenceRefreshKey,
  });
  const {
    stateLibrary,
    engineMode,
    engineProfile,
    hydrationVersion,
  } = useSlicesEngineSystem<ThoughtState, EngineProfile>({
    fallbackSlices: fallbackStateLibrary,
    fallbackEngineMode: "mock local",
    isSignedIn: isUserSignedIn,
    refreshKey: [
      interference?.sourceId ?? "none",
      interference?.publishedAt ?? "none",
      interference?.influenceMode ?? "none",
    ].join("|"),
  });
  const { conceptArchive, isLoadingConceptArchive } = useConceptArchiveSystem();
  const libraryLength = stateLibrary.length;
  const current = stateLibrary[currentIndex];
  const {
    systemState,
    adjustedCurrent,
    adjustedEngineMode,
    adjustedEngineProfile,
    effectiveInfluenceMode,
  } = useSystemModificationState({
    isSignedIn: isUserSignedIn,
    current,
    engineMode,
    engineProfile,
    liveInfluenceMode,
  });
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
  const canViewArtistThinking =
    isUserSignedIn && hasLoadedUserState && hasRequiredDisplayName && hasAcceptedNameDeclaration;
  const currentDebutStatus = profile?.debut_status ?? "aspirant";
  const hasDebutProgramChanges =
    normalizedArtistStatementInput !== (profile?.artist_statement ?? "").trim() ||
    debutStatusInput !== currentDebutStatus;
  const hasBioChanges = normalizedBioInput !== (profile?.bio ?? "").trim();
  const { history, thoughtMemory } = useThoughtMemorySystem({
    isSignedIn: isUserSignedIn,
    isActive,
    hasProfileAccess,
    current: adjustedCurrent,
    currentIndex,
    influenceMode: effectiveInfluenceMode,
  });
  const thoughtCycleDuration = getThoughtCycleDuration(
    adjustedCurrent.thought,
    effectiveInfluenceMode,
  );
  const { animatedThought, isThoughtOverlayVisible, thoughtAnimationKey } = useThoughtSceneLoop({
    currentThought: adjustedCurrent.thought,
    currentDirection: adjustedCurrent.direction,
    currentIndex,
    influenceMode: effectiveInfluenceMode,
    isActive,
    sliceCycleDuration: thoughtCycleDuration,
    referenceImageCount: referenceImageUrls.length,
    onAdvanceSlice: () => {
      setCurrentIndex((previous) => (previous + 1) % libraryLength);
    },
    onAdvanceImage: () => {
      setImageIndex((previous) => (previous + 1) % referenceImageUrls.length);
    },
  });
  const thoughtScene = buildThoughtSceneEngine({
    current: adjustedCurrent,
    currentIndex,
    influenceMode: effectiveInfluenceMode,
    animatedThought,
    isThoughtOverlayVisible,
    aiResponseLines: liveAiResponseLines,
  });
  const thoughtCenterAnchor = thoughtScene.sceneGraph.thoughtCenterAnchor;
  const thoughtCenterFragment = thoughtScene.sceneGraph.thoughtCenterFragment;
  const focalHaloStyles = thoughtScene.sceneGraph.focalHalos;
  const leadingLineStyles = thoughtScene.sceneGraph.leadingLines;
  const negativeSpaceStyles = thoughtScene.sceneGraph.negativeSpace;
  const thoughtLines = thoughtScene.sceneGraph.thoughtLines;
  const conceptProcess = processIdea({
    current: adjustedCurrent,
    currentIndex,
    thoughtScene,
    history,
    thoughtMemory,
    interference,
    influenceMode: effectiveInfluenceMode,
  });
  const conceptCandidate = conceptProcess.candidate;
  const conceptValidation = conceptProcess.validation;
  const { conceptMemory, latestConcept, resolvedConceptCount, latestPromotion } = useConceptMemorySystem({
    isSignedIn: isUserSignedIn,
    isActive,
    conceptCandidate,
    conceptValidation,
  });
  const handleBioSaveWithAccess = () => handleBioSave(hasProfileAccess);
  const handleDebutProgramSaveWithAccess = () => handleDebutProgramSave(hasProfileAccess);

  useEffect(() => {
    setCurrentIndex(0);
  }, [hydrationVersion]);

  useEffect(() => {
    setPromptOutput(buildPrompt(false, adjustedCurrent));
  }, [adjustedCurrent, currentIndex]);

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

  const handleSaveMoment = async () => {
    setPromptOutput(buildPrompt(true, adjustedCurrent));

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
          direction: adjustedCurrent.direction,
          thought: adjustedCurrent.thought,
          prompt: buildPrompt(true, adjustedCurrent),
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

      prependOrReplaceDraft(payload.blogPost);
      hydrateDraft(payload.blogPost);
      setViewMode("journal");

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
    hydrateDraft(draft);
    setDraftEditorMessage(null);
    setDraftEditorMessageTone("neutral");
  };

  const persistActiveDraft = async () => {
    if (!activeDraftId) {
      throw new Error("Selectează mai întâi un draft.");
    }

    if (!hasProfileAccess) {
      throw new Error(
        "Completează numele și declarația din PANEL · Account Profile ca să poți continua.",
      );
    }

    if (isDebutSubmissionInput && !hasActiveSubscription) {
      throw new Error("Debut submission este disponibil doar cu abonament lunar activ.");
    }

    const response = await fetch(`/api/blog-posts/${activeDraftId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: draftTitleInput,
        excerpt: draftExcerptInput,
        sourceText: draftSourceTextInput,
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

    replaceDraft(payload.blogPost);

    return payload.blogPost;
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);

    try {
      await persistActiveDraft();
      setAccountMessage("Draftul de jurnal a fost salvat.");
      setDraftEditorMessage("Draftul a fost salvat local și în Supabase.");
      setDraftEditorMessageTone("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nu am putut salva draftul.";
      setAccountMessage(message);
      setDraftEditorMessage(message);
      setDraftEditorMessageTone("error");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublishDraft = async () => {
    if (!activeDraftId) {
      setAccountMessage("Selectează mai întâi un draft.");
      setDraftEditorMessage("Selectează mai întâi un draft.");
      setDraftEditorMessageTone("error");
      return;
    }

    if (!hasProfileAccess) {
      const message =
        "Completează numele și declarația din PANEL · Account Profile ca să poți continua.";
      setAccountMessage(message);
      setDraftEditorMessage(message);
      setDraftEditorMessageTone("error");
      return;
    }

    if (!profile?.pseudonym?.trim()) {
      const message =
        "Setează mai întâi pseudonimul în PANEL · Account Profile. Tot ce publici apare sub pseudonim.";
      setAccountMessage(message);
      setDraftEditorMessage(message);
      setDraftEditorMessageTone("error");
      return;
    }

    setIsPublishingDraft(true);
    setDraftEditorMessage("Publicarea salvează mai întâi ultima versiune locală a draftului.");
    setDraftEditorMessageTone("neutral");

    try {
      await persistActiveDraft();

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

      replaceDraft(payload.blogPost);
      hydrateDraft(payload.blogPost);
      setAccountMessage("Draftul a fost publicat și poate deveni sursă de contaminare.");
      setDraftEditorMessage(
        "Draftul a fost publicat. Îl vezi acum în Journal Feed și poate intra în Live Interference.",
      );
      setDraftEditorMessageTone("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nu am putut publica draftul.";
      setAccountMessage(message);
      setDraftEditorMessage(message);
      setDraftEditorMessageTone("error");
    } finally {
      setIsPublishingDraft(false);
    }
  };

  const handleRegenerateAiResponse = async (postId: string) => {
    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să poți regenera răspunsul AI.");
      return;
    }

    setRegeneratingAiResponsePostId(postId);

    try {
      const response = await fetch(`/api/blog-posts/${postId}/ai-response`, {
        method: "POST",
      });

      const payload = (await response.json()) as {
        blogPost?: BlogPostDraft;
        error?: string;
      };

      if (!response.ok || !payload.blogPost) {
        throw new Error(payload.error || "Nu am putut regenera răspunsul AI.");
      }

      replaceDraft(payload.blogPost);
      setAccountMessage("Răspunsul AI a fost regenerat.");
    } catch (error) {
      setAccountMessage(
        error instanceof Error ? error.message : "Nu am putut regenera răspunsul AI.",
      );
    } finally {
      setRegeneratingAiResponsePostId(null);
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

        {viewMode === "archive" ? (
          <ConceptArchiveView
            conceptArchive={conceptArchive}
            isLoading={isLoadingConceptArchive}
            canViewArtistThinking={canViewArtistThinking}
          />
        ) : !canViewArtistThinking ? (
          <section className={styles.panelBlock}>
            <span className={styles.panelMarker}>PANEL · Access Gate</span>
            <p className={styles.eyebrow}>Access Locked</p>
            <h2>Scena live a Artistului AI este disponibilă doar din cont.</h2>
            <p className={styles.blogIntro}>
              Fără cont poți vizita `Concept Archive`, dar nu poți intra în câmpul unde Artist
              AI gândește live. Dacă ești autentificat, în `PANEL · Account Profile`, câmpul
              `Nume` trebuie să fie în formatul `Nume de familie, Prenume`, fără pseudonim sau
              alte entități, și trebuie să bifezi declarația că acesta este numele tău real.
            </p>
          </section>
        ) : viewMode === "live" ? (
          <LiveSceneView
            isActive={isActive}
            engineMode={adjustedEngineMode}
            engineProfile={adjustedEngineProfile}
            current={adjustedCurrent}
            currentIndex={currentIndex}
            libraryLength={libraryLength}
            liveInfluenceMode={effectiveInfluenceMode}
            thoughtScene={thoughtScene}
            leadingLineStyles={leadingLineStyles}
            focalHaloStyles={focalHaloStyles}
            negativeSpaceStyles={negativeSpaceStyles}
            thoughtCenterAnchor={thoughtCenterAnchor}
            thoughtCenterFragment={thoughtCenterFragment}
            interference={interference}
            profile={profile}
            followedUserIds={followedUserIds}
            followActionUserId={followActionUserId}
            handleFollowToggle={handleFollowToggle}
            formatPublicAuthor={formatPublicAuthor}
            isThoughtOverlayVisible={isThoughtOverlayVisible}
            thoughtAnimationKey={thoughtAnimationKey}
            thoughtLines={thoughtLines}
            liveAiResponseLines={liveAiResponseLines}
            systemState={systemState}
            conceptProcess={conceptProcess}
            conceptCandidate={conceptCandidate}
            conceptValidation={conceptValidation}
            conceptMemoryCount={conceptMemory.length}
            resolvedConceptCount={resolvedConceptCount}
            latestConceptTitle={latestConcept?.concept.core.title ?? null}
            promotionStatus={latestPromotion?.promotedConcept.stage ?? conceptCandidate.stage}
            canPromoteToCanonical={Boolean(latestPromotion?.canPromoteToCanonical)}
            promotionNotes={latestPromotion?.notes ?? []}
          />
        ) : null}

        {viewMode === "journal" ? (
          <JournalView
            interiorChatInput={interiorChatInput}
            setInteriorChatInput={setInteriorChatInput}
            isSendingInteriorChatMessage={isSendingInteriorChatMessage}
            hasPseudonym={hasPseudonym}
            handleInteriorChatSend={handleInteriorChatSend}
            interiorChatMessages={interiorChatMessages}
            profile={profile}
            followedUserIds={followedUserIds}
            followActionUserId={followActionUserId}
            handleFollowToggle={handleFollowToggle}
            formatPublicAuthor={formatPublicAuthor}
            publishedPosts={publishedPosts}
            handleRegenerateAiResponse={handleRegenerateAiResponse}
            regeneratingAiResponsePostId={regeneratingAiResponsePostId}
            getPublishedEntryPreview={getPublishedEntryPreview}
            onOpenArchive={() => setViewMode("archive")}
            interference={interference}
          />
        ) : null}

        {canViewArtistThinking ? (
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
        {viewMode === "live" && canViewArtistThinking ? (
          <LiveControlsPanel
            isActive={isActive}
            current={adjustedCurrent}
            saveState={saveState}
            onToggleActive={() => setIsActive((previous) => !previous)}
            onNextDirection={() =>
              setCurrentIndex((previous) => (previous + 1) % libraryLength)
            }
            onGeneratePrompt={() => setPromptOutput(buildPrompt(false, adjustedCurrent))}
            onSaveMoment={handleSaveMoment}
          />
        ) : null}

        <AccountPanel
          accountMessage={accountMessage}
          isSignedIn={Boolean(isSignedIn)}
          profile={profile}
          displayNameInput={displayNameInput}
          setDisplayNameInput={setDisplayNameInput}
          isSavingDisplayName={isSavingDisplayName}
          isEditingDisplayName={isEditingDisplayName}
          setIsEditingDisplayName={setIsEditingDisplayName}
          hasDisplayNameInput={hasDisplayNameInput}
          canSaveDisplayName={canSaveDisplayName}
          handleDisplayNameSave={handleDisplayNameSave}
          pseudonymInput={pseudonymInput}
          setPseudonymInput={setPseudonymInput}
          isSavingPseudonym={isSavingPseudonym}
          isEditingPseudonym={isEditingPseudonym}
          setIsEditingPseudonym={setIsEditingPseudonym}
          handlePseudonymSave={handlePseudonymSave}
          bioInput={bioInput}
          setBioInput={setBioInput}
          bioSaveState={bioSaveState}
          setBioSaveState={setBioSaveState}
          isSavingBio={isSavingBio}
          hasBioChanges={hasBioChanges}
          handleBioSave={handleBioSaveWithAccess}
          isEditingAddressForm={isEditingAddressForm}
          setIsEditingAddressForm={setIsEditingAddressForm}
          isSavingAddressForm={isSavingAddressForm}
          handleAddressFormChange={handleAddressFormChange}
          isSavingNameDeclaration={isSavingNameDeclaration}
          handleNameDeclarationChange={handleNameDeclarationChange}
          hasActiveSubscription={hasActiveSubscription}
          debutStatusInput={debutStatusInput}
          setDebutStatusInput={setDebutStatusInput}
          artistStatementInput={artistStatementInput}
          setArtistStatementInput={setArtistStatementInput}
          isSavingDebutProgram={isSavingDebutProgram}
          hasDebutProgramChanges={hasDebutProgramChanges}
          handleDebutProgramSave={handleDebutProgramSaveWithAccess}
          currentDebutStatus={currentDebutStatus}
          isAdmin={isAdmin}
          adminTargetPseudonymInput={adminTargetPseudonymInput}
          setAdminTargetPseudonymInput={setAdminTargetPseudonymInput}
          adminSubscriptionOptions={adminSubscriptionOptions}
          adminSubscriptionStatusInput={adminSubscriptionStatusInput}
          setAdminSubscriptionStatusInput={setAdminSubscriptionStatusInput}
          isSavingAdminSubscription={isSavingAdminSubscription}
          adminSubscriptionResult={adminSubscriptionResult}
          handleAdminSubscriptionSave={handleAdminSubscriptionSave}
          formatQuotedPseudonym={formatQuotedPseudonym}
          formatSubscriptionStatusLabel={formatSubscriptionStatusLabel}
          formatDebutStatusLabel={formatDebutStatusLabel}
        />

        {viewMode === "journal" && canViewArtistThinking ? (
          <JournalDraftPanel
            blogPosts={blogPosts}
            activeDraftId={activeDraftId}
            handleSelectDraft={handleSelectDraft}
            draftTitleInput={draftTitleInput}
            setDraftTitleInput={setDraftTitleInput}
            draftExcerptInput={draftExcerptInput}
            setDraftExcerptInput={setDraftExcerptInput}
            draftSourceTextInput={draftSourceTextInput}
            draftContentInput={draftContentInput}
            setDraftContentInput={setDraftContentInput}
            senseWeightInput={senseWeightInput}
            setSenseWeightInput={setSenseWeightInput}
            structureWeightInput={structureWeightInput}
            setStructureWeightInput={setStructureWeightInput}
            attentionWeightInput={attentionWeightInput}
            setAttentionWeightInput={setAttentionWeightInput}
            influenceModeInput={influenceModeInput}
            setInfluenceModeInput={setInfluenceModeInput}
            isContaminantInput={isContaminantInput}
            setIsContaminantInput={setIsContaminantInput}
            isDebutSubmissionInput={isDebutSubmissionInput}
            setIsDebutSubmissionInput={setIsDebutSubmissionInput}
            hasActiveSubscription={hasActiveSubscription}
            handleSaveDraft={handleSaveDraft}
            isSavingDraft={isSavingDraft}
            handlePublishDraft={handlePublishDraft}
            isPublishingDraft={isPublishingDraft}
            draftEditorMessage={draftEditorMessage}
            draftEditorMessageTone={draftEditorMessageTone}
          />
        ) : null}

        {viewMode === "archive" ? (
          <>
            <ConceptArchivePanel
              conceptArchive={conceptArchive}
              isLoading={isLoadingConceptArchive}
            />
            {canViewArtistThinking ? (
              <ArchivePanel
                history={history}
                thoughtMemory={thoughtMemory}
                savedMoments={savedMoments}
                handleCreateDraftFromMoment={handleCreateDraftFromMoment}
                draftingMomentId={draftingMomentId}
                promptOutput={promptOutput}
              />
            ) : null}
          </>
        ) : null}
      </aside>
    </main>
  );
}
