"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

type AddressForm = "domnule" | "doamnă" | "domnișoară";

type UserProfilePayload = {
  profile?: {
    address_form?: AddressForm | null;
  };
};

function useWelcomeName() {
  const { user } = useUser();
  const fullName = user?.fullName?.trim();
  const lastName = user?.lastName?.trim();

  if (lastName) {
    return lastName;
  }

  if (fullName?.includes(",")) {
    return fullName.split(",")[0]?.trim() || "domnule";
  }

  if (fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    return parts.at(-1) || fullName;
  }

  return (
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "domnule"
  );
}

function useAddressForm() {
  const { isSignedIn } = useAuth();
  const [addressForm, setAddressForm] = useState<AddressForm>("domnule");

  useEffect(() => {
    if (!isSignedIn) {
      setAddressForm("domnule");
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/user-state", { cache: "no-store" });
        const payload = (await response.json()) as UserProfilePayload;

        if (!response.ok) {
          throw new Error("Nu am putut încărca profilul.");
        }

        if (!cancelled && payload.profile?.address_form) {
          setAddressForm(payload.profile.address_form);
        }
      } catch {
        if (!cancelled) {
          setAddressForm("domnule");
        }
      }
    }

    loadProfile();

    function handleAddressFormUpdated(event: Event) {
      const customEvent = event as CustomEvent<{ addressForm?: AddressForm }>;
      if (customEvent.detail?.addressForm) {
        setAddressForm(customEvent.detail.addressForm);
      }
    }

    window.addEventListener("address-form-updated", handleAddressFormUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("address-form-updated", handleAddressFormUpdated);
    };
  }, [isSignedIn]);

  return addressForm;
}

export function AuthHeader() {
  const welcomeName = useWelcomeName();
  const addressForm = useAddressForm();

  return (
    <header
      style={{
        width: "min(1420px, calc(100% - 32px))",
        margin: "0 auto",
        padding: "20px 0 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <Show when="signed-in">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(69, 48, 34, 0.58)",
            }}
          >
            Cont conectat
          </span>
          <strong
            style={{
              fontSize: "15px",
              color: "#2a211b",
            }}
          >
            {`Bun venit, ${addressForm} ${welcomeName}!`}
          </strong>
        </div>
      </Show>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "12px",
          marginLeft: "auto",
        }}
      >
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
