import type { GuardianReport, GuardianReportCategory, GuardianReportStatus, Room } from "@arcana/database";

export const GUARDIAN_REPORT_REPOSITORY = Symbol("GUARDIAN_REPORT_REPOSITORY");

export type GuardianReportWithReviewer = GuardianReport & { reviewedBy: { username: string } | null };
export type GuardianReportWithRoom = GuardianReport & { room: Room };

export interface CreateGuardianReportRecord {
  roomId: string;
  subjectIdentifier: string;
  category: GuardianReportCategory;
  description: string;
  evidenceUrl?: string;
}

export interface IGuardianReportRepository {
  create(record: CreateGuardianReportRecord): Promise<GuardianReportWithReviewer>;
  listByRoom(roomId: string): Promise<GuardianReportWithReviewer[]>;
  findById(id: string): Promise<GuardianReportWithRoom | null>;
  review(id: string, reviewerId: string, status: Extract<GuardianReportStatus, "CONFIRMED" | "DISMISSED">): Promise<GuardianReportWithReviewer>;
}
