import type { MusicQueueItem, Track } from "@arcana/database";

export const QUEUE_REPOSITORY = Symbol("QUEUE_REPOSITORY");

export type QueueItemWithTrack = MusicQueueItem & { track: Track; requestedBy: { username: string } };

export interface IQueueRepository {
  listPending(roomId: string): Promise<QueueItemWithTrack[]>;
  /** Appends to the end of the room's pending queue, returning the assigned position. */
  enqueue(params: { roomId: string; trackId: string; requestedById: string }): Promise<QueueItemWithTrack>;
  /** Pops and marks the earliest pending item as played; null if the queue is empty. */
  popNext(roomId: string): Promise<QueueItemWithTrack | null>;
  remove(queueItemId: string, roomId: string): Promise<void>;
}
