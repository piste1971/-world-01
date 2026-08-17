import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WORLD//01 — Mission 000",
  description:
    "WORLD//01 is building a global network. The world is the room.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
