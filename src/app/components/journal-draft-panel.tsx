"use client";

import type { BlogPostDraft, InfluenceMode } from "@/lib/mindslice/mindslice-types";
import styles from "../page.module.css";

type JournalDraftPanelProps = {
  blogPosts: BlogPostDraft[];
  activeDraftId: string | null;
  handleSelectDraft: (draft: BlogPostDraft) => void;
  draftTitleInput: string;
  setDraftTitleInput: (value: string) => void;
  draftExcerptInput: string;
  setDraftExcerptInput: (value: string) => void;
  draftSourceTextInput: string;
  draftContentInput: string;
  setDraftContentInput: (value: string) => void;
  senseWeightInput: string;
  setSenseWeightInput: (value: string) => void;
  structureWeightInput: string;
  setStructureWeightInput: (value: string) => void;
  attentionWeightInput: string;
  setAttentionWeightInput: (value: string) => void;
  influenceModeInput: InfluenceMode;
  setInfluenceModeInput: (value: InfluenceMode) => void;
  isContaminantInput: boolean;
  setIsContaminantInput: (value: boolean) => void;
  isDebutSubmissionInput: boolean;
  setIsDebutSubmissionInput: (value: boolean) => void;
  hasActiveSubscription: boolean;
  handleSaveDraft: () => void;
  isSavingDraft: boolean;
  handlePublishDraft: () => void;
  isPublishingDraft: boolean;
  draftEditorMessage: string | null;
  draftEditorMessageTone: "neutral" | "success" | "error";
};

export function JournalDraftPanel(props: JournalDraftPanelProps) {
  const {
    blogPosts,
    activeDraftId,
    handleSelectDraft,
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
    hasActiveSubscription,
    handleSaveDraft,
    isSavingDraft,
    handlePublishDraft,
    isPublishingDraft,
    draftEditorMessage,
    draftEditorMessageTone,
  } = props;

  return (
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
            <label className={styles.editorLabel} htmlFor="draft-source-text">
              Text de pornire
            </label>
            <textarea
              id="draft-source-text"
              value={draftSourceTextInput}
              readOnly
              className={styles.editorContentReadonly}
            />
            <label className={styles.editorLabel} htmlFor="draft-content">
              Text editorial final
            </label>
            <textarea
              id="draft-content"
              value={draftContentInput}
              onChange={(event) => setDraftContentInput(event.target.value)}
              className={styles.editorContent}
              placeholder="Rescrie aici intrarea de jurnal finală pe care vrei să o publici."
            />
            <div className={styles.influenceEditorGrid}>
              <div>
                <label className={styles.editorLabel} htmlFor="sense-weight">
                  Sens
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
                  Organizare internă
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
                  Focalizare conceptuală
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
              Mod de influență
            </label>
            <select
              id="influence-mode"
              value={influenceModeInput}
              onChange={(event) => setInfluenceModeInput(event.target.value as InfluenceMode)}
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
            {draftEditorMessage ? (
              <p
                className={`${styles.draftEditorMessage} ${
                  draftEditorMessageTone === "success"
                    ? styles.draftEditorMessageSuccess
                    : draftEditorMessageTone === "error"
                      ? styles.draftEditorMessageError
                      : ""
                }`}
              >
                {draftEditorMessage}
              </p>
            ) : null}
          </div>
        ) : (
          <p className={styles.accountMessage}>
            Creează sau selectează un draft pentru a începe redactarea.
          </p>
        )}
      </section>
    </>
  );
}
