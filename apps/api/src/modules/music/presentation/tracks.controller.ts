import { Body, Controller, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, TrackDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { MusicService } from "../application/music.service";
import { UploadTrackRequestDto } from "./upload-track.dto";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

@ApiTags("music")
@Controller("rooms/:roomId/tracks")
@UseGuards(JwtAuthGuard)
export class TracksController {
  constructor(private readonly musicService: MusicService) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Uploads an audio file into the room's track library for AutoDJ" })
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  uploadTrack(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadTrackRequestDto,
  ): Promise<TrackDto> {
    return this.musicService.uploadTrack(roomId, user.id, file, {
      title: dto.title,
      artist: dto.artist,
      durationSec: dto.durationSec ? Number(dto.durationSec) : undefined,
      genreTags: dto.genreTags
        ? dto.genreTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined,
    });
  }
}
