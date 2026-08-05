"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RoomDto, RoomMemberDto } from "@arcana/types";
import { apiFetch, ApiError } from "@/lib/api-client";

/** Self-service role tags per room — "Femenino"/"Masculino" or any custom in-character title, for roleplay communities (families, clans, fantasy kingdoms). */
export function RoomRosterPanel() {
  const { data: rooms } = useQuery({
    queryKey: ["rooms", "mine"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms/mine"),
  });
  const verifiedRooms = rooms?.filter((room) => room.verificationStatus === "VERIFIED") ?? [];

  const [roomId, setRoomId] = useState("");
  const [roleTag, setRoleTag] = useState("");
  const [imvuDisplayName, setImvuDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: roster } = useQuery({
    queryKey: ["rooms", roomId, "members"],
    queryFn: () => apiFetch<RoomMemberDto[]>(`/rooms/${roomId}/members`),
    enabled: !!roomId,
  });

  const setRole = useMutation({
    mutationFn: () =>
      apiFetch<RoomMemberDto>(`/rooms/${roomId}/members/me`, {
        method: "PUT",
        body: JSON.stringify({
          roleTag: roleTag.trim() || null,
          imvuDisplayName: imvuDisplayName.trim() || null,
        }),
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["rooms", roomId, "members"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't set your role"),
  });

  if (verifiedRooms.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-arcana-pink">
        Room Roles
      </h2>
      <p className="mt-1.5 text-base text-arcana-textMuted">
        Set your own tag for a room — femenino, masculino, or any custom in-character role. Share
        this page with your room to let everyone tag themselves.
      </p>

      <select
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="mt-3 min-h-[48px] w-full rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text focus:border-arcana-pink/70 focus:outline-none"
      >
        <option value="">Select a verified room…</option>
        {verifiedRooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>

      {roomId && (
        <>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={roleTag}
              onChange={(e) => setRoleTag(e.target.value)}
              placeholder="Your role (e.g. Femenino, Masculino, Reina del Clan…)"
              maxLength={40}
              className="min-h-[48px] flex-1 rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-pink/70 focus:outline-none"
            />
            <input
              value={imvuDisplayName}
              onChange={(e) => setImvuDisplayName(e.target.value)}
              placeholder="Your IMVU display name (for the bot)"
              maxLength={60}
              className="min-h-[48px] flex-1 rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-pink/70 focus:outline-none"
            />
            <button
              type="button"
              disabled={setRole.isPending}
              onClick={() => setRole.mutate()}
              className="min-h-[48px] shrink-0 rounded-md border border-arcana-pink/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-pink-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {setRole.isPending ? "Saving…" : "Save my role"}
            </button>
          </div>

          {error && <p className="mt-2 text-base text-red-400">{error}</p>}

          <div className="mt-4 space-y-2">
            {roster?.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-lg border border-arcana-border bg-arcana-bg p-3 text-base text-arcana-text"
              >
                <span>
                  {member.username}
                  {member.imvuDisplayName && (
                    <span className="ml-2 text-sm text-arcana-textMuted">({member.imvuDisplayName})</span>
                  )}
                </span>
                <span className="text-arcana-textMuted">{member.roleTag ?? "—"}</span>
              </div>
            ))}
            {roster?.length === 0 && (
              <p className="text-base text-arcana-textMuted">Nobody has tagged themselves here yet.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
