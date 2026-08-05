import Link from "next/link";
import Image from "next/image";
import { GlitchText } from "@/components/glitch-text";
import { SpotlightContainer } from "@/components/spotlight-container";
import { HeroFlyerCarousel } from "@/components/hero-flyer-carousel";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const MODULES = [
  { name: "Arcana Music", description: "AI DJ, AutoDJ, Playlist AI, Spotify & YouTube integration.", accent: "cyan" as const },
  { name: "Arcana Guardian", description: "Anti-raid, anti-spam, behavior analysis, reputation score.", accent: "pink" as const },
  { name: "Arcana Intelligence", description: "Room analytics, heatmaps, host dashboard.", accent: "cyan" as const },
  { name: "Arcana Studio", description: "Creator tools, asset backup, AI texture generation.", accent: "pink" as const },
];

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 overflow-hidden px-6 py-24 text-center">
      <span
        aria-hidden
        className="jp-watermark absolute -top-8 right-0 select-none text-[clamp(6rem,22vw,14rem)] font-black leading-none sm:right-8"
      >
        近未来
      </span>

      <HeroFlyerCarousel />

      <SpotlightContainer>
        <div className="space-y-5 p-4">
          <h1 className="text-holo font-display text-[clamp(2.5rem,8vw,5rem)] font-black leading-[1.05] tracking-tight">
            <GlitchText text="Arcana Realm Studios" />
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-arcana-textMuted sm:text-xl">
            The operating system for IMVU room owners, DJs, creators, and moderators.
          </p>
        </div>
      </SpotlightContainer>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href={`${API_URL}/auth/discord`}
          className="animate-neon-pulse rounded-lg border border-arcana-cyan/60 bg-arcana-cyan/10 px-8 py-4 text-base font-semibold uppercase tracking-wide text-arcana-cyan shadow-neon-cyan-sm transition-all hover:bg-arcana-cyan/20 hover:shadow-neon-cyan"
        >
          Sign in with Discord
        </a>
        <Link
          href="/pricing"
          className="rounded-lg border border-arcana-border px-8 py-4 text-base font-semibold uppercase tracking-wide text-arcana-text transition-all hover:border-arcana-pink/60"
        >
          Pricing
        </Link>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-arcana-border">
        <Image
          src="/marketing/flyer-banner-wide.png"
          alt="Arcana Realm Studios — live radio 24/7, AI playlist match, always-connected IMVU bot"
          width={2172}
          height={724}
          sizes="(min-width: 1024px) 64rem, 100vw"
          className="w-full"
        />
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULES.map((module) => (
          <div
            key={module.name}
            className={
              "group relative overflow-hidden rounded-xl border bg-arcana-surface/80 p-6 text-left backdrop-blur-sm transition-all " +
              (module.accent === "cyan"
                ? "border-arcana-border hover:border-arcana-cyan/70 hover:shadow-neon-cyan-sm"
                : "border-arcana-border hover:border-arcana-pink/70 hover:shadow-neon-pink-sm")
            }
          >
            <span
              aria-hidden
              className={
                "pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 -translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-[350%] " +
                (module.accent === "cyan"
                  ? "bg-gradient-to-r from-transparent via-arcana-cyan/20 to-transparent"
                  : "bg-gradient-to-r from-transparent via-arcana-pink/20 to-transparent")
              }
            />
            <h2
              className={
                "font-display text-lg font-bold tracking-wide " +
                (module.accent === "cyan" ? "text-arcana-cyan" : "text-arcana-pink")
              }
            >
              {module.name}
            </h2>
            <p className="mt-1.5 text-base text-arcana-textMuted">{module.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
