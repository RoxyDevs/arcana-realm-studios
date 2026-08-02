import { Global, Module } from "@nestjs/common";
import { ROOM_ACCESS_CHECKER } from "./domain/room-access.interface";
import { PrismaRoomAccessChecker } from "./infrastructure/prisma-room-access.checker";
import { AUDIT_LOGGER } from "./domain/audit-logger.interface";
import { PrismaAuditLogger } from "./infrastructure/prisma-audit-logger";

@Global()
@Module({
  providers: [
    { provide: ROOM_ACCESS_CHECKER, useClass: PrismaRoomAccessChecker },
    { provide: AUDIT_LOGGER, useClass: PrismaAuditLogger },
  ],
  exports: [ROOM_ACCESS_CHECKER, AUDIT_LOGGER],
})
export class SharedProvidersModule {}
