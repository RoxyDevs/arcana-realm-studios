import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { AppConfig } from "../../config/configuration";
import type { IObjectStorage, UploadedObject } from "../domain/object-storage.interface";

/**
 * Cloudflare R2 — S3-compatible object storage for user-uploaded audio.
 * Officially documented (R2 publishes an S3-compatible API), accessed here
 * only through the AWS SDK's standard S3 client pointed at R2's endpoint.
 */
@Injectable()
export class R2ObjectStorage implements IObjectStorage {
  private client: S3Client | null = null;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  private getClient(): S3Client {
    if (this.client) return this.client;

    const { accountId, accessKeyId, secretAccessKey } = this.config.get("objectStorage", { infer: true });
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException(
        "Object storage isn't configured yet — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_BASE_URL.",
      );
    }

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    return this.client;
  }

  async upload(params: { key: string; body: Buffer; contentType: string }): Promise<UploadedObject> {
    const { bucket, publicBaseUrl } = this.config.get("objectStorage", { infer: true });
    if (!bucket || !publicBaseUrl) {
      throw new ServiceUnavailableException(
        "Object storage isn't fully configured — R2_BUCKET and R2_PUBLIC_BASE_URL are required.",
      );
    }

    await this.getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );

    return { key: params.key, publicUrl: `${publicBaseUrl.replace(/\/$/, "")}/${params.key}` };
  }

  async delete(key: string): Promise<void> {
    const { bucket } = this.config.get("objectStorage", { infer: true });
    if (!bucket) return;
    await this.getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}
