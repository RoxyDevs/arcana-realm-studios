import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";

export interface ActiveRoomStream {
  roomId: string;
  streamKey: string;
}

const MAX_QUEUE_SKIPS = 5;

@Injectable()
export class StreamingInternalService {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  /** Rooms Liquidsoap should currently be broadcasting: verified + an unexpired bot license. */
  async listActiveRooms(): Promise<ActiveRoomStream[]> {
    const rooms = await this.prisma.room.findMany({ where: { verificationStatus: "VERIFIED" } });
    const now = new Date();

    const active: ActiveRoomStream[] = [];
    for (const room of rooms) {
      const latestLicense = await this.prisma.botLicense.findFirst({
        where: { roomId: room.id },
        orderBy: { expiresAt: "desc" },
      });
      if (latestLicense && latestLicense.expiresAt > now) {
        active.push({ roomId: room.id, streamKey: room.streamKey });
      }
    }
    return active;
  }

  /**
   * What Liquidsoap should fetch and play next for a room. Pops the pending
   * queue in order, skipping over Spotify/YouTube entries (metadata-only —
   * see External Integrations Policy, we never stream their audio). Once the
   * queue runs dry, AutoDJ loops by replaying a random track from whatever
   * this room has ever queued from its own upload library, so the stream
   * never just goes silent.
   */
  async nextTrackUrl(roomId: string): Promise<string | null> {
    for (let attempt = 0; attempt < MAX_QUEUE_SKIPS; attempt++) {
      const item = await this.prisma.musicQueueItem.findFirst({
        where: { roomId, playedAt: null },
        orderBy: { position: "asc" },
        include: { track: true },
      });
      if (!item) break;

      await this.prisma.musicQueueItem.update({ where: { id: item.id }, data: { playedAt: new Date() } });

      if (item.track.source === "UPLOAD" && item.track.fileUrl) {
        return item.track.fileUrl;
      }
      // Metadata-only entry (Spotify/YouTube) — can't stream it, try the next one.
    }

    const history = await this.prisma.musicQueueItem.findMany({
      where: { roomId, track: { source: "UPLOAD" } },
      include: { track: true },
      distinct: ["trackId"],
    });
    const playable = history.filter((item) => !!item.track.fileUrl);
    if (playable.length === 0) return null;

    const pick = playable[Math.floor(Math.random() * playable.length)];
    return pick.track.fileUrl;
  }
}
