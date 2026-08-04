import { Inject, Injectable } from "@nestjs/common";
import type { GuardianLicense, PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IGuardianLicenseRepository } from "../domain/guardian-license-repository.interface";

@Injectable()
export class PrismaGuardianLicenseRepository implements IGuardianLicenseRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  findLatestForRoom(roomId: string): Promise<GuardianLicense | null> {
    return this.prisma.guardianLicense.findFirst({
      where: { roomId },
      orderBy: { expiresAt: "desc" },
    });
  }

  create(params: {
    roomId: string;
    plan: GuardianLicense["plan"];
    source: GuardianLicense["source"];
    creditsCost: number;
    startsAt: Date;
    expiresAt: Date;
    grantedById: string | null;
  }): Promise<GuardianLicense> {
    return this.prisma.guardianLicense.create({ data: params });
  }
}
