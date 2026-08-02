export const ROOM_ACCESS_CHECKER = Symbol("ROOM_ACCESS_CHECKER");

/**
 * Scopes an action to a room the acting user actually owns. Shared by any
 * module that operates on a Room (Music, Billing's bot-license purchases) —
 * a full Room CRUD/membership model lives in Arcana Intelligence.
 */
export interface IRoomAccessChecker {
  assertOwner(roomId: string, userId: string): Promise<void>;
}
