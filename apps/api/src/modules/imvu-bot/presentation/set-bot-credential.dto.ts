import { IsString, MinLength } from "class-validator";

export class SetBotCredentialRequestDto {
  /** The token issued by imvu.js.org after registering a bot account there — not an IMVU-issued credential. */
  @IsString()
  @MinLength(10)
  token!: string;
}
