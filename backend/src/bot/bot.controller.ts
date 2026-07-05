// src/bot/bot.controller.ts

import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { BotService } from './bot.service';
import { InstallBotDto } from './dto/install-bot.dto';
import { ProcessCommandDto } from './dto/process-command.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface AuthenticatedUser {
  id: string;
  discordId: string;
  username: string;
  roles: string[];
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('install')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async installBot(
    @Body() body: InstallBotDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.botService.createInstallation(request.user.id, body.roomId);
  }

  @Post('command')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async processCommand(
    @Body() body: ProcessCommandDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.botService.processCommand(
      body.command,
      request.user.id,
      body.roomId,
    );
  }

  // ⚠️ Solo para pruebas - Eliminar en producción
  @Post('command/public')
  @HttpCode(200)
  async processCommandPublic(@Body() body: ProcessCommandDto) {
    return this.botService.processCommand(body.command, body.userId, body.roomId);
  }
}