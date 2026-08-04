import { randomUUID } from "node:crypto";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ALLOWED_AUDIO_UPLOAD_MIME_TYPES, type TrackDto, type QueueItemDto, type NowPlayingDto } from "@arcana/types";
import type { Track } from "@arcana/database";
import {
  TRACK_REPOSITORY,
  type ITrackRepository,
  type UploadTrackRecord,
} from "../domain/track-repository.interface";
import { QUEUE_REPOSITORY, type IQueueRepository, type QueueItemWithTrack } from "../domain/queue-repository.interface";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../../../common/domain/room-access.interface";
import { OBJECT_STORAGE, type IObjectStorage } from "../../../common/domain/object-storage.interface";
import type { EnqueueTrackDto } from "@arcana/types";
import { TrackProviderRegistry } from "./track-provider.registry";

export interface UploadTrackParams {
  title: string;
  artist?: string;
  durationSec?: number;
  genreTags?: string[];
}

function toTrackDto(track: Track): TrackDto {
  return {
    id: track.id,
    source: track.source,
    externalId: track.externalId,
    title: track.title,
    artist: track.artist,
    durationSec: track.durationSec,
    thumbnailUrl: track.thumbnailUrl,
    genreTags: track.genreTags,
  };
}

function toQueueItemDto(item: QueueItemWithTrack): QueueItemDto {
  return {
    id: item.id,
    position: item.position,
    requestedByUsername: item.requestedBy.username,
    track: toTrackDto(item.track),
  };
}

@Injectable()
export class MusicService {
  constructor(
    private readonly trackProviders: TrackProviderRegistry,
    @Inject(TRACK_REPOSITORY) private readonly tracks: ITrackRepository,
    @Inject(QUEUE_REPOSITORY) private readonly queue: IQueueRepository,
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
    @Inject(OBJECT_STORAGE) private readonly storage: IObjectStorage,
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

  /**
   * The shared library: every room owner's uploaded tracks, searchable by
   * anyone signed in — not just the room that uploaded them. Each result
   * already carries its uploader's rights attestation from upload time, so
   * playing it in a different room is the same trust boundary as playing it
   * in the uploader's own room, just discoverable instead of siloed.
   */
  async searchLibrary(query: string): Promise<TrackDto[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      throw new BadRequestException("Search query must be at least 2 characters");
    }

    const [libraryTracks, jamendoMatches] = await Promise.all([
      this.tracks.search(trimmed, 25),
      this.trackProviders.get("JAMENDO").search(trimmed, 10),
    ]);

    // Jamendo hits need a stable Track row (findOrCreate is idempotent on
    // source+externalId) before they can be added to a queue by id — the
    // same resolve-then-persist step enqueueExisting relies on elsewhere.
    const jamendoTracks = await Promise.all(
      jamendoMatches.map((metadata) => this.tracks.findOrCreate(metadata)),
    );

    return [...libraryTracks, ...jamendoTracks].map(toTrackDto);
  }

  /** Adds an existing library track (yours or another room's upload) to this room's queue. */
  async enqueueExisting(roomId: string, userId: string, trackId: string): Promise<QueueItemDto> {
    await this.roomAccess.assertOwner(roomId, userId);

    const track = await this.tracks.findById(trackId);
    if (!track || track.source !== "UPLOAD" || !track.fileUrl) {
      throw new NotFoundException("Track not found in the library");
    }

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

  async moveInQueue(
    roomId: string,
    userId: string,
    queueItemId: string,
    direction: "up" | "down",
  ): Promise<void> {
    await this.roomAccess.assertOwner(roomId, userId);
    await this.queue.move(queueItemId, roomId, direction);
  }

  /** Best-effort "now playing" — the track AutoDJ most recently pulled off the queue for this room. */
  async getNowPlaying(roomId: string, userId: string): Promise<NowPlayingDto | null> {
    await this.roomAccess.assertOwner(roomId, userId);
    const item = await this.queue.getMostRecentlyPlayed(roomId);
    if (!item || !item.playedAt) return null;
    return { track: toTrackDto(item.track), startedAt: item.playedAt.toISOString() };
  }

  /**
   * Uploads the room owner's own audio into the track library. This is the
   * only source AutoDJ ever streams from — never a copy of a Spotify/YouTube
   * stream, which is why `enqueue()` above only ever resolves *metadata*
   * from those providers.
   */
  async uploadTrack(
    roomId: string,
    userId: string,
    file: Express.Multer.File | undefined,
    params: UploadTrackParams,
  ): Promise<TrackDto> {
    await this.roomAccess.assertOwner(roomId, userId);

    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    const extension = ALLOWED_AUDIO_UPLOAD_MIME_TYPES[file.mimetype];
    if (!extension) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}" — allowed: ${Object.keys(ALLOWED_AUDIO_UPLOAD_MIME_TYPES).join(", ")}`,
      );
    }

    const { key: storageKey, publicUrl } = await this.storage.upload({
      key: `tracks/${roomId}/${randomUUID()}.${extension}`,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const record: UploadTrackRecord = {
      title: params.title,
      artist: params.artist ?? null,
      durationSec: params.durationSec ?? 0,
      uploadedById: userId,
      storageKey,
      fileUrl: publicUrl,
      genreTags: params.genreTags ?? [],
    };

    const track = await this.tracks.createUpload(record);
    // AutoDJ's next-track lookup only ever looks at queue history for a room
    // (see StreamingInternalService.nextTrackUrl) — a Track row that was
    // never queued would sit in the library forever and never actually play.
    await this.queue.enqueue({ roomId, trackId: track.id, requestedById: userId });
    return toTrackDto(track);
  }
}
