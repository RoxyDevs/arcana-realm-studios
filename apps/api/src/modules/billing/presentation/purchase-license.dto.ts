import { IsIn } from "class-validator";
import type { BotLicensePlan } from "@arcana/types";

const PLAN_KEYS: BotLicensePlan[] = ["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3", "YEAR_1"];

export class PurchaseLicenseRequestDto {
  @IsIn(PLAN_KEYS)
  plan!: BotLicensePlan;
}
