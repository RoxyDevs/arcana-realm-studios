"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ALLOWED_AUDIO_UPLOAD_MIME_TYPES,
  TRACK_UPLOAD_MAX_BYTES,
  type QueueItemDto,
  type RoomDto,
  type TrackDto,
} from "@arcana/types";
import { apiFetch, apiUpload, ApiError } from "@/lib/api-client";

/** Debounces search-as-you-type so every keystroke doesn't fire a request. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

const MAX_UPLOAD_MB = Math.round(TRACK_UPLOAD_MAX_BYTES / (1024 * 1024));

function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Client-side mirror of what MusicService.uploadTrack rejects — catches bad files before spending a round trip. */
function validateFile(file: File): string | null {
  if (!ALLOWED_AUDIO_UPLOAD_MIME_TYPES[file.type]) {
    return `Unsupported file type "${file.type || "unknown"}" — use MP3, WAV, OGG, AAC, or M4A.`;
  }
  if (file.size > TRACK_UPLOAD_MAX_BYTES) {
    return `File is ${formatFileSize(file.size)} — max is ${MAX_UPLOAD_MB} MB.`;
  }
  return null;
}

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
  const [successTitle, setSuccessTitle] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: queue } = useQuery({
    queryKey: ["music", "queue", roomId],
    queryFn: () => apiFetch<QueueItemDto[]>(`/rooms/${roomId}/queue`),
    enabled: !!roomId,
  });

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 350);
  const {
    data: searchResults,
    isFetching: isSearching,
  } = useQuery({
    queryKey: ["tracks", "search", debouncedSearchQuery],
    queryFn: () => apiFetch<TrackDto[]>(`/tracks/search?q=${encodeURIComponent(debouncedSearchQuery)}`),
    enabled: debouncedSearchQuery.trim().length >= 2,
  });

  const enqueueExisting = useMutation({
    mutationFn: (trackId: string) => apiFetch<QueueItemDto>(`/rooms/${roomId}/queue/tracks/${trackId}`, { method: "POST" }),
    onSuccess: (item) => {
      setError(null);
      setSuccessTitle(item.track.title);
      queryClient.invalidateQueries({ queryKey: ["music", "queue", roomId] });
      setTimeout(() => setSuccessTitle(null), 4000);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't add that track to the queue"),
  });

  const moveQueueItem = useMutation({
    mutationFn: ({ queueItemId, direction }: { queueItemId: string; direction: "up" | "down" }) =>
      apiFetch<void>(`/rooms/${roomId}/queue/${queueItemId}/move`, {
        method: "POST",
        body: JSON.stringify({ direction }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["music", "queue", roomId] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't reorder the queue"),
  });

  const removeQueueItem = useMutation({
    mutationFn: (queueItemId: string) =>
      apiFetch<void>(`/rooms/${roomId}/queue/${queueItemId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["music", "queue", roomId] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't remove that track"),
  });

  const upload = useMutation({
    mutationFn: () => {
      const body = new FormData();
      body.set("title", title);
      if (artist) body.set("artist", artist);
      if (file) body.set("file", file);
      setProgress(0);
      return apiUpload<TrackDto>(`/rooms/${roomId}/tracks/upload`, body, setProgress);
    },
    onSuccess: (track) => {
      setError(null);
      setSuccessTitle(track.title);
      setTitle("");
      setArtist("");
      setFile(null);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["music", "queue", roomId] });
      setTimeout(() => setSuccessTitle(null), 4000);
    },
    onError: (err) => {
      setProgress(0);
      setError(err instanceof ApiError ? err.message : "Upload failed — check your connection and try again.");
    },
  });

  function handleFileChange(selected: File | null) {
    setSuccessTitle(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const validationError = validateFile(selected);
    if (validationError) {
      setError(validationError);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError(null);
    setFile(selected);
  }

  if (verifiedRooms.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-arcana-cyan">
        Music
      </h2>
      <p className="mt-1.5 text-base text-arcana-textMuted">
        Search the shared library everyone&rsquo;s uploaded, or add your own track — either way it
        queues for AutoDJ immediately.
      </p>

      <select
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="mt-3 min-h-[48px] w-full rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text focus:border-arcana-cyan/70 focus:outline-none"
      >
        <option value="">Select a verified room…</option>
        {verifiedRooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>

      {roomId && (
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the library by song or artist…"
            className="min-h-[48px] rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-cyan/70 focus:outline-none"
          />

          {isSearching && <p className="text-sm text-arcana-textMuted">Searching…</p>}

          {searchResults && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-arcana-border bg-arcana-bg p-3 text-base text-arcana-text"
                >
                  <span>
                    {track.title}
                    {track.artist && <span className="text-arcana-textMuted"> — {track.artist}</span>}
                  </span>
                  <button
                    type="button"
                    disabled={enqueueExisting.isPending}
                    onClick={() => enqueueExisting.mutate(track.id)}
                    className="shrink-0 rounded-md border border-arcana-cyan/60 px-3 py-1.5 text-sm font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add to queue
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchResults && searchResults.length === 0 && !isSearching && (
            <p className="text-sm text-arcana-textMuted">
              Nothing in the library matches that yet — try uploading it instead.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowUploadForm((prev) => !prev)}
            className="self-start text-sm text-arcana-cyan underline-offset-2 hover:underline"
          >
            {showUploadForm ? "Hide upload form" : "Not in the library? Upload your own track"}
          </button>
        </div>
      )}

      {roomId && showUploadForm && (
        <div className="mt-3 flex flex-col gap-2 border-t border-arcana-border pt-4">
          <p className="text-sm text-arcana-textMuted">
            Only upload audio you actually own or have rights to.
          </p>
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
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mp4"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            disabled={upload.isPending}
            className="min-h-[48px] rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text file:mr-3 file:rounded-md file:border-0 file:bg-arcana-cyan/20 file:px-3 file:py-2 file:text-arcana-cyan disabled:cursor-not-allowed disabled:opacity-50"
          />
          {file && !error && (
            <p className="text-sm text-arcana-textMuted">
              {file.name} · {formatFileSize(file.size)}
            </p>
          )}
          <p className="text-sm text-arcana-textMuted">
            MP3, WAV, OGG, AAC, or M4A — max {MAX_UPLOAD_MB} MB.
          </p>

          <button
            type="button"
            disabled={!roomId || !title || !file || upload.isPending}
            onClick={() => upload.mutate()}
            className="min-h-[48px] rounded-md border border-arcana-cyan/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {upload.isPending ? `Uploading… ${progress}%` : "Upload & queue"}
          </button>

          {upload.isPending && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-arcana-bg">
              <div
                className="h-full rounded-full bg-arcana-cyan transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-base text-red-400">{error}</p>}
      {successTitle && (
        <p className="mt-3 text-base text-green-400">
          &ldquo;{successTitle}&rdquo; queued for AutoDJ.
        </p>
      )}

      {roomId && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-arcana-textMuted">
            Queue
          </h3>
          <div className="mt-2 space-y-2">
            {queue?.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-arcana-border bg-arcana-bg p-3 text-base text-arcana-text"
              >
                <span>
                  {item.position}. {item.track.title}
                  {item.track.artist && ` — ${item.track.artist}`}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0 || moveQueueItem.isPending}
                    onClick={() => moveQueueItem.mutate({ queueItemId: item.id, direction: "up" })}
                    aria-label="Move up"
                    className="rounded-md border border-arcana-border px-2 py-1 text-sm text-arcana-text transition-all hover:border-arcana-cyan/60 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={!queue || index === queue.length - 1 || moveQueueItem.isPending}
                    onClick={() => moveQueueItem.mutate({ queueItemId: item.id, direction: "down" })}
                    aria-label="Move down"
                    className="rounded-md border border-arcana-border px-2 py-1 text-sm text-arcana-text transition-all hover:border-arcana-cyan/60 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={removeQueueItem.isPending}
                    onClick={() => removeQueueItem.mutate(item.id)}
                    aria-label="Remove from queue"
                    className="rounded-md border border-arcana-border px-2 py-1 text-sm text-red-400 transition-all hover:border-red-400/60 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
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
