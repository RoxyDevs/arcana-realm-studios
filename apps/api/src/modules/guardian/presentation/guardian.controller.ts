import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, GuardianReportDto, GuardianSettingsDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { GuardianSettingsService } from "../application/guardian-settings.service";
import { GuardianReportService } from "../application/guardian-report.service";
import { UpdateGuardianSettingsRequestDto } from "./update-guardian-settings.dto";
import { CreateGuardianReportRequestDto } from "./create-guardian-report.dto";

@ApiTags("guardian")
@Controller("rooms/:roomId/guardian")
@UseGuards(JwtAuthGuard)
export class GuardianController {
  constructor(
    private readonly settingsService: GuardianSettingsService,
    private readonly reportService: GuardianReportService,
  ) {}

  @Get("settings")
  @ApiOperation({ summary: "Room owner: current anti-spam/anti-raid/auto-mod/shared-reputation toggles" })
  getSettings(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<GuardianSettingsDto> {
    return this.settingsService.get(roomId, user.id);
  }

  @Patch("settings")
  @ApiOperation({ summary: "Room owner: updates Guardian toggles for this room" })
  updateSettings(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: UpdateGuardianSettingsRequestDto,
  ): Promise<GuardianSettingsDto> {
    return this.settingsService.update(roomId, user.id, dto);
  }

  @Post("reports")
  @ApiOperation({
    summary: "Room owner: files an incident report about something that happened in this room",
  })
  createReport(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: CreateGuardianReportRequestDto,
  ): Promise<GuardianReportDto> {
    return this.reportService.create(roomId, user.id, dto);
  }

  @Get("reports")
  @ApiOperation({ summary: "Room owner: lists incident reports filed for this room" })
  listReports(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<GuardianReportDto[]> {
    return this.reportService.listByRoom(roomId, user.id);
  }
}
