'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

export default function BotPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [installRoomId, setInstallRoomId] = useState('');
  const [installResult, setInstallResult] = useState<any>(null);
  const [command, setCommand] = useState('');
  const [commandRoomId, setCommandRoomId] = useState('');
  const [commandResult, setCommandResult] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/rooms')
      .then(setRooms)
      .catch(() => setRooms([]));
  }, []);

  const handleInstall = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setInstallResult(null);

    try {
      const result = await apiFetch('/bot/install', {
        method: 'POST',
        body: JSON.stringify({ roomId: installRoomId }),
      });
      setInstallResult(result);
    } catch (err: any) {
      setMessage(err.message || 'Error al instalar el bot.');
    }
  };

  const handleCommand = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setCommandResult(null);

    try {
      const result = await apiFetch('/bot/command', {
        method: 'POST',
        body: JSON.stringify({ roomId: commandRoomId, userId: 'SELF', command }),
      });
      setCommandResult(result);
    } catch (err: any) {
      setMessage(err.message || 'Error al procesar el comando.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/40">
          <h1 className="text-3xl font-semibold text-white">Bot DJ Virtual</h1>
          <p className="mt-3 text-slate-400">Instala el bot en una sala y prueba los comandos básicos del DJ.</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-xl font-semibold text-white">Instalar bot</h2>
              <form onSubmit={handleInstall} className="mt-6 space-y-4">
                <label className="block text-sm text-slate-300">
                  Selecciona una sala
                  <select
                    value={installRoomId}
                    onChange={(e) => setInstallRoomId(e.target.value)}
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
                <button className="rounded-2xl bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400">
                  Generar código de activación
                </button>
              </form>
              {installResult ? (
                <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950/90 p-4 text-slate-300">
                  <p className="text-sm text-slate-400">Código de activación:</p>
                  <p className="mt-2 text-lg font-semibold text-white">{installResult.code}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-xl font-semibold text-white">Probar comandos</h2>
              <form onSubmit={handleCommand} className="mt-6 space-y-4">
                <label className="block text-sm text-slate-300">
                  Sala objetivo
                  <select
                    value={commandRoomId}
                    onChange={(e) => setCommandRoomId(e.target.value)}
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
                  Comando de bot
                  <input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
                    placeholder="!activate VDJ-XXXX-XXXX"
                  />
                </label>
                <button className="rounded-2xl bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400">
                  Enviar comando
                </button>
              </form>
              {commandResult ? (
                <div className="mt-6 rounded-3xl border border-slate-700 bg-slate-950/90 p-4 text-slate-300">
                  <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(commandResult, null, 2)}</pre>
                </div>
              ) : null}
            </div>
          </div>

          {message ? <p className="mt-6 text-sm text-rose-400">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
