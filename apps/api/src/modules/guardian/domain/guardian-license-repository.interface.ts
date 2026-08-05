import type { GuardianLicense, GuardianLicensePlan, GuardianLicenseSource } from "@arcana/database";

export const GUARDIAN_LICENSE_REPOSITORY = Symbol("GUARDIAN_LICENSE_REPOSITORY");

export interface IGuardianLicenseRepository {
  /** The license with the furthest-out expiry for a room, active or not — used as the base to extend from. */
  findLatestForRoom(roomId: string): Promise<GuardianLicense | null>;
  create(params: {
    roomId: string;
    plan: GuardianLicensePlan;
    source: GuardianLicenseSource;
    creditsCost: number;
    startsAt: Date;
    expiresAt: Date;
    grantedById: string | null;
  }): Promise<GuardianLicense>;
}
