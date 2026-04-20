"use client";

import type {
  HistoryEntry,
  SavedMoment,
  ThoughtMemoryEntry,
} from "@/lib/mindslice/mindslice-types";
import styles from "../page.module.css";

type ArchivePanelProps = {
  history: HistoryEntry[];
  thoughtMemory: ThoughtMemoryEntry[];
  savedMoments: SavedMoment[];
  handleCreateDraftFromMoment: (savedMomentId: string) => void;
  draftingMomentId: string | null;
  promptOutput: string;
};

export function ArchivePanel(props: ArchivePanelProps) {
  const {
    history,
    thoughtMemory,
    savedMoments,
    handleCreateDraftFromMoment,
    draftingMomentId,
    promptOutput,
  } = props;

  return (
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
                  {entry.source_type} · sens {entry.sense_score.toFixed(2)} · organizare internă{" "}
                  {entry.structure_score.toFixed(2)} · focalizare conceptuală{" "}
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
  );
}
