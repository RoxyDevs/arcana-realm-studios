import { Inject, Injectable } from "@nestjs/common";
import { BOT_LICENSE_PLANS, type BotLicensePlan, type BotLicenseStatusDto } from "@arcana/types";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../../../common/domain/room-access.interface";
import { AUDIT_LOGGER, type IAuditLogger } from "../../../common/domain/audit-logger.interface";
import { WALLET_REPOSITORY, type IWalletRepository } from "../domain/wallet-repository.interface";
import {
  BOT_LICENSE_REPOSITORY,
  type IBotLicenseRepository,
} from "../domain/bot-license-repository.interface";

@Injectable()
export class BotLicenseService {
  constructor(
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
    @Inject(WALLET_REPOSITORY) private readonly wallets: IWalletRepository,
    @Inject(BOT_LICENSE_REPOSITORY) private readonly licenses: IBotLicenseRepository,
    @Inject(AUDIT_LOGGER) private readonly auditLogger: IAuditLogger,
  ) {}

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
    const startsAt = await this.resolveStartDate(roomId);
    const expiresAt = new Date(startsAt.getTime() + planDef.days * 86_400_000);

    await this.wallets.applyTransaction({
      userId,
      amount: -planDef.credits,
      type: "CONSUMPTION",
      metadata: { roomId, plan, reason: "bot_license_purchase" },
    });

    const license = await this.licenses.create({
      roomId,
      plan,
      source: "CREDIT_PURCHASE",
      creditsCost: planDef.credits,
      startsAt,
      expiresAt,
      grantedById: null,
    });

    return { active: true, plan: license.plan as BotLicensePlan, expiresAt: license.expiresAt.toISOString() };
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
