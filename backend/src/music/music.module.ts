import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';

@Module({
  imports: [PrismaModule],
  controllers: [MusicController],
  providers: [MusicService],
  exports: [MusicService],
})
export class MusicModule {}
