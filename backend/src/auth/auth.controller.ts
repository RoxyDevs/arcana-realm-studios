import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('discord/login')
  @UseGuards(AuthGuard('discord'))
  async discordLogin() {
    return { message: 'Redirecting to Discord for authentication' };
  }

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(@Req() request: any) {
    return this.authService.handleDiscordCallback(request.user);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() request: any) {
    return request.user || null;
  }
}
