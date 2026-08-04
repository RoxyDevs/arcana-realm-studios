import { randomBytes } from "node:crypto";
import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { LiveIngestCredentialsDto, LiveStatusDto } from "@arcana/types";
import type { AppConfig } from "../../../config/configuration";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../../../common/domain/room-access.interface";
import { ROOM_LICENSE_CHECKER, type IRoomLicenseChecker } from "../../../common/domain/room-license-checker.interface";
import { ROOM_STREAM_KEY_LOOKUP, type IRoomStreamKeyLookup } from "../../../common/domain/room-stream-key.interface";
import {
  LIVE_SESSION_REPOSITORY,
  type ILiveSessionRepository,
} from "../domain/live-session-repository.interface";

@Injectable()
export class LiveService {
  constructor(
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
    @Inject(ROOM_LICENSE_CHECKER) private readonly roomLicense: IRoomLicenseChecker,
    @Inject(ROOM_STREAM_KEY_LOOKUP) private readonly roomStreamKey: IRoomStreamKeyLookup,
    @Inject(LIVE_SESSION_REPOSITORY) private readonly sessions: ILiveSessionRepository,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /**
   * Starts a live mic/DJ session — the room's Icecast mount switches over to
   * this the moment the returned credentials actually connect to the
   * harbor mountpoint (see generate-liquidsoap.sh's fallback ordering).
   * Credentials are shown exactly once; losing them means stopping and
   * starting a fresh session.
   */
  async start(roomId: string, userId: string): Promise<LiveIngestCredentialsDto> {
    await this.roomAccess.assertOwner(roomId, userId);

    const licensed = await this.roomLicense.isActive(roomId);
    if (!licensed) {
      throw new ConflictException("This room needs an active bot license to broadcast live");
    }

    const existing = await this.sessions.findActiveByRoom(roomId);
    if (existing) {
      throw new ConflictException("This room already has a live session running — stop it first");
    }

    const streamKey = await this.roomStreamKey.findStreamKey(roomId);
    if (!streamKey) {
      throw new NotFoundException("Room not found");
    }

    const sourcePassword = randomBytes(24).toString("hex");
    await this.sessions.create({ roomId, startedById: userId, sourcePassword });

    const baseUrl = this.config.get("streaming.baseUrl", { infer: true });
    return {
      harborHost: new URL(baseUrl).hostname,
      harborPort: this.config.get("streaming.harborPort", { infer: true }),
      mount: `/live-${streamKey}`,
      username: "source",
      sourcePassword,
    };
  }

  async stop(roomId: string, userId: string): Promise<void> {
    await this.roomAccess.assertOwner(roomId, userId);

    const existing = await this.sessions.findActiveByRoom(roomId);
    if (!existing) {
      return;
    }
    await this.sessions.end(existing.id);
  }

  async getStatus(roomId: string, userId: string): Promise<LiveStatusDto> {
    await this.roomAccess.assertOwner(roomId, userId);
    const existing = await this.sessions.findActiveByRoom(roomId);
    return { active: !!existing, startedAt: existing ? existing.startedAt.toISOString() : null };
  }
}
