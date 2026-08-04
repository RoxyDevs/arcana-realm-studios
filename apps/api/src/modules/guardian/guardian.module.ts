import { Module } from "@nestjs/common";
import { GuardianController } from "./presentation/guardian.controller";
import { GuardianAdminController } from "./presentation/guardian-admin.controller";
import { GuardianSettingsService } from "./application/guardian-settings.service";
import { GuardianReportService } from "./application/guardian-report.service";
import { ReputationService } from "./application/reputation.service";
import { GUARDIAN_SETTINGS_REPOSITORY } from "./domain/guardian-settings-repository.interface";
import { PrismaGuardianSettingsRepository } from "./infrastructure/prisma-guardian-settings.repository";
import { GUARDIAN_REPORT_REPOSITORY } from "./domain/guardian-report-repository.interface";
import { PrismaGuardianReportRepository } from "./infrastructure/prisma-guardian-report.repository";
import { REPUTATION_REPOSITORY } from "./domain/reputation-repository.interface";
import { PrismaReputationRepository } from "./infrastructure/prisma-reputation.repository";

@Module({
  controllers: [GuardianController, GuardianAdminController],
  providers: [
    GuardianSettingsService,
    GuardianReportService,
    ReputationService,
    { provide: GUARDIAN_SETTINGS_REPOSITORY, useClass: PrismaGuardianSettingsRepository },
    { provide: GUARDIAN_REPORT_REPOSITORY, useClass: PrismaGuardianReportRepository },
    { provide: REPUTATION_REPOSITORY, useClass: PrismaReputationRepository },
  ],
})
export class GuardianModule {}
