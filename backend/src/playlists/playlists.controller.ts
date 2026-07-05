import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddTrackDto } from './dto/add-track.dto';

@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  create(@Body() body: CreatePlaylistDto, @Req() request: any) {
    return this.playlistsService.createPlaylist(request.user.id, body);
  }

  @Get('room/:roomId')
  findByRoom(@Param('roomId') roomId: string) {
    return this.playlistsService.getRoomPlaylists(roomId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdatePlaylistDto,
    @Req() request: any,
  ) {
    return this.playlistsService.updatePlaylist(request.user.id, id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: any) {
    return this.playlistsService.deletePlaylist(request.user.id, id);
  }

  @Post(':id/tracks')
  addTrack(
    @Param('id') playlistId: string,
    @Body() body: AddTrackDto,
    @Req() request: any,
  ) {
    return this.playlistsService.addTrackToPlaylist(request.user.id, playlistId, body);
  }
}