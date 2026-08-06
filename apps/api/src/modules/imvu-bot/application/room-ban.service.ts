import { Inject, Injectable, Logger } from "@nestjs/common";
import type { RoomBanDto } from "@arcana/types";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../../../common/domain/room-access.interface";
import { ROOM_BAN_REPOSITORY, type IRoomBanRepository } from "../domain/room-ban-repository.interface";
import { GuardianReportService } from "../../guardian/application/guardian-report.service";

function toDto(record: { id: string; imvuDisplayName: string; reason: string | null; createdAt: Date }): RoomBanDto {
  return {
    id: record.id,
    imvuDisplayName: record.imvuDisplayName,
    reason: record.reason,
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * Bans are enforced entirely on Arcana's side — see the schema comment on
 * `RoomBan` for why (imvu.js's kick() has no persistent counterpart).
 * `ban()` also files a PENDING Guardian report for the same subject,
 * best-effort: a room without an active Guardian license (only a Music bot
 * license) can still ban people from their own room — Guardian is an
 * enhancement on top (cross-room signal), never a dependency of this.
 */
@Injectable()
export class RoomBanService {
  private readonly logger = new Logger(RoomBanService.name);

  constructor(
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
    @Inject(ROOM_BAN_REPOSITORY) private readonly bans: IRoomBanRepository,
    private readonly guardianReports: GuardianReportService,
  ) {}

  async ban(roomId: string, actingUserId: string, imvuDisplayName: string, reason: string | null): Promise<RoomBanDto> {
    await this.roomAccess.assertOwner(roomId, actingUserId);

    const record = await this.bans.upsert({ roomId, imvuDisplayName, reason, bannedById: actingUserId });

    try {
      await this.guardianReports.create(roomId, actingUserId, {
        subjectIdentifier: imvuDisplayName,
        category: "OTHER",
        description: reason?.trim() ? `Room ban: ${reason.trim()}` : "Room ban issued from room-bot chat command (!ban)",
      });
    } catch (error) {
      // Most common cause: this room has never bought a Guardian license.
      // The ban itself is still real and already persisted above — this is
      // strictly a bonus cross-room signal, not a precondition for banning
      // someone from your own room.
      this.logger.warn(`Ban recorded for room ${roomId}, but couldn't file a Guardian report: ${(error as Error).message}`);
    }

    return toDto(record);
  }

  async unban(roomId: string, actingUserId: string, imvuDisplayName: string): Promise<boolean> {
    await this.roomAccess.assertOwner(roomId, actingUserId);
    return this.bans.remove(roomId, imvuDisplayName);
  }

  /** No auth check — called from the join-event handler, not a user request. See BotSessionService. */
  isBanned(roomId: string, imvuDisplayName: string): Promise<boolean> {
    return this.bans.isBanned(roomId, imvuDisplayName);
  }

  async list(roomId: string, actingUserId: string): Promise<RoomBanDto[]> {
    await this.roomAccess.assertOwner(roomId, actingUserId);
    const records = await this.bans.listByRoom(roomId);
    return records.map(toDto);
  }
}
