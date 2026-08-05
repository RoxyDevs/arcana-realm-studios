import { Module } from "@nestjs/common";
import { RoomsService } from "./application/rooms.service";
import { RoomMemberService } from "./application/room-member.service";
import { RoomsController } from "./presentation/rooms.controller";
import { RoomMemberController } from "./presentation/room-member.controller";
import { ROOM_REPOSITORY } from "./domain/room-repository.interface";
import { PrismaRoomRepository } from "./infrastructure/prisma-room.repository";
import { ROOM_MEMBER_REPOSITORY } from "./domain/room-member-repository.interface";
import { PrismaRoomMemberRepository } from "./infrastructure/prisma-room-member.repository";
import { ROOM_OWNERSHIP_VERIFIER } from "./domain/room-ownership-verifier.interface";
import { ImvuRoomApiVerifier } from "./infrastructure/imvu-room-api.verifier";

@Module({
  controllers: [RoomsController, RoomMemberController],
  providers: [
    RoomsService,
    RoomMemberService,
    { provide: ROOM_REPOSITORY, useClass: PrismaRoomRepository },
    { provide: ROOM_MEMBER_REPOSITORY, useClass: PrismaRoomMemberRepository },
    { provide: ROOM_OWNERSHIP_VERIFIER, useClass: ImvuRoomApiVerifier },
  ],
  exports: [ROOM_REPOSITORY],
})
export class RoomsModule {}
