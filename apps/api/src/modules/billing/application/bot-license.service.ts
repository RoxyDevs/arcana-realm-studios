import { Inject, Injectable } from "@nestjs/common";
import {
  BOT_LICENSE_PLANS,
  BULK_LICENSE_DISCOUNT,
  SUBSCRIPTION_PLANS,
  type BotLicensePlan,
  type BotLicenseStatusDto,
  type BulkLicensePurchaseResultDto,
} from "@arcana/types";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../../../common/domain/room-access.interface";
import { AUDIT_LOGGER, type IAuditLogger } from "../../../common/domain/audit-logger.interface";
import { WALLET_REPOSITORY, type IWalletRepository } from "../domain/wallet-repository.interface";
import {
  BOT_LICENSE_REPOSITORY,
  type IBotLicenseRepository,
} from "../domain/bot-license-repository.interface";
import {
  SUBSCRIPTION_REPOSITORY,
  type ISubscriptionRepository,
} from "../domain/subscription-repository.interface";

@Injectable()
export class BotLicenseService {
  constructor(
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
    @Inject(WALLET_REPOSITORY) private readonly wallets: IWalletRepository,
    @Inject(BOT_LICENSE_REPOSITORY) private readonly licenses: IBotLicenseRepository,
    @Inject(AUDIT_LOGGER) private readonly auditLogger: IAuditLogger,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: ISubscriptionRepository,
  ) {}

  /** PLUS/PREMIUM subscribers get a flat percent off every credit-funded bot-license purchase — 0 for FREE/no subscription. */
  private async getCreditDiscountPercent(userId: string): Promise<number> {
    const active = await this.subscriptions.findActiveByUserId(userId);
    if (!active || active.tier === "FREE") return 0;
    return SUBSCRIPTION_PLANS[active.tier as "PLUS" | "PREMIUM"].creditDiscountPercent;
  }

  /** The date a new grant should count from: now, unless the room already has unexpired time left. */
  private async resolveStartDate(roomId: string): Promise<Date> {
    const latest = await this.licenses.findLatestForRoom(roomId);
    const now = new Date();
    return latest && latest.expiresAt > now ? latest.expiresAt : now;
  }

  async getStatus(roomId: string, userId: string): Promise<BotLicenseStatusDto> {
    await this.roomAccess.assertOwner(roomId, userId);
    const latest = await this.licenses.findLatestForRoom(roomId);
    const isActive = !!latest && latest.expiresAt > new Date();
    return {
      active: isActive,
      plan: isActive ? (latest!.plan as BotLicensePlan) : null,
      expiresAt: isActive ? latest!.expiresAt.toISOString() : null,
    };
  }

  /** Self-service purchase: the room owner spends their own wallet credits. */
  async purchaseWithCredits(
    roomId: string,
    userId: string,
    plan: BotLicensePlan,
  ): Promise<BotLicenseStatusDto> {
    await this.roomAccess.assertOwner(roomId, userId);

    const planDef = BOT_LICENSE_PLANS[plan];
    const discountPercent = await this.getCreditDiscountPercent(userId);
    const cost = Math.round(planDef.credits * (1 - discountPercent / 100));
    const startsAt = await this.resolveStartDate(roomId);
    const expiresAt = new Date(startsAt.getTime() + planDef.days * 86_400_000);

    await this.wallets.applyTransaction({
      userId,
      amount: -cost,
      type: "CONSUMPTION",
      metadata: { roomId, plan, reason: "bot_license_purchase", discountPercent },
    });

    const license = await this.licenses.create({
      roomId,
      plan,
      source: "CREDIT_PURCHASE",
      creditsCost: cost,
      startsAt,
      expiresAt,
      grantedById: null,
    });

    return { active: true, plan: license.plan as BotLicensePlan, expiresAt: license.expiresAt.toISOString() };
  }

  /**
   * Self-service purchase for many rooms in one go — the same plan for each,
   * charged once as a single wallet transaction. Buying
   * BULK_LICENSE_DISCOUNT.minRooms or more at once applies a flat percentage
   * off the whole total.
   */
  async bulkPurchaseWithCredits(
    userId: string,
    roomIds: string[],
    plan: BotLicensePlan,
  ): Promise<BulkLicensePurchaseResultDto> {
    const uniqueRoomIds = Array.from(new Set(roomIds));
    for (const roomId of uniqueRoomIds) {
      await this.roomAccess.assertOwner(roomId, userId);
    }

    const planDef = BOT_LICENSE_PLANS[plan];
    const listTotal = planDef.credits * uniqueRoomIds.length;
    const bulkDiscountApplied = uniqueRoomIds.length >= BULK_LICENSE_DISCOUNT.minRooms;
    const subscriberDiscountPercent = await this.getCreditDiscountPercent(userId);
    const combinedMultiplier =
      (bulkDiscountApplied ? 1 - BULK_LICENSE_DISCOUNT.percentOff / 100 : 1) *
      (1 - subscriberDiscountPercent / 100);
    const total = Math.round(listTotal * combinedMultiplier);
    const perRoomCost = Math.round(total / uniqueRoomIds.length);
    const discountApplied = bulkDiscountApplied || subscriberDiscountPercent > 0;

    await this.wallets.applyTransaction({
      userId,
      amount: -total,
      type: "CONSUMPTION",
      metadata: {
        roomIds: uniqueRoomIds,
        plan,
        reason: "bulk_bot_license_purchase",
        bulkDiscountApplied,
        subscriberDiscountPercent,
      },
    });

    const rooms: BotLicenseStatusDto[] = [];
    for (const roomId of uniqueRoomIds) {
      const startsAt = await this.resolveStartDate(roomId);
      const expiresAt = new Date(startsAt.getTime() + planDef.days * 86_400_000);
      const license = await this.licenses.create({
        roomId,
        plan,
        source: "CREDIT_PURCHASE",
        creditsCost: perRoomCost,
        startsAt,
        expiresAt,
        grantedById: null,
      });
      rooms.push({ active: true, plan: license.plan as BotLicensePlan, expiresAt: license.expiresAt.toISOString() });
    }

    return { totalCharged: total, discountApplied, rooms };
  }

  /**
   * Admin-only path for payments Arcana can't verify automatically (PayPal.me,
   * in-game VCoin gifts confirmed manually) — grants time directly instead of
   * routing through the buyer's wallet. Always audited.
   */
  async grantManually(
    roomId: string,
    adminUserId: string,
    plan: BotLicensePlan,
    reason: string,
  ): Promise<BotLicenseStatusDto> {
    const planDef = BOT_LICENSE_PLANS[plan];
    const startsAt = await this.resolveStartDate(roomId);
    const expiresAt = new Date(startsAt.getTime() + planDef.days * 86_400_000);

    const license = await this.licenses.create({
      roomId,
      plan,
      source: "MANUAL_GRANT",
      creditsCost: planDef.credits,
      startsAt,
      expiresAt,
      grantedById: adminUserId,
    });

    await this.auditLogger.log({
      actorId: adminUserId,
      action: "bot_license.manual_grant",
      targetType: "Room",
      targetId: roomId,
      metadata: { plan, reason, expiresAt: expiresAt.toISOString() },
    });

    return { active: true, plan: license.plan as BotLicensePlan, expiresAt: license.expiresAt.toISOString() };
  }
}
