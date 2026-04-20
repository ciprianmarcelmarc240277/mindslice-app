"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import type {
  AddressForm,
  AdminSubscriptionOption,
  AdminSubscriptionProfile,
  DebutStatus,
  SavedMoment,
  SubscriptionStatus,
  UserProfile,
} from "@/lib/mindslice/mindslice-types";

type UseAccountProfileSystemOptions = {
  isSignedIn: boolean;
  onMessage: (message: string) => void;
  normalizeDisplayName: (value: string) => string;
  isValidFamilyAndGivenName: (value: string) => boolean;
};

function dispatchProfileUpdated(profile: UserProfile, fallbackDisplayName: string, fallbackPseudonym: string) {
  window.dispatchEvent(
    new CustomEvent("profile-updated", {
      detail: {
        addressForm: profile.address_form ?? "domnule",
        displayName: profile.display_name ?? fallbackDisplayName,
        pseudonym: profile.pseudonym ?? fallbackPseudonym,
      },
    }),
  );
}

export function useAccountProfileSystem({
  isSignedIn,
  onMessage,
  normalizeDisplayName,
  isValidFamilyAndGivenName,
}: UseAccountProfileSystemOptions) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedMoments, setSavedMoments] = useState<SavedMoment[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasLoadedUserState, setHasLoadedUserState] = useState(false);

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
  const [debutStatusInput, setDebutStatusInput] = useState<DebutStatus>("aspirant");
  const [isSavingDebutProgram, setIsSavingDebutProgram] = useState(false);

  const [adminSubscriptionOptions, setAdminSubscriptionOptions] = useState<
    AdminSubscriptionOption[]
  >([]);
  const [adminTargetPseudonymInput, setAdminTargetPseudonymInput] = useState("");
  const [adminSubscriptionStatusInput, setAdminSubscriptionStatusInput] =
    useState<SubscriptionStatus>("inactive");
  const [isSavingAdminSubscription, setIsSavingAdminSubscription] = useState(false);
  const [adminSubscriptionResult, setAdminSubscriptionResult] =
    useState<AdminSubscriptionProfile | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setHasLoadedUserState(true);
      setSavedMoments([]);
      setProfile(null);
      setIsAdmin(false);
      onMessage("Conectează-te pentru a salva momente.");
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
          onMessage(
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
          onMessage(
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
  }, [isSignedIn, isValidFamilyAndGivenName, normalizeDisplayName, onMessage]);

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
          onMessage(
            error instanceof Error ? error.message : "Nu am putut încărca lista de pseudonime.",
          );
        }
      }
    }

    loadAdminSubscriptionOptions();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isSignedIn, onMessage]);

  async function handleAddressFormChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextAddressForm = event.target.value as AddressForm;

    if (!isSignedIn) {
      onMessage("Autentifică-te ca să-ți poți seta formula de adresare.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressForm: nextAddressForm }),
      });

      const payload = (await response.json()) as { profile?: UserProfile; error?: string };
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut actualiza formula de adresare.");
      }

      setProfile(payload.profile);
      setIsEditingAddressForm(false);
      dispatchProfileUpdated(payload.profile, displayNameInput, pseudonymInput);
      onMessage("Formula de adresare a fost actualizată.");
    } catch (error) {
      onMessage(
        error instanceof Error ? error.message : "Nu am putut actualiza formula de adresare.",
      );
    } finally {
      setIsSavingAddressForm(false);
    }
  }

  async function handleDisplayNameSave() {
    const nextDisplayName = normalizeDisplayName(displayNameInput);

    if (!isSignedIn) {
      onMessage("Autentifică-te ca să-ți poți seta numele afișat.");
      return;
    }

    if (!nextDisplayName) {
      onMessage("Numele afișat nu poate fi gol.");
      return;
    }

    if (!isValidFamilyAndGivenName(nextDisplayName)) {
      onMessage('Folosește formatul "Nume de familie, Prenume", fără alias sau alte entități.');
      return;
    }

    setIsSavingDisplayName(true);

    try {
      const response = await fetch("/api/user-state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: nextDisplayName }),
      });

      const payload = (await response.json()) as { profile?: UserProfile; error?: string };
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut actualiza numele afișat.");
      }

      setProfile(payload.profile);
      setDisplayNameInput(payload.profile.display_name ?? nextDisplayName);
      setIsEditingDisplayName(false);
      dispatchProfileUpdated(payload.profile, nextDisplayName, pseudonymInput);
      onMessage(
        payload.profile.name_declaration_accepted
          ? "Numele a fost actualizat. Accesul în aplicație este activ."
          : "Numele a fost actualizat. Mai trebuie să bifezi declarația de nume pentru a activa accesul.",
      );
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Nu am putut actualiza numele afișat.");
    } finally {
      setIsSavingDisplayName(false);
    }
  }

  async function handlePseudonymSave() {
    const nextPseudonym = pseudonymInput.trim();

    if (!isSignedIn) {
      onMessage("Autentifică-te ca să-ți poți seta pseudonimul.");
      return;
    }

    if (!nextPseudonym) {
      onMessage("Pseudonimul nu poate fi gol.");
      return;
    }

    setIsSavingPseudonym(true);

    try {
      const response = await fetch("/api/user-state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonym: nextPseudonym }),
      });

      const payload = (await response.json()) as { profile?: UserProfile; error?: string };
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut actualiza pseudonimul.");
      }

      setProfile(payload.profile);
      setPseudonymInput(payload.profile.pseudonym ?? nextPseudonym);
      setIsEditingPseudonym(false);
      dispatchProfileUpdated(payload.profile, displayNameInput, nextPseudonym);
      onMessage("Pseudonimul a fost actualizat.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Nu am putut actualiza pseudonimul.");
    } finally {
      setIsSavingPseudonym(false);
    }
  }

  async function handleBioSave(hasProfileAccess: boolean) {
    if (!isSignedIn) {
      onMessage("Autentifică-te ca să-ți poți seta bio-ul.");
      return;
    }

    if (!hasProfileAccess) {
      onMessage(
        "Completează numele și declarația din PANEL · Account Profile ca să poți continua.",
      );
      return;
    }

    setIsSavingBio(true);
    setBioSaveState("idle");

    try {
      const response = await fetch("/api/user-state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioInput.trim() }),
      });

      const payload = (await response.json()) as { profile?: UserProfile; error?: string };
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut actualiza bio-ul.");
      }

      setProfile(payload.profile);
      setBioInput(payload.profile.bio ?? "");
      setBioSaveState("saved");
      onMessage("Bio-ul a fost actualizat.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Nu am putut actualiza bio-ul.");
    } finally {
      setIsSavingBio(false);
    }
  }

  async function handleNameDeclarationChange(event: ChangeEvent<HTMLInputElement>) {
    const nextAccepted = event.target.checked;

    if (!isSignedIn) {
      onMessage("Autentifică-te ca să poți declara numele real.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameDeclarationAccepted: nextAccepted }),
      });

      const payload = (await response.json()) as { profile?: UserProfile; error?: string };
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut salva declarația de nume.");
      }

      setProfile(payload.profile);
      dispatchProfileUpdated(payload.profile, displayNameInput, pseudonymInput);
      onMessage(
        nextAccepted
          ? "Declarația de nume a fost salvată."
          : "Declarația de nume a fost retrasă. Accesul rămâne blocat.",
      );
    } catch (error) {
      setProfile((previous) =>
        previous ? { ...previous, name_declaration_accepted: !nextAccepted } : previous,
      );
      onMessage(
        error instanceof Error ? error.message : "Nu am putut salva declarația de nume.",
      );
    } finally {
      setIsSavingNameDeclaration(false);
    }
  }

  async function handleDebutProgramSave(hasProfileAccess: boolean) {
    if (!isSignedIn) {
      onMessage("Autentifică-te ca să poți seta programul de debut artistic.");
      return;
    }

    if (!hasProfileAccess) {
      onMessage(
        "Completează numele și declarația din PANEL · Account Profile ca să poți continua.",
      );
      return;
    }

    if (profile?.subscription_status !== "active") {
      onMessage("Programul de debut artistic este disponibil doar cu abonament lunar activ.");
      return;
    }

    setIsSavingDebutProgram(true);

    try {
      const response = await fetch("/api/user-state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistStatement: artistStatementInput.trim(),
          debutStatus: debutStatusInput,
        }),
      });

      const payload = (await response.json()) as { profile?: UserProfile; error?: string };
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "Nu am putut salva programul de debut artistic.");
      }

      setProfile(payload.profile);
      setArtistStatementInput(payload.profile.artist_statement ?? "");
      setDebutStatusInput(payload.profile.debut_status ?? "aspirant");
      onMessage("Programul de debut artistic a fost actualizat.");
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : "Nu am putut salva programul de debut artistic.",
      );
    } finally {
      setIsSavingDebutProgram(false);
    }
  }

  async function handleAdminSubscriptionSave() {
    const targetPseudonym = adminTargetPseudonymInput.trim();

    if (!isSignedIn || !isAdmin) {
      onMessage("Doar un admin poate modifica manual abonamentele.");
      return;
    }

    if (!targetPseudonym) {
      onMessage("Introdu pseudonimul pentru care vrei să schimbi abonamentul.");
      return;
    }

    setIsSavingAdminSubscription(true);

    try {
      const response = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        previous.map((entry) => (entry.user_id === payload.profile?.user_id ? payload.profile : entry)),
      );
      onMessage("Abonamentul a fost actualizat manual de admin.");

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
      onMessage(error instanceof Error ? error.message : "Nu am putut actualiza abonamentul.");
    } finally {
      setIsSavingAdminSubscription(false);
    }
  }

  return {
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
  };
}
