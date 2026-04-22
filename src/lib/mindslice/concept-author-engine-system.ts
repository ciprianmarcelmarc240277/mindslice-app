import type {
  AuthorIdentityType,
  AuthorRole,
  SubscriptionStatus,
  UserProfile,
} from "@/lib/mindslice/mindslice-types";

type ActivateAuthorIdentityInput = {
  displayName: string | null;
  pseudonym: string | null;
  consentFlag: boolean;
};

type ActivateSubscriptionInput = {
  currentRole: AuthorRole;
  subscriptionStatus: SubscriptionStatus | null | undefined;
};

const INDEXED_NAME_PATTERN =
  /^\p{L}+(?:[ '-]\p{L}+){0,2},\s\p{L}+(?:[ '-]\p{L}+){0,2}$/u;

function splitIndexedName(value: string) {
  const [familyName, givenName] = value.split(",").map((entry) => entry.trim());

  return {
    lastName: familyName || null,
    firstName: givenName || null,
  };
}

export function createUser() {
  return {
    provider: "clerk",
    role: "free" as AuthorRole,
    identity: "pseudonym" as AuthorIdentityType,
  };
}

export function activateAuthorIdentity(input: ActivateAuthorIdentityInput) {
  if (input.consentFlag && input.displayName && INDEXED_NAME_PATTERN.test(input.displayName)) {
    const splitName = splitIndexedName(input.displayName);

    return {
      identityType: "indexed" as const,
      indexedName: input.displayName,
      firstName: splitName.firstName,
      lastName: splitName.lastName,
      pseudonym: input.pseudonym,
      consentFlag: true,
    };
  }

  return anonymizeUser({
    pseudonym: input.pseudonym,
  });
}

export function activateSubscription(input: ActivateSubscriptionInput) {
  if (input.subscriptionStatus === "active") {
    return "active_author" as const;
  }

  return input.currentRole;
}

export function anonymizeUser(input: { pseudonym: string | null }) {
  return {
    identityType: "pseudonym" as const,
    indexedName: null,
    firstName: null,
    lastName: null,
    pseudonym: input.pseudonym,
    consentFlag: false,
  };
}

export function deriveAuthorRole(input: {
  identityType: AuthorIdentityType;
  subscriptionStatus: SubscriptionStatus | null | undefined;
}) {
  const baseRole: AuthorRole = input.identityType === "indexed" ? "author" : createUser().role;

  return activateSubscription({
    currentRole: baseRole,
    subscriptionStatus: input.subscriptionStatus,
  });
}

export function buildAuthorProfileSnapshot(input: {
  profile: Pick<
    UserProfile,
    | "display_name"
    | "pseudonym"
    | "name_declaration_accepted"
    | "subscription_status"
    | "identity_type"
    | "author_role"
  > | null;
}) {
  const defaultState = createUser();
  const identity = activateAuthorIdentity({
    displayName: input.profile?.display_name ?? null,
    pseudonym: input.profile?.pseudonym ?? null,
    consentFlag: Boolean(input.profile?.name_declaration_accepted ?? false),
  });
  const role = deriveAuthorRole({
    identityType: identity.identityType ?? input.profile?.identity_type ?? defaultState.identity,
    subscriptionStatus: input.profile?.subscription_status ?? "inactive",
  });

  return {
    identity,
    role,
  };
}
