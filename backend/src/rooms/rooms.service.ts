// src/rooms/rooms.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoomsByUser(userId: string) {
    return this.prisma.room.findMany({ where: { userId } });
  }

  async createRoom(data: {
    userId: string;
    name: string;
    imvuRoomId: string;
    url: string;
    roomType?: 'GA' | 'AP';
  }) {
    const activeLicense = await this.prisma.license.findFirst({
      where: { userId: data.userId, status: 'ACTIVE' },
      orderBy: { expiresAt: 'desc' },
    });

    if (!activeLicense) {
      throw new BadRequestException('No tienes una licencia activa.');
    }

    const roomCount = await this.prisma.room.count({ where: { userId: data.userId } });
    if (roomCount >= activeLicense.maxRooms) {
      throw new BadRequestException('Has alcanzado el límite de salas permitidas por tu licencia.');
    }

    return this.prisma.room.create({
      data: {
        userId: data.userId,
        name: data.name,
        imvuRoomId: data.imvuRoomId,
        url: data.url,
        roomType: data.roomType || 'GA',
      },
    });
  }
}