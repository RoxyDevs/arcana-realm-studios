import Link from "next/link";

const MODULES = [
  { name: "Arcana Music", description: "AI DJ, AutoDJ, Playlist AI, Spotify & YouTube integration." },
  { name: "Arcana Guardian", description: "Anti-raid, anti-spam, behavior analysis, reputation score." },
  { name: "Arcana Intelligence", description: "Room analytics, heatmaps, host dashboard." },
  { name: "Arcana Studio", description: "Creator tools, asset backup, AI texture generation." },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 px-6 py-24 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-arcana-text sm:text-5xl">
          Arcana Realm Studios
        </h1>
        <p className="text-lg text-arcana-textMuted">
          The operating system for IMVU room owners, DJs, creators, and moderators.
        </p>
      </div>

      <Link
        href="/login"
        className="rounded-lg bg-arcana-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-arcana-accentMuted"
      >
        Sign in with Discord
      </Link>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULES.map((module) => (
          <div
            key={module.name}
            className="rounded-xl border border-arcana-border bg-arcana-surface p-6 text-left"
          >
            <h2 className="text-base font-medium text-arcana-text">{module.name}</h2>
            <p className="mt-1 text-sm text-arcana-textMuted">{module.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
