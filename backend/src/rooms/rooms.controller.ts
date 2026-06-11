import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
@UseGuards(AuthGuard('jwt'))
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  getMyRooms(@Req() request: any) {
    return this.roomsService.getRoomsByUser(request.user.id);
  }

  @Post()
  create(@Body() body: CreateRoomDto, @Req() request: any) {
    return this.roomsService.createRoom({
      userId: request.user.id,
      name: body.name,
      imvuRoomId: body.imvuRoomId,
      url: body.url,
    });
  }
}
