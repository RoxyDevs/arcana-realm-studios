/**
 * Adapter boundary for the payment provider (Stripe today). Application/domain
 * code depends only on this interface — swapping providers never touches
 * wallet or subscription business logic.
 */
export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface WebhookEvent {
  type: string;
  userId: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  paymentIntentId: string | null;
  creditsPurchased: number | null;
  currentPeriodEnd: Date | null;
  tier: "PLUS" | "PREMIUM" | null;
  /** Set when the subscription this event concerns started as a trial (from Stripe's own trial_end). */
  trialEndsAt: Date | null;
}

export interface IPaymentProvider {
  createCheckoutSession(params: {
    mode: "payment" | "subscription";
    customerEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
    /** Subscription mode only — Stripe still requires a card up front, it just delays the first charge. */
    trialPeriodDays?: number;
  }): Promise<CheckoutSessionResult>;

  parseWebhookEvent(rawBody: Buffer, signature: string): Promise<WebhookEvent>;
}
