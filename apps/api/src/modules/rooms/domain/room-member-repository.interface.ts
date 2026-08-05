export const ROOM_MEMBER_REPOSITORY = Symbol("ROOM_MEMBER_REPOSITORY");

export interface RoomMemberWithUser {
  userId: string;
  username: string;
  avatarUrl: string | null;
  roleTag: string | null;
  imvuDisplayName: string | null;
  joinedAt: Date;
}

export interface IRoomMemberRepository {
  /** Creates the roster row on first self-tag, otherwise just updates the given fields. */
  upsertRole(params: {
    roomId: string;
    userId: string;
    roleTag: string | null;
    imvuDisplayName?: string | null;
  }): Promise<RoomMemberWithUser>;
  listByRoom(roomId: string): Promise<RoomMemberWithUser[]>;
}
