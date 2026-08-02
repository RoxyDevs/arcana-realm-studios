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
}

export interface IPaymentProvider {
  createCheckoutSession(params: {
    mode: "payment" | "subscription";
    customerEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<CheckoutSessionResult>;

  parseWebhookEvent(rawBody: Buffer, signature: string): WebhookEvent;
}
