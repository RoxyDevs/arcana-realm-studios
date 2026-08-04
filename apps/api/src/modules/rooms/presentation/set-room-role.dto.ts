import { IsOptional, IsString, MaxLength } from "class-validator";

export class SetRoomRoleRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  roleTag?: string | null;
}
