import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient, Track } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { ITrackRepository } from "../domain/track-repository.interface";
import type { ResolvedTrackMetadata } from "../domain/track-provider.interface";

@Injectable()
export class PrismaTrackRepository implements ITrackRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async findOrCreate(metadata: ResolvedTrackMetadata): Promise<Track> {
    const existing = await this.prisma.track.findUnique({
      where: { source_externalId: { source: metadata.source, externalId: metadata.externalId } },
    });
    if (existing) return existing;

    return this.prisma.track.create({ data: metadata });
  }
}
