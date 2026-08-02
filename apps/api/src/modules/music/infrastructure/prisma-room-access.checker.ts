import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IRoomAccessChecker } from "../domain/room-access.interface";

@Injectable()
export class PrismaRoomAccessChecker implements IRoomAccessChecker {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async assertOwner(roomId: string, userId: string): Promise<void> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException("Room not found");
    }
    if (room.ownerId !== userId) {
      throw new ForbiddenException("You do not own this room");
    }
  }
}
