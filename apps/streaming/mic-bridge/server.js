// Browser mic push-to-talk → Liquidsoap harbor.
//
// A browser can record its mic via MediaRecorder, but it can't speak the
// Icecast source protocol the way OBS/Mixxx/ffmpeg do — there's no browser
// API for that. This process is the bridge: a browser opens a WebSocket
// here, sends one JSON control message with the mount/credentials it
// already got from `POST /rooms/:roomId/live/start`, then streams
// MediaRecorder chunks as binary WS frames. Each connection spawns its own
// ffmpeg that reads those chunks from stdin and re-encodes/pushes them into
// the harbor running in this same container — colocated on purpose, so this
// never needs to leave localhost or be told the harbor's public host.
//
// One ffmpeg child process per WebSocket connection. No per-room state here
// on purpose: the harbor's own auth callback (check-live-auth.sh) is what
// actually decides whether a mount/password pair is allowed to broadcast —
// this bridge is a dumb transcoding pipe, same trust model as a direct
// OBS/Mixxx/ffmpeg connection.

const http = require("node:http");
const { spawn } = require("node:child_process");
const { WebSocketServer } = require("ws");

const PORT = parseInt(process.env.MIC_BRIDGE_PORT ?? "8007", 10);
const HARBOR_PORT = parseInt(process.env.LIQUIDSOAP_HARBOR_PORT ?? "8006", 10);
const HARBOR_HOST = "127.0.0.1";
// Wait this long for the first (control) message before giving up on a connection.
const CONTROL_MESSAGE_TIMEOUT_MS = 10_000;
// Grace period between asking ffmpeg to stop and force-killing it.
const FFMPEG_STOP_GRACE_MS = 3_000;

function log(...args) {
  console.log(new Date().toISOString(), "[mic-bridge]", ...args);
}

function isValidControlMessage(msg) {
  return (
    msg &&
    typeof msg === "object" &&
    typeof msg.mount === "string" &&
    msg.mount.startsWith("/") &&
    typeof msg.username === "string" &&
    msg.username.length > 0 &&
    typeof msg.sourcePassword === "string" &&
    msg.sourcePassword.length > 0
  );
}

function sendJson(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function handleConnection(ws) {
  let ffmpeg = null;
  let awaitingControl = true;

  const controlTimeout = setTimeout(() => {
    if (awaitingControl) {
      sendJson(ws, { type: "error", message: "No ingest credentials received in time" });
      ws.close(1008, "control message timeout");
    }
  }, CONTROL_MESSAGE_TIMEOUT_MS);

  function stopFfmpeg() {
    if (!ffmpeg) return;
    const proc = ffmpeg;
    ffmpeg = null;
    try {
      proc.stdin.end();
    } catch {
      // already closed — nothing to do
    }
    const killTimer = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch {
        // already exited
      }
    }, FFMPEG_STOP_GRACE_MS);
    proc.once("exit", () => clearTimeout(killTimer));
    proc.kill("SIGTERM");
  }

  function startFfmpeg(control) {
    const target = `icecast://${encodeURIComponent(control.username)}:${encodeURIComponent(control.sourcePassword)}@${HARBOR_HOST}:${HARBOR_PORT}${control.mount}`;
    const args = [
      "-nostdin",
      "-loglevel", "error",
      "-f", "webm",
      "-i", "pipe:0",
      "-vn",
      "-acodec", "libmp3lame",
      "-b:a", "128k",
      "-ar", "44100",
      "-content_type", "audio/mpeg",
      "-f", "mp3",
      target,
    ];

    log("starting ffmpeg for", control.mount);
    const proc = spawn("ffmpeg", args, { stdio: ["pipe", "ignore", "pipe"] });
    ffmpeg = proc;

    let stderrTail = "";
    proc.stderr.on("data", (chunk) => {
      stderrTail = (stderrTail + chunk.toString()).slice(-4000);
    });

    proc.on("exit", (code, signal) => {
      const expected = ffmpeg === null; // we called stopFfmpeg ourselves
      ffmpeg = null;
      if (!expected) {
        log("ffmpeg exited unexpectedly", { code, signal, stderrTail });
        sendJson(ws, {
          type: "error",
          message: "The harbor rejected or dropped this broadcast — check the room's live status.",
        });
      }
      if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) {
        ws.close();
      }
    });

    proc.stdin.on("error", (err) => {
      // EPIPE etc. once ffmpeg has already exited — harmless, exit handler covers cleanup.
      log("ffmpeg stdin error", err.message);
    });

    sendJson(ws, { type: "connected" });
  }

  ws.on("message", (data, isBinary) => {
    if (awaitingControl) {
      awaitingControl = false;
      clearTimeout(controlTimeout);

      if (isBinary) {
        sendJson(ws, { type: "error", message: "First message must be the JSON control message" });
        ws.close(1008, "expected control message");
        return;
      }

      let control;
      try {
        control = JSON.parse(data.toString("utf8"));
      } catch {
        sendJson(ws, { type: "error", message: "Malformed control message" });
        ws.close(1008, "malformed control message");
        return;
      }

      if (!isValidControlMessage(control)) {
        sendJson(ws, { type: "error", message: "Control message missing mount/username/sourcePassword" });
        ws.close(1008, "invalid control message");
        return;
      }

      startFfmpeg(control);
      return;
    }

    if (!ffmpeg) return; // ffmpeg already exited — drop trailing frames
    if (!isBinary) return; // ignore stray non-binary frames after the handshake
    ffmpeg.stdin.write(data);
  });

  ws.on("close", () => {
    clearTimeout(controlTimeout);
    stopFfmpeg();
  });

  ws.on("error", (err) => {
    log("websocket error", err.message);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({ server, path: "/mic-ingest" });
wss.on("connection", handleConnection);

server.listen(PORT, () => {
  log(`listening on :${PORT}, relaying to harbor at ${HARBOR_HOST}:${HARBOR_PORT}`);
});
