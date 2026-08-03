"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueueItemDto, RoomDto } from "@arcana/types";
import { apiFetch, apiUpload, ApiError } from "@/lib/api-client";

export function TrackUploadPanel() {
  const { data: rooms } = useQuery({
    queryKey: ["rooms", "mine"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms/mine"),
  });
  const verifiedRooms = rooms?.filter((room) => room.verificationStatus === "VERIFIED") ?? [];

  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: queue } = useQuery({
    queryKey: ["music", "queue", roomId],
    queryFn: () => apiFetch<QueueItemDto[]>(`/rooms/${roomId}/queue`),
    enabled: !!roomId,
  });

  const upload = useMutation({
    mutationFn: () => {
      const body = new FormData();
      body.set("title", title);
      if (artist) body.set("artist", artist);
      if (file) body.set("file", file);
      return apiUpload(`/rooms/${roomId}/tracks/upload`, body);
    },
    onSuccess: () => {
      setError(null);
      setTitle("");
      setArtist("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["music", "queue", roomId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Upload failed"),
  });

  if (verifiedRooms.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-arcana-cyan">
        Add a track to the queue
      </h2>
      <p className="mt-1.5 text-base text-arcana-textMuted">
        Only upload audio you actually own or have rights to — this queues it for AutoDJ
        immediately.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="min-h-[48px] rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text focus:border-arcana-cyan/70 focus:outline-none"
        >
          <option value="">Select a verified room…</option>
          {verifiedRooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="min-h-[48px] rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-cyan/70 focus:outline-none"
        />
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist (optional)"
          className="min-h-[48px] rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-cyan/70 focus:outline-none"
        />
        <input
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mp4"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="min-h-[48px] rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text file:mr-3 file:rounded-md file:border-0 file:bg-arcana-cyan/20 file:px-3 file:py-2 file:text-arcana-cyan"
        />

        <button
          type="button"
          disabled={!roomId || !title || !file || upload.isPending}
          onClick={() => upload.mutate()}
          className="min-h-[48px] rounded-md border border-arcana-cyan/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {upload.isPending ? "Uploading…" : "Upload & queue"}
        </button>
      </div>

      {error && <p className="mt-3 text-base text-red-400">{error}</p>}

      {roomId && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-arcana-textMuted">
            Queue
          </h3>
          <div className="mt-2 space-y-2">
            {queue?.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-arcana-border bg-arcana-bg p-3 text-base text-arcana-text"
              >
                {item.position}. {item.track.title}
                {item.track.artist && ` — ${item.track.artist}`}
              </div>
            ))}
            {queue?.length === 0 && (
              <p className="text-base text-arcana-textMuted">
                Queue is empty — AutoDJ will loop your upload history instead.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
