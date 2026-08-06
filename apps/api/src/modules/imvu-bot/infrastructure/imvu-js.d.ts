/**
 * Minimal ambient typing for `imvu.js` (no types shipped upstream) — covers
 * only the surface this module's adapter actually calls. See README.md for
 * why this library talks to imvu.js.org's relay, not any IMVU-owned host.
 * `ws` is exposed here deliberately: it is an internal property, not part of
 * the library's documented API, but it is the only way to tear down the
 * underlying Supabase Realtime channel — see imvu-js-room-chat.adapter.ts.
 */
declare module "imvu.js" {
  interface ImvuJsUser {
    id: string | null;
    legacy_cid: string | null;
    display_name: string | null;
    username: string | null;
    /** True when IMVU reports this user as the room's host/owner — see lib/imvu.js's User class. */
    is_host: boolean;
    /** True when IMVU reports this user as a room moderator (a role assigned inside IMVU itself, not by Arcana). */
    isMod: boolean;
    /** Real method on the library's User class — sends a "kick" message over the ws relay. Not documented in the README; confirmed by reading lib/imvu.js directly. */
    kick(): void;
  }

  interface ImvuJsMessageEvent {
    content: string;
    user: ImvuJsUser;
  }

  interface ImvuJsOptions {
    name?: string;
    /**
     * CONFIRMED DEAD CODE — read the full source of lib/imvu.js during this
     * session: `walk`/`gameslib`/`outfit` are all stored on the instance in
     * the constructor and never referenced anywhere else in the library.
     * They do not configure appearance, movement, or anything else today.
     * Kept typed here only so a future read of the library's own
     * (currently-inaccurate) README doesn't lead someone to wire these up
     * expecting them to do something. Do not use `outfit` to try to control
     * the bot's look — there is no such mechanism. See `ImvuJsClient.seat`
     * for the one instance property that actually does something
     * (positioning, not appearance).
     */
    walk?: boolean;
    gameslib?: boolean;
    outfit?: unknown[];
  }

  interface ImvuJsUsersService {
    getById(id: string): ImvuJsUser | null;
    /** No-arg call returns every currently-tracked user; matches lib/imvu.js's UsersService.get(). */
    get(query?: Record<string, unknown>): ImvuJsUser[];
  }

  class ImvuJsClient {
    constructor(options?: ImvuJsOptions);
    login(token: string): Promise<void>;
    say(message: string): void;
    on(event: "ready", handler: () => void): void;
    on(event: "message", handler: (message: ImvuJsMessageEvent) => void): void;
    on(event: "join", handler: (user: ImvuJsUser) => void): void;
    on(event: "leave", handler: (user: ImvuJsUser) => void): void;
    once(event: "ready", handler: () => void): void;
    removeAllListeners(): void;
    ws: { close?: () => void } | null;
    users: ImvuJsUsersService;
    /**
     * A plain, mutable instance property — NOT a constructor option. Set it
     * BEFORE calling login(); if truthy, login() calls the library's own
     * update_seat() automatically right after auth completes. Confirmed
     * real by reading lib/imvu.js's IMVU.login()/update_seat() directly —
     * this is the one thing here that actually controls where the bot
     * appears (not what it looks like).
     */
    seat: string | null;
  }

  export = ImvuJsClient;
}
