import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, BanRoomMemberDto, RoomBanDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RoomBanService } from "../application/room-ban.service";
import { BanRoomMemberRequestDto } from "./ban-room-member.dto";

/**
 * The dashboard counterpart to !ban/!kick/!unban — same RoomBanService, so
 * banning someone here has the exact same effect (auto-re-kick on rejoin)
 * as doing it from chat. Unlike the chat version, this doesn't require the
 * target to currently be in the room — useful for pre-banning someone
 * who isn't online right now.
 */
@ApiTags("imvu-bot")
@Controller("rooms/:roomId/bans")
@UseGuards(JwtAuthGuard)
export class RoomBanController {
  constructor(private readonly roomBans: RoomBanService) {}

  @Get()
  @ApiOperation({ summary: "Lists everyone currently banned from this room" })
  list(@Param("roomId") roomId: string, @CurrentUser() user: AuthenticatedUserDto): Promise<RoomBanDto[]> {
    return this.roomBans.list(roomId, user.id);
  }

  @Post()
  @ApiOperation({ summary: "Bans an IMVU display name from this room — doesn't need to be present right now" })
  ban(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: BanRoomMemberRequestDto,
  ): Promise<RoomBanDto> {
    const request: BanRoomMemberDto = { imvuDisplayName: dto.imvuDisplayName, reason: dto.reason };
    return this.roomBans.ban(roomId, user.id, request.imvuDisplayName, request.reason ?? null);
  }

  @Delete(":imvuDisplayName")
  @ApiOperation({ summary: "Unbans an IMVU display name from this room" })
  async unban(
    @Param("roomId") roomId: string,
    @Param("imvuDisplayName") imvuDisplayName: string,
    @CurrentUser() user: AuthenticatedUserDto,
  ): Promise<{ removed: boolean }> {
    const removed = await this.roomBans.unban(roomId, user.id, imvuDisplayName);
    return { removed };
  }
}
