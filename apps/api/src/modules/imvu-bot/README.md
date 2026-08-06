# Arcana IMVU Room Bot

Status: **implemented, wired into `app.module.ts`, not yet tested against a
real IMVU bot account.** The go/no-go on `imvu.js` below was decided (go —
the room owner explicitly asked to proceed despite the risk, having already
seen the `imvu.js.org`-based `BorealVU` bot working live in one of their
rooms). What's built:

- `infrastructure/imvu-js-room-chat.adapter.ts` implements
  `IImvuRoomChatAdapter` against the real `imvu.js` package (source read
  directly — `lib/imvu.js`, `lib/ws.js` — not just its README).
- The room owner's `imvu.js.org` token is encrypted at rest
  (`ImvuBotCredential`, AES-256-GCM via `AesSecretBox`) and set through
  `PUT /rooms/:roomId/bot/credential`.
- `POST /rooms/:roomId/bot/start` / `/stop` and `GET /rooms/:roomId/bot`
  (`ImvuBotController`) — owner-only, gated on an active `BotLicense` via
  the existing `ROOM_LICENSE_CHECKER` port.
- `ChatCommandRouter` handles `!play`, `!skip`, `!queue`, `!nowplaying`
  against the real `MusicService` queue — the deterministic layer described
  below, now real code instead of a plan.
- A dashboard panel (`apps/web/components/imvu-bot-panel.tsx`) to paste the
  token and start/stop the bot.

**Still blocking real end-to-end verification:** nobody has run this
against an actual `imvu.js.org` bot account yet. Register one there, save
its token via the dashboard panel, buy/grant this room a `BotLicense`, hit
"Arrancar bot", and watch for the `'ready'` event / a reply to `!nowplaying`
in the room's chat. Until that happens, treat the adapter as "compiles and
matches the library's real source" — not "confirmed working."

## What IMVU officially offers

Nothing applicable. IMVU's public API-key program is closed to new
applicants (confirmed by its own site copy, not assumed). There is no
documented way to run a third-party bot inside a room. Anything here is
necessarily built on undocumented protocol — per the root `CLAUDE.md`'s
External Integrations Policy, that dependency must stay isolated behind
`IImvuRoomChatAdapter` and never be presented as officially supported.

## `imvu.js` (npm, `github.com/imvujs/imvu.js`) — what it actually does

The TODO item said not to trust the README's marketing copy and read the
real source first. Done — cloned and read `lib/imvu.js`, `lib/api.js`,
`lib/ws.js`, `lib/Room.js` directly. The finding changes the risk picture:

**`imvu.js` is not a client for IMVU's protocol. It's a client for a
third party's relay service, `imvu.js.org`, that is unaffiliated with IMVU.**

- `lib/api.js`: `authenticate(token)` POSTs to `https://imvu.js.org/api/authenticate`
  — not any `imvu.com` host. The README confirms this isn't a token IMVU
  itself issues: *"To obtain your token, you must register on our platform
  at https://imvu.js.org."* So step one of using this library is creating
  an account on a small, unaffiliated, single-maintainer site and handing
  it something tied to your real IMVU account.
- `lib/ws.js`: after that auth call, the library connects to **Supabase
  Realtime** (`@supabase/supabase-js`) using a project URL/key/channel the
  `imvu.js.org` backend hands back (`api.ssv`, `api.ssk`, `api.ws_key`,
  `api.ws_sv`). Every room event (chat, join/leave, seating, furniture)
  arrives as a Supabase broadcast payload — never a direct connection to
  any IMVU-owned host. Whatever actually talks to IMVU's real, undocumented
  protocol happens entirely server-side inside `imvu.js.org`'s own backend,
  which is not open source and not visible to us at all.
- So depending on `imvu.js` means depending on `imvu.js.org` staying up,
  staying honest with a bot account's IMVU token, and staying compatible
  with IMVU's internals indefinitely — three separate points of failure
  outside Arcana's control, none of them inspectable.

**Maturity / trust signals, for the record:**
- `package.json` version `0.1.0`, single commit visible in the shallow
  clone, dated 2026-01-23 — roughly the "published ~6 months ago" the prior
  session's TODO note already flagged.
- Source comments are informal to the point of being a red flag in
  production-adjacent code: *"I destroyed all the imports during the
  refactor"*, *"Yeah, I know, 'stuff happens' here. I'll fix it in a future
  commit... maybe"*, *"Too lazy for this now"*. Reads like a solo hobby
  project, not something with an SLA or a security review behind it.
- License is a custom "MIT License with restrictions": the software *"must
  be used in its original form, without modifications"* and *"cannot be
  modified or altered in itself."* Arcana could depend on it, but could
  never fork and patch it if `imvu.js.org` breaks something — full
  dependency on the original maintainer fixing things, on their timeline.
- The README's disclaimer only says usage must comply with IMVU's own ToS;
  it says nothing about whether IMVU is aware of or has sanctioned this
  relay. Building a paid feature on it stacks "our own ToS exposure" on top
  of "a third party's ToS exposure we can't audit."

**Bottom line:** this is not "a reverse-engineered protocol library we can
vendor and inspect." It's "hand a real IMVU bot account's session token to
an unaccountable third party's server, in exchange for room events relayed
through their Supabase project." That's a materially different — and
larger — risk than the TODO note implied before anyone read the source.

## Design: `IImvuRoomChatAdapter` (this module's `domain/`)

Regardless of which transport gets chosen, the business logic on top of it
should never know the difference. `domain/imvu-room-chat-adapter.interface.ts`
defines that boundary: `connect`/`disconnect`/`sendMessage`/`onMessage`/
`onUserJoin`/`onUserLeave`, with `botCredential` left intentionally opaque.
`infrastructure/imvu-js-room-chat.adapter.ts` is the one concrete
implementation, against `imvu.js`.

What sits *on top* of this port, in `application/`:

1. **Deterministic commands first — built.** `ChatCommandRouter` handles
   `!play`, `!skip`, `!queue`, `!nowplaying` against the real `MusicService`
   queue, per the root `CLAUDE.md`'s AI Philosophy ("prefer deterministic
   systems assisted by AI instead of replacing business logic"). A message
   that isn't a recognized command returns `null` and is otherwise ignored —
   there is no AI response layer yet (see below).
2. **AI response layer — not built.** Only messages that don't match a
   deterministic command should reach it, as a distinct service (not folded
   into `ChatCommandRouter`) so it can be toggled off per room without
   touching `!play`/`!skip`. This is the "Host conversacional con IA" task —
   real conversational responses, aware of room context (seats, roles,
   now-playing, queue). Needs an LLM provider decision (none configured in
   this codebase yet) before it can start.
3. **Room-role awareness — schema gap closed, not yet consumed.**
   `RoomMember.imvuDisplayName` now exists (self-reported, same trust level
   as `roleTag` — not a verified identity link) and is settable via
   `PUT /rooms/:roomId/members/me`. Nothing reads it yet — that lookup
   (matching an incoming `ImvuRoomChatMessage.senderDisplayName` back to a
   roster row) belongs inside whatever implements step 2, not in the
   deterministic command router, which has no need for role context today.

## Does the bot show up as a visible avatar in the room?

Short answer: **yes, automatically — this isn't something Arcana's code needs to build.** The "bot" is a real IMVU account (whichever one was registered at imvu.js.org and whose token got pasted into the dashboard's bot panel), and connecting it through imvu.js is a real login session for that account, the same as a person opening IMVU normally. Whatever that account's avatar looks like — the outfit, the model — is what shows up in the room, because it's a real avatar occupying a real seat, not a headless/text-only participant.

Two concrete, code-verified consequences of that, read directly from `lib/imvu.js` (not assumed from the README, which doesn't mention either):

- **Appearance isn't controllable from here, and never was.** The library's constructor accepts `walk`/`gameslib`/`outfit` options — they're stored on the instance and then never referenced anywhere else in the source. Dead code. If you want the bot to look a certain way, dress up its IMVU account the normal way, through IMVU itself, before connecting it — same as any avatar. `imvu-js.d.ts` documents this inline now so nobody wires `outfit` up expecting it to do something.
- **Position IS controllable.** `ImvuJsClient.seat` is a real, plain instance property — set it before calling `login()` and the library calls its own `update_seat()` right after auth completes. `ImvuBotCredential.seat` (new column) + the bot panel's optional seat field wire this through end-to-end now: `PUT /rooms/:roomId/bot/credential { token, seat }`.

None of this has been confirmed against a real room yet, same open item as the rest of this module — but it comes directly from what the library's own code does, not a guess.

- A real `imvu.js.org` bot account + token, to actually exercise `connect()`
  end-to-end (register there, save the token via the dashboard's "Bot de
  sala" panel, buy/grant a `BotLicense`, hit "Arrancar bot").
- A decision on an LLM provider, before step 2 (AI response layer) starts.
