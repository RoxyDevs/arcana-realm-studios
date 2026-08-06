import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class BanRoomMemberRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  imvuDisplayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
