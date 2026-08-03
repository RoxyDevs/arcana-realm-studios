import { ArrayMinSize, IsArray, IsIn, IsString } from "class-validator";
import type { BotLicensePlan } from "@arcana/types";

const PLANS: BotLicensePlan[] = ["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3", "YEAR_1"];

export class BulkPurchaseLicenseRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roomIds!: string[];

  @IsIn(PLANS)
  plan!: BotLicensePlan;
}
