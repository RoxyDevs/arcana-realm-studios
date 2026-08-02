import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared enums (mirror packages/database/prisma/schema.prisma — kept as plain
// string unions here so @arcana/types has no runtime dependency on Prisma).
// ---------------------------------------------------------------------------

export const RoleSchema = z.enum(["OWNER", "ADMIN", "MODERATOR", "MEMBER"]);
export type Role = z.infer<typeof RoleSchema>;

export const SubscriptionTierSchema = z.enum(["FREE", "PLUS", "PREMIUM"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const TrackSourceSchema = z.enum(["SPOTIFY", "YOUTUBE", "UPLOAD"]);
export type TrackSource = z.infer<typeof TrackSourceSchema>;

export const GuardianReportCategorySchema = z.enum([
  "HARASSMENT",
  "SPAM",
  "RAID",
  "HATE_SPEECH",
  "BAN_EVASION",
  "OTHER",
]);
export type GuardianReportCategory = z.infer<typeof GuardianReportCategorySchema>;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthenticatedUserDto {
  id: string;
  discordId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  roles: Role[];
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export interface WalletBalanceDto {
  creditBalance: number;
  updatedAt: string;
}

export const CreateCheckoutSessionSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});
export type CreateCheckoutSessionDto = z.infer<typeof CreateCheckoutSessionSchema>;

// ---------------------------------------------------------------------------
// Arcana Music
// ---------------------------------------------------------------------------

export interface TrackDto {
  id: string;
  source: TrackSource;
  externalId: string;
  title: string;
  artist: string | null;
  durationSec: number;
  thumbnailUrl: string | null;
}

export interface QueueItemDto {
  id: string;
  track: TrackDto;
  requestedByUsername: string;
  position: number;
}

export const EnqueueTrackSchema = z.object({
  source: TrackSourceSchema,
  externalId: z.string().min(1),
});
export type EnqueueTrackDto = z.infer<typeof EnqueueTrackSchema>;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
