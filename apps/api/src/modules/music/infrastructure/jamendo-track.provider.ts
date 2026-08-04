import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import type { ITrackProvider, ResolvedTrackMetadata } from "../domain/track-provider.interface";

interface JamendoTrackResponse {
  id: string;
  name: string;
  artist_name: string;
  duration: number;
  image: string;
  audio: string;
}

/**
 * Wraps Jamendo's public API (developer.jamendo.com) — a ~500k-track catalog
 * of independently released, Creative-Commons-licensed music. This is the
 * one external provider Arcana is allowed to actually stream from (see
 * ResolvedTrackMetadata.fileUrl): Jamendo's own terms permit it, unlike
 * Spotify/YouTube's commercial catalogs.
 *
 * `JAMENDO_CLIENT_ID` is a free client id from https://developer.jamendo.com —
 * reading the catalog needs nothing more than that (no OAuth). Until it's
 * configured this provider no-ops (empty search results, 404 on resolve)
 * rather than failing the whole music search — Jamendo is an enhancement to
 * the shared upload library, not a dependency of it.
 */
@Injectable()
export class JamendoTrackProvider implements ITrackProvider {
  readonly source = "JAMENDO" as const;
  private readonly logger = new Logger(JamendoTrackProvider.name);

  private get clientId(): string {
    return process.env.JAMENDO_CLIENT_ID ?? "";
  }

  private toMetadata(track: JamendoTrackResponse): ResolvedTrackMetadata {
    return {
      source: "JAMENDO",
      externalId: track.id,
      title: track.name,
      artist: track.artist_name || null,
      durationSec: track.duration,
      thumbnailUrl: track.image || null,
      fileUrl: track.audio,
    };
  }

  async resolve(externalId: string): Promise<ResolvedTrackMetadata> {
    if (!this.clientId) {
      throw new NotFoundException("Jamendo isn't configured (missing JAMENDO_CLIENT_ID)");
    }

    const url = new URL("https://api.jamendo.com/v3.0/tracks/");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("format", "json");
    url.searchParams.set("id", externalId);

    const response = await fetch(url);
    if (!response.ok) {
      throw new InternalServerErrorException("Jamendo API request failed");
    }

    const data = (await response.json()) as { results: JamendoTrackResponse[] };
    const track = data.results[0];
    if (!track) {
      throw new NotFoundException(`Jamendo track ${externalId} not found`);
    }
    return this.toMetadata(track);
  }

  async search(query: string, limit: number): Promise<ResolvedTrackMetadata[]> {
    if (!this.clientId) {
      // Not configured — treated as "no results" rather than an error so
      // the shared library search still works with zero setup, just
      // without the Jamendo catalog mixed in.
      return [];
    }

    const url = new URL("https://api.jamendo.com/v3.0/tracks/");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("format", "json");
    url.searchParams.set("search", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("audioformat", "mp32");

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!response.ok) {
        this.logger.warn(`Jamendo search failed with status ${response.status}`);
        return [];
      }
      const data = (await response.json()) as { results: JamendoTrackResponse[] };
      return data.results.map((track) => this.toMetadata(track));
    } catch (error) {
      // A Jamendo outage/timeout should degrade search to "just the upload
      // library", never take the whole endpoint down with it.
      this.logger.warn(`Jamendo search errored: ${(error as Error).message}`);
      return [];
    }
  }
}
