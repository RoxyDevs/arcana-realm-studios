import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SetBotCredentialRequestDto {
  /** The token issued by imvu.js.org after registering a bot account there — not an IMVU-issued credential. */
  @IsString()
  @MinLength(10)
  token!: string;

  /**
   * Where the bot stands/sits — an IMVU seat identifier, same format IMVU's
   * own client uses. Optional; leave unset and the bot uses whatever
   * default IMVU/imvu.js.org falls back to. This does NOT control
   * appearance — see the README for why outfit isn't something Arcana can
   * set, only where the bot is positioned.
   */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  seat?: string;
}
