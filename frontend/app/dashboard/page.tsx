export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/30">
          <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          <p className="mt-3 text-slate-400">Gestión de salas, playlists, licencias y métricas para tu DJ virtual.</p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <article className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-xl font-semibold text-white">Estado de licencia</h2>
              <p className="mt-2 text-slate-400">Controla tu suscripción, fecha de expiración y permisos de sala.</p>
            </article>
            <article className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-xl font-semibold text-white">Salas activas</h2>
              <p className="mt-2 text-slate-400">Verifica qué salas tienen instalado el DJ y administra configuraciones.</p>
            </article>
            <article className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-xl font-semibold text-white">AutoDJ</h2>
              <p className="mt-2 text-slate-400">Configura el auto player inteligente y genera playlists por estado de ánimo.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
