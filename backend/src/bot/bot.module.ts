import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MusicModule } from '../music/music.module';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';

@Module({
  imports: [PrismaModule, MusicModule],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}
