import { Inject, Injectable } from "@nestjs/common";
import type { GuardianReportStatus, PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type {
  CreateGuardianReportRecord,
  GuardianReportWithReviewer,
  GuardianReportWithRoom,
  IGuardianReportRepository,
} from "../domain/guardian-report-repository.interface";

@Injectable()
export class PrismaGuardianReportRepository implements IGuardianReportRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  create(record: CreateGuardianReportRecord): Promise<GuardianReportWithReviewer> {
    return this.prisma.guardianReport.create({
      data: {
        roomId: record.roomId,
        subjectIdentifier: record.subjectIdentifier,
        category: record.category,
        description: record.description,
        evidenceUrl: record.evidenceUrl,
      },
      include: { reviewedBy: { select: { username: true } } },
    });
  }

  listByRoom(roomId: string): Promise<GuardianReportWithReviewer[]> {
    return this.prisma.guardianReport.findMany({
      where: { roomId },
      include: { reviewedBy: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string): Promise<GuardianReportWithRoom | null> {
    return this.prisma.guardianReport.findUnique({ where: { id }, include: { room: true } });
  }

  review(
    id: string,
    reviewerId: string,
    status: Extract<GuardianReportStatus, "CONFIRMED" | "DISMISSED">,
  ): Promise<GuardianReportWithReviewer> {
    return this.prisma.guardianReport.update({
      where: { id },
      data: { status, reviewedById: reviewerId, reviewedAt: new Date() },
      include: { reviewedBy: { select: { username: true } } },
    });
  }
}
