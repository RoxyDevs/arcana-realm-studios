import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BotService } from './bot.service';
import { InstallBotDto } from './dto/install-bot.dto';
import { ProcessCommandDto } from './dto/process-command.dto';

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('install')
  @UseGuards(AuthGuard('jwt'))
  installBot(@Body() body: InstallBotDto, @Req() request: any) {
    return this.botService.createInstallation(request.user.id, body.roomId);
  }

  @Post('command')
  processCommand(@Body() body: ProcessCommandDto) {
    return this.botService.processCommand(body.command, body.userId, body.roomId);
  }
}
