import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUserDto, RoomDto } from "@arcana/types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RoomsService } from "../application/rooms.service";
import { BindRoomRequestDto } from "./bind-room.dto";

@ApiTags("rooms")
@Controller("rooms")
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get("mine")
  @ApiOperation({ summary: "Lists the rooms the current user has bound (pending or verified)" })
  listMine(@CurrentUser() user: AuthenticatedUserDto): Promise<RoomDto[]> {
    return this.roomsService.listMine(user.id);
  }

  @Post("bind")
  @ApiOperation({
    summary: "Step 1: parses a pasted IMVU room URL/ID and issues a one-time verification token",
  })
  bind(@CurrentUser() user: AuthenticatedUserDto, @Body() dto: BindRoomRequestDto): Promise<RoomDto> {
    return this.roomsService.bindRoom(user.id, dto.roomUrlOrId);
  }

  @Post(":roomId/verify")
  @ApiOperation({
    summary: "Step 2: confirms the verification token is present in the room's IMVU description",
  })
  verify(@Param("roomId") roomId: string, @CurrentUser() user: AuthenticatedUserDto): Promise<RoomDto> {
    return this.roomsService.verifyRoom(user.id, roomId);
  }

  @Get(":roomId/stream")
  @ApiOperation({
    summary: "Returns the room's status and, once verified + licensed, its Icecast/HLS stream URL",
  })
  getStream(@Param("roomId") roomId: string, @CurrentUser() user: AuthenticatedUserDto): Promise<RoomDto> {
    return this.roomsService.getStreamUrl(user.id, roomId);
  }

  @Delete(":roomId")
  @HttpCode(204)
  @ApiOperation({
    summary: "Unbinds a room — deletes it, freeing the IMVU room up to be bound again by anyone",
  })
  unbind(@Param("roomId") roomId: string, @CurrentUser() user: AuthenticatedUserDto): Promise<void> {
    return this.roomsService.unbindRoom(user.id, roomId);
  }
}
