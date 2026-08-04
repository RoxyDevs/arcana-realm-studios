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
  /** Swaps a pending item's position with its immediate neighbor in the given direction. No-op at either end of the queue. */
  move(queueItemId: string, roomId: string, direction: "up" | "down"): Promise<void>;
  /** The most recently played item for the room (by playedAt desc), i.e. what AutoDJ most recently started streaming — null if nothing has played yet. */
  getMostRecentlyPlayed(roomId: string): Promise<QueueItemWithTrack | null>;
}
