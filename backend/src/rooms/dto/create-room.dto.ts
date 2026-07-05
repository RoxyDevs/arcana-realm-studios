// src/rooms/dto/create-room.dto.ts

import { IsNotEmpty, IsOptional, IsString, IsUrl, IsEnum } from 'class-validator';
import { RoomType } from '@prisma/client';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  imvuRoomId!: string;

  @IsUrl()
  url!: string;

  @IsEnum(RoomType)
  @IsOptional()
  roomType?: RoomType = RoomType.GA;
}