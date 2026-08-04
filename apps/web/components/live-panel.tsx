"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LiveIngestCredentialsDto, LiveStatusDto, RoomDto } from "@arcana/types";
import { apiFetch, ApiError } from "@/lib/api-client";

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-arcana-border bg-arcana-bg px-3 py-2">
      <span className="text-sm text-arcana-textMuted">{label}</span>
      <code className="text-sm text-arcana-text">{value}</code>
    </div>
  );
}

export function LivePanel() {
  const { data: rooms } = useQuery({
    queryKey: ["rooms", "mine"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms/mine"),
  });
  const verifiedRooms = rooms?.filter((room) => room.verificationStatus === "VERIFIED") ?? [];

  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<LiveIngestCredentialsDto | null>(null);
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ["live", "status", roomId],
    queryFn: () => apiFetch<LiveStatusDto>(`/rooms/${roomId}/live/status`),
    enabled: !!roomId,
    // Live status can change from outside this tab (broadcaster disconnecting) — keep it fresh.
    refetchInterval: 15_000,
  });

  const start = useMutation({
    mutationFn: () => apiFetch<LiveIngestCredentialsDto>(`/rooms/${roomId}/live/start`, { method: "POST" }),
    onSuccess: (creds) => {
      setError(null);
      setCredentials(creds);
      queryClient.invalidateQueries({ queryKey: ["live", "status", roomId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't start a live session"),
  });

  const stop = useMutation({
    mutationFn: () => apiFetch<void>(`/rooms/${roomId}/live/stop`, { method: "POST" }),
    onSuccess: () => {
      setError(null);
      setCredentials(null);
      queryClient.invalidateQueries({ queryKey: ["live", "status", roomId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't stop the live session"),
  });

  if (verifiedRooms.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-arcana-cyan">
        Live broadcast
      </h2>
      <p className="mt-1.5 text-base text-arcana-textMuted">
        Go live with your mic, a DJ set, or a podcast — it takes over from AutoDJ the moment
        you connect, and AutoDJ resumes automatically when you stop. Broadcast from any free
        Icecast source app — BUTT (simplest), Mixxx (if you want DJ decks/mixing), or ffmpeg.
      </p>

      <select
        value={roomId}
        onChange={(e) => {
          setRoomId(e.target.value);
          setCredentials(null);
        }}
        className="mt-3 min-h-[48px] w-full rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text focus:border-arcana-cyan/70 focus:outline-none"
      >
        <option value="">Select a verified room…</option>
        {verifiedRooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>

      {roomId && status && (
        <div className="mt-3">
          <p className="text-base text-arcana-text">
            Status:{" "}
            <span className={status.active ? "text-arcana-cyan" : "text-arcana-textMuted"}>
              {status.active ? "Live" : "Offline"}
            </span>
          </p>

          {!status.active && !credentials && (
            <button
              type="button"
              disabled={start.isPending}
              onClick={() => start.mutate()}
              className="mt-2 min-h-[48px] rounded-md border border-arcana-cyan/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {start.isPending ? "Starting…" : "Start live broadcast"}
            </button>
          )}

          {credentials && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-arcana-textMuted">
                Paste these into your broadcast app&rsquo;s stream settings — shown once, so copy
                them now:
              </p>
              <CredentialRow label="Server" value={credentials.harborHost} />
              <CredentialRow label="Port" value={String(credentials.harborPort)} />
              <CredentialRow label="Mount point" value={credentials.mount} />
              <CredentialRow label="Username" value={credentials.username} />
              <CredentialRow label="Password" value={credentials.sourcePassword} />
            </div>
          )}

          {status.active && (
            <button
              type="button"
              disabled={stop.isPending}
              onClick={() => stop.mutate()}
              className="mt-3 min-h-[48px] rounded-md border border-red-400/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stop.isPending ? "Stopping…" : "Stop live broadcast"}
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-base text-red-400">{error}</p>}
    </section>
  );
}
