import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthHeader } from "./auth-header";
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
          <AuthHeader />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
