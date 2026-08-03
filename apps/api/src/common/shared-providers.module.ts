import { Global, Module } from "@nestjs/common";
import { ROOM_ACCESS_CHECKER } from "./domain/room-access.interface";
import { PrismaRoomAccessChecker } from "./infrastructure/prisma-room-access.checker";
import { AUDIT_LOGGER } from "./domain/audit-logger.interface";
import { PrismaAuditLogger } from "./infrastructure/prisma-audit-logger";
import { ROOM_LICENSE_CHECKER } from "./domain/room-license-checker.interface";
import { PrismaRoomLicenseChecker } from "./infrastructure/prisma-room-license.checker";

@Global()
@Module({
  providers: [
    { provide: ROOM_ACCESS_CHECKER, useClass: PrismaRoomAccessChecker },
    { provide: AUDIT_LOGGER, useClass: PrismaAuditLogger },
    { provide: ROOM_LICENSE_CHECKER, useClass: PrismaRoomLicenseChecker },
  ],
  exports: [ROOM_ACCESS_CHECKER, AUDIT_LOGGER, ROOM_LICENSE_CHECKER],
})
export class SharedProvidersModule {}
