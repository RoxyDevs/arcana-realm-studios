import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddToQueueDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  query!: string; // nombre de la canción o URL de YouTube
}