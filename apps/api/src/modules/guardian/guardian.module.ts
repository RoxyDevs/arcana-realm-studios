import { Module } from "@nestjs/common";
import { BillingModule } from "../billing/billing.module";
import { GuardianController } from "./presentation/guardian.controller";
import { GuardianAdminController } from "./presentation/guardian-admin.controller";
import { GuardianLicenseController } from "./presentation/guardian-license.controller";
import { GuardianSettingsService } from "./application/guardian-settings.service";
import { GuardianReportService } from "./application/guardian-report.service";
import { ReputationService } from "./application/reputation.service";
import { GuardianLicenseService } from "./application/guardian-license.service";
import { GUARDIAN_SETTINGS_REPOSITORY } from "./domain/guardian-settings-repository.interface";
import { PrismaGuardianSettingsRepository } from "./infrastructure/prisma-guardian-settings.repository";
import { GUARDIAN_REPORT_REPOSITORY } from "./domain/guardian-report-repository.interface";
import { PrismaGuardianReportRepository } from "./infrastructure/prisma-guardian-report.repository";
import { REPUTATION_REPOSITORY } from "./domain/reputation-repository.interface";
import { PrismaReputationRepository } from "./infrastructure/prisma-reputation.repository";
import { GUARDIAN_LICENSE_REPOSITORY } from "./domain/guardian-license-repository.interface";
import { PrismaGuardianLicenseRepository } from "./infrastructure/prisma-guardian-license.repository";

@Module({
  imports: [BillingModule],
  controllers: [GuardianController, GuardianAdminController, GuardianLicenseController],
  providers: [
    GuardianSettingsService,
    GuardianReportService,
    ReputationService,
    GuardianLicenseService,
    { provide: GUARDIAN_SETTINGS_REPOSITORY, useClass: PrismaGuardianSettingsRepository },
    { provide: GUARDIAN_REPORT_REPOSITORY, useClass: PrismaGuardianReportRepository },
    { provide: REPUTATION_REPOSITORY, useClass: PrismaReputationRepository },
    { provide: GUARDIAN_LICENSE_REPOSITORY, useClass: PrismaGuardianLicenseRepository },
  ],
  // !ban (imvu-bot) files a best-effort Guardian report on every ban — see
  // RoomBanService. Guardian doesn't need to know imvu-bot exists; this is
  // a one-directional dependency the other way.
  exports: [GuardianReportService],
})
export class GuardianModule {}
