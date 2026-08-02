import Link from "next/link";

const MODULES = [
  { name: "Arcana Music", description: "AI DJ, AutoDJ, Playlist AI, Spotify & YouTube integration.", accent: "cyan" as const },
  { name: "Arcana Guardian", description: "Anti-raid, anti-spam, behavior analysis, reputation score.", accent: "pink" as const },
  { name: "Arcana Intelligence", description: "Room analytics, heatmaps, host dashboard.", accent: "cyan" as const },
  { name: "Arcana Studio", description: "Creator tools, asset backup, AI texture generation.", accent: "pink" as const },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 px-6 py-24 text-center">
      <div className="space-y-4">
        <h1 className="text-shadow-neon-cyan text-4xl font-bold tracking-tight text-arcana-text sm:text-6xl">
          Arcana Realm Studios
        </h1>
        <p className="text-lg text-arcana-textMuted">
          The operating system for IMVU room owners, DJs, creators, and moderators.
        </p>
      </div>

      <Link
        href="/login"
        className="rounded-lg border border-arcana-cyan/60 bg-arcana-cyan/10 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-arcana-cyan shadow-neon-cyan-sm transition-all hover:bg-arcana-cyan/20 hover:shadow-neon-cyan"
      >
        Sign in with Discord
      </Link>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULES.map((module) => (
          <div
            key={module.name}
            className={
              "group rounded-xl border bg-arcana-surface/80 p-6 text-left backdrop-blur-sm transition-all " +
              (module.accent === "cyan"
                ? "border-arcana-border hover:border-arcana-cyan/70 hover:shadow-neon-cyan-sm"
                : "border-arcana-border hover:border-arcana-pink/70 hover:shadow-neon-pink-sm")
            }
          >
            <h2
              className={
                "text-base font-semibold " +
                (module.accent === "cyan" ? "text-arcana-cyan" : "text-arcana-pink")
              }
            >
              {module.name}
            </h2>
            <p className="mt-1 text-sm text-arcana-textMuted">{module.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
