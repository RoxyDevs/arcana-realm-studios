import { Module } from "@nestjs/common";
import { MusicService } from "./application/music.service";
import { TrackProviderRegistry, TRACK_PROVIDERS } from "./application/track-provider.registry";
import { MusicController } from "./presentation/music.controller";
import { TracksController } from "./presentation/tracks.controller";
import { LibraryController } from "./presentation/library.controller";
import { TRACK_REPOSITORY } from "./domain/track-repository.interface";
import { PrismaTrackRepository } from "./infrastructure/prisma-track.repository";
import { QUEUE_REPOSITORY } from "./domain/queue-repository.interface";
import { PrismaQueueRepository } from "./infrastructure/prisma-queue.repository";
import { SpotifyTrackProvider } from "./infrastructure/spotify-track.provider";
import { YoutubeTrackProvider } from "./infrastructure/youtube-track.provider";

@Module({
  controllers: [MusicController, TracksController, LibraryController],
  providers: [
    MusicService,
    TrackProviderRegistry,
    SpotifyTrackProvider,
    YoutubeTrackProvider,
    {
      provide: TRACK_PROVIDERS,
      useFactory: (spotify: SpotifyTrackProvider, youtube: YoutubeTrackProvider) => [spotify, youtube],
      inject: [SpotifyTrackProvider, YoutubeTrackProvider],
    },
    { provide: TRACK_REPOSITORY, useClass: PrismaTrackRepository },
    { provide: QUEUE_REPOSITORY, useClass: PrismaQueueRepository },
  ],
})
export class MusicModule {}
