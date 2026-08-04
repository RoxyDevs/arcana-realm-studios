import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared enums (mirror packages/database/prisma/schema.prisma — kept as plain
// string unions here so @arcana/types has no runtime dependency on Prisma).
// ---------------------------------------------------------------------------

export const RoleSchema = z.enum(["OWNER", "ADMIN", "MODERATOR", "MEMBER"]);
export type Role = z.infer<typeof RoleSchema>;

export const SubscriptionTierSchema = z.enum(["FREE", "PLUS", "PREMIUM"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const TrackSourceSchema = z.enum(["SPOTIFY", "YOUTUBE", "UPLOAD", "JAMENDO"]);
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

/** Minimal user shape returned by the admin username search — for granting credits/subscriptions. */
export interface UserSummaryDto {
  id: string;
  username: string;
  discordId: string;
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

export interface SubscriptionStatusDto {
  tier: SubscriptionTier;
  status: string;
  currentPeriodEnd: string | null;
  /** Set only while this subscription is still inside its 3-day trial window. */
  trialEndsAt: string | null;
}

export const GrantSubscriptionSchema = z.object({
  targetUserId: z.string().min(1),
  tier: SubscriptionTierSchema,
  expiresAt: z.string().datetime().nullable(),
});
export type GrantSubscriptionDto = z.infer<typeof GrantSubscriptionSchema>;

export const AdjustWalletSchema = z.object({
  targetUserId: z.string().min(1),
  amount: z.number().int().refine((v) => v !== 0, "amount must not be zero"),
  reason: z.string().min(3).max(500),
});
export type AdjustWalletDto = z.infer<typeof AdjustWalletSchema>;

/**
 * Paid subscription tiers — a recurring perk bundle on top of the credit
 * wallet, not a replacement for it. Bot time itself stays pay-as-you-go
 * with credits at every tier (including FREE); PLUS/PREMIUM just make that
 * credit spend go further. priceUsd is informational display copy — the
 * actual charge amount lives in the Stripe Price object each tier's
 * STRIPE_PRICE_*_MONTHLY env var points to, so this number and Stripe's
 * price must be kept in sync by hand.
 */
export interface SubscriptionPlanDefinition {
  label: string;
  priceUsd: number;
  /** Percent off every credit-funded bot-license purchase (single or bulk), applied on top of BULK_LICENSE_DISCOUNT. */
  creditDiscountPercent: number;
  perks: string[];
}

/** Every paid tier starts with this trial length — a card is still required at checkout (see BillingService), it only delays the first charge. */
export const SUBSCRIPTION_TRIAL_DAYS = 3;

export const SUBSCRIPTION_PLANS: Record<"PLUS" | "PREMIUM", SubscriptionPlanDefinition> = {
  PLUS: {
    label: "Plus",
    priceUsd: 6.99,
    creditDiscountPercent: 10,
    perks: ["10% off all bot-time purchases", "Priority support"],
  },
  PREMIUM: {
    label: "Premium",
    priceUsd: 14.99,
    creditDiscountPercent: 20,
    perks: ["20% off all bot-time purchases", "Priority support", "Early access to new modules"],
  },
};

// ---------------------------------------------------------------------------
// Bot Licenses — time-boxed bot access per room ("1 day" ... "1 year" plans).
// Prices are credits, defined once here so the pricing table on the web app
// and the API's purchase logic never drift apart.
// ---------------------------------------------------------------------------

export const BotLicensePlanSchema = z.enum(["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3", "YEAR_1"]);
export type BotLicensePlan = z.infer<typeof BotLicensePlanSchema>;

export interface BotLicensePlanDefinition {
  days: number;
  credits: number;
  label: string;
}

export const BOT_LICENSE_PLANS: Record<BotLicensePlan, BotLicensePlanDefinition> = {
  DAY_1: { days: 1, credits: 50, label: "1 día" },
  WEEK_1: { days: 7, credits: 250, label: "1 semana" },
  MONTH_1: { days: 30, credits: 800, label: "1 mes" },
  MONTH_3: { days: 90, credits: 2000, label: "3 meses" },
  YEAR_1: { days: 365, credits: 6000, label: "1 año" },
};

export const PurchaseLicenseSchema = z.object({
  plan: BotLicensePlanSchema,
});
export type PurchaseLicenseDto = z.infer<typeof PurchaseLicenseSchema>;

export interface BotLicenseStatusDto {
  active: boolean;
  plan: BotLicensePlan | null;
  expiresAt: string | null;
}

/** Buying bot time for this many rooms (or more) in one purchase gets a flat discount off the total. */
export const BULK_LICENSE_DISCOUNT = { minRooms: 10, percentOff: 10 } as const;

export const BulkPurchaseLicenseSchema = z.object({
  roomIds: z.array(z.string().min(1)).min(1),
  plan: BotLicensePlanSchema,
});
export type BulkPurchaseLicenseDto = z.infer<typeof BulkPurchaseLicenseSchema>;

export interface BulkLicensePurchaseResultDto {
  totalCharged: number;
  discountApplied: boolean;
  rooms: BotLicenseStatusDto[];
}

// ---------------------------------------------------------------------------
// Rooms — binding a user's IMVU room to Arcana (ownership verified via a
// token placed in the room's description, mirroring Vusic's flow).
// ---------------------------------------------------------------------------

export const RoomVerificationStatusSchema = z.enum(["PENDING", "VERIFIED"]);
export type RoomVerificationStatus = z.infer<typeof RoomVerificationStatusSchema>;

export interface RoomDto {
  id: string;
  imvuRoomId: string;
  name: string;
  verificationStatus: RoomVerificationStatus;
  verifiedAt: string | null;
  /** Only present while PENDING — paste this into the room's IMVU description. */
  verificationToken: string | null;
  /** Only present once VERIFIED and the room has an active bot license. */
  streamUrl: string | null;
}

export const BindRoomSchema = z.object({
  roomUrlOrId: z.string().min(1),
});
export type BindRoomDto = z.infer<typeof BindRoomSchema>;

// ---------------------------------------------------------------------------
// Room roster — self-service role tags for roleplay communities (families,
// clans, fantasy kingdoms). Free text on purpose: "Femenino"/"Masculino" are
// just the two examples that came up, not an enum Arcana should gatekeep.
// ---------------------------------------------------------------------------

export const SetRoomRoleSchema = z.object({
  roleTag: z.string().trim().max(40).nullable(),
});
export type SetRoomRoleDto = z.infer<typeof SetRoomRoleSchema>;

export interface RoomMemberDto {
  userId: string;
  username: string;
  avatarUrl: string | null;
  roleTag: string | null;
  joinedAt: string;
}

// ---------------------------------------------------------------------------
// Arcana Music
// ---------------------------------------------------------------------------

/**
 * Mirrors what apps/api's TracksController + MusicService accept for
 * uploads — defined once here so the web dashboard can validate client-side
 * before spending a round trip, without drifting from what the API actually
 * enforces.
 */
export const TRACK_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

export const ALLOWED_AUDIO_UPLOAD_MIME_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/aac": "aac",
  "audio/mp4": "m4a",
};

export interface TrackDto {
  id: string;
  source: TrackSource;
  externalId: string;
  title: string;
  artist: string | null;
  durationSec: number;
  thumbnailUrl: string | null;
  genreTags: string[];
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

export const MoveQueueItemSchema = z.object({
  direction: z.enum(["up", "down"]),
});
export type MoveQueueItemDto = z.infer<typeof MoveQueueItemSchema>;

/** What AutoDJ most recently pulled off the queue for a room — the closest thing to "now playing" without polling Icecast directly. */
export interface NowPlayingDto {
  track: TrackDto;
  startedAt: string;
}

// ---------------------------------------------------------------------------
// Live DJ / mic broadcasting — a room owner's own live audio (mic, DJ set,
// podcast) preempts AutoDJ on the room's Icecast mount while connected.
// ---------------------------------------------------------------------------

/** Returned once, right when a session starts — the ingest relay/browser needs these to connect; never re-exposed afterward. */
export interface LiveIngestCredentialsDto {
  harborHost: string;
  harborPort: number;
  mount: string;
  username: string;
  sourcePassword: string;
}

export interface LiveStatusDto {
  active: boolean;
  startedAt: string | null;
}

// ---------------------------------------------------------------------------
// Arcana Guardian — consent-scoped moderation. Reports are about incidents
// that happened inside a room the reporter owns, never third-party
// surveillance; reputation is aggregated only from CONFIRMED reports in
// rooms that opted into the shared network (see GuardianSettings.sharedBlacklistOptIn).
// ---------------------------------------------------------------------------

export const GuardianReportStatusSchema = z.enum(["PENDING", "CONFIRMED", "DISMISSED"]);
export type GuardianReportStatus = z.infer<typeof GuardianReportStatusSchema>;

export interface GuardianSettingsDto {
  roomId: string;
  antiSpamEnabled: boolean;
  antiRaidEnabled: boolean;
  autoModEnabled: boolean;
  /** Opts this room's confirmed reports into the cross-room ReputationScore aggregate. */
  sharedBlacklistOptIn: boolean;
}

export const UpdateGuardianSettingsSchema = z
  .object({
    antiSpamEnabled: z.boolean(),
    antiRaidEnabled: z.boolean(),
    autoModEnabled: z.boolean(),
    sharedBlacklistOptIn: z.boolean(),
  })
  .partial();
export type UpdateGuardianSettingsDto = z.infer<typeof UpdateGuardianSettingsSchema>;

export interface GuardianReportDto {
  id: string;
  roomId: string;
  subjectIdentifier: string;
  category: GuardianReportCategory;
  description: string;
  evidenceUrl: string | null;
  status: GuardianReportStatus;
  reviewedByUsername: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export const CreateGuardianReportSchema = z.object({
  subjectIdentifier: z.string().min(1).max(200),
  category: GuardianReportCategorySchema,
  description: z.string().min(10).max(2000),
  evidenceUrl: z.string().url().optional(),
});
export type CreateGuardianReportDto = z.infer<typeof CreateGuardianReportSchema>;

export const ReviewGuardianReportSchema = z.object({
  status: z.enum(["CONFIRMED", "DISMISSED"]),
});
export type ReviewGuardianReportDto = z.infer<typeof ReviewGuardianReportSchema>;

export interface ReputationScoreDto {
  subjectIdentifier: string;
  score: number;
  confirmedReports: number;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
