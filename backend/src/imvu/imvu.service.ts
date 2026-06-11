import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImvuService {
  constructor(private readonly prisma: PrismaService) {}

  async getLinkedAccount(userId: string) {
    return this.prisma.iMVUAccount.findUnique({ where: { userId } });
  }

  async linkImvuAccount(userId: string, username: string, roomId: string, roomUrl: string) {
    if (!username || !roomId || !roomUrl) {
      throw new BadRequestException('Los datos IMVU son obligatorios.');
    }

    return this.prisma.iMVUAccount.upsert({
      where: { userId },
      update: { username, roomId, roomUrl },
      create: { userId, username, roomId, roomUrl },
    });
  }
}
