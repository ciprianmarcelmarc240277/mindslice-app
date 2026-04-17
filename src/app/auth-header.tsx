"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

function useDisplayName() {
  const { user } = useUser();

  return (
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Contul tău"
  );
}

export function AuthHeader() {
  const displayName = useDisplayName();

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
            {displayName}
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
