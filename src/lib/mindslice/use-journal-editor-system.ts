"use client";

import { useEffect, useState } from "react";
import type { BlogPostDraft } from "@/lib/mindslice/mindslice-types";

type UseJournalEditorSystemOptions<TDraft extends BlogPostDraft> = {
  isSignedIn: boolean;
  onLoadError?: (message: string) => void;
  deriveSourceText: (draft: TDraft) => string;
  deriveEditorialText: (draft: TDraft) => string;
};

export function useJournalEditorSystem<TDraft extends BlogPostDraft>({
  isSignedIn,
  onLoadError,
  deriveSourceText,
  deriveEditorialText,
}: UseJournalEditorSystemOptions<TDraft>) {
  const [blogPosts, setBlogPosts] = useState<TDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftTitleInput, setDraftTitleInput] = useState("");
  const [draftExcerptInput, setDraftExcerptInput] = useState("");
  const [draftSourceTextInput, setDraftSourceTextInput] = useState("");
  const [draftContentInput, setDraftContentInput] = useState("");
  const [senseWeightInput, setSenseWeightInput] = useState("0.4");
  const [structureWeightInput, setStructureWeightInput] = useState("0.3");
  const [attentionWeightInput, setAttentionWeightInput] = useState("0.3");
  const [influenceModeInput, setInfluenceModeInput] = useState<
    "whisper" | "echo" | "rupture" | "counterpoint" | "stain"
  >("whisper");
  const [isContaminantInput, setIsContaminantInput] = useState(true);
  const [isDebutSubmissionInput, setIsDebutSubmissionInput] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setBlogPosts([]);
      setActiveDraftId(null);
      return;
    }

    let cancelled = false;

    async function loadBlogPosts() {
      try {
        const response = await fetch("/api/blog-posts", { cache: "no-store" });
        const payload = (await response.json()) as {
          blogPosts?: TDraft[];
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
        if (!cancelled && onLoadError) {
          onLoadError(
            error instanceof Error ? error.message : "Nu am putut încărca drafturile de jurnal.",
          );
        }
      }
    }

    loadBlogPosts();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, onLoadError]);

  useEffect(() => {
    const activeDraft = blogPosts.find((entry) => entry.id === activeDraftId);
    if (!activeDraft) {
      return;
    }

    setDraftTitleInput(activeDraft.title);
    setDraftExcerptInput(activeDraft.excerpt ?? "");
    setDraftSourceTextInput(deriveSourceText(activeDraft));
    setDraftContentInput(deriveEditorialText(activeDraft));
    setSenseWeightInput(String(activeDraft.sense_weight ?? 0));
    setStructureWeightInput(String(activeDraft.structure_weight ?? 0));
    setAttentionWeightInput(String(activeDraft.attention_weight ?? 0));
    setInfluenceModeInput(activeDraft.influence_mode);
    setIsContaminantInput(activeDraft.is_contaminant);
    setIsDebutSubmissionInput(Boolean(activeDraft.is_debut_submission));
  }, [activeDraftId, blogPosts, deriveEditorialText, deriveSourceText]);

  function hydrateDraft(draft: TDraft) {
    setActiveDraftId(draft.id);
    setDraftTitleInput(draft.title);
    setDraftExcerptInput(draft.excerpt ?? "");
    setDraftSourceTextInput(deriveSourceText(draft));
    setDraftContentInput(deriveEditorialText(draft));
    setSenseWeightInput(String(draft.sense_weight ?? 0));
    setStructureWeightInput(String(draft.structure_weight ?? 0));
    setAttentionWeightInput(String(draft.attention_weight ?? 0));
    setInfluenceModeInput(draft.influence_mode);
    setIsContaminantInput(draft.is_contaminant);
    setIsDebutSubmissionInput(Boolean(draft.is_debut_submission));
  }

  function prependOrReplaceDraft(draft: TDraft) {
    setBlogPosts((previous) => {
      const next = previous.filter((entry) => entry.id !== draft.id);
      return [draft, ...next];
    });
  }

  function replaceDraft(draft: TDraft) {
    setBlogPosts((previous) =>
      previous.map((entry) => (entry.id === draft.id ? draft : entry)),
    );
  }

  return {
    blogPosts,
    setBlogPosts,
    activeDraftId,
    setActiveDraftId,
    draftTitleInput,
    setDraftTitleInput,
    draftExcerptInput,
    setDraftExcerptInput,
    draftSourceTextInput,
    setDraftSourceTextInput,
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
  };
}
