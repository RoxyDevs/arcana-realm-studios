"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NowPlayingDto, RoomDto } from "@arcana/types";
import { apiFetch } from "@/lib/api-client";

/** AutoDJ's currently-playing track, plus a real in-browser player for anyone at a PC — the two things Vusic-style consoles show side by side. */
export function NowPlayingPanel() {
  const { data: rooms } = useQuery({
    queryKey: ["rooms", "mine"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms/mine"),
  });
  const liveRooms = rooms?.filter((room) => !!room.streamUrl) ?? [];

  if (liveRooms.length === 0) {
    return null;
  }

  return (
    <>
      {liveRooms.map((room) => (
        <RoomNowPlaying key={room.id} roomId={room.id} roomName={room.name} streamUrl={room.streamUrl!} />
      ))}
    </>
  );
}

function RoomNowPlaying({
  roomId,
  roomName,
  streamUrl,
}: {
  roomId: string;
  roomName: string;
  streamUrl: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const { data: nowPlaying } = useQuery({
    queryKey: ["music", "now-playing", roomId],
    queryFn: () => apiFetch<NowPlayingDto | null>(`/rooms/${roomId}/queue/now-playing`),
    // AutoDJ tracks run a few minutes each — 15s keeps this feeling live without hammering the API.
    refetchInterval: 15_000,
  });

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  }

  function handleVolumeChange(next: number) {
    setVolume(next);
    if (audioRef.current) audioRef.current.volume = next;
  }

  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-arcana-cyan">
        Now Playing — {roomName}
      </h2>

      <p className="mt-2 text-lg text-arcana-text">
        {nowPlaying ? (
          <>
            {nowPlaying.track.title}
            {nowPlaying.track.artist && (
              <span className="text-arcana-textMuted"> — {nowPlaying.track.artist}</span>
            )}
          </>
        ) : (
          <span className="text-arcana-textMuted">Nothing has streamed for this room yet.</span>
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={togglePlayback}
          className="min-h-[44px] rounded-md border border-arcana-cyan/60 px-5 py-2.5 text-base font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm"
        >
          {playing ? "⏸ Pause" : "▶ Listen in browser"}
        </button>

        <label className="flex items-center gap-2 text-sm text-arcana-textMuted">
          Volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="accent-arcana-cyan"
            aria-label="Playback volume"
          />
        </label>

        <a
          href={streamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-arcana-cyan underline-offset-2 hover:underline"
        >
          Open raw stream URL
        </a>
      </div>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- live radio stream, no caption track exists */}
      <audio ref={audioRef} src={streamUrl} preload="none" className="hidden" />
    </section>
  );
}
