import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { PrismaClient, Role, User } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IUserRepository } from "../domain/user-repository.interface";
import type { DiscordProfile } from "../domain/discord-profile.entity";
import type { AppConfig } from "../../../config/configuration";

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByDiscordId(discordId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { discordId } });
  }

  createFromDiscordProfile(profile: DiscordProfile): Promise<User> {
    const bootstrapOwners = this.config.get("bootstrapOwnerDiscordIds", { infer: true });
    const roles: Role[] = bootstrapOwners.includes(profile.discordId) ? ["OWNER"] : ["MEMBER"];

    return this.prisma.user.create({
      data: {
        discordId: profile.discordId,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        email: profile.email,
        roles,
        wallet: { create: { creditBalance: 0 } },
      },
    });
  }
}
