# Arcana Realm Studios

The operating system for IMVU room owners, DJs, creators, and moderators — built as a
set of independent modules (Music, Guardian, Intelligence, Studio, API, Dashboard).

See [`CLAUDE.md`](./CLAUDE.md) for the full product vision, module list, and engineering
standards this codebase follows.

## 1. Architecture

Turborepo monorepo, pnpm workspaces:

```
apps/
  api/    NestJS backend — Feature-First + Clean Architecture
  web/    Next.js 15 dashboard (dark cyberpunk UI)
packages/
  database/   Prisma schema + shared client singleton (@arcana/database)
  types/      Shared DTOs & zod schemas consumed by both apps (@arcana/types)
```

Each `apps/api/src/modules/<name>` follows the same four layers:

- **domain/** — entities and repository/adapter *interfaces* only. No framework imports.
- **application/** — use cases / services that orchestrate domain interfaces.
- **infrastructure/** — Prisma repositories, Passport strategies, Stripe/Spotify/YouTube
  adapters. This is the only layer allowed to import a concrete SDK.
- **presentation/** — NestJS controllers + request DTOs (class-validator).

External integrations (Stripe, Spotify, YouTube, Discord) are always accessed through a
domain interface (e.g. `IPaymentProvider`, `ITrackProvider`) so a provider can be
replaced without touching business logic — see the **External Integrations Policy** in
`CLAUDE.md`.

Modules implemented so far:

| Module | Status | Notes |
|---|---|---|
| **Auth** | ✅ | Discord OAuth, JWT access + rotating opaque refresh tokens, RBAC (`@Roles`) |
| **Billing** | ✅ | Credit wallet, Stripe Checkout (one-time credits + Plus/Premium subscriptions), webhook handling, time-boxed bot licenses (1 day/week/month/3 months/year), audited manual wallet adjustments |
| **Music** | ✅ | Per-room queue, Spotify/YouTube track resolution, AutoDJ `playNext` hook |
| **Rooms** | ✅ | Bind any IMVU room by URL/ID, verify ownership via a token placed in the room's description, get back the room's Icecast/HLS stream URL once verified + bot-licensed |
| Guardian | 🔜 | Schema in place (`GuardianReport`, `ReputationScore`, `GuardianSettings`) — service layer not yet built |
| Intelligence | 🔜 | `Room` model in place — analytics/heatmaps not yet built |
| Studio | 🔜 | Not started |

## 2. Database

PostgreSQL via Prisma (`packages/database/prisma/schema.prisma`). Key models:

- **Identity**: `User`, `RefreshToken`, `AuditLog`
- **Rooms**: `Room` (owned by a `User`; `imvuRoomId` is an opaque external reference —
  no IMVU API is assumed to exist). `verificationToken`/`verificationStatus`/`verifiedAt`
  track the ownership-proof flow; `streamKey` is the private component of the room's
  Icecast/HLS stream URL, only ever exposed once `VERIFIED`
- **Billing**: `Wallet`, `Transaction`, `Subscription`
- **Music**: `Track`, `Playlist`, `PlaylistTrack`, `MusicQueueItem`
- **Guardian**: `GuardianSettings`, `GuardianReport`, `ReputationScore` — scoped to
  incidents inside a room the reporter hosts/moderates, never third-party tracking
- **Bot Licenses**: `BotLicense` — time-boxed bot access per `Room` (`DAY_1`, `WEEK_1`,
  `MONTH_1`, `MONTH_3`, `YEAR_1`; prices in `@arcana/types`' `BOT_LICENSE_PLANS`). Two
  sources: `CREDIT_PURCHASE` (self-service, spends the room owner's wallet) and
  `MANUAL_GRANT` (an `OWNER`/`ADMIN` grants time directly after confirming a payment
  Arcana can't verify automatically — PayPal.me, an in-game VCoin gift — always tied to
  the granting admin's `User.id` and logged in `AuditLog`)

### Migration strategy

- Local dev: `pnpm db:migrate` (Prisma migrate dev, generates a new migration file).
- CI/prod: `prisma migrate deploy` against the target database, run before the API
  container starts (add this as a release step in your deploy pipeline).
- Never edit an already-applied migration; add a new one.

## 3. API

NestJS on port `4000` (`API_PORT`). Swagger UI at `/docs` once running.

Auth flow: `GET /auth/discord` → Discord consent → `GET /auth/discord/callback` → sets
`access_token` / `refresh_token` httpOnly cookies → redirect to `WEB_URL/dashboard`.
`POST /auth/refresh` rotates the refresh token; `POST /auth/logout` revokes it.

Billing: `POST /billing/checkout/credits` and `POST /billing/checkout/subscription`
create a Stripe Checkout session; `POST /billing/webhook` verifies the Stripe signature
using `req.rawBody` (see `main.ts`, `NestFactory.create(AppModule, { rawBody: true })`).

Music: all endpoints are scoped under `/rooms/:roomId/queue` and require the caller to
own the room (`IRoomAccessChecker`, now shared under `common/domain` since Bot Licenses
uses it too). `POST /rooms/:roomId/tracks/upload` (multipart) uploads a room owner's own
audio into the track library that AutoDJ actually streams from — stored in Cloudflare R2
via the `IObjectStorage` port (`common/infrastructure/r2-object.storage.ts`). Spotify/
YouTube `enqueue()` only ever resolves *metadata* through their official APIs; the
platform never redistributes their copyrighted audio.

Bot Licenses: `GET /rooms/:roomId/license` (status), `POST /rooms/:roomId/license/purchase`
(room owner spends wallet credits), `POST /rooms/:roomId/license/grant` (`OWNER`/`ADMIN`
only — manual grant for a PayPal.me/VCoin payment). `POST /billing/wallet/adjust`
(`OWNER`/`ADMIN` only) credits/debits any user's wallet directly for the same
out-of-band-payment reason, and always writes an `AuditLog` row.

Rooms (binding your own IMVU room — generalized, not tied to any one example room):

1. `GET /rooms/mine` — lists the current user's rooms (pending or verified).
2. `POST /rooms/bind` — body `{ roomUrlOrId }`. Parses the `<clientId>-<roomId>` slug out
   of a pasted room URL (or accepts the bare slug), and issues a one-time
   `verificationToken` for the caller to paste into that room's IMVU description.
3. `POST /rooms/:roomId/verify` — checks whether the token actually made it into the
   room's description via `IRoomOwnershipVerifier`, and flips the room to `VERIFIED` if so.
4. `GET /rooms/:roomId/stream` — once `VERIFIED` and the room has an active bot license,
   returns the Icecast/HLS `streamUrl` to paste into IMVU's native **Media Controls →
   Transmisión de Radio** field (no bot avatar account required for audio).

`IRoomOwnershipVerifier` is backed by `ImvuRoomApiVerifier`
(`apps/api/src/modules/rooms/infrastructure/imvu-room-api.verifier.ts`), which calls
`https://api.imvu.com/room/room-<clientId>-<roomId>` — not an officially documented IMVU
endpoint, but confirmed (via a cold, cookie-less request in an incognito window) to be
public: it returns the room's `data.description` with no authentication required. This is
the same resource-graph endpoint IMVU's own "Next" web client (a WASM app, codename
"northstar") fetches to render a room page. Since it's undocumented, IMVU could change or
restrict it at any time — that risk is exactly why it's isolated behind
`IRoomOwnershipVerifier` and overridable via `IMVU_ROOM_PAGE_URL_TEMPLATE` rather than
hardcoded anywhere else.

## 4. Frontend

Next.js 15 App Router, Tailwind, TanStack Query. Dark cyberpunk theme defined in
`apps/web/tailwind.config.ts` (`arcana.*` color tokens). `/` is the marketing landing
page, `/login` starts the Discord OAuth flow, `/dashboard` reads `/auth/me` and
`/billing/wallet`.

## 5. Security

- Discord OAuth only — no password storage.
- Access tokens are short-lived JWTs (15m default); refresh tokens are opaque random
  values, stored **hashed** (SHA-256) and rotated on every use.
- RBAC via `@Roles()` + `RolesGuard`.
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` — unknown
  fields are rejected, not silently dropped.
- Global rate limiting via `@nestjs/throttler` (120 req/min/IP by default).
- Stripe webhook signature verification is mandatory (`stripe-signature` header +
  `req.rawBody`); requests without both are rejected.

## 6. Getting started

```bash
cp .env.example .env        # fill in Discord/Stripe/Spotify/YouTube credentials
docker compose up -d        # Postgres + Redis
pnpm install
pnpm db:migrate
pnpm dev                    # runs apps/api and apps/web in parallel via Turborepo
```

## 7. Testing strategy

- Unit tests live next to the code they cover (`*.spec.ts`) inside each module's layer —
  domain/application logic is tested against mocked repository/adapter interfaces, no
  real database required.
- Infrastructure (Prisma repositories, Stripe/Spotify/YouTube adapters) gets integration
  tests run against the Dockerized Postgres in CI.
- `pnpm test` runs the full suite via Turborepo; CI runs it against a real Postgres
  service container (see `.github/workflows/ci.yml`).

## 8. Future improvements

- Build the **Arcana Guardian** service layer (behavior analysis, opt-in reputation
  aggregation, ban-evasion detection) on top of the existing schema.
- Build **Arcana Intelligence** (room analytics, heatmaps) and a proper Room CRUD +
  membership model (today `IRoomAccessChecker` only checks ownership).
- Add BullMQ workers for AutoDJ playback scheduling and async Stripe webhook retries.
- Add Playwright e2e coverage for the Discord OAuth → dashboard flow.
