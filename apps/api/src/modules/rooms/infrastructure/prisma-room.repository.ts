import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient, Room } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IRoomRepository } from "../domain/room-repository.interface";

@Injectable()
export class PrismaRoomRepository implements IRoomRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<Room | null> {
    return this.prisma.room.findUnique({ where: { id } });
  }

  findByImvuRoomId(imvuRoomId: string): Promise<Room | null> {
    return this.prisma.room.findUnique({ where: { imvuRoomId } });
  }

  listByOwner(ownerId: string): Promise<Room[]> {
    return this.prisma.room.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
  }

  async upsertPendingBinding(params: {
    ownerId: string;
    imvuRoomId: string;
    name: string;
    verificationToken: string;
    streamKey: string;
  }): Promise<Room> {
    const existing = await this.prisma.room.findUnique({ where: { imvuRoomId: params.imvuRoomId } });

    // Callers only reach here once the service has confirmed the room isn't
    // already VERIFIED by someone else, so any existing row at this point is
    // PENDING — re-issuing it (possibly to a new claimant) is safe because
    // nothing is proven until the token is actually found in the description.
    if (existing) {
      return this.prisma.room.update({
        where: { id: existing.id },
        data: {
          ownerId: params.ownerId,
          name: params.name,
          verificationToken: params.verificationToken,
          streamKey: params.streamKey,
        },
      });
    }

    return this.prisma.room.create({
      data: {
        ownerId: params.ownerId,
        imvuRoomId: params.imvuRoomId,
        name: params.name,
        verificationToken: params.verificationToken,
        streamKey: params.streamKey,
      },
    });
  }

  markVerified(id: string): Promise<Room> {
    return this.prisma.room.update({
      where: { id },
      data: { verificationStatus: "VERIFIED", verifiedAt: new Date() },
    });
  }
}
