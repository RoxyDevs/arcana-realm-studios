import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getCurrentUser(@Req() request: any) {
    return request.user || { message: 'Unauthenticated request' };
  }
}
