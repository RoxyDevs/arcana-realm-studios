import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, GuardianLicenseStatusDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { GuardianLicenseService } from "../application/guardian-license.service";
import { PurchaseGuardianLicenseRequestDto } from "./purchase-guardian-license.dto";
import { GrantGuardianLicenseRequestDto } from "./grant-guardian-license.dto";

@ApiTags("guardian")
@Controller("rooms/:roomId/guardian/license")
@UseGuards(JwtAuthGuard)
export class GuardianLicenseController {
  constructor(private readonly guardianLicenseService: GuardianLicenseService) {}

  @Get()
  @ApiOperation({ summary: "Returns whether Guardian is currently licensed for this room" })
  getStatus(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<GuardianLicenseStatusDto> {
    return this.guardianLicenseService.getStatus(roomId, user.id);
  }

  @Post("purchase")
  @ApiOperation({ summary: "Spends the room owner's wallet credits to buy/extend Guardian moderation time" })
  purchase(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: PurchaseGuardianLicenseRequestDto,
  ): Promise<GuardianLicenseStatusDto> {
    return this.guardianLicenseService.purchaseWithCredits(roomId, user.id, dto.plan);
  }

  @Post("grant")
  @UseGuards(RolesGuard)
  @Roles("OWNER", "ADMIN")
  @ApiOperation({
    summary: "Admin-only: grants Guardian time directly after confirming an out-of-band payment (PayPal.me, in-game VCoins)",
  })
  grant(
    @Param("roomId") roomId: string,
    @CurrentUser() admin: AuthenticatedUserDto,
    @Body() dto: GrantGuardianLicenseRequestDto,
  ): Promise<GuardianLicenseStatusDto> {
    return this.guardianLicenseService.grantManually(roomId, admin.id, dto.plan, dto.reason);
  }
}
