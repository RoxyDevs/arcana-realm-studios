import { Module } from "@nestjs/common";
import { LiveController } from "./presentation/live.controller";
import { LiveService } from "./application/live.service";
import { LIVE_SESSION_REPOSITORY } from "./domain/live-session-repository.interface";
import { PrismaLiveSessionRepository } from "./infrastructure/prisma-live-session.repository";

@Module({
  controllers: [LiveController],
  providers: [LiveService, { provide: LIVE_SESSION_REPOSITORY, useClass: PrismaLiveSessionRepository }],
  exports: [LIVE_SESSION_REPOSITORY],
})
export class LiveModule {}
