import { Inject, Injectable, BadRequestException } from "@nestjs/common";
import type { TrackSource } from "@arcana/database";
import type { ITrackProvider } from "../domain/track-provider.interface";

export const TRACK_PROVIDERS = Symbol("TRACK_PROVIDERS");

@Injectable()
export class TrackProviderRegistry {
  private readonly providersBySource = new Map<TrackSource, ITrackProvider>();

  constructor(@Inject(TRACK_PROVIDERS) providers: ITrackProvider[]) {
    for (const provider of providers) {
      this.providersBySource.set(provider.source, provider);
    }
  }

  get(source: TrackSource): ITrackProvider {
    const provider = this.providersBySource.get(source);
    if (!provider) {
      throw new BadRequestException(`No track provider registered for source ${source}`);
    }
    return provider;
  }
}
