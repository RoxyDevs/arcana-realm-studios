export const TRIAL_CLAIM_REPOSITORY = Symbol("TRIAL_CLAIM_REPOSITORY");

/**
 * Tracks who has already claimed the 3-day subscription trial, by both
 * userId and the IP address the checkout was created from — a card is
 * required by Stripe for every trial regardless, this is the extra layer
 * that stops the same person from farming multiple trials across throwaway
 * Discord accounts on one connection.
 */
export interface ITrialClaimRepository {
  hasClaimed(params: { userId: string; ipAddress: string }): Promise<boolean>;
  record(params: { userId: string; ipAddress: string; tier: "PLUS" | "PREMIUM" }): Promise<void>;
}
