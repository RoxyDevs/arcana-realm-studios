import { Inject, Injectable } from "@nestjs/common";
import type { LiveSession, PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { ILiveSessionRepository } from "../domain/live-session-repository.interface";

@Injectable()
export class PrismaLiveSessionRepository implements ILiveSessionRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  findActiveByRoom(roomId: string): Promise<LiveSession | null> {
    return this.prisma.liveSession.findFirst({ where: { roomId, endedAt: null } });
  }

  create(params: { roomId: string; startedById: string; sourcePassword: string }): Promise<LiveSession> {
    return this.prisma.liveSession.create({
      data: { roomId: params.roomId, startedById: params.startedById, sourcePassword: params.sourcePassword },
    });
  }

  async end(sessionId: string): Promise<void> {
    await this.prisma.liveSession.update({ where: { id: sessionId }, data: { endedAt: new Date() } });
  }

  findActiveByRoomAndPassword(roomId: string, sourcePassword: string): Promise<LiveSession | null> {
    return this.prisma.liveSession.findFirst({ where: { roomId, sourcePassword, endedAt: null } });
  }
}
