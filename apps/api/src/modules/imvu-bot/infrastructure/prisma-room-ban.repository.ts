import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IRoomBanRepository, RoomBanRecord } from "../domain/room-ban-repository.interface";

function toRecord(row: { id: string; roomId: string; imvuDisplayName: string; reason: string | null; createdAt: Date }): RoomBanRecord {
  return { id: row.id, roomId: row.roomId, imvuDisplayName: row.imvuDisplayName, reason: row.reason, createdAt: row.createdAt };
}

@Injectable()
export class PrismaRoomBanRepository implements IRoomBanRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async upsert(params: {
    roomId: string;
    imvuDisplayName: string;
    reason: string | null;
    bannedById: string;
  }): Promise<RoomBanRecord> {
    const row = await this.prisma.roomBan.upsert({
      where: { roomId_imvuDisplayName: { roomId: params.roomId, imvuDisplayName: params.imvuDisplayName } },
      create: {
        roomId: params.roomId,
        imvuDisplayName: params.imvuDisplayName,
        reason: params.reason,
        bannedById: params.bannedById,
      },
      // Re-banning (or banning again after a name-case mismatch resolves)
      // refreshes the reason/who-banned instead of erroring on the unique
      // constraint.
      update: { reason: params.reason, bannedById: params.bannedById },
    });
    return toRecord(row);
  }

  async isBanned(roomId: string, imvuDisplayName: string): Promise<boolean> {
    const count = await this.prisma.roomBan.count({
      where: { roomId, imvuDisplayName: { equals: imvuDisplayName, mode: "insensitive" } },
    });
    return count > 0;
  }

  async remove(roomId: string, imvuDisplayName: string): Promise<boolean> {
    const { count } = await this.prisma.roomBan.deleteMany({
      where: { roomId, imvuDisplayName: { equals: imvuDisplayName, mode: "insensitive" } },
    });
    return count > 0;
  }

  async listByRoom(roomId: string): Promise<RoomBanRecord[]> {
    const rows = await this.prisma.roomBan.findMany({ where: { roomId }, orderBy: { createdAt: "desc" } });
    return rows.map(toRecord);
  }
}
