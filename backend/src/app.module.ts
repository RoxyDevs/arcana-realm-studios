import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { BotModule } from './bot/bot.module';
import { ImvuModule } from './imvu/imvu.module';
import { LicensesModule } from './licenses/licenses.module';
import { MusicModule } from './music/music.module';
import { PaymentsModule } from './payments/payments.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LicensesModule,
    RoomsModule,
    PlaylistsModule,
    PaymentsModule,
    ImvuModule,
    BotModule,
    MusicModule,
    AdminModule,
  ],
})
export class AppModule {}
