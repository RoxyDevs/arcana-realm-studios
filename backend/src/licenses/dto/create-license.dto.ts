import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LicenseType } from '@prisma/client';

export class CreateLicenseDto {
  @IsEnum(LicenseType)
  type!: LicenseType;

  @IsOptional()
  @IsString()
  userId?: string;
}
