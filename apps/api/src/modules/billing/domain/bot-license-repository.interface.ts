import type { BotLicense, BotLicensePlan, BotLicenseSource } from "@arcana/database";

export const BOT_LICENSE_REPOSITORY = Symbol("BOT_LICENSE_REPOSITORY");

export interface IBotLicenseRepository {
  /** The license with the furthest-out expiry for a room, active or not — used as the base to extend from. */
  findLatestForRoom(roomId: string): Promise<BotLicense | null>;
  create(params: {
    roomId: string;
    plan: BotLicensePlan;
    source: BotLicenseSource;
    creditsCost: number;
    startsAt: Date;
    expiresAt: Date;
    grantedById: string | null;
  }): Promise<BotLicense>;
}
