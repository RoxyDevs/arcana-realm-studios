export const IMVU_BOT_CREDENTIAL_REPOSITORY = Symbol("IMVU_BOT_CREDENTIAL_REPOSITORY");

/**
 * Stores/reads the room owner's imvu.js.org bot token. Encrypted at rest —
 * see AesSecretBox and the ImvuBotCredential model's doc comment for why
 * this is not treated the same as Room.streamKey.
 */
export interface IImvuBotCredentialRepository {
  set(roomId: string, plaintextToken: string, seat?: string | null): Promise<void>;
  getPlaintext(roomId: string): Promise<string | null>;
  /** Where the bot should stand/sit — see the ImvuBotCredential.seat schema comment for what this can and can't control. */
  getSeat(roomId: string): Promise<string | null>;
  exists(roomId: string): Promise<boolean>;
  delete(roomId: string): Promise<void>;
}
