import { IsIn } from "class-validator";

export class MoveQueueItemRequestDto {
  @IsIn(["up", "down"])
  direction!: "up" | "down";
}
