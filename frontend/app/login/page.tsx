import Link from 'next/link';

const authUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-10 shadow-xl shadow-slate-950/50">
          <h1 className="text-4xl font-semibold text-white">Bienvenido a VibeDJ AI</h1>
          <p className="mt-4 text-slate-400">
            Conecta tu Discord, administra tu sala IMVU y controla tu DJ inteligente.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href={`${authUrl}/auth/discord/login`}
              className="inline-flex items-center justify-center rounded-2xl bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
            >
              Iniciar sesión con Discord
            </a>
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400">
              Ver dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
