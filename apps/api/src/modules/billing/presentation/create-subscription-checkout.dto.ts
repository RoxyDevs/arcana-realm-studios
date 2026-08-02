import { IsIn, IsUrl } from "class-validator";

export class CreateSubscriptionCheckoutDto {
  @IsIn(["PLUS", "PREMIUM"])
  tier!: "PLUS" | "PREMIUM";

  @IsUrl({ require_tld: false })
  successUrl!: string;

  @IsUrl({ require_tld: false })
  cancelUrl!: string;
}
