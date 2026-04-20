"use client";

import type {
  BlogPostDraft,
  InteriorChatMessage,
  LiveInterference,
  UserProfile,
} from "@/lib/mindslice/mindslice-types";
import styles from "../page.module.css";

type JournalViewProps = {
  interiorChatInput: string;
  setInteriorChatInput: (value: string) => void;
  isSendingInteriorChatMessage: boolean;
  hasPseudonym: boolean;
  handleInteriorChatSend: () => void;
  interiorChatMessages: InteriorChatMessage[];
  profile: Pick<UserProfile, "user_id"> | null;
  followedUserIds: string[];
  followActionUserId: string | null;
  handleFollowToggle: (targetUserId: string, shouldFollow: boolean) => void;
  formatPublicAuthor: (value: string | null | undefined) => string;
  publishedPosts: BlogPostDraft[];
  handleRegenerateAiResponse: (postId: string) => void;
  regeneratingAiResponsePostId: string | null;
  getPublishedEntryPreview: (entry: BlogPostDraft) => string;
  onOpenArchive: () => void;
  interference: LiveInterference | null;
};

export function JournalView(props: JournalViewProps) {
  const {
    interiorChatInput,
    setInteriorChatInput,
    isSendingInteriorChatMessage,
    hasPseudonym,
    handleInteriorChatSend,
    interiorChatMessages,
    profile,
    followedUserIds,
    followActionUserId,
    handleFollowToggle,
    formatPublicAuthor,
    publishedPosts,
    handleRegenerateAiResponse,
    regeneratingAiResponsePostId,
    getPublishedEntryPreview,
    onOpenArchive,
    interference,
  } = props;

  return (
    <>
      <section className={styles.panelBlock}>
        <span className={styles.panelMarker}>PANEL · Interior Group Chat</span>
        <div className={styles.blogHeading}>
          <p className={styles.eyebrow}>Interior Chat</p>
          <h2>Discuția interioară comună</h2>
          <p className={styles.blogIntro}>
            Un singur grup pentru toți cei din aplicație. Fiecare mesaj apare sub pseudonim.
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
              disabled={isSendingInteriorChatMessage || !hasPseudonym || !interiorChatInput.trim()}
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
            Fragmentele de mai jos transformă fiecare felie într-o intrare de blog: concept,
            atmosferă și direcție vizuală.
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
                {entry.author_user_id && profile?.user_id === entry.author_user_id ? (
                  <button
                    type="button"
                    className={styles.aiResponseButton}
                    onClick={() => handleRegenerateAiResponse(entry.id)}
                    disabled={regeneratingAiResponsePostId === entry.id}
                  >
                    {regeneratingAiResponsePostId === entry.id
                      ? "Se regenerează..."
                      : "Regenerare răspuns AI"}
                  </button>
                ) : null}
                <p className={styles.blogContentPreview}>{getPublishedEntryPreview(entry)}</p>
                {entry.ai_response_text?.trim() ? (
                  <div className={styles.blogAiResponse}>
                    <span className={styles.blogAiResponseLabel}>Artist AI response</span>
                    <p>{entry.ai_response_text}</p>
                  </div>
                ) : null}
                <strong>
                  {entry.influence_mode} · sense {entry.sense_weight.toFixed(2)} · structure{" "}
                  {entry.structure_weight.toFixed(2)} · attention {entry.attention_weight.toFixed(2)}
                </strong>
              </article>
            ))
          ) : (
            <button
              type="button"
              className={`${styles.blogCard} ${styles.blogCardPlaceholder}`}
              onClick={onOpenArchive}
            >
              <span className={styles.blogMeta}>Fără articole publicate</span>
              <h3>Publică primul jurnal contaminant</h3>
              <p>
                Intră în Archive, transformă un moment salvat în draft și publică-l ca sursă
                de interferență.
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
  );
}
