import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { RoomMemberDto } from "@arcana/types";
import { ROOM_REPOSITORY, type IRoomRepository } from "../domain/room-repository.interface";
import {
  ROOM_MEMBER_REPOSITORY,
  type IRoomMemberRepository,
  type RoomMemberWithUser,
} from "../domain/room-member-repository.interface";

function toDto(member: RoomMemberWithUser): RoomMemberDto {
  return {
    userId: member.userId,
    username: member.username,
    avatarUrl: member.avatarUrl,
    roleTag: member.roleTag,
    joinedAt: member.joinedAt.toISOString(),
  };
}

/**
 * The room roster — deliberately not owner-gated like the rest of the Rooms
 * module. Anyone signed in who has the room's link can self-tag; the room
 * owner never approves or assigns these, matching how roleplay communities
 * (families, clans, fantasy kingdoms) actually organize themselves.
 */
@Injectable()
export class RoomMemberService {
  constructor(
    @Inject(ROOM_REPOSITORY) private readonly rooms: IRoomRepository,
    @Inject(ROOM_MEMBER_REPOSITORY) private readonly members: IRoomMemberRepository,
  ) {}

  async setMyRole(roomId: string, userId: string, roleTag: string | null): Promise<RoomMemberDto> {
    const room = await this.rooms.findById(roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }
    const member = await this.members.upsertRole({ roomId, userId, roleTag });
    return toDto(member);
  }

  async listRoster(roomId: string): Promise<RoomMemberDto[]> {
    const room = await this.rooms.findById(roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }
    const roster = await this.members.listByRoom(roomId);
    return roster.map(toDto);
  }
}
