import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ImvuController } from './imvu.controller';
import { ImvuService } from './imvu.service';

@Module({
  imports: [PrismaModule],
  controllers: [ImvuController],
  providers: [ImvuService],
  exports: [ImvuService],
})
export class ImvuModule {}
