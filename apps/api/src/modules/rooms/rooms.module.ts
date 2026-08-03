import { Module } from "@nestjs/common";
import { RoomsService } from "./application/rooms.service";
import { RoomsController } from "./presentation/rooms.controller";
import { ROOM_REPOSITORY } from "./domain/room-repository.interface";
import { PrismaRoomRepository } from "./infrastructure/prisma-room.repository";
import { ROOM_OWNERSHIP_VERIFIER } from "./domain/room-ownership-verifier.interface";
import { ImvuRoomApiVerifier } from "./infrastructure/imvu-room-api.verifier";

@Module({
  controllers: [RoomsController],
  providers: [
    RoomsService,
    { provide: ROOM_REPOSITORY, useClass: PrismaRoomRepository },
    { provide: ROOM_OWNERSHIP_VERIFIER, useClass: ImvuRoomApiVerifier },
  ],
})
export class RoomsModule {}
