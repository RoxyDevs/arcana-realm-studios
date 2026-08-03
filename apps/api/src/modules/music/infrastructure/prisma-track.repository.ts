import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient, Track } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { ITrackRepository, UploadTrackRecord } from "../domain/track-repository.interface";
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

  createUpload(record: UploadTrackRecord): Promise<Track> {
    return this.prisma.track.create({
      data: {
        source: "UPLOAD",
        // Uploads have no external catalog id — the unique constraint on
        // (source, externalId) just needs *something* collision-free.
        externalId: randomUUID(),
        title: record.title,
        artist: record.artist,
        durationSec: record.durationSec,
        thumbnailUrl: null,
        uploadedById: record.uploadedById,
        storageKey: record.storageKey,
        fileUrl: record.fileUrl,
        genreTags: record.genreTags,
      },
    });
  }
}
