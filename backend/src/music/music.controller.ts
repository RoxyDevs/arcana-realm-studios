import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MusicService } from './music.service';
import { AutoDjDto } from './dto/auto-dj.dto';
import { FillPlaylistDto } from './dto/fill-playlist.dto';
import { RecordTrackDto } from './dto/record-track.dto';

@Controller('music')
@UseGuards(AuthGuard('jwt'))
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Get('profile/:roomId')
  getProfile(@Param('roomId') roomId: string) {
    return this.musicService.getRoomProfile(roomId);
  }

  @Post('record')
  recordTrack(@Body() body: RecordTrackDto) {
    return this.musicService.recordTrack(body.roomId, body.trackTitle, body.genre, body.artist, body.bpm);
  }

  @Post('fillplaylist')
  fillPlaylist(@Body() body: FillPlaylistDto) {
    return this.musicService.fillPlaylist(body.roomId, body.recentTracks, body.mood);
  }

  @Post('autodj')
  autoDj(@Body() body: AutoDjDto) {
    return this.musicService.autoDj(body.roomId, body.mood);
  }
}
