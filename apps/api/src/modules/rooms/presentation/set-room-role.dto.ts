import { IsOptional, IsString, MaxLength } from "class-validator";

export class SetRoomRoleRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  roleTag?: string | null;

  /** Self-reported — lets the room bot match a chat sender back to this roster row. Not a verified identity link. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  imvuDisplayName?: string | null;
}
