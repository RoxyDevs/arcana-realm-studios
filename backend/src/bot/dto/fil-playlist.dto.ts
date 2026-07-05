import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FillPlaylistDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsOptional()
  mood?: string;
}