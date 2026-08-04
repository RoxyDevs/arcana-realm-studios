# Arcana IMVU Room Bot — research + design (not shippable yet)

Status: **domain interface only, no infrastructure adapter.** This module
intentionally has no controller, no NestJS wiring in `app.module.ts`, and no
implementation of `IImvuRoomChatAdapter`. Two things block going further,
and both need a human decision, not more code:

1. A real IMVU bot account's credentials, to test any adapter end-to-end.
2. A go/no-go decision on the `imvu.js` finding below — this isn't a small
   detail, it changes what "using imvu.js" actually means.

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

Regardless of which transport gets chosen (or whether one gets chosen at
all), the business logic on top of it should never know the difference.
`domain/imvu-room-chat-adapter.interface.ts` defines that boundary:
`connect`/`disconnect`/`sendMessage`/`onMessage`/`onUserJoin`/`onUserLeave`,
with `botCredential` left intentionally opaque (a session token today,
something else tomorrow, adapter's problem either way).

The intended shape for what sits *on top* of this port, once there's an
adapter to wire in:

1. **Deterministic commands first.** `!play`, `!skip`, and friends already
   exist as real business logic (Arcana Music's queue). A chat message
   handler pattern-matches against known command prefixes before anything
   else runs — per the root `CLAUDE.md`'s AI Philosophy ("prefer
   deterministic systems assisted by AI instead of replacing business
   logic"), the LLM layer is a fallback for messages that aren't a known
   command, not a replacement for command parsing.
2. **AI response layer, separate service.** Only messages that don't match
   a deterministic command reach it. Keeping it a distinct service (not
   folded into command dispatch) means it can be toggled off per room
   without touching `!play`/`!skip` at all.
3. **Room-role awareness — currently blocked by a schema gap.** The ask was
   for responses "conscious of room roles" using `RoomMember.roleTag`
   (`packages/database/prisma/schema.prisma`). Checked that model: it's
   keyed by `roomId` + Arcana `User.id`, with **no IMVU identity field at
   all**. It's populated by an Arcana-account holder self-tagging *inside
   the dashboard* — nothing today links that row to the display name/ID an
   IMVU chat message's sender actually shows up as. Before role-aware
   responses are possible, `RoomMember` needs something like an
   `imvuDisplayName` field (self-reported, same trust level as `roleTag`
   itself — this isn't a verified identity link, just a matching key) so
   an incoming `ImvuRoomChatMessage.senderDisplayName` can be looked up
   against it. Not built yet — flagging it here since it blocks step 3
   specifically, independent of the `imvu.js` question above.

## What's needed before this goes further

- A decision on the `imvu.js`/`imvu.js.org` trust question above — worth
  treating as a real go/no-go, not a formality (see AskUserQuestion in the
  session that produced this doc).
- A real IMVU bot account to test whatever gets decided against.
- The `RoomMember.imvuDisplayName` schema addition, if role-aware responses
  are still wanted.
