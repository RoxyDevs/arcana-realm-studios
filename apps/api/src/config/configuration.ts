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
     * Not a documented IMVU endpoint — see IRoomOwnershipVerifier. Left unset
     * until the real request behind Vusic's "VALIDAR SALA" check is captured
     * and confirmed. `{roomId}` is substituted with the parsed room slug.
     */
    roomPageUrlTemplate: string | null;
  };
  streaming: {
    /** Base URL of the Icecast/HLS server rooms broadcast from once verified + licensed. */
    baseUrl: string;
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
  },
});
