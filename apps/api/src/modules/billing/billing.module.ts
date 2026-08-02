import { Module } from "@nestjs/common";
import { BillingService } from "./application/billing.service";
import { BillingController } from "./presentation/billing.controller";
import { PAYMENT_PROVIDER } from "./domain/payment-provider.interface";
import { StripePaymentProvider } from "./infrastructure/stripe-payment.provider";
import { WALLET_REPOSITORY } from "./domain/wallet-repository.interface";
import { PrismaWalletRepository } from "./infrastructure/prisma-wallet.repository";
import { SUBSCRIPTION_REPOSITORY } from "./domain/subscription-repository.interface";
import { PrismaSubscriptionRepository } from "./infrastructure/prisma-subscription.repository";

@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
    { provide: PAYMENT_PROVIDER, useClass: StripePaymentProvider },
    { provide: WALLET_REPOSITORY, useClass: PrismaWalletRepository },
    { provide: SUBSCRIPTION_REPOSITORY, useClass: PrismaSubscriptionRepository },
  ],
})
export class BillingModule {}
