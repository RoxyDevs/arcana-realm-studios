import { IsBoolean, IsOptional } from "class-validator";

export class UpdateGuardianSettingsRequestDto {
  @IsOptional()
  @IsBoolean()
  antiSpamEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  antiRaidEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoModEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sharedBlacklistOptIn?: boolean;
}
