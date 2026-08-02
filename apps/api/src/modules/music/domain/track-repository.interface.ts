import type { Track } from "@arcana/database";
import type { ResolvedTrackMetadata } from "./track-provider.interface";

export const TRACK_REPOSITORY = Symbol("TRACK_REPOSITORY");

export interface ITrackRepository {
  findOrCreate(metadata: ResolvedTrackMetadata): Promise<Track>;
}
