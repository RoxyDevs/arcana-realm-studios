import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddTrackDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  url?: string;
}