import type { Metadata } from "next";
import { QueryProvider } from "@/components/query-provider";
import { BackgroundFx } from "@/components/background-fx";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcana Realm Studios",
  description: "The operating system for IMVU room owners, DJs, creators, and moderators.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-arcana-bg font-sans antialiased">
        <BackgroundFx />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
