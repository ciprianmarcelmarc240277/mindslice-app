"use client";

import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { AddressForm } from "@/lib/mindslice/mindslice-types";

type UserProfilePayload = {
  profile?: {
    display_name?: string | null;
    pseudonym?: string | null;
    address_form?: AddressForm | null;
  };
};

type HeaderProfile = {
  addressForm: AddressForm;
};

function useHeaderProfile() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<HeaderProfile>({
    addressForm: "domnule",
  });

  useEffect(() => {
    if (!isSignedIn) {
      setProfile({
        addressForm: "domnule",
      });
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

        if (!cancelled) {
          setProfile({
            addressForm: payload.profile?.address_form || "domnule",
          });
        }
      } catch {
        if (!cancelled) {
          setProfile({
            addressForm: "domnule",
          });
        }
      }
    }

    loadProfile();

    function handleProfileUpdated(event: Event) {
      const customEvent = event as CustomEvent<{
        addressForm?: AddressForm;
        pseudonym?: string;
      }>;

      setProfile((previous) => ({
        addressForm: customEvent.detail?.addressForm || previous.addressForm,
      }));
    }

    window.addEventListener("profile-updated", handleProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, [isSignedIn, user]);

  return profile;
}

export function AuthHeader() {
  const profile = useHeaderProfile();

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: "12px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(69, 48, 34, 0.7)",
          }}
        >
          MindSlice
        </Link>
        <Link
          href="/about-theory"
          style={{
            fontSize: "12px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(69, 48, 34, 0.7)",
          }}
        >
          About / Theory
        </Link>
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
              {`Bun venit, ${profile.addressForm}!`}
            </strong>
          </div>
        </Show>
      </div>

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
          <SignInButton mode="modal">
            <button
              type="button"
              style={{
                border: "1px solid rgba(69, 48, 34, 0.18)",
                background: "rgba(255, 250, 243, 0.86)",
                color: "#2a211b",
                padding: "10px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Conectează-te
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              style={{
                border: "1px solid transparent",
                background: "#2a211b",
                color: "#f6efe5",
                padding: "10px 14px",
                borderRadius: "999px",
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Creează cont
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
