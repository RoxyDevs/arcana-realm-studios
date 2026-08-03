export const ROOM_LICENSE_CHECKER = Symbol("ROOM_LICENSE_CHECKER");

/**
 * Read-only check for whether a Room currently has an unexpired BotLicense.
 * Lives in `common` (rather than being imported from Billing) so Rooms and
 * Billing never depend on each other directly — both depend on this port.
 */
export interface IRoomLicenseChecker {
  isActive(roomId: string): Promise<boolean>;
}
