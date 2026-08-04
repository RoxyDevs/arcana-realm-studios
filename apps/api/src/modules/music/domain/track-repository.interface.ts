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
  findById(id: string): Promise<Track | null>;

  /**
   * Searches the shared library of user-uploaded tracks by title/artist —
   * every room can discover and stream any track another room owner has
   * uploaded (and attested they have rights to), not just their own. Never
   * returns SPOTIFY/YOUTUBE rows: those are metadata-only and have no
   * fileUrl to actually stream.
   */
  search(query: string, limit: number): Promise<Track[]>;
}
