import type { RefreshToken } from "@arcana/database";

export const REFRESH_TOKEN_REPOSITORY = Symbol("REFRESH_TOKEN_REPOSITORY");

export interface IRefreshTokenRepository {
  create(params: { userId: string; tokenHash: string; expiresAt: Date; issuedIp: string | null }): Promise<RefreshToken>;
  findValidByHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
