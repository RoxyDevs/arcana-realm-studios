import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "./prisma.module";
import type { IRoomLicenseChecker } from "../domain/room-license-checker.interface";

@Injectable()
export class PrismaRoomLicenseChecker implements IRoomLicenseChecker {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async isActive(roomId: string): Promise<boolean> {
    const latest = await this.prisma.botLicense.findFirst({
      where: { roomId },
      orderBy: { expiresAt: "desc" },
    });
    return !!latest && latest.expiresAt > new Date();
  }
}
