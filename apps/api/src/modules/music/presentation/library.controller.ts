import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import type { TrackDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { MusicService } from "../application/music.service";

@ApiTags("music")
@Controller("tracks")
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly musicService: MusicService) {}

  @Get("search")
  @ApiQuery({ name: "q", required: true })
  @ApiOperation({
    summary: "Searches the shared library of tracks every room owner has uploaded, by title/artist",
  })
  search(@Query("q") query: string): Promise<TrackDto[]> {
    return this.musicService.searchLibrary(query ?? "");
  }
}
