"use client";

import type {
  DebutStatus,
  SubscriptionStatus,
  UserProfile,
} from "@/lib/mindslice/mindslice-types";
import styles from "../page.module.css";

type AccountPanelProps = {
  accountMessage: string;
  isSignedIn: boolean;
  profile: UserProfile | null;
  displayNameInput: string;
  setDisplayNameInput: (value: string) => void;
  isSavingDisplayName: boolean;
  isEditingDisplayName: boolean;
  setIsEditingDisplayName: (value: boolean) => void;
  hasDisplayNameInput: boolean;
  canSaveDisplayName: boolean;
  handleDisplayNameSave: () => void;
  pseudonymInput: string;
  setPseudonymInput: (value: string) => void;
  isSavingPseudonym: boolean;
  isEditingPseudonym: boolean;
  setIsEditingPseudonym: (value: boolean) => void;
  handlePseudonymSave: () => void;
  middleNameInput: string;
  setMiddleNameInput: (value: string) => void;
  executiveNameInput: string;
  setExecutiveNameInput: (value: string) => void;
  executiveIndexInput: string;
  setExecutiveIndexInput: (value: string) => void;
  isSavingIdentityFormat: boolean;
  handleIdentityFormatSave: () => void;
  bioInput: string;
  setBioInput: (value: string) => void;
  bioSaveState: "idle" | "saved";
  setBioSaveState: (value: "idle" | "saved") => void;
  isSavingBio: boolean;
  hasBioChanges: boolean;
  handleBioSave: () => void;
  isEditingAddressForm: boolean;
  setIsEditingAddressForm: (value: boolean) => void;
  isSavingAddressForm: boolean;
  handleAddressFormChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  isSavingNameDeclaration: boolean;
  handleNameDeclarationChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hasActiveSubscription: boolean;
  debutStatusInput: DebutStatus;
  setDebutStatusInput: (value: DebutStatus) => void;
  artistStatementInput: string;
  setArtistStatementInput: (value: string) => void;
  isSavingDebutProgram: boolean;
  hasDebutProgramChanges: boolean;
  handleDebutProgramSave: () => void;
  currentDebutStatus: DebutStatus | null | undefined;
  isAdmin: boolean;
  adminTargetPseudonymInput: string;
  setAdminTargetPseudonymInput: (value: string) => void;
  adminSubscriptionOptions: Array<{
    user_id: string;
    pseudonym: string | null;
    subscription_status: SubscriptionStatus;
  }>;
  adminSubscriptionStatusInput: SubscriptionStatus;
  setAdminSubscriptionStatusInput: (value: SubscriptionStatus) => void;
  isSavingAdminSubscription: boolean;
  adminSubscriptionResult: {
    pseudonym: string | null;
    subscription_status: SubscriptionStatus;
    subscription_expires_at: string | null;
  } | null;
  handleAdminSubscriptionSave: () => void;
  formatQuotedPseudonym: (value: string) => string;
  formatSubscriptionStatusLabel: (value: SubscriptionStatus | null | undefined) => string;
  formatDebutStatusLabel: (value: DebutStatus | null | undefined) => string;
};

export function AccountPanel(props: AccountPanelProps) {
  const {
    accountMessage,
    isSignedIn,
    profile,
    displayNameInput,
    setDisplayNameInput,
    isSavingDisplayName,
    isEditingDisplayName,
    setIsEditingDisplayName,
    hasDisplayNameInput,
    canSaveDisplayName,
    handleDisplayNameSave,
    pseudonymInput,
    setPseudonymInput,
    isSavingPseudonym,
    isEditingPseudonym,
    setIsEditingPseudonym,
    handlePseudonymSave,
    middleNameInput,
    setMiddleNameInput,
    executiveNameInput,
    setExecutiveNameInput,
    executiveIndexInput,
    setExecutiveIndexInput,
    isSavingIdentityFormat,
    handleIdentityFormatSave,
    bioInput,
    setBioInput,
    bioSaveState,
    setBioSaveState,
    isSavingBio,
    hasBioChanges,
    handleBioSave,
    isEditingAddressForm,
    setIsEditingAddressForm,
    isSavingAddressForm,
    handleAddressFormChange,
    isSavingNameDeclaration,
    handleNameDeclarationChange,
    hasActiveSubscription,
    debutStatusInput,
    setDebutStatusInput,
    artistStatementInput,
    setArtistStatementInput,
    isSavingDebutProgram,
    hasDebutProgramChanges,
    handleDebutProgramSave,
    currentDebutStatus,
    isAdmin,
    adminTargetPseudonymInput,
    setAdminTargetPseudonymInput,
    adminSubscriptionOptions,
    adminSubscriptionStatusInput,
    setAdminSubscriptionStatusInput,
    isSavingAdminSubscription,
    adminSubscriptionResult,
    handleAdminSubscriptionSave,
    formatQuotedPseudonym,
    formatSubscriptionStatusLabel,
    formatDebutStatusLabel,
  } = props;

  return (
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
                    {profile.pseudonym ? formatQuotedPseudonym(profile.pseudonym) : "Nesetat încă"}
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
            <span>Format identitate</span>
            <div className={styles.accountInlineEditor}>
              <input
                type="text"
                value={middleNameInput}
                onChange={(event) => setMiddleNameInput(event.target.value)}
                disabled={isSavingIdentityFormat}
                className={styles.accountInput}
                placeholder="Prenume median sau inițială pentru ORCHESTRATOR"
              />
              <input
                type="text"
                value={executiveNameInput}
                onChange={(event) => setExecutiveNameInput(event.target.value)}
                disabled={isSavingIdentityFormat}
                className={styles.accountInput}
                placeholder="Nume executiv afișat"
              />
              <textarea
                value={executiveIndexInput}
                onChange={(event) => setExecutiveIndexInput(event.target.value)}
                disabled={isSavingIdentityFormat}
                className={styles.accountTextarea}
                placeholder={"Index executiv, ex:\nIonescu,\nAndrei"}
                rows={3}
              />
              <p className={styles.accountHint}>
                Aceste preferințe intră în joc doar la rank-urile care deblochează formate mai
                avansate ale identității.
              </p>
              <div className={styles.accountActionRow}>
                <button
                  type="button"
                  className={styles.accountButton}
                  onClick={handleIdentityFormatSave}
                  disabled={isSavingIdentityFormat}
                >
                  {isSavingIdentityFormat ? "Se salvează..." : "Salvează formatul"}
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
            <span>Identity engine</span>
            <div className={styles.accountInlineEditor}>
              <strong className={styles.inlineStatusValue}>
                identity_type: {profile.identity_type ?? "pseudonym"}
              </strong>
              <strong className={styles.inlineStatusValue}>
                author_role: {profile.author_role ?? "free"}
              </strong>
              <p className={styles.accountHint}>
                `indexed` apare doar când numele este valid, consimțământul este activ, iar
                `active_author` apare când abonamentul este activ.
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
                  disabled={isSavingDebutProgram || !hasDebutProgramChanges || !hasActiveSubscription}
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
                      event.target.value as "inactive" | "active" | "past_due" | "canceled",
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
                    {formatSubscriptionStatusLabel(adminSubscriptionResult.subscription_status)}
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
                    {isSavingAdminSubscription ? "Se actualizează..." : "Actualizează abonamentul"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
