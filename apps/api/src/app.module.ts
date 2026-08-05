import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { PrismaModule } from "./common/infrastructure/prisma.module";
import { SharedProvidersModule } from "./common/shared-providers.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BillingModule } from "./modules/billing/billing.module";
import { MusicModule } from "./modules/music/music.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { StreamingInternalModule } from "./modules/streaming-internal/streaming-internal.module";
import { GuardianModule } from "./modules/guardian/guardian.module";
import { LiveModule } from "./modules/live/live.module";
import { ImvuBotModule } from "./modules/imvu-bot/imvu-bot.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    SharedProvidersModule,
    AuthModule,
    BillingModule,
    MusicModule,
    RoomsModule,
    StreamingInternalModule,
    GuardianModule,
    LiveModule,
    ImvuBotModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
