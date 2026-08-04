import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import {
  GUARDIAN_LICENSE_PLANS,
  SUBSCRIPTION_PLANS,
  type GuardianLicensePlan,
  type GuardianLicenseStatusDto,
} from "@arcana/types";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../../../common/domain/room-access.interface";
import { AUDIT_LOGGER, type IAuditLogger } from "../../../common/domain/audit-logger.interface";
import { WALLET_REPOSITORY, type IWalletRepository } from "../../billing/domain/wallet-repository.interface";
import {
  SUBSCRIPTION_REPOSITORY,
  type ISubscriptionRepository,
} from "../../billing/domain/subscription-repository.interface";
import {
  GUARDIAN_LICENSE_REPOSITORY,
  type IGuardianLicenseRepository,
} from "../domain/guardian-license-repository.interface";

@Injectable()
export class GuardianLicenseService {
  constructor(
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
    @Inject(WALLET_REPOSITORY) private readonly wallets: IWalletRepository,
    @Inject(GUARDIAN_LICENSE_REPOSITORY) private readonly licenses: IGuardianLicenseRepository,
    @Inject(AUDIT_LOGGER) private readonly auditLogger: IAuditLogger,
    @Inject(SUBSCRIPTION_REPOSITORY) private readonly subscriptions: ISubscriptionRepository,
  ) {}

  /** PLUS/PREMIUM subscribers get the same flat credit discount on Guardian licenses as on bot time — 0 for FREE/no subscription. */
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

  /** Internal use by GuardianSettingsService/GuardianReportService to gate access — no ownership check, callers already resolved that. */
  async isActive(roomId: string): Promise<boolean> {
    const latest = await this.licenses.findLatestForRoom(roomId);
    return !!latest && latest.expiresAt > new Date();
  }

  /** Guardian is a paid module — an unlicensed room gets no settings/reports access. Shared by GuardianSettingsService and GuardianReportService. */
  async assertActive(roomId: string): Promise<void> {
    if (!(await this.isActive(roomId))) {
      throw new ForbiddenException("Guardian isn't licensed for this room — purchase a Guardian license first.");
    }
  }

  async getStatus(roomId: string, userId: string): Promise<GuardianLicenseStatusDto> {
    await this.roomAccess.assertOwner(roomId, userId);
    const latest = await this.licenses.findLatestForRoom(roomId);
    const active = !!latest && latest.expiresAt > new Date();
    return {
      active,
      plan: active ? (latest!.plan as GuardianLicensePlan) : null,
      expiresAt: active ? latest!.expiresAt.toISOString() : null,
    };
  }

  /** Self-service purchase: the room owner spends their own wallet credits. */
  async purchaseWithCredits(
    roomId: string,
    userId: string,
    plan: GuardianLicensePlan,
  ): Promise<GuardianLicenseStatusDto> {
    await this.roomAccess.assertOwner(roomId, userId);

    const planDef = GUARDIAN_LICENSE_PLANS[plan];
    const discountPercent = await this.getCreditDiscountPercent(userId);
    const cost = Math.round(planDef.credits * (1 - discountPercent / 100));
    const startsAt = await this.resolveStartDate(roomId);
    const expiresAt = new Date(startsAt.getTime() + planDef.days * 86_400_000);

    await this.wallets.applyTransaction({
      userId,
      amount: -cost,
      type: "CONSUMPTION",
      metadata: { roomId, plan, reason: "guardian_license_purchase", discountPercent },
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

    return {
      active: true,
      plan: license.plan as GuardianLicensePlan,
      expiresAt: license.expiresAt.toISOString(),
    };
  }

  /**
   * Admin-only path for payments Arcana can't verify automatically (PayPal.me,
   * in-game VCoin gifts confirmed manually) — grants time directly instead of
   * routing through the buyer's wallet. Always audited.
   */
  async grantManually(
    roomId: string,
    adminUserId: string,
    plan: GuardianLicensePlan,
    reason: string,
  ): Promise<GuardianLicenseStatusDto> {
    const planDef = GUARDIAN_LICENSE_PLANS[plan];
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
      action: "guardian_license.manual_grant",
      targetType: "Room",
      targetId: roomId,
      metadata: { plan, reason, expiresAt: expiresAt.toISOString() },
    });

    return {
      active: true,
      plan: license.plan as GuardianLicensePlan,
      expiresAt: license.expiresAt.toISOString(),
    };
  }
}
