import { IsNotEmpty, IsNumberString, IsOptional, IsString } from "class-validator";

export class UploadTrackRequestDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  artist?: string;

  /** Multipart fields always arrive as strings — parsed to a number in the service. */
  @IsOptional()
  @IsNumberString()
  durationSec?: string;

  /** Comma-separated, e.g. "synthwave,electronic". */
  @IsOptional()
  @IsString()
  genreTags?: string;
}
