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
    this.stripe = new Stripe(config.get("stripe.secretKey", { infer: true }));
    this.webhookSecret = config.get("stripe.webhookSecret", { infer: true });
  }

  async createCheckoutSession(params: {
    mode: "payment" | "subscription";
    customerEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: params.mode,
      customer_email: params.customerEmail,
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      subscription_data: params.mode === "subscription" ? { metadata: params.metadata } : undefined,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return { sessionId: session.id, url: session.url };
  }

  parseWebhookEvent(rawBody: Buffer, signature: string): WebhookEvent {
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          type: event.type,
          userId: session.metadata?.userId ?? null,
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
          paymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          creditsPurchased: session.metadata?.credits ? Number(session.metadata.credits) : null,
          currentPeriodEnd: null,
          tier: (session.metadata?.tier as "PLUS" | "PREMIUM" | undefined) ?? null,
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
        };
    }
  }
}
