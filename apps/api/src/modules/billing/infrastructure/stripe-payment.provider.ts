import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import type { AppConfig } from "../../../config/configuration";
import type {
  CheckoutSessionResult,
  IPaymentProvider,
  WebhookEvent,
} from "../domain/payment-provider.interface";

@Injectable()
export class StripePaymentProvider implements IPaymentProvider {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(config: ConfigService<AppConfig, true>) {
    // A placeholder key lets the app boot when Stripe isn't configured yet —
    // any real billing call will then fail with a normal Stripe auth error
    // instead of crashing the whole process at startup.
    const secretKey = config.get("stripe.secretKey", { infer: true }) || "sk_test_not_configured";
    this.stripe = new Stripe(secretKey);
    this.webhookSecret = config.get("stripe.webhookSecret", { infer: true });
  }

  async createCheckoutSession(params: {
    mode: "payment" | "subscription";
    customerEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
    trialPeriodDays?: number;
  }): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: params.mode,
      customer_email: params.customerEmail,
      // Stripe still collects and validates a real payment method during a
      // trial checkout — trial_period_days only delays the first charge, it
      // never skips card collection. That's what makes the trial "not 100%
      // free" from an abuse standpoint even before the IP-based TrialClaim
      // check runs.
      payment_method_collection: "always",
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      subscription_data:
        params.mode === "subscription"
          ? { metadata: params.metadata, trial_period_days: params.trialPeriodDays }
          : undefined,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return { sessionId: session.id, url: session.url };
  }

  async parseWebhookEvent(rawBody: Buffer, signature: string): Promise<WebhookEvent> {
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;
        // The session itself doesn't carry trial_end — only the Subscription
        // object does, so a trial checkout needs one extra round trip to
        // know whether (and until when) it's trialing.
        const trialEndsAt = subscriptionId
          ? await this.fetchTrialEnd(subscriptionId)
          : null;
        return {
          type: event.type,
          userId: session.metadata?.userId ?? null,
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId,
          paymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          creditsPurchased: session.metadata?.credits ? Number(session.metadata.credits) : null,
          currentPeriodEnd: null,
          tier: (session.metadata?.tier as "PLUS" | "PREMIUM" | undefined) ?? null,
          trialEndsAt,
        };
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        return {
          type: event.type,
          userId: subscription.metadata?.userId ?? null,
          customerId: typeof subscription.customer === "string" ? subscription.customer : null,
          subscriptionId: subscription.id,
          paymentIntentId: null,
          creditsPurchased: null,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          tier: (subscription.metadata?.tier as "PLUS" | "PREMIUM" | undefined) ?? null,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        };
      }
      default:
        return {
          type: event.type,
          userId: null,
          customerId: null,
          subscriptionId: null,
          paymentIntentId: null,
          creditsPurchased: null,
          currentPeriodEnd: null,
          tier: null,
          trialEndsAt: null,
        };
    }
  }

  private async fetchTrialEnd(subscriptionId: string): Promise<Date | null> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    return subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
  }
}
