export interface AppConfig {
  port: number;
  webUrl: string;
  nodeEnv: string;
  redisUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  discord: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  /** Discord IDs that get the OWNER role the moment their account is first created — solves the bootstrap problem of nobody having admin rights yet. */
  bootstrapOwnerDiscordIds: string[];
  imvu: {
    /**
     * Not an officially documented IMVU endpoint, but confirmed working and
     * public (no auth) — see ImvuRoomApiVerifier. Override only if IMVU
     * changes this shape; `{roomId}` is substituted with the parsed
     * `<clientId>-<roomId>` room slug.
     */
    roomPageUrlTemplate: string | null;
  };
  streaming: {
    /** Base URL of the Icecast/HLS server rooms broadcast from once verified + licensed. */
    baseUrl: string;
    /**
     * Shared secret the Icecast/Liquidsoap service authenticates with when
     * polling `/internal/streaming/*` — this isn't a logged-in user, so JWT
     * cookies don't apply. Empty = the internal API stays locked (fails
     * loudly, per the object-storage/IMVU-verifier pattern elsewhere).
     */
    internalToken: string;
    /**
     * Port Liquidsoap's shared input.harbor listener runs on (one listener,
     * one mountpoint per live-broadcasting room, same as Icecast itself) —
     * see apps/streaming/generate-liquidsoap.sh. Must match that service's
     * LIQUIDSOAP_HARBOR_PORT.
     */
    harborPort: number;
    /**
     * Port the streaming service's browser-mic bridge listens on (see
     * apps/streaming/mic-bridge) — a WebSocket relay that transcodes a
     * browser's MediaRecorder audio into an Icecast source push against the
     * harbor above, since a browser can't speak the Icecast source protocol
     * directly. Must match that service's MIC_BRIDGE_PORT.
     */
    micBridgePort: number;
  };
  objectStorage: {
    /** Cloudflare R2 — S3-compatible. Empty until configured; upload endpoints fail loudly rather than silently no-op. */
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    /** Public base URL the bucket is served from (R2 public bucket URL or a custom domain). */
    publicBaseUrl: string;
  };
  imvuBot: {
    /**
     * 32-byte key (base64), used to AES-256-GCM encrypt each room's
     * imvu.js.org bot token at rest — see SecretBox and
     * PrismaImvuBotCredentialRepository. Empty until configured; credential
     * writes fail loudly rather than ever storing a token in plaintext.
     */
    credentialEncryptionKey: string;
  };
}

export default (): AppConfig => ({
  // Most hosts (Railway included) inject their own PORT and expect the app to bind to it.
  port: parseInt(process.env.PORT ?? process.env.API_PORT ?? "4000", 10),
  webUrl: process.env.WEB_URL ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV ?? "development",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "",
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "30d",
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID ?? "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    callbackUrl: process.env.DISCORD_CALLBACK_URL ?? "",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  },
  bootstrapOwnerDiscordIds: (process.env.BOOTSTRAP_OWNER_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  imvu: {
    roomPageUrlTemplate: process.env.IMVU_ROOM_PAGE_URL_TEMPLATE || null,
  },
  streaming: {
    baseUrl: process.env.STREAMING_BASE_URL ?? "https://stream.arcanarealmstudios.com",
    internalToken: process.env.STREAMING_INTERNAL_TOKEN ?? "",
    harborPort: parseInt(process.env.STREAMING_HARBOR_PORT ?? "8006", 10),
    micBridgePort: parseInt(process.env.STREAMING_MIC_BRIDGE_PORT ?? "8007", 10),
  },
  objectStorage: {
    accountId: process.env.R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.R2_BUCKET ?? "",
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? "",
  },
  imvuBot: {
    credentialEncryptionKey: process.env.IMVU_BOT_CREDENTIAL_ENCRYPTION_KEY ?? "",
  },
});
