import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../../config/configuration";
import type { ITrackProvider, ResolvedTrackMetadata } from "../domain/track-provider.interface";

interface SpotifyTrackResponse {
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
  album: { images: { url: string }[] };
}

/**
 * Wraps the officially documented Spotify Web API (Client Credentials flow).
 * Isolated behind ITrackProvider so the domain never imports the Spotify SDK.
 */
@Injectable()
export class SpotifyTrackProvider implements ITrackProvider {
  readonly source = "SPOTIFY" as const;

  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID ?? "";
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? "";
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new InternalServerErrorException("Failed to authenticate with Spotify");
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.accessTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  private toMetadata(track: SpotifyTrackResponse): ResolvedTrackMetadata {
    return {
      source: "SPOTIFY",
      externalId: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", ") || null,
      durationSec: Math.round(track.duration_ms / 1000),
      thumbnailUrl: track.album.images[0]?.url ?? null,
    };
  }

  async resolve(externalId: string): Promise<ResolvedTrackMetadata> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/tracks/${externalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
      throw new NotFoundException(`Spotify track ${externalId} not found`);
    }
    if (!response.ok) {
      throw new InternalServerErrorException("Spotify API request failed");
    }

    return this.toMetadata((await response.json()) as SpotifyTrackResponse);
  }

  async search(query: string, limit: number): Promise<ResolvedTrackMetadata[]> {
    const token = await this.getAccessToken();
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "track");
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      throw new InternalServerErrorException("Spotify API search failed");
    }

    const data = (await response.json()) as { tracks: { items: SpotifyTrackResponse[] } };
    return data.tracks.items.map((track) => this.toMetadata(track));
  }
}
