import { Inject, Injectable } from "@nestjs/common";
import type { PrismaClient } from "@arcana/database";
import { PRISMA_CLIENT } from "../../../common/infrastructure/prisma.module";
import { AesSecretBox } from "../../../common/infrastructure/aes-secret-box";
import type { IImvuBotCredentialRepository } from "../domain/imvu-bot-credential-repository.interface";

@Injectable()
export class PrismaImvuBotCredentialRepository implements IImvuBotCredentialRepository {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    private readonly secretBox: AesSecretBox,
  ) {}

  async set(roomId: string, plaintextToken: string, seat?: string | null): Promise<void> {
    const { ciphertext, iv, authTag } = this.secretBox.encrypt(plaintextToken);
    await this.prisma.imvuBotCredential.upsert({
      where: { roomId },
      create: { roomId, encryptedToken: ciphertext, iv, authTag, seat: seat ?? null },
      update: { encryptedToken: ciphertext, iv, authTag, seat: seat ?? null },
    });
  }

  async getPlaintext(roomId: string): Promise<string | null> {
    const record = await this.prisma.imvuBotCredential.findUnique({ where: { roomId } });
    if (!record) return null;
    return this.secretBox.decrypt({
      ciphertext: record.encryptedToken,
      iv: record.iv,
      authTag: record.authTag,
    });
  }

  async getSeat(roomId: string): Promise<string | null> {
    const record = await this.prisma.imvuBotCredential.findUnique({ where: { roomId } });
    return record?.seat ?? null;
  }

  async exists(roomId: string): Promise<boolean> {
    const count = await this.prisma.imvuBotCredential.count({ where: { roomId } });
    return count > 0;
  }

  async delete(roomId: string): Promise<void> {
    await this.prisma.imvuBotCredential.deleteMany({ where: { roomId } });
  }
}
