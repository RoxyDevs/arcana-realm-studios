import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateFromDiscord(profile: any) {
    const discordId = profile.id;
    const existing = await this.prisma.user.findUnique({ where: { discordId } });

    if (existing) {
      return this.prisma.user.update({
        where: { discordId },
        data: {
          username: profile.username,
          avatar: profile.avatar || null,
          email: profile.email || null,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        discordId,
        username: profile.username,
        avatar: profile.avatar || null,
        email: profile.email || null,
        roles: ['USER'],
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
