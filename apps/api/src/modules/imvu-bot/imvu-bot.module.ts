import { Module } from "@nestjs/common";
import { MusicModule } from "../music/music.module";
import { RoomsModule } from "../rooms/rooms.module";
import { GuardianModule } from "../guardian/guardian.module";
import { BotSessionService } from "./application/bot-session.service";
import { ChatCommandRouter } from "./application/chat-command.router";
import { RoomBanService } from "./application/room-ban.service";
import { ImvuBotController } from "./presentation/imvu-bot.controller";
import { RoomBanController } from "./presentation/room-ban.controller";
import { IMVU_BOT_CREDENTIAL_REPOSITORY } from "./domain/imvu-bot-credential-repository.interface";
import { PrismaImvuBotCredentialRepository } from "./infrastructure/prisma-imvu-bot-credential.repository";
import { IMVU_ROOM_CHAT_ADAPTER } from "./domain/imvu-room-chat-adapter.interface";
import { ImvuJsRoomChatAdapter } from "./infrastructure/imvu-js-room-chat.adapter";
import { ROOM_BAN_REPOSITORY } from "./domain/room-ban-repository.interface";
import { PrismaRoomBanRepository } from "./infrastructure/prisma-room-ban.repository";

@Module({
  imports: [MusicModule, RoomsModule, GuardianModule],
  controllers: [ImvuBotController, RoomBanController],
  providers: [
    BotSessionService,
    ChatCommandRouter,
    RoomBanService,
    { provide: IMVU_BOT_CREDENTIAL_REPOSITORY, useClass: PrismaImvuBotCredentialRepository },
    // Single adapter instance for the module's lifetime — it holds the live
    // per-room connections, so it can't be request-scoped.
    { provide: IMVU_ROOM_CHAT_ADAPTER, useClass: ImvuJsRoomChatAdapter },
    { provide: ROOM_BAN_REPOSITORY, useClass: PrismaRoomBanRepository },
  ],
})
export class ImvuBotModule {}
