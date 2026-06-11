import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateDiscordProfile(profile: any) {
    return this.usersService.findOrCreateFromDiscord(profile);
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      discordId: user.discordId,
      username: user.username,
      roles: user.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async handleDiscordCallback(user: any) {
    return this.login(user);
  }
}
