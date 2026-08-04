import { IsIn, IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";
import type { GuardianReportCategory } from "@arcana/database";

const CATEGORIES: GuardianReportCategory[] = [
  "HARASSMENT",
  "SPAM",
  "RAID",
  "HATE_SPEECH",
  "BAN_EVASION",
  "OTHER",
];

export class CreateGuardianReportRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subjectIdentifier!: string;

  @IsIn(CATEGORIES)
  category!: GuardianReportCategory;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  evidenceUrl?: string;
}
