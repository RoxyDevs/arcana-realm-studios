import { GlitchText } from "@/components/glitch-text";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-shadow-neon-pink font-display text-[clamp(1.75rem,6vw,2.75rem)] font-black text-arcana-text">
        <GlitchText text="Sign in to Arcana Realm Studios" />
      </h1>
      <p className="max-w-sm text-base text-arcana-textMuted sm:text-lg">
        Authentication is handled by Discord OAuth. You&apos;ll be redirected back to your
        dashboard once it completes.
      </p>
      <a
        href={`${API_URL}/auth/discord`}
        className="animate-neon-pulse rounded-lg border border-arcana-pink/60 bg-arcana-pink/10 px-8 py-4 text-base font-semibold uppercase tracking-wide text-arcana-pink shadow-neon-pink-sm transition-all hover:bg-arcana-pink/20 hover:shadow-neon-pink"
      >
        Continue with Discord
      </a>
    </main>
  );
}
