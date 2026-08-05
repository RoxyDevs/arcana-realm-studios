"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LiveIngestCredentialsDto, LiveStatusDto, RoomDto } from "@arcana/types";
import { apiFetch, ApiError } from "@/lib/api-client";

const MIC_MIME_TYPE = "audio/webm;codecs=opus";

type MicBroadcastState = "idle" | "requesting" | "broadcasting" | "error";

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
  const [micState, setMicState] = useState<MicBroadcastState>("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Never leave the mic hot or a socket open if the dashboard navigates away mid-broadcast.
  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      wsRef.current?.close();
    };
  }, []);

  function stopMicBroadcast() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setMicState("idle");
  }

  async function startMicBroadcast() {
    if (!credentials) return;
    setMicError(null);
    setMicState("requesting");

    if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported(MIC_MIME_TYPE)) {
      setMicError("This browser can't record audio/webm — use a broadcast app (BUTT, Mixxx, ffmpeg) instead.");
      setMicState("error");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError("Microphone permission denied or unavailable.");
      setMicState("error");
      return;
    }
    micStreamRef.current = stream;

    const ws = new WebSocket(credentials.micBridgeUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          mount: credentials.mount,
          username: credentials.username,
          sourcePassword: credentials.sourcePassword,
        }),
      );

      const recorder = new MediaRecorder(stream, { mimeType: MIC_MIME_TYPE });
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(e.data);
        }
      };
      recorder.start(250); // 250ms timeslices, small enough to feel live once it reaches the harbor
      setMicState("broadcasting");
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "error") {
        setMicError(msg.message);
        stopMicBroadcast();
        setMicState("error");
      }
    };

    ws.onerror = () => {
      setMicError("Couldn't reach the mic bridge — is the streaming service up?");
      stopMicBroadcast();
      setMicState("error");
    };

    ws.onclose = () => {
      recorderRef.current?.stop();
      recorderRef.current = null;
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
      wsRef.current = null;
      setMicState((prev) => (prev === "broadcasting" ? "idle" : prev));
    };
  }

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
      stopMicBroadcast();
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
        you connect, and AutoDJ resumes automatically when you stop. Push-to-talk straight from
        this browser tab, or broadcast from any free Icecast source app — BUTT (simplest), Mixxx
        (if you want DJ decks/mixing), or ffmpeg.
      </p>

      <select
        value={roomId}
        onChange={(e) => {
          setRoomId(e.target.value);
          setCredentials(null);
          stopMicBroadcast();
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

              <div className="mt-3 border-t border-arcana-border pt-3">
                <p className="text-sm text-arcana-textMuted">
                  Or skip the broadcast app entirely — push-to-talk straight from this tab&rsquo;s
                  microphone:
                </p>
                {micState !== "broadcasting" ? (
                  <button
                    type="button"
                    disabled={micState === "requesting"}
                    onClick={() => void startMicBroadcast()}
                    className="mt-2 min-h-[48px] rounded-md border border-arcana-pink/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-pink-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {micState === "requesting" ? "Requesting mic…" : "Start browser mic broadcast"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopMicBroadcast}
                    className="mt-2 min-h-[48px] rounded-md border border-red-400/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm"
                  >
                    Stop browser mic broadcast
                  </button>
                )}
                {micState === "broadcasting" && (
                  <p className="mt-2 text-sm text-arcana-cyan">🔴 Broadcasting from this browser&rsquo;s mic</p>
                )}
                {micError && <p className="mt-2 text-sm text-red-400">{micError}</p>}
              </div>
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
