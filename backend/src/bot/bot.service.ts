import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MusicService } from '../music/music.service';

@Injectable()
export class BotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly musicService: MusicService,
  ) {}

  async createInstallation(userId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId }, include: { owner: true } });
    if (!room || room.userId !== userId) {
      throw new BadRequestException('Sala no encontrada o no pertenece al usuario.');
    }

    const activeLicense = await this.prisma.license.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { expiresAt: 'desc' },
    });
    if (!activeLicense) {
      throw new BadRequestException('No hay licencia activa para este usuario.');
    }

    const code = this.generateActivationCode();
    return this.prisma.botInstallation.create({
      data: {
        roomId,
        code,
        status: 'ACTIVE',
      },
    });
  }

  async validateActivation(code: string, roomId: string, userId: string) {
    const installation = await this.prisma.botInstallation.findUnique({ where: { code } });
    if (!installation || installation.roomId !== roomId || installation.status !== 'ACTIVE') {
      throw new NotFoundException('Código de activación inválido o sala no autorizada.');
    }

    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.userId !== userId) {
      throw new BadRequestException('Usuario no autorizado para esta sala.');
    }

    const activeLicense = await this.prisma.license.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { expiresAt: 'desc' },
    });
    if (!activeLicense) {
      throw new BadRequestException('Licencia inactiva.');
    }

    return { success: true, installation };
  }

  async processCommand(command: string, userId: string, roomId: string) {
    if (!command) {
      throw new BadRequestException('El comando es obligatorio.');
    }

    const normalized = command.trim().toLowerCase();
    if (normalized.startsWith('!activate')) {
      const parts = command.split(' ');
      const code = parts[1]?.trim();
      if (!code) {
        throw new BadRequestException('Código de activación requerido.');
      }
      return this.validateActivation(code, roomId, userId);
    }

    if (normalized.startsWith('!fillplaylist')) {
      return this.musicService.fillPlaylist(roomId, [], this.extractMood(normalized));
    }

    if (normalized.startsWith('!autodj')) {
      return this.musicService.autoDj(roomId, this.extractMood(normalized));
    }

    if (normalized.startsWith('!recommend')) {
      return this.musicService.fillPlaylist(roomId, [], this.extractMood(normalized));
    }

    if (normalized.startsWith('!mood')) {
      const mood = command.split(' ')[1]?.trim();
      return {
        success: true,
        message: `Modo musical establecido a ${mood ?? 'default'}`,
        mood,
      };
    }

    return {
      success: true,
      message: 'Comando procesado, encolando respuesta musical.',
      command,
    };
  }

  private extractMood(command: string) {
    const parts = command.split(' ');
    if (parts.length > 1 && parts[0] === '!mood') {
      return parts[1];
    }
    return undefined;
  }

  private generateActivationCode() {
    const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `VDJ-${segment()}-${segment()}`;
  }
}
