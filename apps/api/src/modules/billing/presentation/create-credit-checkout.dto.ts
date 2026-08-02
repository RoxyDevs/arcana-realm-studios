import { IsInt, IsPositive, IsString, IsUrl } from "class-validator";

export class CreateCreditCheckoutDto {
  @IsString()
  priceId!: string;

  @IsInt()
  @IsPositive()
  credits!: number;

  @IsUrl({ require_tld: false })
  successUrl!: string;

  @IsUrl({ require_tld: false })
  cancelUrl!: string;
}
