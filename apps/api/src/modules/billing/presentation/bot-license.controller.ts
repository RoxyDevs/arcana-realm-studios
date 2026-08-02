import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, BotLicenseStatusDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { BotLicenseService } from "../application/bot-license.service";
import { PurchaseLicenseRequestDto } from "./purchase-license.dto";
import { GrantLicenseRequestDto } from "./grant-license.dto";

@ApiTags("bot-licenses")
@Controller("rooms/:roomId/license")
@UseGuards(JwtAuthGuard)
export class BotLicenseController {
  constructor(private readonly botLicenseService: BotLicenseService) {}

  @Get()
  @ApiOperation({ summary: "Returns whether the bot is currently licensed for this room" })
  getStatus(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<BotLicenseStatusDto> {
    return this.botLicenseService.getStatus(roomId, user.id);
  }

  @Post("purchase")
  @ApiOperation({ summary: "Spends the room owner's wallet credits to buy/extend bot time" })
  purchase(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: PurchaseLicenseRequestDto,
  ): Promise<BotLicenseStatusDto> {
    return this.botLicenseService.purchaseWithCredits(roomId, user.id, dto.plan);
  }

  @Post("grant")
  @UseGuards(RolesGuard)
  @Roles("OWNER", "ADMIN")
  @ApiOperation({
    summary: "Admin-only: grants bot time directly after confirming an out-of-band payment (PayPal.me, in-game VCoins)",
  })
  grant(
    @Param("roomId") roomId: string,
    @CurrentUser() admin: AuthenticatedUserDto,
    @Body() dto: GrantLicenseRequestDto,
  ): Promise<BotLicenseStatusDto> {
    return this.botLicenseService.grantManually(roomId, admin.id, dto.plan, dto.reason);
  }
}
