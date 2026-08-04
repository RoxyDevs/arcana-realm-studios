import { IsIn, IsString, MinLength } from "class-validator";
import type { GuardianLicensePlan } from "@arcana/types";

const PLAN_KEYS: GuardianLicensePlan[] = ["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3", "YEAR_1"];

export class GrantGuardianLicenseRequestDto {
  @IsIn(PLAN_KEYS)
  plan!: GuardianLicensePlan;

  @IsString()
  @MinLength(3)
  reason!: string;
}
