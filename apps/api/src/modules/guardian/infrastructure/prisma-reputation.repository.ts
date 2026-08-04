import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient, ReputationScore } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IReputationRepository } from "../domain/reputation-repository.interface";

/** Flat penalty per confirmed report — simple and predictable until Guardian's scoring model is refined. */
const SCORE_PENALTY_PER_CONFIRMED_REPORT = 10;

@Injectable()
export class PrismaReputationRepository implements IReputationRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  findBySubject(subjectIdentifier: string): Promise<ReputationScore | null> {
    return this.prisma.reputationScore.findUnique({ where: { subjectIdentifier } });
  }

  async recordConfirmedReport(subjectIdentifier: string): Promise<ReputationScore> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.reputationScore.findUnique({ where: { subjectIdentifier } });
      const confirmedReports = (existing?.confirmedReports ?? 0) + 1;
      const score = -(confirmedReports * SCORE_PENALTY_PER_CONFIRMED_REPORT);

      return tx.reputationScore.upsert({
        where: { subjectIdentifier },
        update: { confirmedReports, score },
        create: { subjectIdentifier, confirmedReports, score },
      });
    });
  }
}
