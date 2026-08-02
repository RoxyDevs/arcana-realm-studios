export const ROOM_ACCESS_CHECKER = Symbol("ROOM_ACCESS_CHECKER");

/**
 * Scopes every music/queue action to a room the acting user actually owns.
 * A full Room CRUD lives in Arcana Intelligence — this is the minimal read
 * boundary Arcana Music needs until that module lands.
 */
export interface IRoomAccessChecker {
  assertOwner(roomId: string, userId: string): Promise<void>;
}
