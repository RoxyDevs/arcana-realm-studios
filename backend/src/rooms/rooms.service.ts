import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoomsByUser(userId: string) {
    return this.prisma.room.findMany({ where: { userId } });
  }

  async createRoom(data: { userId: string; name: string; imvuRoomId: string; url: string }) {
    const activeLicense = await this.prisma.license.findFirst({
      where: { userId: data.userId, status: 'ACTIVE' },
      orderBy: { expiresAt: 'desc' },
    });

    if (!activeLicense) {
      throw new BadRequestException('El usuario no tiene una licencia activa.');
    }

    const roomCount = await this.prisma.room.count({ where: { userId: data.userId } });
    if (roomCount >= activeLicense.maxRooms) {
      throw new BadRequestException('El límite de salas permitidas por la licencia ha sido alcanzado.');
    }

    return this.prisma.room.create({ data });
  }
}
