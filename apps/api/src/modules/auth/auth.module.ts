import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./application/auth.service";
import { TokensService } from "./application/tokens.service";
import { BootstrapOwnersRunner } from "./application/bootstrap-owners.runner";
import { AuthController } from "./presentation/auth.controller";
import { DiscordStrategy } from "./infrastructure/discord.strategy";
import { JwtStrategy } from "./infrastructure/jwt.strategy";
import { USER_REPOSITORY } from "./domain/user-repository.interface";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository";
import { REFRESH_TOKEN_REPOSITORY } from "./domain/refresh-token-repository.interface";
import { PrismaRefreshTokenRepository } from "./infrastructure/prisma-refresh-token.repository";

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    BootstrapOwnersRunner,
    DiscordStrategy,
    JwtStrategy,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
  ],
  exports: [AuthService],
})
export class AuthModule {}
