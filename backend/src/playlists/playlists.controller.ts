import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get('room/:roomId')
  findByRoom(@Param('roomId') roomId: string) {
    return this.playlistsService.getRoomPlaylists(roomId);
  }

  @Post()
  create(@Body() body: { roomId: string; name: string; description?: string }) {
    return this.playlistsService.createPlaylist(body);
  }
}
