"use client";

import type { ThoughtState } from "@/lib/mindslice/mindslice-types";
import styles from "../page.module.css";

type LiveControlsPanelProps = {
  isActive: boolean;
  canCreateSlice?: boolean;
  current: Pick<ThoughtState, "mood" | "palette" | "materials" | "motion" | "triad">;
  saveState: "idle" | "saving" | "saved" | "error";
  onToggleActive: () => void;
  onNextDirection: () => void;
  onGeneratePrompt: () => void;
  onSaveMoment: () => void;
};

export function LiveControlsPanel(props: LiveControlsPanelProps) {
  const {
    isActive,
    canCreateSlice = true,
    current,
    saveState,
    onToggleActive,
    onNextDirection,
    onGeneratePrompt,
    onSaveMoment,
  } = props;

  return (
    <>
      <section className={styles.panelBlock}>
        <span className={styles.panelMarker}>PANEL · Live Controls</span>
        <h2>Control</h2>
        <div className={styles.buttonRow}>
          <button type="button" onClick={onToggleActive}>
            {isActive ? "Pauză" : "Pornește sesiunea"}
          </button>
          <button type="button" className={styles.secondary} onClick={onNextDirection}>
            Schimbă direcția
          </button>
        </div>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.secondary} onClick={onGeneratePrompt}>
            Generează prompt
          </button>
          <button type="button" className={styles.ghost} onClick={onSaveMoment} disabled={!canCreateSlice}>
            {saveState === "saving" ? "Se salvează..." : "Salvează momentul"}
          </button>
        </div>
        {!canCreateSlice ? <p>Rank-ul curent nu permite încă crearea de slice-uri.</p> : null}
      </section>

      <section className={`${styles.panelBlock} ${styles.metricsGrid}`}>
        <span className={styles.panelMarker}>PANEL · Evaluation Metrics</span>
        <article>
          <span>Sens</span>
          <strong>{current.triad.art.score.toFixed(2)} · {current.triad.art.label}</strong>
        </article>
        <article>
          <span>Organizare internă</span>
          <strong>{current.triad.design.score.toFixed(2)} · {current.triad.design.label}</strong>
        </article>
        <article>
          <span>Focalizare conceptuală</span>
          <strong>
            {current.triad.business.score.toFixed(2)} · {current.triad.business.label}
          </strong>
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
  );
}
