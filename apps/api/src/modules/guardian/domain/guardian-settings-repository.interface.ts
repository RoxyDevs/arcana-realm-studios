import type { GuardianSettings } from "@arcana/database";

export const GUARDIAN_SETTINGS_REPOSITORY = Symbol("GUARDIAN_SETTINGS_REPOSITORY");

export interface UpdateGuardianSettingsRecord {
  antiSpamEnabled?: boolean;
  antiRaidEnabled?: boolean;
  autoModEnabled?: boolean;
  sharedBlacklistOptIn?: boolean;
}

export interface IGuardianSettingsRepository {
  findByRoomId(roomId: string): Promise<GuardianSettings | null>;

  /** Rooms don't get GuardianSettings until first touched — this creates the row with schema defaults if missing. */
  getOrCreate(roomId: string): Promise<GuardianSettings>;

  update(roomId: string, patch: UpdateGuardianSettingsRecord): Promise<GuardianSettings>;
}
