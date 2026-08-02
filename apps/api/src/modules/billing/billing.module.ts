import { Module } from "@nestjs/common";
import { BillingService } from "./application/billing.service";
import { BillingController } from "./presentation/billing.controller";
import { PAYMENT_PROVIDER } from "./domain/payment-provider.interface";
import { StripePaymentProvider } from "./infrastructure/stripe-payment.provider";
import { WALLET_REPOSITORY } from "./domain/wallet-repository.interface";
import { PrismaWalletRepository } from "./infrastructure/prisma-wallet.repository";
import { SUBSCRIPTION_REPOSITORY } from "./domain/subscription-repository.interface";
import { PrismaSubscriptionRepository } from "./infrastructure/prisma-subscription.repository";
import { BotLicenseService } from "./application/bot-license.service";
import { BotLicenseController } from "./presentation/bot-license.controller";
import { BOT_LICENSE_REPOSITORY } from "./domain/bot-license-repository.interface";
import { PrismaBotLicenseRepository } from "./infrastructure/prisma-bot-license.repository";

@Module({
  controllers: [BillingController, BotLicenseController],
  providers: [
    BillingService,
    BotLicenseService,
    { provide: PAYMENT_PROVIDER, useClass: StripePaymentProvider },
    { provide: WALLET_REPOSITORY, useClass: PrismaWalletRepository },
    { provide: SUBSCRIPTION_REPOSITORY, useClass: PrismaSubscriptionRepository },
    { provide: BOT_LICENSE_REPOSITORY, useClass: PrismaBotLicenseRepository },
  ],
})
export class BillingModule {}
