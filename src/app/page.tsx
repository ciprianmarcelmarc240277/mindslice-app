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

type AddressForm = "domnule" | "doamnă" | "domnișoară";

type UserProfile = {
  user_id: string;
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  address_form?: AddressForm | null;
};

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
  const [isActive, setIsActive] = useState(true);
  const [engineMode, setEngineMode] = useState("mock local");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedMoments, setSavedMoments] = useState<SavedMoment[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountMessage, setAccountMessage] = useState("Conectează-te pentru a salva momente.");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isSavingAddressForm, setIsSavingAddressForm] = useState(false);
  const [promptOutput, setPromptOutput] = useState(() =>
    buildPrompt(false, fallbackStateLibrary[0]),
  );
  const { isSignedIn } = useAuth();
  const libraryLength = stateLibrary.length;
  const current = stateLibrary[currentIndex];
  const currentImageUrl = referenceImageUrls.length
    ? referenceImageUrls[currentIndex % referenceImageUrls.length]
    : null;
  const blogEntries = stateLibrary.slice(0, 6).map((entry, index) => ({
    id: `${index}-${entry.direction}`,
    title: entry.direction,
    excerpt: entry.thought,
    mood: entry.mood,
    palette: entry.palette.slice(0, 3).join(", "),
  }));

  useEffect(() => {
    let ignore = false;

    async function loadSlices() {
      try {
        const response = await fetch("/api/slices", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Slices request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as { slices?: ThoughtState[] };
        const slices = Array.isArray(payload.slices) ? payload.slices : [];
        if (!slices.length || ignore) {
          return;
        }

        setStateLibrary(slices);
        setCurrentIndex(0);
        setEngineMode("Slices file");
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
  }, []);

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
    if (!isSignedIn) {
      setSavedMoments([]);
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
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut încărca datele utilizatorului.");
        }

        if (!cancelled) {
          setProfile(payload.profile ?? null);
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
    if (!isActive) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % libraryLength);
    }, 5800);

    return () => window.clearInterval(interval);
  }, [isActive, libraryLength]);

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
      window.dispatchEvent(
        new CustomEvent("address-form-updated", {
          detail: { addressForm: payload.profile.address_form ?? "domnule" },
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

  return (
    <main className={styles.page}>
      <div className={styles.ambientLeft} />
      <div className={styles.ambientRight} />

      <section className={styles.heroPanel}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>MindSlice Next Prototype 01</p>
          <h1>Artist AI live care gândește artă în timp real.</h1>
          <p className={styles.lede}>
            Sistemul rulează prin triada art, design, business și transformă
            gândirea curentă într-un câmp vizual viu, procedural.
          </p>
        </div>

        <div className={styles.statusBar}>
          <div>
            <span className={styles.statusLabel}>Stare curentă</span>
            <strong>{isActive ? "artistul gândește live" : "în așteptare"}</strong>
          </div>
          <div>
            <span className={styles.statusLabel}>Sursa thinking</span>
            <strong>{engineMode}</strong>
          </div>
          <div>
            <span className={styles.statusLabel}>Direcție</span>
            <strong>{current.direction}</strong>
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
          <div className={styles.thoughtOverlay}>
            <span className={styles.overlayLabel}>Acum mă gândesc la</span>
            <p>{current.thought}</p>
          </div>
        </div>

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
            {blogEntries.map((entry) => (
              <article key={entry.id} className={styles.blogCard}>
                <span className={styles.blogMeta}>{entry.mood}</span>
                <h3>{entry.title}</h3>
                <p>{entry.excerpt}</p>
                <strong>{entry.palette}</strong>
              </article>
            ))}
          </div>
        </section>
      </section>

      <aside className={styles.controlPanel}>
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

        <section className={styles.panelBlock}>
          <h2>Cont</h2>
          <p className={styles.accountMessage}>{accountMessage}</p>
          {isSignedIn ? (
            <div className={styles.accountSettings}>
              <label htmlFor="address-form">Formula de adresare</label>
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
            </div>
          ) : null}
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

        <section className={styles.panelBlock}>
          <h2>Istoric scurt</h2>
          <ul className={styles.historyList}>
            {history.map((entry) => (
              <li key={`${entry.time}-${entry.text}`}>
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
      </aside>
    </main>
  );
}
