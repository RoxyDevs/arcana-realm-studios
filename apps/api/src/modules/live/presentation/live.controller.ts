import { Controller, HttpCode, Param, Post, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, LiveIngestCredentialsDto, LiveStatusDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { LiveService } from "../application/live.service";

@ApiTags("live")
@Controller("rooms/:roomId/live")
@UseGuards(JwtAuthGuard)
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Get("status")
  @ApiOperation({ summary: "Whether this room currently has a live mic/DJ session running" })
  getStatus(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<LiveStatusDto> {
    return this.liveService.getStatus(roomId, user.id);
  }

  @Post("start")
  @ApiOperation({
    summary:
      "Starts a live mic/DJ session — returns one-time ingest credentials that preempt AutoDJ once connected",
  })
  start(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<LiveIngestCredentialsDto> {
    return this.liveService.start(roomId, user.id);
  }

  @Post("stop")
  @HttpCode(204)
  @ApiOperation({ summary: "Ends the room's live session — AutoDJ resumes automatically" })
  stop(@Param("roomId") roomId: string, @CurrentUser() user: AuthenticatedUserDto): Promise<void> {
    return this.liveService.stop(roomId, user.id);
  }
}
