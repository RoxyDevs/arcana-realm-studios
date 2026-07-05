import { IsNotEmpty, IsString } from 'class-validator';

export class ProcessCommandDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  command!: string;
}