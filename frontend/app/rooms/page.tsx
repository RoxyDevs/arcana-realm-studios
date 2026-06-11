'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', imvuRoomId: '', url: '' });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/rooms')
      .then(setRooms)
      .catch(() => setRooms([]));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    try {
      const room = await apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setRooms((current) => [...current, room]);
      setForm({ name: '', imvuRoomId: '', url: '' });
      setMessage('Sala creada correctamente.');
    } catch (err: any) {
      setMessage(err.message || 'Error al crear la sala.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/40">
          <h1 className="text-3xl font-semibold text-white">Administrar Salas</h1>
          <p className="mt-3 text-slate-400">Crea nuevas salas IMVU y revisa las que ya tienes vinculadas.</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <h2 className="text-xl font-semibold text-white">Tus salas</h2>
              <div className="mt-4 space-y-4">
                {rooms.length === 0 ? (
                  <p className="text-slate-400">Aún no tienes salas registradas.</p>
                ) : (
                  rooms.map((room) => (
                    <article key={room.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                      <p className="text-lg font-semibold text-white">{room.name}</p>
                      <p className="mt-2 text-slate-400">Room ID: {room.imvuRoomId}</p>
                      <a href={room.url} className="mt-2 block text-sm text-fuchsia-400 hover:underline">
                        Abrir sala en IMVU
                      </a>
                    </article>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-xl font-semibold text-white">Crear nueva sala</h2>
              <div className="mt-6 space-y-4">
                <label className="block text-sm text-slate-300">
                  Nombre de sala
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
                    placeholder="Nombre de la sala"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  IMVU Room ID
                  <input
                    value={form.imvuRoomId}
                    onChange={(e) => setForm({ ...form, imvuRoomId: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
                    placeholder="room-xxxxxxxx"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Room URL
                  <input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
                    placeholder="https://es.imvu.com/next/chat/room-xxxx"
                  />
                </label>
              </div>
              <button className="mt-6 inline-flex items-center justify-center rounded-2xl bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400">
                Crear sala
              </button>
              {message ? <p className="mt-4 text-slate-300">{message}</p> : null}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
