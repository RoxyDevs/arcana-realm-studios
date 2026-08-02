import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { SubscriptionTier, WalletBalanceDto, SubscriptionStatusDto } from "@arcana/types";
import { AUDIT_LOGGER, type IAuditLogger } from "../../../common/domain/audit-logger.interface";
import { PAYMENT_PROVIDER, type IPaymentProvider } from "../domain/payment-provider.interface";
import { WALLET_REPOSITORY, type IWalletRepository } from "../domain/wallet-repository.interface";
import {
  SUBSCRIPTION_REPOSITORY,
  type ISubscriptionRepository,
} from "../domain/subscription-repository.interface";

const TIER_PRICE_IDS: Record<"PLUS" | "PREMIUM", string | undefined> = {
  PLUS: process.env.STRIPE_PRICE_PLUS_MONTHLY,
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: IPaymentProvider,
    @Inject(WALLET_REPOSITORY) private readonly wallets: IWalletRepository,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: ISubscriptionRepository,
    @Inject(AUDIT_LOGGER) private readonly auditLogger: IAuditLogger,
  ) {}

  async getWalletBalance(userId: string): Promise<WalletBalanceDto> {
    const wallet = await this.wallets.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }
    return { creditBalance: wallet.creditBalance, updatedAt: wallet.updatedAt.toISOString() };
  }

  /**
   * Credits (or debits) a user's wallet for a payment Arcana couldn't verify
   * automatically — PayPal.me, an in-game VCoin gift, etc. Every call is
   * audit-logged with who did it and why; this is the only legitimate way
   * those out-of-band payment channels connect to the credit ledger.
   */
  async adjustWalletManually(params: {
    adminUserId: string;
    targetUserId: string;
    amount: number;
    reason: string;
  }): Promise<WalletBalanceDto> {
    const { wallet } = await this.wallets.applyTransaction({
      userId: params.targetUserId,
      amount: params.amount,
      type: "MANUAL_ADJUSTMENT",
      metadata: { reason: params.reason, adjustedBy: params.adminUserId },
    });

    await this.auditLogger.log({
      actorId: params.adminUserId,
      action: "wallet.manual_adjustment",
      targetType: "User",
      targetId: params.targetUserId,
      metadata: { amount: params.amount, reason: params.reason },
    });

    return { creditBalance: wallet.creditBalance, updatedAt: wallet.updatedAt.toISOString() };
  }

  /**
   * Complimentary access — an OWNER/ADMIN grants a tier to a user (including
   * themselves) with no Stripe checkout involved. Audit-logged like every
   * other manual grant so it's clear who authorized it and why.
   */
  async grantComplimentarySubscription(params: {
    adminUserId: string;
    targetUserId: string;
    tier: SubscriptionTier;
    expiresAt: Date | null;
  }): Promise<SubscriptionStatusDto> {
    const subscription = await this.subscriptions.grantManual({
      userId: params.targetUserId,
      tier: params.tier,
      currentPeriodEnd: params.expiresAt,
    });

    await this.auditLogger.log({
      actorId: params.adminUserId,
      action: "subscription.complimentary_grant",
      targetType: "User",
      targetId: params.targetUserId,
      metadata: { tier: params.tier, expiresAt: params.expiresAt?.toISOString() ?? null },
    });

    return {
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    };
  }

  async createCreditCheckout(params: {
    userId: string;
    email: string;
    priceId: string;
    credits: number;
    successUrl: string;
    cancelUrl: string;
  }) {
    return this.paymentProvider.createCheckoutSession({
      mode: "payment",
      customerEmail: params.email,
      priceId: params.priceId,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      metadata: { userId: params.userId, credits: String(params.credits), kind: "credits" },
    });
  }

  async createSubscriptionCheckout(params: {
    userId: string;
    email: string;
    tier: "PLUS" | "PREMIUM";
    successUrl: string;
    cancelUrl: string;
  }) {
    const priceId = TIER_PRICE_IDS[params.tier];
    if (!priceId) {
      throw new BadRequestException(`No Stripe price configured for tier ${params.tier}`);
    }

    return this.paymentProvider.createCheckoutSession({
      mode: "subscription",
      customerEmail: params.email,
      priceId,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      metadata: { userId: params.userId, tier: params.tier },
    });
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const event = this.paymentProvider.parseWebhookEvent(rawBody, signature);

    if (!event.userId) {
      this.logger.warn(`Webhook ${event.type} received without a resolvable userId — ignoring`);
      return;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        if (event.creditsPurchased) {
          await this.wallets.applyTransaction({
            userId: event.userId,
            amount: event.creditsPurchased,
            type: "PURCHASE",
            stripePaymentIntentId: event.paymentIntentId ?? undefined,
          });
        }
        if (event.tier && event.subscriptionId && event.customerId) {
          await this.subscriptions.upsertByStripeSubscriptionId({
            userId: event.userId,
            stripeCustomerId: event.customerId,
            stripeSubscriptionId: event.subscriptionId,
            tier: event.tier,
            status: "ACTIVE",
            currentPeriodEnd: event.currentPeriodEnd,
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        if (event.subscriptionId) {
          await this.subscriptions.updateStatusByStripeSubscriptionId(
            event.subscriptionId,
            "ACTIVE",
          );
        }
        break;
      }
      case "customer.subscription.deleted": {
        if (event.subscriptionId) {
          await this.subscriptions.updateStatusByStripeSubscriptionId(
            event.subscriptionId,
            "CANCELED",
          );
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled webhook event type: ${event.type}`);
    }
  }
}
