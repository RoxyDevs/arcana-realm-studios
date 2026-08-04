import type { LiveSession } from "@arcana/database";

export const LIVE_SESSION_REPOSITORY = Symbol("LIVE_SESSION_REPOSITORY");

export interface ILiveSessionRepository {
  findActiveByRoom(roomId: string): Promise<LiveSession | null>;
  create(params: { roomId: string; startedById: string; sourcePassword: string }): Promise<LiveSession>;
  end(sessionId: string): Promise<void>;

  /** Used only by the harbor auth check — matches a room + password against a currently-active session. */
  findActiveByRoomAndPassword(roomId: string, sourcePassword: string): Promise<LiveSession | null>;
}
