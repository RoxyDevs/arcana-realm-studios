import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, QueueItemDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { MusicService } from "../application/music.service";
import { EnqueueTrackRequestDto } from "./enqueue-track.dto";

@ApiTags("music")
@Controller("rooms/:roomId/queue")
@UseGuards(JwtAuthGuard)
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get()
  @ApiOperation({ summary: "Lists the pending music queue for a room" })
  getQueue(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<QueueItemDto[]> {
    return this.musicService.getQueue(roomId, user.id);
  }

  @Post()
  @ApiOperation({ summary: "Resolves a track (Spotify/YouTube) and appends it to the queue" })
  enqueue(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: EnqueueTrackRequestDto,
  ): Promise<QueueItemDto> {
    return this.musicService.enqueue(roomId, user.id, dto);
  }

  @Post("tracks/:trackId")
  @ApiOperation({ summary: "Adds an existing library track (yours or another room's upload) to this room's queue" })
  enqueueExisting(
    @Param("roomId") roomId: string,
    @Param("trackId") trackId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<QueueItemDto> {
    return this.musicService.enqueueExisting(roomId, user.id, trackId);
  }

  @Post("next")
  @ApiOperation({ summary: "AutoDJ: advances the queue and returns the next track to play" })
  playNext(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<QueueItemDto | null> {
    return this.musicService.playNext(roomId, user.id);
  }

  @Delete(":queueItemId")
  @ApiOperation({ summary: "Removes a pending item from the queue" })
  remove(
    @Param("roomId") roomId: string,
    @Param("queueItemId") queueItemId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<void> {
    return this.musicService.removeFromQueue(roomId, user.id, queueItemId);
  }
}
