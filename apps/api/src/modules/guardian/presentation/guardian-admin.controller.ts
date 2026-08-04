import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, GuardianReportDto, ReputationScoreDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { GuardianReportService } from "../application/guardian-report.service";
import { ReputationService } from "../application/reputation.service";
import { ReviewGuardianReportRequestDto } from "./review-guardian-report.dto";

@ApiTags("guardian")
@Controller("guardian")
@UseGuards(JwtAuthGuard)
export class GuardianAdminController {
  constructor(
    private readonly reportService: GuardianReportService,
    private readonly reputationService: ReputationService,
  ) {}

  @Post("reports/:reportId/review")
  @UseGuards(RolesGuard)
  @Roles("OWNER", "ADMIN")
  @ApiOperation({
    summary:
      "Platform staff only: confirms or dismisses a report — a room owner can't self-adjudicate their own report since CONFIRMED feeds the shared reputation network",
  })
  review(
    @Param("reportId") reportId: string,
    @CurrentUser() reviewer: AuthenticatedUserDto,
    @Body() dto: ReviewGuardianReportRequestDto,
  ): Promise<GuardianReportDto> {
    return this.reportService.review(reportId, reviewer.id, dto.status);
  }

  @Get("reputation/:subjectIdentifier")
  @ApiOperation({
    summary: "Looks up a subject's aggregate reputation — derived only from CONFIRMED reports in opted-in rooms",
  })
  getReputation(@Param("subjectIdentifier") subjectIdentifier: string): Promise<ReputationScoreDto> {
    return this.reputationService.getBySubject(subjectIdentifier);
  }
}
