import { Inject, Injectable } from "@nestjs/common";
import type { ReputationScoreDto } from "@arcana/types";
import { REPUTATION_REPOSITORY, type IReputationRepository } from "../domain/reputation-repository.interface";

@Injectable()
export class ReputationService {
  constructor(@Inject(REPUTATION_REPOSITORY) private readonly reputation: IReputationRepository) {}

  /** Never resolves to a "no record" error — a subject with no confirmed reports is simply clean (score 0). */
  async getBySubject(subjectIdentifier: string): Promise<ReputationScoreDto> {
    const record = await this.reputation.findBySubject(subjectIdentifier);
    return {
      subjectIdentifier,
      score: record?.score ?? 0,
      confirmedReports: record?.confirmedReports ?? 0,
    };
  }
}
