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
5. **Live mic/DJ broadcast**: each active room also gets an
   `input.harbor("live-<streamKey>", port=LIQUIDSOAP_HARBOR_PORT, auth=...)`
   source. `POST /rooms/:roomId/live/start` (room owner, room needs an
   active bot license) issues short-lived, single-use ingest credentials —
   point any Icecast-compatible source app (OBS Studio, Mixxx, BUTT,
   ffmpeg) at them and the room's mount switches from AutoDJ to the live
   feed the moment it connects, falling back to AutoDJ automatically when
   the broadcaster disconnects or `POST /rooms/:roomId/live/stop` is
   called. The harbor's `auth` callback shells out to `check-live-auth.sh`,
   which hits `GET /internal/streaming/rooms/:roomId/live-auth` — checked
   once per *connection attempt*, not polled, so it can't reproduce the
   `request.dynamic` hammering bug below. Session passwords are per-session
   and never reused across starts, and never the same as `ICECAST_SOURCE_PASSWORD`.

## Required environment variables

| Variable | Purpose |
|---|---|
| `API_URL` | Base URL of `apps/api` (e.g. `https://api-production-3180.up.railway.app`) |
| `STREAMING_INTERNAL_TOKEN` | Shared secret — must exactly match the API's `STREAMING_INTERNAL_TOKEN` |
| `ICECAST_SOURCE_PASSWORD` | Password Liquidsoap uses to connect to this Icecast instance |
| `ICECAST_ADMIN_PASSWORD` | Icecast admin panel password |
| `ICECAST_HOSTNAME` | Public hostname of this service (optional, defaults to `localhost`) |
| `ICECAST_PORT` | Port Icecast listens on (optional, defaults to `8000`) |
| `LIQUIDSOAP_HARBOR_PORT` | Port the live mic/DJ harbor listener runs on (optional, defaults to `8006`) — must match the API's `STREAMING_HARBOR_PORT` |

The API side additionally needs `STREAMING_BASE_URL` set to this service's
public URL (so `streamUrl` in `GET /rooms/:roomId/stream` and the live
broadcast host shown in the dashboard actually point here),
`STREAMING_INTERNAL_TOKEN` matching, and `STREAMING_HARBOR_PORT` matching
`LIQUIDSOAP_HARBOR_PORT` above.

## Deploying (Railway)

1. New service in the same Railway project, **Dockerfile** builder, path
   `apps/streaming/Dockerfile`, root directory unset (same reasoning as the
   API's Dockerfile — build context needs to be the repo root... actually
   this Dockerfile is self-contained and doesn't need the monorepo, so
   Root Directory can be `apps/streaming` directly).
2. Generate a public domain, expose port `8000` (Icecast/AutoDJ) and
   `8006` (Liquidsoap harbor/live broadcast).
3. Set the environment variables above.
4. On the API service, set `STREAMING_BASE_URL` to this service's public
   URL, `STREAMING_INTERNAL_TOKEN` to the same secret, and
   `STREAMING_HARBOR_PORT` to match `LIQUIDSOAP_HARBOR_PORT`.

## Verified locally

There's no Docker daemon in the environment this was developed in, so the
Dockerfile image itself has never been built locally — but the actual
`icecast2` and `liquidsoap` packages were installed directly (first Ubuntu's
2.2.4, then cross-checked against Debian bookworm's actual 2.1.3 — see
below) and the real, unmodified scripts were run end-to-end: Icecast started
from `icecast.xml.template`, a real `generate-liquidsoap.sh` output loaded
into a real Liquidsoap process, a real track fetched over HTTP via the real
`next-track.sh`, and a listener `curl` confirmed genuine LAME-encoded MP3
bytes coming off the `/live/<streamKey>.mp3` mount. This — plus the actual
first Railway deploy — caught three real bugs that a Docker-only "does it
build" check would have missed:

- **Icecast refuses to start as root** without an explicit privilege drop
  (surfaces only once the container actually tries to run as root, which it
  does — no `USER` directive). Fixed by adding
  `<changeowner><user>icecast2</user><group>icecast</group></changeowner>`
  to `icecast.xml.template` (the Debian package's own `icecast2` system user).
- **Liquidsoap hard-exits on root** ("security exit... Override with
  `settings.init.allow_root := true`") — but only at actual stream startup,
  not during `--check`, which is why a syntax-only check wouldn't have
  caught it.
- **Debian bookworm ships Liquidsoap 2.1.3, not 2.2.x** — confirmed after the
  first real Railway deploy failed with `this value has type () -> _ but it
  should be a subtype of ref(_)` on `settings.log.level := 3`. The newer
  `settings.path := value` ref-assignment syntax isn't supported in 2.1.3;
  `settings.path.set(value)` is the form both 2.1.x and 2.2.x accept (2.2.x
  only emits a deprecation warning). `generate-liquidsoap.sh` now emits
  `settings.log.level.set(3)` / `settings.init.allow_root.set(true)`
  accordingly — re-verified against a real Icecast+Liquidsoap 2.2.4 run
  locally, and matches Liquidsoap's own documented 2.1→2.2 migration path.
- **`request.dynamic` was hammering the API at ~10–25 req/sec per active
  mount, forever** — confirmed by instrumenting `next-track.sh` and counting
  real invocations against a real running `apps/api`: with no explicit
  `retry_delay`, Liquidsoap 2.2.4 re-invoked the resolver function that
  fast regardless of whether a track was actively playing, which would have
  scaled linearly with room count and could have taken down the API with
  only a handful of active rooms. Separately, the "nothing queued" sentinel
  (`request.create("invalid://no-track-available")`) isn't a real protocol,
  so every one of those retries also logged `Unknown protocol "invalid" in
  URI` — 25×/sec of log spam per empty room. Fixed by returning `null()`
  (the documented way to tell `request.dynamic` "nothing right now") instead
  of a fake URI, and setting `retry_delay=4.` explicitly. Re-measured against
  the same real running pipeline: ~1 request per 3–4s per mount, zero log
  spam, stream still verified as valid decodable MP3 throughout.

- **Live mic/DJ broadcast, end-to-end with real ffmpeg pushes**: seeded a
  licensed room, started a real Liquidsoap harbor listener from the
  unmodified generated script, then pushed a real MP3 into
  `icecast://source:<sessionPassword>@localhost:8006/live-<streamKey>` with
  ffmpeg (the same URL scheme OBS/Mixxx/BUTT use). Confirmed: the mount
  switched from silence to the live source (`Switch to input.harbor with
  transition`) the moment a correctly-authenticated push connected, a
  listener `curl`+`mpg123` confirmed genuine playable MP3 while it was
  live, a wrong-password push was rejected outright with a clean HTTP 401
  (no takeover), and the mount fell back to AutoDJ automatically the
  instant the live source disconnected. This also caught a real
  API-contract bug: `POST /rooms/:roomId/live/stop` returned `201` with an
  empty body instead of `204`, which crashed the dashboard's fetch client
  on `response.json()` — fixed on both sides (`@HttpCode(204)` on the
  endpoint, and `apiFetch` now checks for actual body content instead of
  assuming only status `204` can be empty).

What's still unverified is the Dockerfile build itself and Railway's
specific networking (public domain → container port 8000) — this sandbox's
network policy blocks Docker Hub's blob CDN (`production.cloudfront.docker.com`,
403), so even a local `docker build` can't get past pulling the base image.
Everything else here — Icecast, Liquidsoap, the actual generated script, the
real `apps/api` `/internal/streaming/*` endpoints, a real seeded room/track,
and a real listener client — was run end-to-end outside Docker and is proven
correct, including the fix above.
