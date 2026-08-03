# Arcana Streaming (Icecast + Liquidsoap)

The AutoDJ engine — broadcasts each verified, bot-licensed room's track queue
as an MP3 stream. This is what IMVU's native **Media Controls → Transmisión
de Radio** field actually connects to (the `streamUrl` the API returns from
`GET /rooms/:roomId/stream`).

Deliberately a separate long-running process from `apps/api`, not another
NestJS route — this is a persistent audio pipeline, not request/response.

## Why these choices

Per IMVU's own support docs (`support.imvu.com` → "Radio Streaming"):

- **MP3 only** — AAC/OGG streams don't play. `output.icecast(%mp3(...))` below.
- **The URL must point straight at raw audio bytes** — never a `.pls`/`.m3u`/
  `.m3u8` playlist wrapper, and should end in something like `.mp3`. That's
  why `RoomsService` appends `.mp3` to the stream URL, matching an Icecast
  mountpoint path.
- **128 kbps or lower** — higher bitrates cause skips/dropouts in-room.
- Icecast is IMVU's own suggested option (open source, no licensing fees vs.
  Shoutcast) — matches what's built here.

## How it works

1. `entrypoint.sh` starts Icecast, then loops every 60s calling
   `generate-liquidsoap.sh`, which hits the API's
   `GET /internal/streaming/active-rooms` (verified + unexpired bot license)
   and regenerates `radio.liq` with one Liquidsoap output per active room.
2. If the room list changed since the last loop, Liquidsoap is restarted to
   pick up new/removed mountpoints — new bindings get a stream within a
   minute, no redeploy needed.
3. Each room's Liquidsoap source is a `request.dynamic` that shells out to
   `next-track.sh <roomId>`, which calls
   `GET /internal/streaming/rooms/:roomId/next-track` — the API pops the
   room's pending queue (skipping Spotify/YouTube metadata-only entries,
   since we never stream their copyrighted audio — see the External
   Integrations Policy in the root `CLAUDE.md`) and loops back through the
   room's own uploaded tracks once the queue runs dry, so AutoDJ never goes
   silent as long as *something* has been uploaded.
4. A room with nothing uploaded yet falls back to `blank()` (silence)
   instead of the mountpoint dying.

## Required environment variables

| Variable | Purpose |
|---|---|
| `API_URL` | Base URL of `apps/api` (e.g. `https://api-production-3180.up.railway.app`) |
| `STREAMING_INTERNAL_TOKEN` | Shared secret — must exactly match the API's `STREAMING_INTERNAL_TOKEN` |
| `ICECAST_SOURCE_PASSWORD` | Password Liquidsoap uses to connect to this Icecast instance |
| `ICECAST_ADMIN_PASSWORD` | Icecast admin panel password |
| `ICECAST_HOSTNAME` | Public hostname of this service (optional, defaults to `localhost`) |
| `ICECAST_PORT` | Port Icecast listens on (optional, defaults to `8000`) |

The API side additionally needs `STREAMING_BASE_URL` set to this service's
public URL (so `streamUrl` in `GET /rooms/:roomId/stream` actually points
here) and the matching `STREAMING_INTERNAL_TOKEN`.

## Deploying (Railway)

1. New service in the same Railway project, **Dockerfile** builder, path
   `apps/streaming/Dockerfile`, root directory unset (same reasoning as the
   API's Dockerfile — build context needs to be the repo root... actually
   this Dockerfile is self-contained and doesn't need the monorepo, so
   Root Directory can be `apps/streaming` directly).
2. Generate a public domain, expose port `8000`.
3. Set the environment variables above.
4. On the API service, set `STREAMING_BASE_URL` to this service's public
   URL and `STREAMING_INTERNAL_TOKEN` to the same secret.

## Known gap — this needs live testing

This was built and reasoned through against Debian's packaged Icecast2/
Liquidsoap documentation, but **not run** — there's no Docker daemon
available in the environment this was developed in, so the exact Liquidsoap
script syntax (`request.dynamic`, `fallback`, `mksafe`) hasn't been verified
against a real Liquidsoap version. Expect to watch Railway's deploy/runtime
logs closely on first deploy and iterate on `generate-liquidsoap.sh`'s
generated `.liq` syntax if Liquidsoap rejects it.
