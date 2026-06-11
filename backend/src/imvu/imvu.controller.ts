import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ImvuService } from './imvu.service';
import { LinkImvuDto } from './dto/link-imvu.dto';

@Controller('imvu')
@UseGuards(AuthGuard('jwt'))
export class ImvuController {
  constructor(private readonly imvuService: ImvuService) {}

  @Get('me')
  getLinkedAccount(@Req() request: any) {
    return this.imvuService.getLinkedAccount(request.user.id);
  }

  @Post('link')
  linkAccount(@Req() request: any, @Body() body: LinkImvuDto) {
    return this.imvuService.linkImvuAccount(request.user.id, body.username, body.roomId, body.roomUrl);
  }
}
