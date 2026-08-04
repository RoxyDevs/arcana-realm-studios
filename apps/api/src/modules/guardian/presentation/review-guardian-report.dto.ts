import { IsIn } from "class-validator";

export class ReviewGuardianReportRequestDto {
  @IsIn(["CONFIRMED", "DISMISSED"])
  status!: "CONFIRMED" | "DISMISSED";
}
