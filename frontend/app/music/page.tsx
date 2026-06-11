'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function MusicPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomId, setRoomId] = useState('');
  const [mood, setMood] = useState('');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [autoDj, setAutoDj] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/rooms')
      .then(setRooms)
      .catch(() => setRooms([]));
  }, []);

  useEffect(() => {
    if (!roomId) {
      setPlaylists([]);
      return;
    }

    apiFetch(`/playlists/room/${roomId}`)
      .then(setPlaylists)
      .catch(() => setPlaylists([]));
  }, [roomId]);

  const handleRecommend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setRecommendation(null);

    if (!roomId) {
      setMessage('Selecciona una sala primero.');
      return;
    }

    try {
      const response = await apiFetch('/music/fillplaylist', {
        method: 'POST',
        body: JSON.stringify({ roomId, recentTracks: [], mood }),
      });
      setRecommendation(response);
    } catch (err: any) {
      setMessage(err.message || 'Error al generar la recomendación.');
    }
  };

  const handleAutoDj = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setAutoDj(null);

    if (!roomId) {
      setMessage('Selecciona una sala primero.');
      return;
    }

    try {
      const response = await apiFetch('/music/autodj', {
        method: 'POST',
        body: JSON.stringify({ roomId, mood }),
      });
      setAutoDj(response);
    } catch (err: any) {
      setMessage(err.message || 'Error al activar AutoDJ.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/40">
          <h1 className="text-3xl font-semibold text-white">Motor de Música</h1>
          <p className="mt-3 text-slate-400">Explora playlists, genera recomendaciones con IA y activa AutoDJ en tus salas.</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-xl font-semibold text-white">Playlists guardadas</h2>
              <div className="mt-4 space-y-4">
                {roomId === '' ? (
                  <p className="text-slate-400">Selecciona una sala para ver sus playlists.</p>
                ) : playlists.length === 0 ? (
                  <p className="text-slate-400">No hay playlists registradas para esta sala.</p>
                ) : (
                  playlists.map((playlist) => (
                    <article key={playlist.id} className="rounded-3xl border border-slate-700 bg-slate-950/90 p-4">
                      <p className="text-lg font-semibold text-white">{playlist.name}</p>
                      <p className="mt-2 text-slate-400">Tracks: {playlist.tracks?.length ?? 0}</p>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                <h2 className="text-xl font-semibold text-white">Recomendar pistas</h2>
                <form onSubmit={handleRecommend} className="mt-6 space-y-4">
                  <label className="block text-sm text-slate-300">
                    Sala
                    <select
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
                    >
                      <option value="">Selecciona una sala</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    Mood / estilo
                    <input
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
                      placeholder="Ej: upbeat, romantic, club chill"
                    />
                  </label>
                  <button className="rounded-2xl bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400">
                    Generar recomendación
                  </button>
                </form>
                {recommendation ? (
                  <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950/90 p-4 text-slate-300">
                    <h3 className="text-white">Recomendaciones</h3>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                      {recommendation.recommendations?.map((track: string, index: number) => (
                        <li key={index}>{track}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                <h2 className="text-xl font-semibold text-white">AutoDJ</h2>
                <form onSubmit={handleAutoDj} className="mt-6 space-y-4">
                  <label className="block text-sm text-slate-300">
                    Mood sugerido
                    <input
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
                      placeholder="Ej: cyberpunk, chill, energetic"
                    />
                  </label>
                  <button className="rounded-2xl bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400">
                    Activar AutoDJ
                  </button>
                </form>
                {autoDj ? (
                  <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950/90 p-4 text-slate-300">
                    <h3 className="text-white">Cola AutoDJ</h3>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                      {autoDj.queue?.map((track: string, index: number) => (
                        <li key={index}>{track}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {message ? <p className="mt-6 text-sm text-rose-400">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
