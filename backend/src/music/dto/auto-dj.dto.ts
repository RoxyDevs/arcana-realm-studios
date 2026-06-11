import { IsOptional, IsString } from 'class-validator';

export class AutoDjDto {
  @IsString()
  roomId!: string;

  @IsString()
  @IsOptional()
  mood?: string;
}
