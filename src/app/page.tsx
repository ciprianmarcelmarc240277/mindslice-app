"use client";

import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Triad = {
  art: string;
  design: string;
  business: string;
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

type BlogPostDraft = {
  id: string;
  saved_moment_id: string | null;
  title: string;
  excerpt: string | null;
  content: string;
  sense_weight: number;
  structure_weight: number;
  attention_weight: number;
  influence_mode: "whisper" | "echo" | "rupture" | "counterpoint" | "stain";
  is_contaminant: boolean;
  status: "draft" | "published";
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type LiveInterference = {
  sourceId: string;
  title: string;
  excerpt: string | null;
  senseWeight: number;
  structureWeight: number;
  attentionWeight: number;
  influenceMode: "whisper" | "echo" | "rupture" | "counterpoint" | "stain";
  note: string;
  publishedAt: string;
};

type AddressForm = "domnule" | "doamnă" | "domnișoară";

type UserProfile = {
  user_id: string;
  display_name?: string | null;
  pseudonym?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  address_form?: AddressForm | null;
};

type ViewMode = "live" | "journal" | "archive";

function formatQuotedPseudonym(value: string) {
  return `„${value}”`;
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
    triad: { art: "ok", design: "ok", business: "refine" },
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
    triad: { art: "ok", design: "ok", business: "ok" },
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
    triad: { art: "ok", design: "ok", business: "weak" },
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
    `Triad alignment: art ${current.triad.art}, design ${current.triad.design}, business ${current.triad.business}.`,
    "Visual behavior: hand-drawn conceptual map, density gradients, text fragments converging toward a dominant anchor, visible tension zones, imperfect spacing, controlled chaos, no decorative polish.",
    `Keywords: ${current.keywords.join(", ")}.`,
    "Output style: sophisticated post-generative art direction, museum-grade conceptual aesthetics, layered typography, warm paper texture, subtle ink bleed, high compositional intelligence.",
  ].join("\n");
}

export default function Home() {
  const [stateLibrary, setStateLibrary] = useState<ThoughtState[]>(fallbackStateLibrary);
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("live");
  const [isActive, setIsActive] = useState(true);
  const [engineMode, setEngineMode] = useState("mock local");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedMoments, setSavedMoments] = useState<SavedMoment[]>([]);
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
  const [isSavingAddressForm, setIsSavingAddressForm] = useState(false);
  const [isEditingAddressForm, setIsEditingAddressForm] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [pseudonymInput, setPseudonymInput] = useState("");
  const [isSavingPseudonym, setIsSavingPseudonym] = useState(false);
  const [isEditingPseudonym, setIsEditingPseudonym] = useState(false);
  const [animatedThought, setAnimatedThought] = useState(fallbackStateLibrary[0].thought);
  const [thoughtAnimationKey, setThoughtAnimationKey] = useState(0);
  const [promptOutput, setPromptOutput] = useState(() =>
    buildPrompt(false, fallbackStateLibrary[0]),
  );
  const { isSignedIn } = useAuth();
  const libraryLength = stateLibrary.length;
  const current = stateLibrary[currentIndex];
  const currentImageUrl = referenceImageUrls.length
    ? referenceImageUrls[imageIndex % referenceImageUrls.length]
    : null;
  const publishedPosts = blogPosts.filter((entry) => entry.status === "published");

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
        };
        const slices = Array.isArray(payload.slices) ? payload.slices : [];
        if (!slices.length || ignore) {
          return;
        }

        setStateLibrary(slices);
        setCurrentIndex(0);
        setEngineMode(payload.engineMode || "Slices file");
      } catch {
        if (!ignore) {
          setStateLibrary(fallbackStateLibrary);
          setEngineMode("mock local");
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
    let timeoutId: number | undefined;

    setThoughtAnimationKey((previous) => previous + 1);
    setAnimatedThought("");

    const nextThought = current.thought;
    const influenceMode = interference?.influenceMode;

    const getDelay = (character: string) => {
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
    };

    const writeCharacter = (index: number) => {
      if (cancelled) {
        return;
      }

      setAnimatedThought(nextThought.slice(0, index + 1));

      if (index >= nextThought.length - 1) {
        return;
      }

      timeoutId = window.setTimeout(
        () => writeCharacter(index + 1),
        getDelay(nextThought[index]),
      );
    };

    timeoutId = window.setTimeout(() => writeCharacter(0), 160);

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [current.thought, interference?.influenceMode]);

  useEffect(() => {
    if (!isSignedIn) {
      setSavedMoments([]);
      setBlogPosts([]);
      setProfile(null);
      setAccountMessage("Conectează-te pentru a salva momente.");
      return;
    }

    let cancelled = false;

    async function loadUserState() {
      try {
        const response = await fetch("/api/user-state", { cache: "no-store" });
        const payload = (await response.json()) as {
          profile?: UserProfile;
          savedMoments?: SavedMoment[];
          blogPosts?: BlogPostDraft[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut încărca datele utilizatorului.");
        }

        if (!cancelled) {
          setProfile(payload.profile ?? null);
          setDisplayNameInput(payload.profile?.display_name ?? "");
          setPseudonymInput(payload.profile?.pseudonym ?? "");
          setSavedMoments(Array.isArray(payload.savedMoments) ? payload.savedMoments : []);
          setAccountMessage("Momentele tale salvate sunt sincronizate cu Supabase.");
        }
      } catch (error) {
        if (!cancelled) {
          setAccountMessage(
            error instanceof Error ? error.message : "Nu am putut încărca datele utilizatorului.",
          );
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
  }, [activeDraftId, blogPosts]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % libraryLength);
    }, 5800);

    return () => window.clearInterval(interval);
  }, [isActive, libraryLength]);

  useEffect(() => {
    if (!isActive || referenceImageUrls.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setImageIndex((previous) => (previous + 1) % referenceImageUrls.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [isActive, referenceImageUrls.length]);

  const handleSaveMoment = async () => {
    setPromptOutput(buildPrompt(true, current));

    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să poți salva momente în contul tău.");
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
      setDraftTitleInput(payload.blogPost.title);
      setDraftExcerptInput(payload.blogPost.excerpt ?? "");
      setDraftContentInput(payload.blogPost.content);
      setSenseWeightInput(String(payload.blogPost.sense_weight ?? 0));
      setStructureWeightInput(String(payload.blogPost.structure_weight ?? 0));
      setAttentionWeightInput(String(payload.blogPost.attention_weight ?? 0));
      setInfluenceModeInput(payload.blogPost.influence_mode);
      setIsContaminantInput(payload.blogPost.is_contaminant);

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
  };

  const handleSaveDraft = async () => {
    if (!activeDraftId) {
      setAccountMessage("Selectează mai întâi un draft.");
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
    const nextDisplayName = displayNameInput.trim();

    if (!isSignedIn) {
      setAccountMessage("Autentifică-te ca să-ți poți seta numele afișat.");
      return;
    }

    if (!nextDisplayName) {
      setAccountMessage("Numele afișat nu poate fi gol.");
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
      setAccountMessage("Numele afișat a fost actualizat.");
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

  return (
    <main className={styles.page}>
      <div className={styles.ambientLeft} />
      <div className={styles.ambientRight} />

      <section className={styles.heroPanel}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>MindSlice Next Prototype 01</p>
          <h1 className={styles.heroTitle}>Artist AI live care gândește artă în timp real.</h1>
          <p className={`${styles.lede} ${styles.heroLede}`}>
            Sistemul rulează prin triada art, design, business și transformă
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

        {viewMode === "live" ? (
          <>
            <div className={styles.statusBar}>
              <div>
                <span className={styles.statusLabel}>Stare curentă</span>
                <strong className={styles.statusValue}>
                  {isActive ? "artistul gândește live" : "în așteptare"}
                </strong>
              </div>
              <div>
                <span className={styles.statusLabel}>Sursa thinking</span>
                <strong className={styles.statusValue}>{engineMode}</strong>
              </div>
              <div>
                <span className={styles.statusLabel}>Direcție</span>
                <strong key={current.direction} className={styles.statusValue}>
                  {current.direction}
                </strong>
              </div>
            </div>

            <div className={styles.canvasCard}>
              <div className={styles.visualStage}>
                {currentImageUrl ? (
                  <Image
                    src={currentImageUrl}
                    alt={current.thought}
                    className={styles.referenceImage}
                    fill
                    sizes="(max-width: 900px) 100vw, 68vw"
                    unoptimized
                  />
                ) : (
                  <div className={styles.visualFallback}>
                    <strong>{current.direction}</strong>
                    <span>Nicio imagine disponibilă încă.</span>
                  </div>
                )}
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
                <span className={styles.overlayLabel}>Acum mă gândesc la</span>
                <p key={thoughtAnimationKey} className={styles.typewriterText}>
                  {animatedThought}
                  <span className={styles.typewriterCaret} aria-hidden="true" />
                </p>
              </div>
            </div>

            {interference ? (
              <section className={styles.interferencePanel}>
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
            <section className={styles.blogSection}>
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

        {viewMode === "archive" ? (
          <section className={styles.archiveIntro}>
            <p className={styles.eyebrow}>Archive</p>
            <h2>Memoria activă a sistemului</h2>
            <p className={styles.blogIntro}>
              Aici păstrezi momente, drafturi, istorii scurte și prompturi. Archive este
              rezerva de materiale din care jurnalul poate extrage noi contaminări.
            </p>
          </section>
        ) : null}
      </section>

      <aside className={styles.controlPanel}>
        {viewMode === "live" ? (
          <>
            <section className={styles.panelBlock}>
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
              <article>
                <span>Art</span>
                <strong>{current.triad.art}</strong>
              </article>
              <article>
                <span>Design</span>
                <strong>{current.triad.design}</strong>
              </article>
              <article>
                <span>Business</span>
                <strong>{current.triad.business}</strong>
              </article>
            </section>

            <section className={`${styles.panelBlock} ${styles.detailList}`}>
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
                        placeholder="Ex: Marc, Ciprian-Marcel"
                      />
                      <p className={styles.accountHint}>Format obligatoriu: `Nume, Prenume`.</p>
                      <div className={styles.accountActionRow}>
                        <button
                          type="button"
                          className={styles.accountButton}
                          onClick={handleDisplayNameSave}
                          disabled={isSavingDisplayName}
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
            </div>
          ) : null}
        </section>

        {viewMode === "journal" ? (
          <>
            <section className={styles.panelBlock}>
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
              <h2>Prompt final</h2>
              <textarea readOnly value={promptOutput} className={styles.promptOutput} />
            </section>
          </>
        ) : null}
      </aside>
    </main>
  );
}
