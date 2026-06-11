import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class LinkImvuDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsUrl()
  roomUrl!: string;
}
