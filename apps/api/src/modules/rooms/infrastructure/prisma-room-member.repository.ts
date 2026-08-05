import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type {
  IRoomMemberRepository,
  RoomMemberWithUser,
} from "../domain/room-member-repository.interface";

const includeUser = { user: { select: { username: true, avatarUrl: true } } } as const;

@Injectable()
export class PrismaRoomMemberRepository implements IRoomMemberRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async upsertRole(params: {
    roomId: string;
    userId: string;
    roleTag: string | null;
    imvuDisplayName?: string | null;
  }): Promise<RoomMemberWithUser> {
    const member = await this.prisma.roomMember.upsert({
      where: { roomId_userId: { roomId: params.roomId, userId: params.userId } },
      create: {
        roomId: params.roomId,
        userId: params.userId,
        roleTag: params.roleTag,
        imvuDisplayName: params.imvuDisplayName ?? null,
      },
      update: {
        roleTag: params.roleTag,
        ...(params.imvuDisplayName !== undefined ? { imvuDisplayName: params.imvuDisplayName } : {}),
      },
      include: includeUser,
    });
    return {
      userId: member.userId,
      username: member.user.username,
      avatarUrl: member.user.avatarUrl,
      roleTag: member.roleTag,
      imvuDisplayName: member.imvuDisplayName,
      joinedAt: member.joinedAt,
    };
  }

  async listByRoom(roomId: string): Promise<RoomMemberWithUser[]> {
    const members = await this.prisma.roomMember.findMany({
      where: { roomId },
      include: includeUser,
      orderBy: { joinedAt: "asc" },
    });
    return members.map((member) => ({
      userId: member.userId,
      username: member.user.username,
      avatarUrl: member.user.avatarUrl,
      roleTag: member.roleTag,
      imvuDisplayName: member.imvuDisplayName,
      joinedAt: member.joinedAt,
    }));
  }
}
