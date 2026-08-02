import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "./prisma.module";
import type { IAuditLogger } from "../domain/audit-logger.interface";

@Injectable()
export class PrismaAuditLogger implements IAuditLogger {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  async log(params: {
    actorId: string | null;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata as never,
      },
    });
  }
}
