/**
 * Contact info for manual (non-Stripe) top-ups — PayPal or in-game VCoin gifts
 * that an OWNER/ADMIN confirms by hand via POST /billing/wallet/adjust.
 * Purely informational; nothing here is called by the API.
 */
export const MANUAL_PAYMENT_INFO = {
  paypalUrl: "https://paypal.me/roxdevit",
  imvuUsername: "@BelaRogvaldson",
} as const;
