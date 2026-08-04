import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { ITrialClaimRepository } from "../domain/trial-claim-repository.interface";

@Injectable()
export class PrismaTrialClaimRepository implements ITrialClaimRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async hasClaimed(params: { userId: string; ipAddress: string }): Promise<boolean> {
    const existing = await this.prisma.trialClaim.findFirst({
      where: { OR: [{ userId: params.userId }, { ipAddress: params.ipAddress }] },
    });
    return !!existing;
  }

  async record(params: { userId: string; ipAddress: string; tier: "PLUS" | "PREMIUM" }): Promise<void> {
    await this.prisma.trialClaim.create({
      data: { userId: params.userId, ipAddress: params.ipAddress, tier: params.tier },
    });
  }
}
