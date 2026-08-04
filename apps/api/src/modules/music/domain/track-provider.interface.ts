import type { TrackSource } from "@arcana/database";

/**
 * Adapter boundary for external music catalogs. Spotify/YouTube are both
 * officially documented APIs — this interface exists so the domain never
 * depends on either SDK directly, and a provider can be swapped or mocked.
 */
export const TRACK_PROVIDER = Symbol("TRACK_PROVIDER");

export interface ResolvedTrackMetadata {
  source: TrackSource;
  externalId: string;
  title: string;
  artist: string | null;
  durationSec: number;
  thumbnailUrl: string | null;
  /**
   * Only ever set by the JAMENDO provider — its Creative Commons licensing
   * permits actually streaming the audio, unlike SPOTIFY/YOUTUBE which stay
   * metadata-only here on purpose (see External Integrations Policy).
   */
  fileUrl?: string;
}

export interface ITrackProvider {
  readonly source: TrackSource;
  resolve(externalId: string): Promise<ResolvedTrackMetadata>;
  search(query: string, limit: number): Promise<ResolvedTrackMetadata[]>;
}
