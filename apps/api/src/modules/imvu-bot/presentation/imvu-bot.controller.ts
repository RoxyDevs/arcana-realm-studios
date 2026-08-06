import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, ImvuBotStatusDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { BotSessionService } from "../application/bot-session.service";
import { SetBotCredentialRequestDto } from "./set-bot-credential.dto";

@ApiTags("imvu-bot")
@Controller("rooms/:roomId/bot")
@UseGuards(JwtAuthGuard)
export class ImvuBotController {
  constructor(private readonly botSession: BotSessionService) {}

  @Get()
  @ApiOperation({ summary: "Whether the room's bot has a token saved and/or is currently connected" })
  getStatus(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<ImvuBotStatusDto> {
    return this.botSession.getStatus(roomId, user.id);
  }

  @Put("credential")
  @ApiOperation({ summary: "Saves the room's imvu.js.org bot token (encrypted at rest) and optional seat" })
  setCredential(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: SetBotCredentialRequestDto,
  ): Promise<void> {
    return this.botSession.setCredential(roomId, user.id, dto.token, dto.seat ?? null);
  }

  @Delete("credential")
  @ApiOperation({ summary: "Removes the saved token and disconnects the bot if it's running" })
  clearCredential(@Param("roomId") roomId: string, @CurrentUser() user: AuthenticatedUserDto): Promise<void> {
    return this.botSession.clearCredential(roomId, user.id);
  }

  @Post("start")
  @ApiOperation({ summary: "Connects the bot to the room's chat — requires an active BotLicense and a saved token" })
  start(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<ImvuBotStatusDto> {
    return this.botSession.start(roomId, user.id);
  }

  @Post("stop")
  @ApiOperation({ summary: "Disconnects the bot from the room's chat" })
  stop(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<ImvuBotStatusDto> {
    return this.botSession.stop(roomId, user.id);
  }
}
