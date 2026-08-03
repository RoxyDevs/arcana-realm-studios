import type { Room } from "@arcana/database";

export const ROOM_REPOSITORY = Symbol("ROOM_REPOSITORY");

export interface IRoomRepository {
  findById(id: string): Promise<Room | null>;
  findByImvuRoomId(imvuRoomId: string): Promise<Room | null>;
  listByOwner(ownerId: string): Promise<Room[]>;

  /**
   * Creates a new PENDING binding, or — if the caller already has a PENDING
   * binding for this exact IMVU room — reissues it with a fresh token
   * instead of creating a duplicate row.
   */
  upsertPendingBinding(params: {
    ownerId: string;
    imvuRoomId: string;
    name: string;
    verificationToken: string;
    streamKey: string;
  }): Promise<Room>;

  markVerified(id: string): Promise<Room>;
}
