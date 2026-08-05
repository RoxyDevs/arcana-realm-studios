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
  }

  export = ImvuJsClient;
}
