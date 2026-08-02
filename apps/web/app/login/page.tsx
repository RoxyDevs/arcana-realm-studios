const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold text-arcana-text">Sign in to Arcana Realm Studios</h1>
      <p className="max-w-sm text-sm text-arcana-textMuted">
        Authentication is handled by Discord OAuth. You&apos;ll be redirected back to your
        dashboard once it completes.
      </p>
      <a
        href={`${API_URL}/auth/discord`}
        className="rounded-lg bg-arcana-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-arcana-accentMuted"
      >
        Continue with Discord
      </a>
    </main>
  );
}
