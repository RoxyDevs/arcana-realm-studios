import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { AuthService } from './auth.service';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('DISCORD_CLIENT_ID', 'local-discord-client-id'),
      clientSecret: configService.get<string>('DISCORD_CLIENT_SECRET', 'local-discord-client-secret'),
      callbackURL: configService.get<string>('DISCORD_CALLBACK_URL', 'http://localhost:3000/auth/discord/callback'),
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: CallableFunction,
  ) {
    const user = await this.authService.validateDiscordProfile(profile);
    done(null, user);
  }
}
