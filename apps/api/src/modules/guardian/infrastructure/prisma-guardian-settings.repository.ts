import { Inject, Injectable } from "@nestjs/common";
import type { GuardianSettings, PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type {
  IGuardianSettingsRepository,
  UpdateGuardianSettingsRecord,
} from "../domain/guardian-settings-repository.interface";

@Injectable()
export class PrismaGuardianSettingsRepository implements IGuardianSettingsRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  findByRoomId(roomId: string): Promise<GuardianSettings | null> {
    return this.prisma.guardianSettings.findUnique({ where: { roomId } });
  }

  getOrCreate(roomId: string): Promise<GuardianSettings> {
    return this.prisma.guardianSettings.upsert({
      where: { roomId },
      update: {},
      create: { roomId },
    });
  }

  update(roomId: string, patch: UpdateGuardianSettingsRecord): Promise<GuardianSettings> {
    return this.prisma.guardianSettings.upsert({
      where: { roomId },
      update: patch,
      create: { roomId, ...patch },
    });
  }
}
