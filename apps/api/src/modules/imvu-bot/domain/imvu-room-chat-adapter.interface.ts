/**
 * Domain port for a bot's presence inside an IMVU room's chat: connect,
 * receive messages/presence events, send messages, disconnect. Deliberately
 * transport-agnostic — see README.md in this module for why the only
 * candidate implementation found so far (the `imvu.js` npm package) is NOT
 * wired up yet, and must never be assumed to represent IMVU's actual,
 * official protocol.
 *
 * Per the root CLAUDE.md's External Integrations Policy: no method here
 * implies a specific wire protocol, endpoint, or auth scheme — that detail
 * belongs entirely to whichever infrastructure/ adapter implements this,
 * and must be labeled there as documented / observed / reverse-engineered /
 * hypothetical.
 */
export const IMVU_ROOM_CHAT_ADAPTER = Symbol("IMVU_ROOM_CHAT_ADAPTER");

/** A chat message observed in the room, as reported by the underlying transport. */
export interface ImvuRoomChatMessage {
  /**
   * The sender's identity as the transport reports it. Never assume this is
   * stable across adapters or reusable as a foreign key into Arcana's own
   * User/RoomMember tables without an explicit, verified link — see
   * README.md's "RoomMember has no IMVU identity" gap.
   */
  senderImvuId: string;
  senderDisplayName: string;
  content: string;
  receivedAt: Date;
  /**
   * True only when IMVU itself reports this sender as the room's host or a
   * moderator (imvu.js's User.is_host / .isMod, populated from IMVU's own
   * live room data) — deliberately NOT RoomMember.roleTag, which is
   * self-reported and explicitly not a verified signal (see its schema
   * comment). This is the one thing here that's actually safe to gate
   * moderation commands (!ban/!kick/!unban) on.
   */
  senderCanModerate: boolean;
}

export interface ImvuRoomPresenceEvent {
  imvuId: string;
  displayName: string;
}

export interface IImvuRoomChatAdapter {
  /**
   * Establishes the bot's presence in a room. `botCredential` is
   * intentionally opaque here — what it actually is (a session token, an
   * API key, something else) is a decision for the concrete adapter, not
   * this interface. `seat` positions the bot once connected — where
   * available; see the concrete adapter for whether/how it's honored.
   */
  connect(params: { roomId: string; botCredential: string; seat?: string | null }): Promise<void>;
  disconnect(roomId: string): Promise<void>;
  isConnected(roomId: string): boolean;

  sendMessage(roomId: string, content: string): Promise<void>;
  /**
   * Removes a user from the room right now — real-time only, nothing
   * persistent (see the `RoomBan` model for how a "ban" that actually
   * sticks is built on top of this). No-ops if the user isn't currently
   * tracked as present (already left, wrong id, etc.) rather than throwing
   * — callers can't always know in advance.
   */
  kickUser(roomId: string, imvuUserId: string): Promise<void>;
  /** Case-insensitive lookup against currently-present users only — there's no way to resolve someone who isn't in the room right now. */
  findUserByDisplayName(roomId: string, displayName: string): Promise<{ imvuId: string; displayName: string } | null>;

  onMessage(roomId: string, handler: (message: ImvuRoomChatMessage) => void): void;
  onUserJoin(roomId: string, handler: (event: ImvuRoomPresenceEvent) => void): void;
  onUserLeave(roomId: string, handler: (event: ImvuRoomPresenceEvent) => void): void;
}
