import { Inject, Injectable } from "@nestjs/common";
import type { GuardianSettings } from "@arcana/database";
import type { GuardianSettingsDto, UpdateGuardianSettingsDto } from "@arcana/types";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../../../common/domain/room-access.interface";
import {
  GUARDIAN_SETTINGS_REPOSITORY,
  type IGuardianSettingsRepository,
} from "../domain/guardian-settings-repository.interface";
import { GuardianLicenseService } from "./guardian-license.service";

function toDto(settings: GuardianSettings): GuardianSettingsDto {
  return {
    roomId: settings.roomId,
    antiSpamEnabled: settings.antiSpamEnabled,
    antiRaidEnabled: settings.antiRaidEnabled,
    autoModEnabled: settings.autoModEnabled,
    sharedBlacklistOptIn: settings.sharedBlacklistOptIn,
  };
}

@Injectable()
export class GuardianSettingsService {
  constructor(
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
    @Inject(GUARDIAN_SETTINGS_REPOSITORY) private readonly settings: IGuardianSettingsRepository,
    private readonly guardianLicense: GuardianLicenseService,
  ) {}

  async get(roomId: string, userId: string): Promise<GuardianSettingsDto> {
    await this.roomAccess.assertOwner(roomId, userId);
    await this.guardianLicense.assertActive(roomId);
    return toDto(await this.settings.getOrCreate(roomId));
  }

  async update(roomId: string, userId: string, patch: UpdateGuardianSettingsDto): Promise<GuardianSettingsDto> {
    await this.roomAccess.assertOwner(roomId, userId);
    await this.guardianLicense.assertActive(roomId);
    return toDto(await this.settings.update(roomId, patch));
  }
}
