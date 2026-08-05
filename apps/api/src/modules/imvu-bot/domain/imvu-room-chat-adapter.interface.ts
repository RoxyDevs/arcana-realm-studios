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
   * this interface.
   */
  connect(params: { roomId: string; botCredential: string }): Promise<void>;
  disconnect(roomId: string): Promise<void>;
  isConnected(roomId: string): boolean;

  sendMessage(roomId: string, content: string): Promise<void>;

  onMessage(roomId: string, handler: (message: ImvuRoomChatMessage) => void): void;
  onUserJoin(roomId: string, handler: (event: ImvuRoomPresenceEvent) => void): void;
  onUserLeave(roomId: string, handler: (event: ImvuRoomPresenceEvent) => void): void;
}
