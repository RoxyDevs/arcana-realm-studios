import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString } from "class-validator";
import type { SubscriptionTier } from "@arcana/types";

const TIERS: SubscriptionTier[] = ["FREE", "PLUS", "PREMIUM"];

export class GrantSubscriptionRequestDto {
  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @IsIn(TIERS)
  tier!: SubscriptionTier;

  /** Omit for a subscription that never expires. */
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
