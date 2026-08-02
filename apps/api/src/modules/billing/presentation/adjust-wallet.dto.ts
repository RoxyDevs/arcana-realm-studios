import { IsInt, IsNotEmpty, IsString, MaxLength, MinLength, NotEquals } from "class-validator";

export class AdjustWalletRequestDto {
  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @IsInt()
  @NotEquals(0)
  amount!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
