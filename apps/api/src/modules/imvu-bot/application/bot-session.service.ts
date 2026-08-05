import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { ImvuBotStatusDto } from "@arcana/types";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../../../common/domain/room-access.interface";
import { ROOM_LICENSE_CHECKER, type IRoomLicenseChecker } from "../../../common/domain/room-license-checker.interface";
import { ROOM_REPOSITORY, type IRoomRepository } from "../../rooms/domain/room-repository.interface";
import {
  IMVU_BOT_CREDENTIAL_REPOSITORY,
  type IImvuBotCredentialRepository,
} from "../domain/imvu-bot-credential-repository.interface";
import {
  IMVU_ROOM_CHAT_ADAPTER,
  type IImvuRoomChatAdapter,
} from "../domain/imvu-room-chat-adapter.interface";
import { ChatCommandRouter } from "./chat-command.router";

@Injectable()
export class BotSessionService {
  private readonly logger = new Logger(BotSessionService.name);

  constructor(
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
    @Inject(ROOM_LICENSE_CHECKER) private readonly roomLicense: IRoomLicenseChecker,
    @Inject(ROOM_REPOSITORY) private readonly rooms: IRoomRepository,
    @Inject(IMVU_BOT_CREDENTIAL_REPOSITORY) private readonly credentials: IImvuBotCredentialRepository,
    @Inject(IMVU_ROOM_CHAT_ADAPTER) private readonly adapter: IImvuRoomChatAdapter,
    private readonly commandRouter: ChatCommandRouter,
  ) {}

  async setCredential(roomId: string, userId: string, token: string): Promise<void> {
    await this.roomAccess.assertOwner(roomId, userId);
    await this.credentials.set(roomId, token);
  }

  async clearCredential(roomId: string, userId: string): Promise<void> {
    await this.roomAccess.assertOwner(roomId, userId);
    if (this.adapter.isConnected(roomId)) {
      await this.adapter.disconnect(roomId);
    }
    await this.credentials.delete(roomId);
  }

  async getStatus(roomId: string, userId: string): Promise<ImvuBotStatusDto> {
    await this.roomAccess.assertOwner(roomId, userId);
    return {
      connected: this.adapter.isConnected(roomId),
      hasCredential: await this.credentials.exists(roomId),
    };
  }

  async start(roomId: string, userId: string): Promise<ImvuBotStatusDto> {
    await this.roomAccess.assertOwner(roomId, userId);

    if (!(await this.roomLicense.isActive(roomId))) {
      throw new ForbiddenException("El bot no está licenciado para esta sala — comprá una licencia primero.");
    }

    if (this.adapter.isConnected(roomId)) {
      return { connected: true, hasCredential: true };
    }

    const room = await this.rooms.findById(roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }

    const token = await this.credentials.getPlaintext(roomId);
    if (!token) {
      throw new BadRequestException(
        "No hay token de imvu.js.org configurado para esta sala todavía — configuralo antes de arrancar el bot.",
      );
    }

    await this.adapter.connect({ roomId, botCredential: token });

    this.adapter.onMessage(roomId, (message) => {
      this.commandRouter
        .handle(roomId, room.ownerId, message)
        .then((reply) => {
          if (reply) return this.adapter.sendMessage(roomId, reply);
        })
        .catch((error) => {
          this.logger.error(`Failed handling chat message in room ${roomId}: ${error instanceof Error ? error.message : error}`);
        });
    });

    this.logger.log(`Bot started for room ${roomId}`);
    return { connected: true, hasCredential: true };
  }

  async stop(roomId: string, userId: string): Promise<ImvuBotStatusDto> {
    await this.roomAccess.assertOwner(roomId, userId);
    await this.adapter.disconnect(roomId);
    return { connected: false, hasCredential: await this.credentials.exists(roomId) };
  }
}
