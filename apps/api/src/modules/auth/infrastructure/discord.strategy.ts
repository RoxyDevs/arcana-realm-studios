import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile } from "passport-discord";
import type { AppConfig } from "../../../config/configuration";
import type { DiscordProfile } from "../domain/discord-profile.entity";

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, "discord") {
  constructor(config: ConfigService<AppConfig, true>) {
    super({
      clientID: config.get("discord.clientId", { infer: true }),
      clientSecret: config.get("discord.clientSecret", { infer: true }),
      callbackURL: config.get("discord.callbackUrl", { infer: true }),
      scope: ["identify", "email"],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): DiscordProfile {
    return {
      discordId: profile.id,
      username: profile.username,
      avatarUrl: profile.avatar
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
        : null,
      email: profile.email ?? null,
    };
  }
}
