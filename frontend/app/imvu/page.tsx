'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function ImvuPage() {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', roomId: '', roomUrl: '' });

  useEffect(() => {
    apiFetch('/imvu/me')
      .then(setAccount)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await apiFetch('/imvu/link', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setAccount(result);
      setMessage('Cuenta IMVU vinculada correctamente.');
    } catch (err: any) {
      setMessage(err.message || 'Error al vincular la cuenta IMVU.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/40">
          <h1 className="text-3xl font-semibold text-white">Vinculación IMVU</h1>
          <p className="mt-3 text-slate-400">Asocia tu cuenta IMVU con VibeDJ AI para administrar salas y activar el bot.</p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-xl font-semibold text-white">Cuenta vinculada</h2>
              {loading ? (
                <p className="mt-4 text-slate-400">Cargando información...</p>
              ) : account ? (
                <div className="mt-4 space-y-2 text-slate-300">
                  <p>
                    <span className="font-semibold text-white">Usuario IMVU:</span> {account.username}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Room ID:</span> {account.roomId}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Room URL:</span> {account.roomUrl}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-slate-400">Aún no has vinculado tu cuenta IMVU.</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-xl font-semibold text-white">Vincular nueva cuenta</h2>
              <div className="mt-6 space-y-4">
                <label className="block text-sm text-slate-300">
                  Usuario IMVU
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
                    placeholder="ejemplo_imvu"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Room ID
                  <input
                    value={form.roomId}
                    onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
                    placeholder="room-xxxxxxxx"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Room URL
                  <input
                    value={form.roomUrl}
                    onChange={(e) => setForm({ ...form, roomUrl: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
                    placeholder="https://es.imvu.com/next/chat/room-xxxx"
                  />
                </label>
              </div>

              <button className="mt-6 inline-flex items-center justify-center rounded-2xl bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400">
                Guardar vinculación
              </button>
              {message ? <p className="mt-4 text-sm text-slate-300">{message}</p> : null}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
