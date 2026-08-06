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
  }

  export = ImvuJsClient;
}
