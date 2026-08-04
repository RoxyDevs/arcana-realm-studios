import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, RoomMemberDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RoomMemberService } from "../application/room-member.service";
import { SetRoomRoleRequestDto } from "./set-room-role.dto";

@ApiTags("rooms")
@Controller("rooms/:roomId/members")
@UseGuards(JwtAuthGuard)
export class RoomMemberController {
  constructor(private readonly roomMemberService: RoomMemberService) {}

  @Get()
  @ApiOperation({ summary: "Lists everyone who has self-tagged a role in this room" })
  listRoster(@Param("roomId") roomId: string): Promise<RoomMemberDto[]> {
    return this.roomMemberService.listRoster(roomId);
  }

  @Put("me")
  @ApiOperation({
    summary: "Sets (or clears, with roleTag: null) the current user's own role tag in this room",
  })
  setMyRole(
    @Param("roomId") roomId: string,
    @CurrentUser() user: AuthenticatedUserDto,
    @Body() dto: SetRoomRoleRequestDto,
  ): Promise<RoomMemberDto> {
    return this.roomMemberService.setMyRole(roomId, user.id, dto.roleTag ?? null);
  }
}
