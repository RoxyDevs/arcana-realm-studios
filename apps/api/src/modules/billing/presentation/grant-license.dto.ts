import { IsIn, IsString, MinLength } from "class-validator";
import type { BotLicensePlan } from "@arcana/types";

const PLAN_KEYS: BotLicensePlan[] = ["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3", "YEAR_1"];

export class GrantLicenseRequestDto {
  @IsIn(PLAN_KEYS)
  plan!: BotLicensePlan;

  @IsString()
  @MinLength(3)
  reason!: string;
}
