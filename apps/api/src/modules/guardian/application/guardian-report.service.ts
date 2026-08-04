import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateGuardianReportDto, GuardianReportDto } from "@arcana/types";
import { AUDIT_LOGGER, type IAuditLogger } from "../../../common/domain/audit-logger.interface";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../../../common/domain/room-access.interface";
import {
  GUARDIAN_REPORT_REPOSITORY,
  type GuardianReportWithReviewer,
  type IGuardianReportRepository,
} from "../domain/guardian-report-repository.interface";
import {
  GUARDIAN_SETTINGS_REPOSITORY,
  type IGuardianSettingsRepository,
} from "../domain/guardian-settings-repository.interface";
import { REPUTATION_REPOSITORY, type IReputationRepository } from "../domain/reputation-repository.interface";

function toDto(report: GuardianReportWithReviewer): GuardianReportDto {
  return {
    id: report.id,
    roomId: report.roomId,
    subjectIdentifier: report.subjectIdentifier,
    category: report.category,
    description: report.description,
    evidenceUrl: report.evidenceUrl,
    status: report.status,
    reviewedByUsername: report.reviewedBy?.username ?? null,
    reviewedAt: report.reviewedAt ? report.reviewedAt.toISOString() : null,
    createdAt: report.createdAt.toISOString(),
  };
}

@Injectable()
export class GuardianReportService {
  constructor(
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
    @Inject(GUARDIAN_REPORT_REPOSITORY) private readonly reports: IGuardianReportRepository,
    @Inject(GUARDIAN_SETTINGS_REPOSITORY) private readonly settings: IGuardianSettingsRepository,
    @Inject(REPUTATION_REPOSITORY) private readonly reputation: IReputationRepository,
    @Inject(AUDIT_LOGGER) private readonly auditLogger: IAuditLogger,
  ) {}

  /** Filing a report is scoped to the room owner — this is about an incident in *your* room, never third-party tracking. */
  async create(roomId: string, userId: string, dto: CreateGuardianReportDto): Promise<GuardianReportDto> {
    await this.roomAccess.assertOwner(roomId, userId);
    const report = await this.reports.create({
      roomId,
      subjectIdentifier: dto.subjectIdentifier,
      category: dto.category,
      description: dto.description,
      evidenceUrl: dto.evidenceUrl,
    });
    return toDto(report);
  }

  async listByRoom(roomId: string, userId: string): Promise<GuardianReportDto[]> {
    await this.roomAccess.assertOwner(roomId, userId);
    const reports = await this.reports.listByRoom(roomId);
    return reports.map(toDto);
  }

  /**
   * Platform-trust action (ADMIN/OWNER role, not room ownership) — a room
   * owner filed the report, so they can't also be the one who adjudicates
   * it, since CONFIRMED reports feed the cross-room reputation aggregate.
   */
  async review(
    reportId: string,
    reviewerId: string,
    status: "CONFIRMED" | "DISMISSED",
  ): Promise<GuardianReportDto> {
    const existing = await this.reports.findById(reportId);
    if (!existing) {
      throw new NotFoundException("Report not found");
    }

    const reviewed = await this.reports.review(reportId, reviewerId, status);

    if (status === "CONFIRMED") {
      const roomSettings = await this.settings.findByRoomId(existing.roomId);
      if (roomSettings?.sharedBlacklistOptIn) {
        await this.reputation.recordConfirmedReport(existing.subjectIdentifier);
      }
    }

    await this.auditLogger.log({
      actorId: reviewerId,
      action: `guardian_report.${status.toLowerCase()}`,
      targetType: "GuardianReport",
      targetId: reportId,
      metadata: { roomId: existing.roomId, subjectIdentifier: existing.subjectIdentifier },
    });

    return toDto(reviewed);
  }
}
