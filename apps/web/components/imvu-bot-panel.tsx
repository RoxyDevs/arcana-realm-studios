"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ImvuBotStatusDto, RoomDto } from "@arcana/types";
import { apiFetch, ApiError } from "@/lib/api-client";

/**
 * Room-chat bot control panel. Runs on `imvu.js.org` (an unaffiliated
 * third-party relay, NOT an IMVU-owned service) — see
 * apps/api/src/modules/imvu-bot/README.md for the full trust writeup.
 * Register a bot account there to get a token before using this panel.
 */
export function ImvuBotPanel() {
  const [roomId, setRoomId] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: rooms } = useQuery({
    queryKey: ["rooms", "mine"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms/mine"),
  });
  const verifiedRooms = rooms?.filter((room) => room.verificationStatus === "VERIFIED") ?? [];

  useEffect(() => {
    if (roomId) return;
    const firstVerified = rooms?.find((room) => room.verificationStatus === "VERIFIED");
    if (firstVerified) setRoomId(firstVerified.id);
  }, [rooms, roomId]);

  const { data: status } = useQuery({
    queryKey: ["imvu-bot", roomId],
    queryFn: () => apiFetch<ImvuBotStatusDto>(`/rooms/${roomId}/bot`),
    enabled: !!roomId,
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["imvu-bot", roomId] });

  const saveToken = useMutation({
    mutationFn: () =>
      apiFetch<void>(`/rooms/${roomId}/bot/credential`, {
        method: "PUT",
        body: JSON.stringify({ token: token.trim() }),
      }),
    onSuccess: () => {
      setError(null);
      setMessage("Token guardado.");
      setToken("");
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo guardar el token"),
  });

  const start = useMutation({
    mutationFn: () => apiFetch<ImvuBotStatusDto>(`/rooms/${roomId}/bot/start`, { method: "POST" }),
    onSuccess: () => {
      setError(null);
      setMessage("Bot conectado a la sala.");
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo arrancar el bot"),
  });

  const stop = useMutation({
    mutationFn: () => apiFetch<ImvuBotStatusDto>(`/rooms/${roomId}/bot/stop`, { method: "POST" }),
    onSuccess: () => {
      setError(null);
      setMessage("Bot desconectado.");
      invalidate();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "No se pudo parar el bot"),
  });

  if (verifiedRooms.length === 0) return null;

  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-arcana-cyan">
        Bot de sala (chat)
      </h2>
      <p className="mt-1.5 text-base text-arcana-textMuted">
        Corre sobre imvu.js.org, un relay de terceros no afiliado a IMVU — registrá una cuenta bot
        ahí para obtener el token. Requiere licencia de bot activa para esta sala. Comandos: !play,
        !skip, !queue, !nowplaying.
      </p>

      <select
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="mt-3 min-h-[48px] w-full rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text focus:border-arcana-cyan/70 focus:outline-none"
      >
        {verifiedRooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>

      {roomId && status && (
        <>
          <p className="mt-3 text-base text-arcana-textMuted">
            {status.connected ? "🟢 Conectado" : "⚪ Desconectado"} ·{" "}
            {status.hasCredential ? "Token guardado" : "Sin token"}
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token de imvu.js.org"
              className="min-h-[48px] flex-1 rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-cyan/70 focus:outline-none"
            />
            <button
              type="button"
              disabled={!token.trim() || saveToken.isPending}
              onClick={() => saveToken.mutate()}
              className="min-h-[48px] shrink-0 rounded-md border border-arcana-cyan/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveToken.isPending ? "Guardando…" : "Guardar token"}
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={status.connected || start.isPending}
              onClick={() => start.mutate()}
              className="min-h-[48px] flex-1 rounded-md border border-arcana-cyan/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {start.isPending ? "Conectando…" : "Arrancar bot"}
            </button>
            <button
              type="button"
              disabled={!status.connected || stop.isPending}
              onClick={() => stop.mutate()}
              className="min-h-[48px] flex-1 rounded-md border border-arcana-border px-5 py-3 text-base font-medium text-arcana-text transition-all hover:border-red-400/70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stop.isPending ? "Desconectando…" : "Parar bot"}
            </button>
          </div>
        </>
      )}

      {message && <p className="mt-3 text-base text-arcana-cyan">{message}</p>}
      {error && <p className="mt-3 text-base text-red-400">{error}</p>}
    </section>
  );
}
