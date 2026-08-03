import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthTokensDto, UserSummaryDto } from "@arcana/types";
import { USER_REPOSITORY, type IUserRepository } from "../domain/user-repository.interface";
import type { DiscordProfile } from "../domain/discord-profile.entity";
import { TokensService } from "./tokens.service";

function toUserSummary(user: { id: string; username: string; discordId: string; avatarUrl: string | null; roles: string[] }): UserSummaryDto {
  return {
    id: user.id,
    username: user.username,
    discordId: user.discordId,
    avatarUrl: user.avatarUrl,
    roles: user.roles as UserSummaryDto["roles"],
  };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly tokens: TokensService,
  ) {}

  async loginWithDiscord(profile: DiscordProfile, ip: string | null): Promise<AuthTokensDto> {
    const user =
      (await this.users.findByDiscordId(profile.discordId)) ??
      (await this.users.createFromDiscordProfile(profile));

    return this.tokens.issueTokenPair(user, ip);
  }

  async refresh(rawRefreshToken: string, ip: string | null): Promise<AuthTokensDto> {
    const userId = await this.tokens.resolveUserIdForRefreshToken(rawRefreshToken);
    if (!userId) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }

    const rotated = await this.tokens.rotateRefreshToken(rawRefreshToken, user, ip);
    if (!rotated) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    return rotated;
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await this.tokens.revokeRefreshToken(rawRefreshToken);
  }

  async searchUsers(query: string): Promise<UserSummaryDto[]> {
    const users = await this.users.searchByUsername(query, 10);
    return users.map(toUserSummary);
  }
}
