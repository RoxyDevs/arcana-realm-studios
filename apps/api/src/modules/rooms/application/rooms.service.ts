import { randomBytes, randomUUID } from "node:crypto";
import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { RoomDto } from "@arcana/types";
import type { AppConfig } from "../../../config/configuration";
import { ROOM_ACCESS_CHECKER, type IRoomAccessChecker } from "../../../common/domain/room-access.interface";
import { ROOM_LICENSE_CHECKER, type IRoomLicenseChecker } from "../../../common/domain/room-license-checker.interface";
import { parseImvuRoomIdentifier } from "../domain/imvu-room-identifier";
import { ROOM_REPOSITORY, type IRoomRepository } from "../domain/room-repository.interface";
import {
  ROOM_OWNERSHIP_VERIFIER,
  type IRoomOwnershipVerifier,
} from "../domain/room-ownership-verifier.interface";
import type { Room } from "@arcana/database";

function toRoomDto(room: Room, streamBaseUrl: string, licenseActive: boolean): RoomDto {
  return {
    id: room.id,
    imvuRoomId: room.imvuRoomId,
    name: room.name,
    verificationStatus: room.verificationStatus,
    verifiedAt: room.verifiedAt ? room.verifiedAt.toISOString() : null,
    verificationToken: room.verificationStatus === "PENDING" ? room.verificationToken : null,
    streamUrl: room.verificationStatus === "VERIFIED" && licenseActive ? `${streamBaseUrl}/live/${room.streamKey}` : null,
  };
}

@Injectable()
export class RoomsService {
  constructor(
    @Inject(ROOM_REPOSITORY) private readonly rooms: IRoomRepository,
    @Inject(ROOM_OWNERSHIP_VERIFIER) private readonly verifier: IRoomOwnershipVerifier,
    @Inject(ROOM_ACCESS_CHECKER) private readonly roomAccess: IRoomAccessChecker,
    @Inject(ROOM_LICENSE_CHECKER) private readonly roomLicense: IRoomLicenseChecker,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private get streamBaseUrl(): string {
    return this.config.get("streaming.baseUrl", { infer: true });
  }

  async listMine(userId: string): Promise<RoomDto[]> {
    const rooms = await this.rooms.listByOwner(userId);
    return Promise.all(
      rooms.map(async (room) => toRoomDto(room, this.streamBaseUrl, await this.roomLicense.isActive(room.id))),
    );
  }

  /**
   * Step 1 of binding: parses the room URL/ID the user pastes, and issues a
   * one-time verification token for them to place in that room's IMVU
   * description. Works for any room — nothing here is tied to one example.
   */
  async bindRoom(userId: string, roomUrlOrId: string): Promise<RoomDto> {
    const imvuRoomId = parseImvuRoomIdentifier(roomUrlOrId);
    if (!imvuRoomId) {
      throw new ConflictException(
        "Couldn't find a room ID in that — paste the full room URL (containing \"room-<numbers>-<numbers>\") or just the \"<numbers>-<numbers>\" slug.",
      );
    }

    const existing = await this.rooms.findByImvuRoomId(imvuRoomId);
    if (existing?.verificationStatus === "VERIFIED") {
      if (existing.ownerId === userId) {
        throw new ConflictException("This room is already verified on your account.");
      }
      throw new ConflictException("This room is already bound and verified on another Arcana account.");
    }

    const verificationToken = `arcana-verify-${randomUUID()}`;
    const streamKey = randomBytes(24).toString("hex");
    const name = existing?.name ?? `IMVU Room ${imvuRoomId}`;

    const room = await this.rooms.upsertPendingBinding({
      ownerId: userId,
      imvuRoomId,
      name,
      verificationToken,
      streamKey,
    });

    return toRoomDto(room, this.streamBaseUrl, false);
  }

  /** Step 2: checks that the token from step 1 actually made it into the room's description. */
  async verifyRoom(userId: string, roomId: string): Promise<RoomDto> {
    const room = await this.rooms.findById(roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }
    if (room.ownerId !== userId) {
      throw new UnauthorizedException("You don't own this pending binding");
    }
    if (room.verificationStatus === "VERIFIED") {
      return toRoomDto(room, this.streamBaseUrl, await this.roomLicense.isActive(room.id));
    }

    const confirmed = await this.verifier.descriptionContainsToken(room.imvuRoomId, room.verificationToken);
    if (!confirmed) {
      throw new ConflictException(
        "Token not found in that room's description yet — paste it in and save the room, then try again.",
      );
    }

    const verified = await this.rooms.markVerified(room.id);
    return toRoomDto(verified, this.streamBaseUrl, await this.roomLicense.isActive(verified.id));
  }

  async getStreamUrl(userId: string, roomId: string): Promise<RoomDto> {
    await this.roomAccess.assertOwner(roomId, userId);
    const room = await this.rooms.findById(roomId);
    if (!room) {
      throw new NotFoundException("Room not found");
    }
    return toRoomDto(room, this.streamBaseUrl, await this.roomLicense.isActive(room.id));
  }
}
