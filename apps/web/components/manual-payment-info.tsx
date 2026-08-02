import { MANUAL_PAYMENT_INFO } from "@/lib/site-config";

export function ManualPaymentInfo() {
  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="text-sm font-medium uppercase tracking-wide text-arcana-pink">Need credits without a card?</h2>
      <p className="mt-1 text-sm text-arcana-text">
        Send payment via PayPal or IMVU VCoins, then message us to confirm — credits are added
        to your wallet by hand once the payment is verified.
      </p>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-arcana-textMuted">PayPal:</dt>
          <dd>
            <a
              href={MANUAL_PAYMENT_INFO.paypalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-arcana-cyan hover:underline hover:text-shadow-neon-cyan"
            >
              {MANUAL_PAYMENT_INFO.paypalUrl}
            </a>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-arcana-textMuted">IMVU (VCoins):</dt>
          <dd className="text-arcana-text">{MANUAL_PAYMENT_INFO.imvuUsername}</dd>
        </div>
      </dl>
    </section>
  );
}
