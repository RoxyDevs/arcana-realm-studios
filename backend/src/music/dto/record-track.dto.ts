import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RecordTrackDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  trackTitle!: string;

  @IsString()
  @IsOptional()
  genre?: string;

  @IsString()
  @IsOptional()
  artist?: string;

  @IsNumber()
  @IsOptional()
  bpm?: number;
}
