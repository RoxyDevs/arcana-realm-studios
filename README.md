# Arcana Realm Studios

**The operating system for IMVU room owners, DJs, creators, and moderators.**

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)

Most IMVU room owners run their community on a patchwork of separate tools — one bot
for music, another for moderation, a spreadsheet for tracking who paid for what. Arcana
Realm Studios brings that into a single platform instead: a real AutoDJ radio bot with
no bot-avatar required for audio, AI-assisted moderation, creator tooling, and analytics,
all sharing one account, one wallet, and one dashboard.

**Live:** dashboard at [arcana-realm-web.vercel.app](https://arcana-realm-web.vercel.app) ·
API docs at `/docs` on the deployed API

See [`CLAUDE.md`](./CLAUDE.md) for the full product vision and the engineering standards
(Clean Architecture, the External Integrations Policy, etc.) this codebase follows.

## Modules

| Module | What it does |
|---|---|
| 🎧 **Arcana Music** | AutoDJ radio streamed straight into IMVU's native "Transmisión de Radio" field — no bot avatar needed for audio. Upload your own tracks; AI playlist matching against Spotify/YouTube taste is on the roadmap. |
| 🛡️ **Arcana Guardian** | Anti-raid, anti-spam, behavior analysis, opt-in reputation scoring — scoped to incidents inside rooms you actually host or moderate. |
| 📊 **Arcana Intelligence** | Room analytics, activity heatmaps, host dashboards. |
| 🎨 **Arcana Studio** | Creator tools — asset backup, AI texture generation. |
| 🔌 **Arcana API** | REST + webhooks + a plugin SDK for third-party integrations. |
| ⚙️ **Arcana Dashboard** | Billing, credit wallet, subscriptions, bot-time licenses, admin tools — all in one place. |

Status of each module's implementation is tracked in the table further down.

## Table of contents

1. [Architecture](#1-architecture)
2. [Database](#2-database)
3. [API](#3-api)
4. [Frontend](#4-frontend)
5. [Security](#5-security)
6. [Getting started](#6-getting-started)
7. [Testing strategy](#7-testing-strategy)
8. [Future improvements](#8-future-improvements)

## 1. Architecture

Turborepo monorepo, pnpm workspaces:

```
apps/
  api/         NestJS backend — Feature-First + Clean Architecture
  web/         Next.js 15 dashboard (dark cyberpunk UI)
  streaming/   Icecast + Liquidsoap AutoDJ engine (see apps/streaming/README.md)
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

Implementation status, module by module:

| Module | Status | Notes |
|---|---|---|
| **Auth** | ✅ | Discord OAuth, JWT access + rotating opaque refresh tokens, RBAC (`@Roles`) |
| **Billing** | ✅ | Credit wallet, Stripe Checkout (one-time credits + Plus/Premium subscriptions), webhook handling, time-boxed bot licenses (1 day/week/month/3 months/year), audited manual wallet adjustments |
| **Music** | ✅ | Per-room queue, Spotify/YouTube track resolution, AutoDJ `playNext` hook |
| **Rooms** | ✅ | Bind any IMVU room by URL/ID, verify ownership via a token placed in the room's description, get back the room's Icecast/HLS stream URL once verified + bot-licensed |
| **Streaming** | 🔜 verified outside Docker | `apps/streaming/` — Icecast + Liquidsoap AutoDJ broadcasting each room's upload queue as MP3, polling `apps/api`'s `/internal/streaming/*` for what's active/next. Run end-to-end against a real `apps/api` + Postgres (real Icecast/Liquidsoap, real seeded room/track, a real listener confirming genuine MP3 bytes) — see `apps/streaming/README.md`. Docker itself still unbuilt: every sandbox this was developed in blocks Docker Hub's image CDN |
| **Guardian** | ✅ | Service layer on `GuardianReport`/`ReputationScore`/`GuardianSettings`: room-owner-scoped settings + incident reports, platform-role-gated review, opt-in cross-room reputation aggregation |
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
- **Music**: `Track` (`storageKey`/`fileUrl`/`genreTags` set only for `source: UPLOAD` — the
  room's own audio in Cloudflare R2, never a copy of a Spotify/YouTube stream), `Playlist`,
  `PlaylistTrack`, `MusicQueueItem`
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
only — manual grant for a PayPal.me/VCoin payment). `POST /rooms/license/bulk-purchase`
buys the same plan for several owned rooms in one wallet charge — `BULK_LICENSE_DISCOUNT`
(`@arcana/types`) applies a flat percentage off the total once you buy for
`minRooms` or more at once. `POST /billing/wallet/adjust` (`OWNER`/`ADMIN` only)
credits/debits any user's wallet directly for the same out-of-band-payment reason, and
always writes an `AuditLog` row.

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
5. `DELETE /rooms/:roomId` — unbinds a room (deletes it, cascading to its queue and bot
   license history), freeing the IMVU room to be bound again by anyone.

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

Music (tracks): `POST /rooms/:roomId/tracks/upload` (multipart) — uploads a room owner's
own audio to Cloudflare R2 for AutoDJ to stream; never a copy of a Spotify/YouTube
source. Internal-only, not part of the public API surface: `GET
/internal/streaming/active-rooms` and `GET /internal/streaming/rooms/:roomId/next-track`
— polled by `apps/streaming`'s Liquidsoap process, authenticated via a shared
`STREAMING_INTERNAL_TOKEN` header instead of a user JWT (see `InternalTokenGuard`).

Guardian: `GET`/`PATCH /rooms/:roomId/guardian/settings` and `POST`/`GET
/rooms/:roomId/guardian/reports` are room-owner scoped, same as Music/Bot Licenses —
filing a report is about an incident in *your own* room, never third-party tracking.
`POST /guardian/reports/:reportId/review` is deliberately **not** room-scoped: it's
gated to platform `OWNER`/`ADMIN` roles (`@Roles`, same pattern as the bot-license
manual grant), because a room owner filing a report can't also be the one who confirms
it — `CONFIRMED` reports feed `GET /guardian/reputation/:subjectIdentifier`, a
cross-room aggregate, so self-adjudication would be an integrity hole. A confirmed
report only actually updates the aggregate if its room opted in
(`GuardianSettings.sharedBlacklistOptIn`); every review is written to `AuditLog`.

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

- Arcana Guardian's report/reputation system is deterministic by design (see the
  External Integrations Policy — there's no confirmed IMVU chat/activity feed to
  analyze). AI-assisted analysis (e.g. classifying report descriptions/evidence) is a
  future addition behind its own adapter once a real data source exists, plus
  ban-evasion detection once there's a signal to detect it from.
- Build **Arcana Intelligence** (room analytics, heatmaps) and a proper Room CRUD +
  membership model (today `IRoomAccessChecker` only checks ownership) — Guardian
  Settings/Reports currently reuse the same room-owner-only scoping, so a MODERATOR
  role for a room can't manage Guardian until that model exists.
- Add BullMQ workers for AutoDJ playback scheduling and async Stripe webhook retries.
- Add Playwright e2e coverage for the Discord OAuth → dashboard flow.
- Deploy `apps/streaming` for real (Railway) to verify the Dockerfile build itself and
  public-domain → container-port networking — the audio pipeline underneath is proven,
  the container wrapper isn't yet.
