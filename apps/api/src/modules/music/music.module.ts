import { Module } from "@nestjs/common";
import { MusicService } from "./application/music.service";
import { TrackProviderRegistry, TRACK_PROVIDERS } from "./application/track-provider.registry";
import { MusicController } from "./presentation/music.controller";
import { TRACK_REPOSITORY } from "./domain/track-repository.interface";
import { PrismaTrackRepository } from "./infrastructure/prisma-track.repository";
import { QUEUE_REPOSITORY } from "./domain/queue-repository.interface";
import { PrismaQueueRepository } from "./infrastructure/prisma-queue.repository";
import { ROOM_ACCESS_CHECKER } from "./domain/room-access.interface";
import { PrismaRoomAccessChecker } from "./infrastructure/prisma-room-access.checker";
import { SpotifyTrackProvider } from "./infrastructure/spotify-track.provider";
import { YoutubeTrackProvider } from "./infrastructure/youtube-track.provider";

@Module({
  controllers: [MusicController],
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
    { provide: ROOM_ACCESS_CHECKER, useClass: PrismaRoomAccessChecker },
  ],
})
export class MusicModule {}
