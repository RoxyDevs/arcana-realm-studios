import { Inject, Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { PrismaClient, Role } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { AppConfig } from "../../../config/configuration";

/**
 * BOOTSTRAP_OWNER_DISCORD_IDS only ran at account *creation* time, so anyone
 * who logged in before the env var was configured correctly stayed MEMBER
 * forever — a real deadlock, since granting OWNER requires already being
 * OWNER/ADMIN. This reconciles it on every boot: idempotent, and a no-op
 * once everyone listed already has the role.
 */
@Injectable()
export class BootstrapOwnersRunner implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapOwnersRunner.name);

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const ids = this.config.get("bootstrapOwnerDiscordIds", { infer: true });
    if (ids.length === 0) return;

    const users = await this.prisma.user.findMany({ where: { discordId: { in: ids } } });
    for (const user of users) {
      if (user.roles.includes("OWNER")) continue;

      const roles = [...user.roles, "OWNER"] as Role[];
      await this.prisma.user.update({ where: { id: user.id }, data: { roles } });
      this.logger.log(`Promoted existing user "${user.username}" (${user.discordId}) to OWNER`);
    }
  }
}
