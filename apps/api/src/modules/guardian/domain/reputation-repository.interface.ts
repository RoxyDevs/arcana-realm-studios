import type { ReputationScore } from "@arcana/database";

export const REPUTATION_REPOSITORY = Symbol("REPUTATION_REPOSITORY");

export interface IReputationRepository {
  findBySubject(subjectIdentifier: string): Promise<ReputationScore | null>;

  /**
   * Recomputes a subject's aggregate from confirmedReports/score deltas —
   * only ever called for a report belonging to a room that opted into the
   * shared network (GuardianSettings.sharedBlacklistOptIn).
   */
  recordConfirmedReport(subjectIdentifier: string): Promise<ReputationScore>;
}
