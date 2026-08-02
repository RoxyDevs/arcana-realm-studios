import { Inject, Injectable } from "@nestjs/common";
import type { QueueItemDto } from "@arcana/types";
import { TRACK_REPOSITORY, type ITrackRepository } from "../domain/track-repository.interface";
import { QUEUE_REPOSITORY, type IQueueRepository, type QueueItemWithTrack } from "../domain/queue-repository.interface";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../domain/room-access.interface";
import type { EnqueueTrackDto } from "@arcana/types";
import { TrackProviderRegistry } from "./track-provider.registry";

function toQueueItemDto(item: QueueItemWithTrack): QueueItemDto {
  return {
    id: item.id,
    position: item.position,
    requestedByUsername: item.requestedBy.username,
    track: {
      id: item.track.id,
      source: item.track.source,
      externalId: item.track.externalId,
      title: item.track.title,
      artist: item.track.artist,
      durationSec: item.track.durationSec,
      thumbnailUrl: item.track.thumbnailUrl,
    },
  };
}

@Injectable()
export class MusicService {
  constructor(
    private readonly trackProviders: TrackProviderRegistry,
    @Inject(TRACK_REPOSITORY) private readonly tracks: ITrackRepository,
    @Inject(QUEUE_REPOSITORY) private readonly queue: IQueueRepository,
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
  ) {}

  async getQueue(roomId: string, userId: string): Promise<QueueItemDto[]> {
    await this.roomAccess.assertOwner(roomId, userId);
    const items = await this.queue.listPending(roomId);
    return items.map(toQueueItemDto);
  }

  async enqueue(roomId: string, userId: string, dto: EnqueueTrackDto): Promise<QueueItemDto> {
    await this.roomAccess.assertOwner(roomId, userId);

    const provider = this.trackProviders.get(dto.source);
    const metadata = await provider.resolve(dto.externalId);
    const track = await this.tracks.findOrCreate(metadata);

    const item = await this.queue.enqueue({ roomId, trackId: track.id, requestedById: userId });
    return toQueueItemDto(item);
  }

  /** AutoDJ hook: advances the queue and returns the track that should start playing next. */
  async playNext(roomId: string, userId: string): Promise<QueueItemDto | null> {
    await this.roomAccess.assertOwner(roomId, userId);
    const next = await this.queue.popNext(roomId);
    return next ? toQueueItemDto(next) : null;
  }

  async removeFromQueue(roomId: string, userId: string, queueItemId: string): Promise<void> {
    await this.roomAccess.assertOwner(roomId, userId);
    await this.queue.remove(queueItemId, roomId);
  }
}
