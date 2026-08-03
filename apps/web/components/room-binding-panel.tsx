"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RoomDto } from "@arcana/types";
import { apiFetch, ApiError } from "@/lib/api-client";

function StatusPill({ room }: { room: RoomDto }) {
  if (room.verificationStatus === "VERIFIED") {
    return (
      <span className="rounded-full border border-arcana-cyan/50 px-2.5 py-1 text-sm text-arcana-cyan">
        Verified
      </span>
    );
  }
  return (
    <span className="rounded-full border border-arcana-pink/50 px-2.5 py-1 text-sm text-arcana-pink">
      Pending verification
    </span>
  );
}

export function RoomBindingPanel() {
  const [roomInput, setRoomInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: rooms } = useQuery({
    queryKey: ["rooms", "mine"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms/mine"),
  });

  const bind = useMutation({
    mutationFn: (roomUrlOrId: string) =>
      apiFetch<RoomDto>("/rooms/bind", { method: "POST", body: JSON.stringify({ roomUrlOrId }) }),
    onSuccess: () => {
      setError(null);
      setRoomInput("");
      queryClient.invalidateQueries({ queryKey: ["rooms", "mine"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't bind that room"),
  });

  const verify = useMutation({
    mutationFn: (roomId: string) => apiFetch<RoomDto>(`/rooms/${roomId}/verify`, { method: "POST" }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["rooms", "mine"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Verification failed"),
  });

  const unbind = useMutation({
    mutationFn: (roomId: string) => apiFetch<void>(`/rooms/${roomId}`, { method: "DELETE" }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["rooms", "mine"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't unbind that room"),
  });

  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-arcana-purple">Bind your IMVU room</h2>
      <p className="mt-1.5 text-base text-arcana-textMuted">
        Paste your room&apos;s URL (or just the <code>id-id</code> at the end of it) — any room works, this
        isn&apos;t limited to one example.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          placeholder="https://www.imvu.com/.../room-188423770-75"
          className="min-h-[48px] flex-1 rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-purple/70 focus:outline-none"
        />
        <button
          type="button"
          disabled={!roomInput || bind.isPending}
          onClick={() => bind.mutate(roomInput)}
          className="min-h-[48px] rounded-md border border-arcana-purple/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-purple-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start binding
        </button>
      </div>

      {error && <p className="mt-3 text-base text-red-400">{error}</p>}

      <div className="mt-5 space-y-3">
        {rooms?.map((room) => (
          <div key={room.id} className="rounded-lg border border-arcana-border bg-arcana-bg p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-semibold text-arcana-text">{room.name}</span>
              <div className="flex items-center gap-2">
                <StatusPill room={room} />
                <button
                  type="button"
                  disabled={unbind.isPending}
                  onClick={() => {
                    if (window.confirm(`Unbind "${room.name}"? This deletes its queue and bot license history.`)) {
                      unbind.mutate(room.id);
                    }
                  }}
                  className="min-h-[36px] rounded-md border border-red-400/40 px-3 py-1 text-sm text-red-400 transition-all hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Unbind
                </button>
              </div>
            </div>

            {room.verificationStatus === "PENDING" && room.verificationToken && (
              <div className="mt-3 space-y-2 text-base text-arcana-textMuted">
                <p>
                  1. Paste this token into your room&apos;s IMVU description, save it, then confirm below:
                </p>
                <code className="block break-all rounded-md border border-arcana-border bg-arcana-surface px-3 py-2.5 text-arcana-cyan">
                  {room.verificationToken}
                </code>
                <button
                  type="button"
                  disabled={verify.isPending}
                  onClick={() => verify.mutate(room.id)}
                  className="min-h-[44px] rounded-md border border-arcana-cyan/60 px-4 py-2 text-sm font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  I saved it — verify now
                </button>
              </div>
            )}

            {room.verificationStatus === "VERIFIED" && (
              <div className="mt-3 text-base text-arcana-textMuted">
                {room.streamUrl ? (
                  <>
                    <p>2. Paste this into your room&apos;s Media Controls → Transmisión de Radio:</p>
                    <code className="mt-2 block break-all rounded-md border border-arcana-border bg-arcana-surface px-3 py-2.5 text-arcana-cyan">
                      {room.streamUrl}
                    </code>
                  </>
                ) : (
                  <p>Verified — buy bot time above to get your stream URL.</p>
                )}
              </div>
            )}
          </div>
        ))}
        {rooms?.length === 0 && <p className="text-base text-arcana-textMuted">No rooms bound yet.</p>}
      </div>
    </section>
  );
}
