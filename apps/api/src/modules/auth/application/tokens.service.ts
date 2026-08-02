import { randomBytes, createHash } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { User } from "@arcana/database";
import type { AuthTokensDto } from "@arcana/types";
import type { AppConfig } from "../../../config/configuration";
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from "../domain/refresh-token-repository.interface";
import { parseDurationToMs } from "./parse-duration.util";
import type { AccessTokenPayload } from "../infrastructure/jwt.strategy";

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: IRefreshTokenRepository,
  ) {}

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private signAccessToken(user: User): { token: string; expiresIn: number } {
    const accessTtl = this.config.get("jwt.accessTtl", { infer: true });
    const payload: AccessTokenPayload = {
      sub: user.id,
      discordId: user.discordId,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
    };
    const token = this.jwtService.sign(payload, {
      secret: this.config.get("jwt.accessSecret", { infer: true }),
      expiresIn: accessTtl,
    });
    return { token, expiresIn: Math.floor(parseDurationToMs(accessTtl) / 1000) };
  }

  /** Issues a fresh access + refresh token pair, persisting only the refresh token's hash. */
  async issueTokenPair(user: User, issuedIp: string | null): Promise<AuthTokensDto> {
    const { token: accessToken, expiresIn } = this.signAccessToken(user);

    const refreshTtl = this.config.get("jwt.refreshTtl", { infer: true });
    const refreshToken = randomBytes(48).toString("hex");

    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: this.hash(refreshToken),
      expiresAt: new Date(Date.now() + parseDurationToMs(refreshTtl)),
      issuedIp,
    });

    return { accessToken, refreshToken, expiresIn };
  }

  async resolveUserIdForRefreshToken(presentedToken: string): Promise<string | null> {
    const record = await this.refreshTokens.findValidByHash(this.hash(presentedToken));
    return record?.userId ?? null;
  }

  /** Rotates a refresh token: the presented token is revoked and a new pair is issued. */
  async rotateRefreshToken(
    presentedToken: string,
    user: User,
    issuedIp: string | null,
  ): Promise<AuthTokensDto | null> {
    const record = await this.refreshTokens.findValidByHash(this.hash(presentedToken));
    if (!record || record.userId !== user.id) {
      return null;
    }
    await this.refreshTokens.revoke(record.id);
    return this.issueTokenPair(user, issuedIp);
  }

  async revokeRefreshToken(presentedToken: string): Promise<void> {
    const record = await this.refreshTokens.findValidByHash(this.hash(presentedToken));
    if (record) {
      await this.refreshTokens.revoke(record.id);
    }
  }
}
