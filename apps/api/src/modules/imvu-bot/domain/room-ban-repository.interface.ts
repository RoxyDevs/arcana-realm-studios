export const ROOM_BAN_REPOSITORY = Symbol("ROOM_BAN_REPOSITORY");

export interface RoomBanRecord {
  id: string;
  roomId: string;
  imvuDisplayName: string;
  reason: string | null;
  createdAt: Date;
}

export interface IRoomBanRepository {
  upsert(params: {
    roomId: string;
    imvuDisplayName: string;
    reason: string | null;
    bannedById: string;
  }): Promise<RoomBanRecord>;
  /** Case-insensitive — chat-typed names won't always match a stored ban's exact casing. */
  isBanned(roomId: string, imvuDisplayName: string): Promise<boolean>;
  remove(roomId: string, imvuDisplayName: string): Promise<boolean>;
  listByRoom(roomId: string): Promise<RoomBanRecord[]>;
}
