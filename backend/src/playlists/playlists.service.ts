import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoomPlaylists(roomId: string) {
    return this.prisma.playlist.findMany({ where: { roomId } });
  }

  async createPlaylist(data: { roomId: string; name: string; description?: string }) {
    return this.prisma.playlist.create({ data });
  }
}
