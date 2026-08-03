import type { Track } from "@arcana/database";
import type { ResolvedTrackMetadata } from "./track-provider.interface";

export const TRACK_REPOSITORY = Symbol("TRACK_REPOSITORY");

export interface UploadTrackRecord {
  title: string;
  artist: string | null;
  durationSec: number;
  uploadedById: string;
  storageKey: string;
  fileUrl: string;
  genreTags: string[];
}

export interface ITrackRepository {
  findOrCreate(metadata: ResolvedTrackMetadata): Promise<Track>;
  createUpload(record: UploadTrackRecord): Promise<Track>;
}
