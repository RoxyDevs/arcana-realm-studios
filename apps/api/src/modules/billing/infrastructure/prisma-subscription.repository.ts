import { Inject, Injectable } from "@nestjs/common";
import type {
  PrismaClient,
  Subscription,
  SubscriptionStatus,
  SubscriptionTier,
} from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { ISubscriptionRepository } from "../domain/subscription-repository.interface";

@Injectable()
export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  findActiveByUserId(userId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
  }

  upsertByStripeSubscriptionId(params: {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
  }): Promise<Subscription> {
    return this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: params.stripeSubscriptionId },
      create: {
        userId: params.userId,
        stripeCustomerId: params.stripeCustomerId,
        stripeSubscriptionId: params.stripeSubscriptionId,
        tier: params.tier,
        status: params.status,
        currentPeriodEnd: params.currentPeriodEnd,
      },
      update: {
        tier: params.tier,
        status: params.status,
        currentPeriodEnd: params.currentPeriodEnd,
      },
    });
  }

  async updateStatusByStripeSubscriptionId(
    stripeSubscriptionId: string,
    status: SubscriptionStatus,
  ): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId },
      data: { status },
    });
  }
}
