import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { AuthenticatedUserDto, SubscriptionStatusDto, WalletBalanceDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { BillingService } from "../application/billing.service";
import { CreateCreditCheckoutDto } from "./create-credit-checkout.dto";
import { CreateSubscriptionCheckoutDto } from "./create-subscription-checkout.dto";
import { AdjustWalletRequestDto } from "./adjust-wallet.dto";
import { GrantSubscriptionRequestDto } from "./grant-subscription.dto";
import type { CheckoutSessionResult } from "../domain/payment-provider.interface";

@ApiTags("billing")
@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("wallet")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Returns the current user's credit balance" })
  getWallet(@CurrentUser() user: AuthenticatedUserDto): Promise<WalletBalanceDto> {
    return this.billingService.getWalletBalance(user.id);
  }

  @Post("checkout/credits")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Creates a Stripe Checkout session to purchase credits" })
  createCreditCheckout(
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: CreateCreditCheckoutDto,
  ): Promise<CheckoutSessionResult> {
    if (!user.email) {
      throw new BadRequestException("A verified email is required to purchase credits");
    }
    return this.billingService.createCreditCheckout({
      userId: user.id,
      email: user.email,
      priceId: dto.priceId,
      credits: dto.credits,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });
  }

  @Post("checkout/subscription")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Creates a Stripe Checkout session for a Plus/Premium subscription" })
  createSubscriptionCheckout(
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: CreateSubscriptionCheckoutDto,
  ): Promise<CheckoutSessionResult> {
    if (!user.email) {
      throw new BadRequestException("A verified email is required to subscribe");
    }
    return this.billingService.createSubscriptionCheckout({
      userId: user.id,
      email: user.email,
      tier: dto.tier,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });
  }

  @Post("wallet/adjust")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "ADMIN")
  @ApiOperation({
    summary:
      "Admin-only: manually credits/debits a user's wallet for a payment confirmed out-of-band (PayPal.me, in-game VCoins) — always audit-logged",
  })
  adjustWallet(
    @CurrentUser() admin: AuthenticatedUserDto,
    @Body() dto: AdjustWalletRequestDto,
  ): Promise<WalletBalanceDto> {
    return this.billingService.adjustWalletManually({
      adminUserId: admin.id,
      targetUserId: dto.targetUserId,
      amount: dto.amount,
      reason: dto.reason,
    });
  }

  @Post("subscriptions/grant")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "ADMIN")
  @ApiOperation({
    summary:
      "Admin-only: grants a Plus/Premium tier to any user (including yourself) for free — no Stripe checkout, always audit-logged",
  })
  grantSubscription(
    @CurrentUser() admin: AuthenticatedUserDto,
    @Body() dto: GrantSubscriptionRequestDto,
  ): Promise<SubscriptionStatusDto> {
    return this.billingService.grantComplimentarySubscription({
      adminUserId: admin.id,
      targetUserId: dto.targetUserId,
      tier: dto.tier,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
  }

  @Post("webhook")
  @HttpCode(200)
  @ApiOperation({ summary: "Stripe webhook endpoint — verifies signature via req.rawBody" })
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("stripe-signature") signature: string,
  ): Promise<{ received: true }> {
    if (!req.rawBody || !signature) {
      throw new BadRequestException("Missing raw body or Stripe signature");
    }
    await this.billingService.handleWebhook(req.rawBody, signature);
    return { received: true };
  }
}
