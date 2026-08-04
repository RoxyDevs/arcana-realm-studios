import { IsIn } from "class-validator";
import type { GuardianLicensePlan } from "@arcana/types";

const PLAN_KEYS: GuardianLicensePlan[] = ["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3", "YEAR_1"];

export class PurchaseGuardianLicenseRequestDto {
  @IsIn(PLAN_KEYS)
  plan!: GuardianLicensePlan;
}
