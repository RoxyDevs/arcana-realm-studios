import type { Subscription, SubscriptionStatus, SubscriptionTier } from "@arcana/database";

export const SUBSCRIPTION_REPOSITORY = Symbol("SUBSCRIPTION_REPOSITORY");

export interface ISubscriptionRepository {
  findActiveByUserId(userId: string): Promise<Subscription | null>;
  upsertByStripeSubscriptionId(params: {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
  }): Promise<Subscription>;
  updateStatusByStripeSubscriptionId(
    stripeSubscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<void>;
  /** Complimentary access granted by an OWNER/ADMIN — no Stripe fields involved. */
  grantManual(params: {
    userId: string;
    tier: SubscriptionTier;
    currentPeriodEnd: Date | null;
  }): Promise<Subscription>;
}
