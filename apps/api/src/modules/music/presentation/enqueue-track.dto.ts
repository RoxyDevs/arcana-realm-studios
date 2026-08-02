import { IsIn, IsString } from "class-validator";
import type { TrackSource } from "@arcana/database";

const TRACK_SOURCES: TrackSource[] = ["SPOTIFY", "YOUTUBE", "UPLOAD"];

export class EnqueueTrackRequestDto {
  @IsIn(TRACK_SOURCES)
  source!: TrackSource;

  @IsString()
  externalId!: string;
}
