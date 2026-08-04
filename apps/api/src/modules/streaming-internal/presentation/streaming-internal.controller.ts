import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { InternalTokenGuard } from "../infrastructure/internal-token.guard";
import { StreamingInternalService, type ActiveRoomStream } from "../application/streaming-internal.service";

/**
 * Not part of the public API surface (excluded from Swagger) — only the
 * Icecast/Liquidsoap streaming service calls this, authenticated via
 * InternalTokenGuard rather than a user's JWT.
 */
@ApiExcludeController()
@Controller("internal/streaming")
@UseGuards(InternalTokenGuard)
export class StreamingInternalController {
  constructor(private readonly streamingInternalService: StreamingInternalService) {}

  @Get("active-rooms")
  listActiveRooms(): Promise<ActiveRoomStream[]> {
    return this.streamingInternalService.listActiveRooms();
  }

  @Get("rooms/:roomId/next-track")
  async nextTrack(@Param("roomId") roomId: string): Promise<{ fileUrl: string | null }> {
    const fileUrl = await this.streamingInternalService.nextTrackUrl(roomId);
    return { fileUrl };
  }

  @Get("rooms/:roomId/live-auth")
  async liveAuth(
    @Param("roomId") roomId: string,
    @Query("password") password: string,
  ): Promise<{ authorized: boolean }> {
    const authorized = await this.streamingInternalService.checkLiveAuth(roomId, password ?? "");
    return { authorized };
  }
}
