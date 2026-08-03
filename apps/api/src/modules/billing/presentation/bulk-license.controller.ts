import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, BulkLicensePurchaseResultDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { BotLicenseService } from "../application/bot-license.service";
import { BulkPurchaseLicenseRequestDto } from "./bulk-purchase-license.dto";

@ApiTags("bot-licenses")
@Controller("rooms/license")
@UseGuards(JwtAuthGuard)
export class BulkLicenseController {
  constructor(private readonly botLicenseService: BotLicenseService) {}

  @Post("bulk-purchase")
  @ApiOperation({
    summary: "Buys the same bot-time plan for multiple rooms at once — a bulk discount applies at 10+ rooms",
  })
  bulkPurchase(
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: BulkPurchaseLicenseRequestDto,
  ): Promise<BulkLicensePurchaseResultDto> {
    return this.botLicenseService.bulkPurchaseWithCredits(user.id, dto.roomIds, dto.plan);
  }
}
