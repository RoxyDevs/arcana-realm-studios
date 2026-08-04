import { MANUAL_PAYMENT_INFO } from "@/lib/site-config";

export function ManualPaymentInfo() {
  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-arcana-pink">Need credits without a card?</h2>
      <p className="mt-1.5 text-base text-arcana-text">
        Pay with PayPal or IMVU VCoins, then message us with the amount and your username — credits
        are added to your wallet by hand once the payment is verified.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={MANUAL_PAYMENT_INFO.paypalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[48px] flex-1 rounded-md border border-arcana-cyan/60 px-5 py-3 text-center text-base font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm"
        >
          Pay with PayPal
        </a>
        <a
          href={MANUAL_PAYMENT_INFO.vcoinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[48px] flex-1 rounded-md border border-arcana-pink/60 px-5 py-3 text-center text-base font-medium text-arcana-text transition-all hover:shadow-neon-pink-sm"
        >
          Pay with VCoins
        </a>
      </div>

      <p className="mt-3 text-sm text-arcana-textMuted">
        PayPal: <span className="text-arcana-text">{MANUAL_PAYMENT_INFO.paypalUrl}</span> · IMVU:{" "}
        <span className="text-arcana-text">{MANUAL_PAYMENT_INFO.imvuUsername}</span>
      </p>
    </section>
  );
}
