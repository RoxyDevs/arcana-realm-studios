import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "./prisma.module";
import type { IRoomStreamKeyLookup } from "../domain/room-stream-key.interface";

@Injectable()
export class PrismaRoomStreamKeyLookup implements IRoomStreamKeyLookup {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async findStreamKey(roomId: string): Promise<string | null> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId }, select: { streamKey: true } });
    return room?.streamKey ?? null;
  }
}
