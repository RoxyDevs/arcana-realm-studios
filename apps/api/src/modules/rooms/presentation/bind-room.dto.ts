import { IsNotEmpty, IsString } from "class-validator";

export class BindRoomRequestDto {
  @IsString()
  @IsNotEmpty()
  roomUrlOrId!: string;
}
