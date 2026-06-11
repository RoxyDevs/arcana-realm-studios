import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LicensesController } from './licenses.controller';
import { LicensesService } from './licenses.service';

@Module({
  imports: [PrismaModule],
  controllers: [LicensesController],
  providers: [LicensesService],
  exports: [LicensesService],
})
export class LicensesModule {}
