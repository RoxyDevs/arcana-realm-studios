import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import type { ITrackProvider, ResolvedTrackMetadata } from "../domain/track-provider.interface";

interface YoutubeVideoItem {
  id: string;
  snippet: { title: string; channelTitle: string; thumbnails: { default?: { url: string } } };
  contentDetails: { duration: string };
}

/** Parses an ISO-8601 duration (e.g. "PT4M13S") into whole seconds. */
function parseIso8601Duration(duration: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration);
  if (!match) return 0;
  const [, hours, minutes, seconds] = match;
  return Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0);
}

/**
 * Wraps the officially documented YouTube Data API v3. Isolated behind
 * ITrackProvider so the domain never imports the YouTube SDK directly.
 */
@Injectable()
export class YoutubeTrackProvider implements ITrackProvider {
  readonly source = "YOUTUBE" as const;

  private get apiKey(): string {
    return process.env.YOUTUBE_API_KEY ?? "";
  }

  private toMetadata(item: YoutubeVideoItem): ResolvedTrackMetadata {
    return {
      source: "YOUTUBE",
      externalId: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      durationSec: parseIso8601Duration(item.contentDetails.duration),
      thumbnailUrl: item.snippet.thumbnails.default?.url ?? null,
    };
  }

  async resolve(externalId: string): Promise<ResolvedTrackMetadata> {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("id", externalId);
    url.searchParams.set("key", this.apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      throw new InternalServerErrorException("YouTube API request failed");
    }

    const data = (await response.json()) as { items: YoutubeVideoItem[] };
    const item = data.items[0];
    if (!item) {
      throw new NotFoundException(`YouTube video ${externalId} not found`);
    }

    return this.toMetadata(item);
  }

  async search(query: string, limit: number): Promise<ResolvedTrackMetadata[]> {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("videoCategoryId", "10"); // Music
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("maxResults", String(limit));
    searchUrl.searchParams.set("key", this.apiKey);

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new InternalServerErrorException("YouTube API search failed");
    }

    const searchData = (await searchResponse.json()) as { items: { id: { videoId: string } }[] };
    const ids = searchData.items.map((item) => item.id.videoId).filter(Boolean);
    if (ids.length === 0) return [];

    return Promise.all(ids.map((id) => this.resolve(id)));
  }
}
