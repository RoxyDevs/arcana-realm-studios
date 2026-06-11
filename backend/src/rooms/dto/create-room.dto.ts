import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  imvuRoomId!: string;

  @IsUrl()
  url!: string;
}
