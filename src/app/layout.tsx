import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/manrope";
import "@fontsource/instrument-serif";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velora — Less swiping. More something real.",
  description: "A thoughtful dating experience built around honest intentions, shared interests and conversations with somewhere to go.",
};

export const viewport: Viewport = {
  themeColor: "#1c101c",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
