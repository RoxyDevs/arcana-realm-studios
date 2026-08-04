import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import { QueryProvider } from "@/components/query-provider";
import { BackgroundFx } from "@/components/background-fx";
import { FaqChatWidget } from "@/components/faq-chat-widget";
import "./globals.css";

// Orbitron: angular, sci-fi display font for headings — the "holographic
// future" read. Rajdhani: a geometric, tech-flavored body font that still
// stays legible at small sizes (unlike Orbitron, which is display-only).
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800", "900"],
});
const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Arcana Realm Studios",
  description: "The operating system for IMVU room owners, DJs, creators, and moderators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${orbitron.variable} ${rajdhani.variable}`}>
      <body className="min-h-screen bg-arcana-bg font-sans text-base antialiased">
        <BackgroundFx />
        <QueryProvider>{children}</QueryProvider>
        <FaqChatWidget />
      </body>
    </html>
  );
}
