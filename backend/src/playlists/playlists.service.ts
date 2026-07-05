import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddTrackDto } from './dto/add-track.dto';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlaylist(userId: string, dto: CreatePlaylistDto) {
    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });

    if (!room || room.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para crear playlists en esta sala.');
    }

    return this.prisma.playlist.create({
      data: {
        roomId: dto.roomId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async getRoomPlaylists(roomId: string) {
    return this.prisma.playlist.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      include: { tracks: true },
    });
  }

  async updatePlaylist(userId: string, playlistId: string, dto: UpdatePlaylistDto) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { room: true },
    });

    if (!playlist || playlist.room.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para editar esta playlist.');
    }

    return this.prisma.playlist.update({
      where: { id: playlistId },
      data: dto,
    });
  }

  async deletePlaylist(userId: string, playlistId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { room: true },
    });

    if (!playlist || playlist.room.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar esta playlist.');
    }

    return this.prisma.playlist.delete({ where: { id: playlistId } });
  }

  async addTrackToPlaylist(userId: string, playlistId: string, dto: AddTrackDto) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { room: true },
    });

    if (!playlist || playlist.room.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para añadir canciones a esta playlist.');
    }

    return this.prisma.playlistTrack.create({
      data: {
        playlistId,
        title: dto.title,
        url: dto.url,
      },
    });
  }
}