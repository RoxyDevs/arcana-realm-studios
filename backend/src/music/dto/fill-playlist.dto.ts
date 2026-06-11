import { IsArray, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export class FillPlaylistDto {
  @IsString()
  roomId!: string;

  @IsArray()
  @ArrayNotEmpty()
  recentTracks!: string[];

  @IsString()
  @IsOptional()
  mood?: string;
}
