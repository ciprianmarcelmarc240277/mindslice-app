import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindSlice Live Artist",
  description: "AI artist live care gândește artă și construiește prompturi în timp real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>
        <ClerkProvider>
          <header
            style={{
              width: "min(1420px, calc(100% - 32px))",
              margin: "0 auto",
              padding: "20px 0 0",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
