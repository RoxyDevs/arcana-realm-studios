import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IQueueRepository, QueueItemWithTrack } from "../domain/queue-repository.interface";

const includeTrackAndRequester = {
  track: true,
  requestedBy: { select: { username: true } },
} as const;

@Injectable()
export class PrismaQueueRepository implements IQueueRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  listPending(roomId: string): Promise<QueueItemWithTrack[]> {
    return this.prisma.musicQueueItem.findMany({
      where: { roomId, playedAt: null },
      orderBy: { position: "asc" },
      include: includeTrackAndRequester,
    });
  }

  async enqueue(params: {
    roomId: string;
    trackId: string;
    requestedById: string;
  }): Promise<QueueItemWithTrack> {
    return this.prisma.$transaction(async (tx) => {
      const last = await tx.musicQueueItem.findFirst({
        where: { roomId: params.roomId, playedAt: null },
        orderBy: { position: "desc" },
      });

      return tx.musicQueueItem.create({
        data: {
          roomId: params.roomId,
          trackId: params.trackId,
          requestedById: params.requestedById,
          position: (last?.position ?? 0) + 1,
        },
        include: includeTrackAndRequester,
      });
    });
  }

  async popNext(roomId: string): Promise<QueueItemWithTrack | null> {
    return this.prisma.$transaction(async (tx) => {
      const next = await tx.musicQueueItem.findFirst({
        where: { roomId, playedAt: null },
        orderBy: { position: "asc" },
        include: includeTrackAndRequester,
      });
      if (!next) return null;

      return tx.musicQueueItem.update({
        where: { id: next.id },
        data: { playedAt: new Date() },
        include: includeTrackAndRequester,
      });
    });
  }

  async remove(queueItemId: string, roomId: string): Promise<void> {
    const result = await this.prisma.musicQueueItem.deleteMany({
      where: { id: queueItemId, roomId },
    });
    if (result.count === 0) {
      throw new NotFoundException("Queue item not found in this room");
    }
  }

  async move(queueItemId: string, roomId: string, direction: "up" | "down"): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.musicQueueItem.findFirst({ where: { id: queueItemId, roomId, playedAt: null } });
      if (!current) {
        throw new NotFoundException("Queue item not found in this room's pending queue");
      }

      const neighbor = await tx.musicQueueItem.findFirst({
        where: {
          roomId,
          playedAt: null,
          position: direction === "up" ? { lt: current.position } : { gt: current.position },
        },
        orderBy: { position: direction === "up" ? "desc" : "asc" },
      });
      if (!neighbor) return; // already at that end of the queue

      await tx.musicQueueItem.update({ where: { id: current.id }, data: { position: neighbor.position } });
      await tx.musicQueueItem.update({ where: { id: neighbor.id }, data: { position: current.position } });
    });
  }

  getMostRecentlyPlayed(roomId: string): Promise<QueueItemWithTrack | null> {
    return this.prisma.musicQueueItem.findFirst({
      where: { roomId, playedAt: { not: null } },
      orderBy: { playedAt: "desc" },
      include: includeTrackAndRequester,
    });
  }
}
