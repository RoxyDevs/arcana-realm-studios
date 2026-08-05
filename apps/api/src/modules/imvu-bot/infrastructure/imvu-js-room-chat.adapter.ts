import { Injectable, Logger } from "@nestjs/common";
import ImvuJsClient from "imvu.js";
import type {
  IImvuRoomChatAdapter,
  ImvuRoomChatMessage,
  ImvuRoomPresenceEvent,
} from "../domain/imvu-room-chat-adapter.interface";

const READY_TIMEOUT_MS = 20_000;

interface RoomConnection {
  client: ImvuJsClient;
}

/**
 * `IImvuRoomChatAdapter` implemented against `imvu.js` (github.com/imvujs/imvu.js).
 *
 * Per README.md in this module: this is NOT a client for IMVU's own protocol.
 * `botCredential` here is a token minted by `imvu.js.org`, a third party
 * unaffiliated with IMVU — the library authenticates against that relay,
 * which then hands back Supabase Realtime connection details and proxies
 * room events through its own backend. That backend is closed-source and
 * outside Arcana's control; treat this adapter as depending on
 * `imvu.js.org` staying up and honest, not on any IMVU-documented API.
 *
 * One more consequence of that: `imvu.js`'s `login(token)` takes no room
 * parameter — the room a token connects to is decided server-side by
 * imvu.js.org when the token was issued. So `roomId` here is purely our own
 * correlation key (which Arcana Room this connection belongs to); it is
 * never sent to `imvu.js` and there is nothing stopping a misconfigured
 * token from actually being bound to a different IMVU room than the one its
 * `botCredential` was stored against.
 */
@Injectable()
export class ImvuJsRoomChatAdapter implements IImvuRoomChatAdapter {
  private readonly logger = new Logger(ImvuJsRoomChatAdapter.name);
  private readonly connections = new Map<string, RoomConnection>();

  async connect(params: { roomId: string; botCredential: string }): Promise<void> {
    const { roomId, botCredential } = params;
    if (this.connections.has(roomId)) return;

    const client = new ImvuJsClient({ name: `arcana-bot-${roomId}` });

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`imvu.js: no 'ready' event within ${READY_TIMEOUT_MS}ms for room ${roomId}`));
      }, READY_TIMEOUT_MS);

      client.once("ready", () => {
        clearTimeout(timer);
        resolve();
      });

      client.login(botCredential).catch((error) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });

    this.connections.set(roomId, { client });
    this.logger.log(`Connected bot for room ${roomId} via imvu.js.org relay`);
  }

  async disconnect(roomId: string): Promise<void> {
    const connection = this.connections.get(roomId);
    if (!connection) return;

    // imvu.js exposes no public logout/disconnect method — WS.close() (the
    // Supabase channel's unsubscribe()) is defined in the library but never
    // wired to anything IMVU's own class calls. Reaching into `client.ws` is
    // the only way to actually tear the session down; it is an internal
    // property, not documented API — see imvu-js.d.ts.
    connection.client.ws?.close?.();
    connection.client.removeAllListeners();
    this.connections.delete(roomId);
    this.logger.log(`Disconnected bot for room ${roomId}`);
  }

  isConnected(roomId: string): boolean {
    return this.connections.has(roomId);
  }

  async sendMessage(roomId: string, content: string): Promise<void> {
    const connection = this.requireConnection(roomId);
    connection.client.say(content);
  }

  onMessage(roomId: string, handler: (message: ImvuRoomChatMessage) => void): void {
    const connection = this.requireConnection(roomId);
    connection.client.on("message", ({ content, user }) => {
      handler({
        senderImvuId: user.id ?? user.legacy_cid ?? "",
        senderDisplayName: user.display_name ?? user.username ?? "Unknown",
        content,
        receivedAt: new Date(),
      });
    });
  }

  onUserJoin(roomId: string, handler: (event: ImvuRoomPresenceEvent) => void): void {
    const connection = this.requireConnection(roomId);
    connection.client.on("join", (user) => handler(this.toPresenceEvent(user)));
  }

  onUserLeave(roomId: string, handler: (event: ImvuRoomPresenceEvent) => void): void {
    const connection = this.requireConnection(roomId);
    connection.client.on("leave", (user) => handler(this.toPresenceEvent(user)));
  }

  private toPresenceEvent(user: { id: string | null; legacy_cid: string | null; display_name: string | null; username: string | null }): ImvuRoomPresenceEvent {
    return {
      imvuId: user.id ?? user.legacy_cid ?? "",
      displayName: user.display_name ?? user.username ?? "Unknown",
    };
  }

  private requireConnection(roomId: string): RoomConnection {
    const connection = this.connections.get(roomId);
    if (!connection) {
      throw new Error(`No active imvu.js connection for room ${roomId} — call connect() first`);
    }
    return connection;
  }
}
