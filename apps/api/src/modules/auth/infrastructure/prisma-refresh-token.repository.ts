import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient, RefreshToken } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import type { IRefreshTokenRepository } from "../domain/refresh-token-repository.interface";

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {}

  create(params: { userId: string; tokenHash: string; expiresAt: Date; issuedIp: string | null }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data: params });
  }

  findValidByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
