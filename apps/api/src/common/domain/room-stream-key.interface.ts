export const ROOM_STREAM_KEY_LOOKUP = Symbol("ROOM_STREAM_KEY_LOOKUP");

/**
 * Minimal read port for a room's streamKey — used to derive the Icecast
 * mountpoint name for a feature (like Live) that needs it without pulling
 * in Rooms' full domain layer. Same shape as IRoomAccessChecker/IRoomLicenseChecker.
 */
export interface IRoomStreamKeyLookup {
  findStreamKey(roomId: string): Promise<string | null>;
}
