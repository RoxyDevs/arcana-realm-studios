import { Inject, Injectable } from "@nestjs/common";
import type { BotLicense, PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IBotLicenseRepository } from "../domain/bot-license-repository.interface";

@Injectable()
export class PrismaBotLicenseRepository implements IBotLicenseRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  findLatestForRoom(roomId: string): Promise<BotLicense | null> {
    return this.prisma.botLicense.findFirst({
      where: { roomId },
      orderBy: { expiresAt: "desc" },
    });
  }

  create(params: {
    roomId: string;
    plan: BotLicense["plan"];
    source: BotLicense["source"];
    creditsCost: number;
    startsAt: Date;
    expiresAt: Date;
    grantedById: string | null;
  }): Promise<BotLicense> {
    return this.prisma.botLicense.create({ data: params });
  }
}
