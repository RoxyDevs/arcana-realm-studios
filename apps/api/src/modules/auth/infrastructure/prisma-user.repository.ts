import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient, User } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IUserRepository } from "../domain/user-repository.interface";
import type { DiscordProfile } from "../domain/discord-profile.entity";

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByDiscordId(discordId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { discordId } });
  }

  createFromDiscordProfile(profile: DiscordProfile): Promise<User> {
    return this.prisma.user.create({
      data: {
        discordId: profile.discordId,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        email: profile.email,
        wallet: { create: { creditBalance: 0 } },
      },
    });
  }
}
