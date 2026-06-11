import { IsNotEmpty, IsString } from 'class-validator';

export class InstallBotDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;
}
