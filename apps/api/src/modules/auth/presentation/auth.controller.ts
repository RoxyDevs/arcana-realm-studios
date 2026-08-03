import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { AuthenticatedUserDto, UserSummaryDto } from "@arcana/types";
import type { DiscordProfile } from "../domain/discord-profile.entity";
import type { AppConfig } from "../../../config/configuration";
import { AuthService } from "../application/auth.service";
import { JwtAuthGuard } from "../infrastructure/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RefreshTokenDto } from "./refresh-token.dto";
import { clearAuthCookies, setAuthCookies } from "./cookie.util";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private get isProduction(): boolean {
    return this.config.get("nodeEnv", { infer: true }) === "production";
  }

  @Get("discord")
  @UseGuards(AuthGuard("discord"))
  @ApiOperation({ summary: "Redirects to Discord's OAuth consent screen" })
  discordLogin(): void {
    // Passport intercepts this request and redirects to Discord.
  }

  @Get("discord/callback")
  @UseGuards(AuthGuard("discord"))
  @ApiOperation({ summary: "Discord OAuth callback — issues Arcana session cookies" })
  async discordCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const profile = req.user as DiscordProfile;
    const tokens = await this.authService.loginWithDiscord(profile, req.ip ?? null);
    setAuthCookies(res, tokens, this.isProduction);
    res.redirect(`${this.config.get("webUrl", { infer: true })}/dashboard`);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Rotates the refresh token and issues a new access token" })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RefreshTokenDto,
  ): Promise<{ ok: true }> {
    const rawToken = req.cookies?.["refresh_token"] ?? body.refreshToken;
    if (!rawToken) {
      throw new BadRequestException("Missing refresh token");
    }

    const tokens = await this.authService.refresh(rawToken, req.ip ?? null);
    setAuthCookies(res, tokens, this.isProduction);
    return { ok: true };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Revokes the current refresh token and clears session cookies" })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RefreshTokenDto,
  ): Promise<{ ok: true }> {
    const rawToken = req.cookies?.["refresh_token"] ?? body.refreshToken;
    if (rawToken) {
      await this.authService.logout(rawToken);
    }
    clearAuthCookies(res);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Returns the currently authenticated user" })
  me(@CurrentUser() user: AuthenticatedUserDto): AuthenticatedUserDto {
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  @Get("users/search")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Admin-only: looks up users by username, to grant credits/subscriptions to" })
  searchUsers(@Query("query") query: string): Promise<UserSummaryDto[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException("query must be at least 2 characters");
    }
    return this.authService.searchUsers(query.trim());
  }
}
