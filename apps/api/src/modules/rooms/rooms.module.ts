import { Module } from "@nestjs/common";
import { RoomsService } from "./application/rooms.service";
import { RoomsController } from "./presentation/rooms.controller";
import { ROOM_REPOSITORY } from "./domain/room-repository.interface";
import { PrismaRoomRepository } from "./infrastructure/prisma-room.repository";
import { ROOM_OWNERSHIP_VERIFIER } from "./domain/room-ownership-verifier.interface";
import { ImvuRoomPageVerifier } from "./infrastructure/imvu-room-page.verifier";

@Module({
  controllers: [RoomsController],
  providers: [
    RoomsService,
    { provide: ROOM_REPOSITORY, useClass: PrismaRoomRepository },
    { provide: ROOM_OWNERSHIP_VERIFIER, useClass: ImvuRoomPageVerifier },
  ],
})
export class RoomsModule {}
