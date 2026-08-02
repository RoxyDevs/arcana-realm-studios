import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import type { AuthenticatedUserDto, Role } from "@arcana/types";
import type { AppConfig } from "../../../config/configuration";

export interface AccessTokenPayload {
  sub: string;
  discordId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  roles: Role[];
}

function extractFromCookie(req: Request): string | null {
  return req?.cookies?.["access_token"] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get("jwt.accessSecret", { infer: true }),
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUserDto {
    return {
      id: payload.sub,
      discordId: payload.discordId,
      username: payload.username,
      email: payload.email,
      avatarUrl: payload.avatarUrl,
      roles: payload.roles,
    };
  }
}
