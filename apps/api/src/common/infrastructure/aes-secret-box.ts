import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../config/configuration";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * Small AES-256-GCM helper for at-rest secrets Arcana holds on a user's
 * behalf that aren't its own (e.g. a room's imvu.js.org bot token) — see
 * Room.imvuBotCredential. Not a general KMS: one static key from config,
 * loaded once. Fails loudly if the key is missing/malformed rather than
 * ever falling back to storing a secret in plaintext.
 */
@Injectable()
export class AesSecretBox {
  private key: Buffer | null = null;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  private getKey(): Buffer {
    if (this.key) return this.key;

    const raw = this.config.get("imvuBot", { infer: true }).credentialEncryptionKey;
    if (!raw) {
      throw new ServiceUnavailableException(
        "IMVU_BOT_CREDENTIAL_ENCRYPTION_KEY isn't configured — refusing to store or read a bot credential without it.",
      );
    }
    const key = Buffer.from(raw, "base64");
    if (key.length !== KEY_LENGTH_BYTES) {
      throw new ServiceUnavailableException(
        `IMVU_BOT_CREDENTIAL_ENCRYPTION_KEY must decode (base64) to exactly ${KEY_LENGTH_BYTES} bytes, got ${key.length}`,
      );
    }
    this.key = key;
    return key;
  }

  encrypt(plaintext: string): EncryptedSecret {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return {
      ciphertext: ciphertext.toString("base64"),
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
    };
  }

  decrypt(secret: EncryptedSecret): string {
    const decipher = createDecipheriv(ALGORITHM, this.getKey(), Buffer.from(secret.iv, "base64"));
    decipher.setAuthTag(Buffer.from(secret.authTag, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(secret.ciphertext, "base64")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  }
}
