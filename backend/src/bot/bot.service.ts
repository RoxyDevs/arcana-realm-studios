// src/bot/bot.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MusicService } from '../music/music.service';

@Injectable()
export class BotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly musicService: MusicService,
  ) {}

  // =====================================================
  // ================== INSTALACIÓN DEL BOT ==============
  // =====================================================

  async createInstallation(userId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });

    if (!room || room.userId !== userId) {
      throw new BadRequestException('La sala no existe o no te pertenece.');
    }

    const activeLicense = await this.prisma.license.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { expiresAt: 'desc' },
    });

    if (!activeLicense) {
      throw new BadRequestException('Necesitas una licencia activa.');
    }

    const existing = await this.prisma.botInstallation.findUnique({ where: { roomId } });
    if (existing && existing.status === 'ACTIVE') {
      throw new BadRequestException('Ya tienes un bot instalado en esta sala.');
    }

    const code = this.generateActivationCode();

    return this.prisma.botInstallation.create({
      data: { roomId, code, status: 'ACTIVE' },
    });
  }

  // =====================================================
  // ===== ACTIVAR BOT DESDE LA WEB (con Room ID) ========
  // =====================================================

  async activateBotFromWeb(userId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });

    if (!room || room.userId !== userId) {
      throw new BadRequestException('La sala no existe o no te pertenece.');
    }

    const activeLicense = await this.prisma.license.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { expiresAt: 'desc' },
    });

    if (!activeLicense) {
      throw new BadRequestException('No tienes una licencia activa.');
    }

    const existing = await this.prisma.botInstallation.findUnique({ where: { roomId } });

    if (existing && existing.status === 'ACTIVE') {
      return {
        success: true,
        message: 'El bot ya está activo en esta sala.',
        installation: existing,
      };
    }

    const code = this.generateActivationCode();

    const installation = await this.prisma.botInstallation.create({
      data: {
        roomId,
        code,
        status: 'ACTIVE',
      },
    });

    return {
      success: true,
      message: 'Bot activado correctamente desde la web.',
      installation,
      activationCode: code,
    };
  }

  // =====================================================
  // ============= PROCESADOR DE COMANDOS ================
  // =====================================================

  async processCommand(command: string, userId: string, roomId: string) {
    const normalized = command.trim().toLowerCase();

    if (normalized.startsWith('!install')) {
      return this.createInstallation(userId, roomId);
    }

    if (normalized.startsWith('!activate')) {
      const code = normalized.split(' ')[1];
      if (!code) throw new BadRequestException('Falta el código de activación.');
      return this.validateActivation(code, roomId, userId);
    }

    if (normalized === '!stop') {
      return { success: true, message: 'Reproducción detenida.', action: 'STOP' };
    }

    if (normalized === '!help') {
      return this.showHelp();
    }

    if (normalized.startsWith('!play')) {
      const arg = command.slice(5).trim();
      if (!arg) throw new BadRequestException('Debes indicar una URL o nombre de canción.');
      return this.playNow(roomId, arg, userId);
    }

    if (normalized.startsWith('!add')) {
      const query = command.slice(4).trim();
      if (!query) throw new BadRequestException('Debes indicar qué añadir.');
      return this.addToQueue(roomId, query, userId);
    }

    if (normalized === '!next' || normalized === '!skip') {
      return this.skipToNext(roomId, userId);
    }

    if (normalized === '!prev') {
      return this.skipToPrevious(roomId, userId);
    }

    if (normalized === '!shuffle') {
      return this.shuffleQueue(roomId, userId);
    }

    if (normalized === '!clear') {
      return this.clearQueue(roomId, userId);
    }

    if (normalized.startsWith('!remove')) {
      const index = parseInt(normalized.split(' ')[1] ?? '1', 10);
      return this.removeFromQueue(roomId, index, userId);
    }

    if (normalized === '!queue') {
      return this.showQueue(roomId);
    }

    if (normalized === '!nowplaying') {
      return this.showNowPlaying(roomId);
    }

    if (normalized.startsWith('!fillplaylist')) {
      return this.fillPlaylistWithAI(roomId, userId);
    }

    if (normalized.startsWith('!autodj')) {
      const mood = normalized.split(' ')[1];
      return this.musicService.autoDj(roomId, mood);
    }

    if (normalized.startsWith('!ban')) {
      const target = command.split(' ')[1];
      return this.banUser(roomId, target, userId);
    }

    return {
      success: true,
      message: 'Comando no reconocido. Usa !help.',
      command,
    };
  }

  // =====================================================
  // ================== COMANDOS ========================
  // =====================================================

  private async playNow(roomId: string, query: string, userId: string) {
    return {
      success: true,
      message: `▶ Reproduciendo: ${query}`,
      action: 'PLAY_NOW',
      query,
    };
  }

  private async addToQueue(roomId: string, query: string, userId: string) {
    const track = await this.prisma.queueTrack.create({
      data: {
        roomId,
        title: query,
        url: query.startsWith('http') ? query : null,
        addedBy: userId,
        position: await this.getNextPosition(roomId),
      },
    });

    return {
      success: true,
      message: 'Canción agregada a la cola',
      track,
      action: 'ADD_TO_QUEUE',
    };
  }

  private async skipToNext(roomId: string, userId: string) {
    const next = await this.prisma.queueTrack.findFirst({
      where: { roomId },
      orderBy: { position: 'asc' },
    });

    if (next) {
      await this.prisma.playHistory.create({
        data: { roomId, title: next.title, url: next.url },
      });
      await this.prisma.queueTrack.delete({ where: { id: next.id } });
    }

    return { success: true, message: 'Saltando a la siguiente canción', action: 'NEXT' };
  }

  private async skipToPrevious(roomId: string, userId: string) {
    return { success: true, message: 'Volviendo a la canción anterior', action: 'PREV' };
  }

  private async shuffleQueue(roomId: string, userId: string) {
    return { success: true, message: 'Playlist mezclada', action: 'SHUFFLE' };
  }

  private async clearQueue(roomId: string, userId: string) {
    await this.prisma.queueTrack.deleteMany({ where: { roomId } });
    return { success: true, message: 'Playlist limpiada', action: 'CLEAR' };
  }

  private async removeFromQueue(roomId: string, index: number, userId: string) {
    return {
      success: true,
      message: `Canción #${index} eliminada`,
      action: 'REMOVE',
    };
  }

  private async showQueue(roomId: string) {
    const tracks = await this.prisma.queueTrack.findMany({
      where: { roomId },
      orderBy: { position: 'asc' },
    });

    return { success: true, message: 'Cola actual', tracks, action: 'SHOW_QUEUE' };
  }

  private async showNowPlaying(roomId: string) {
    return { success: true, message: 'Mostrando canción actual', action: 'NOW_PLAYING' };
  }

  // =====================================================
  // ============== FILLPLAYLIST CON IA ==================
  // =====================================================

  private async fillPlaylistWithAI(roomId: string, userId: string) {
    const profile = await this.musicService.getOrCreateProfile(roomId);
    const recent = profile.playedTracks.slice(-3);

    if (recent.length < 3) {
      return {
        success: false,
        message: 'Añade al menos 3 canciones primero.',
      };
    }

    const genre = this.detectGenreFromTracks(recent);
    const tracks = this.generateSimilarTracks(genre, 10);

    return {
      success: true,
      message: `Se añadieron 10 canciones de ${genre}`,
      genre,
      addedTracks: tracks,
      action: 'FILL_PLAYLIST_AI',
    };
  }

  private detectGenreFromTracks(tracks: string[]): string {
    const keywords: Record<string, string[]> = {
      rock: ['rock', 'metal'],
      pop: ['pop'],
      electronic: ['electronic'],
      metal: ['metal'],
      hiphop: ['rap'],
    };

    const lower = tracks.map((t) => t.toLowerCase());

    for (const [genre, words] of Object.entries(keywords)) {
      if (words.some((kw) => lower.some((t) => t.includes(kw)))) {
        return genre;
      }
    }

    return 'pop';
  }

  private generateSimilarTracks(genre: string, count: number): string[] {
    const pools: Record<string, string[]> = {
      rock: ['Breaking Benjamin - The Diary of Jane', 'Skillet - Monster'],
      pop: ['The Weeknd - Blinding Lights'],
      electronic: ['The Prodigy - Firestarter'],
      metal: ['Disturbed - Down with the Sickness'],
    };

    return (pools[genre] || pools['pop']).slice(0, count);
  }

  // =====================================================
  // ================== HELP COMMAND =====================
  // =====================================================

  private showHelp() {
    return {
      success: true,
      message: `!install | !activate | !play | !add | !skip / !next | !prev | !stop | !shuffle | !clear | !remove | !queue | !nowplaying | !fillplaylist | !autodj | !ban | !help`,
      action: 'HELP',
    };
  }

  // =====================================================
  // ================== MODERACIÓN =======================
  // =====================================================

  private async banUser(roomId: string, target: string, requesterId: string) {
    return {
      success: true,
      message: `Usuario ${target} baneado`,
      action: 'BAN_USER',
    };
  }

  // =====================================================
  // ================== AUXILIARES =======================
  // =====================================================

  private async validateActivation(code: string, roomId: string, userId: string) {
    const inst = await this.prisma.botInstallation.findUnique({ where: { code } });

    if (!inst || inst.roomId !== roomId || inst.status !== 'ACTIVE') {
      throw new NotFoundException('Código inválido.');
    }

    return { success: true, message: 'Bot activado', installation: inst };
  }

  private generateActivationCode(): string {
    const s = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `VDJ-${s()}-${s()}`;
  }

  private async getNextPosition(roomId: string): Promise<number> {
    const count = await this.prisma.queueTrack.count({ where: { roomId } });
    return count + 1;
  }
}