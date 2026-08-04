"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BULK_LICENSE_DISCOUNT,
  SUBSCRIPTION_PLANS,
  type AuthenticatedUserDto,
  type SubscriptionStatusDto,
} from "@arcana/types";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useState } from "react";

type Tier = "FREE" | "PLUS" | "PREMIUM";

const FREE_PERKS = [
  "Bind unlimited IMVU rooms",
  "AutoDJ radio streaming (no bot avatar needed)",
  "Search the shared upload library across every room",
  "Guardian: incident reports + moderation settings for your own rooms",
  "Live mic/DJ broadcast from any Icecast-compatible app",
  "Pay-as-you-go bot time with credits",
];

const COMPARISON_ROWS: { label: string; free: boolean; plus: boolean; premium: boolean; typical: boolean }[] = [
  { label: "AutoDJ radio streaming", free: true, plus: true, premium: true, typical: true },
  { label: "No bot avatar required for audio", free: true, plus: true, premium: true, typical: false },
  { label: "Cross-room shared music library", free: true, plus: true, premium: true, typical: false },
  { label: "Live mic/DJ broadcast (OBS, Mixxx, BUTT, ffmpeg)", free: true, plus: true, premium: true, typical: false },
  { label: "Room moderation & incident reports", free: true, plus: true, premium: true, typical: false },
  { label: "Discount on bot-time purchases", free: false, plus: true, premium: true, typical: false },
  { label: "Priority support", free: false, plus: true, premium: true, typical: false },
  { label: "Early access to new modules", free: false, plus: false, premium: true, typical: false },
];

function Check({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? "text-arcana-cyan" : "text-arcana-textMuted"} aria-label={ok ? "Included" : "Not included"}>
      {ok ? "✓" : "—"}
    </span>
  );
}

export default function PricingPage() {
  const [error, setError] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<AuthenticatedUserDto>("/auth/me"),
    retry: false,
  });

  const { data: subscription } = useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: () => apiFetch<SubscriptionStatusDto>("/billing/subscription"),
    enabled: !!user,
    retry: false,
  });

  const subscribe = useMutation({
    mutationFn: (tier: "PLUS" | "PREMIUM") =>
      apiFetch<{ url: string }>("/billing/checkout/subscription", {
        method: "POST",
        body: JSON.stringify({
          tier,
          successUrl: `${window.location.origin}/dashboard`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      }),
    onSuccess: (session) => {
      setError(null);
      window.location.href = session.url;
    },
    onError: (err) =>
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't start checkout — try again in a moment.",
      ),
  });

  const currentTier: Tier = (subscription?.tier as Tier | undefined) ?? "FREE";

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-shadow-neon-cyan font-display text-[clamp(2rem,6vw,3rem)] font-bold text-arcana-text">
          Simple pricing, no surprises
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-arcana-textMuted">
          Bot time is always pay-as-you-go with credits, at every tier — Plus and Premium just
          make those credits go further, plus a couple of perks.
        </p>
      </div>

      {error && <p className="mt-6 text-center text-base text-red-400">{error}</p>}

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* FREE */}
        <div className="rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-arcana-text">Free</h2>
          <p className="mt-1 text-3xl font-bold text-arcana-text">$0</p>
          <ul className="mt-4 space-y-2 text-base text-arcana-textMuted">
            {FREE_PERKS.map((perk) => (
              <li key={perk}>· {perk}</li>
            ))}
          </ul>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="mt-6 block rounded-md border border-arcana-border px-5 py-3 text-center text-base font-medium text-arcana-text transition-all hover:border-arcana-cyan/60"
          >
            {currentTier === "FREE" && user ? "Current plan" : "Get started"}
          </Link>
        </div>

        {/* PLUS / PREMIUM */}
        {(["PLUS", "PREMIUM"] as const).map((tier) => {
          const plan = SUBSCRIPTION_PLANS[tier];
          const isCurrent = currentTier === tier;
          return (
            <div
              key={tier}
              className={
                "rounded-xl border p-6 backdrop-blur-sm " +
                (tier === "PREMIUM"
                  ? "border-arcana-pink/60 bg-arcana-surface/80 shadow-neon-pink-sm"
                  : "border-arcana-cyan/60 bg-arcana-surface/80 shadow-neon-cyan-sm")
              }
            >
              <h2
                className={
                  "font-display text-lg font-bold uppercase tracking-wide " +
                  (tier === "PREMIUM" ? "text-arcana-pink" : "text-arcana-cyan")
                }
              >
                {plan.label}
              </h2>
              <p className="mt-1 text-3xl font-bold text-arcana-text">
                ${plan.priceUsd.toFixed(2)}
                <span className="text-base font-normal text-arcana-textMuted">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-base text-arcana-textMuted">
                <li>· Everything in Free</li>
                {plan.perks.map((perk) => (
                  <li key={perk}>· {perk}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isCurrent || subscribe.isPending}
                onClick={() => (user ? subscribe.mutate(tier) : (window.location.href = "/login"))}
                className={
                  "mt-6 w-full rounded-md border px-5 py-3 text-base font-medium text-arcana-text transition-all disabled:cursor-not-allowed disabled:opacity-50 " +
                  (tier === "PREMIUM"
                    ? "border-arcana-pink/60 hover:shadow-neon-pink-sm"
                    : "border-arcana-cyan/60 hover:shadow-neon-cyan-sm")
                }
              >
                {isCurrent
                  ? "Current plan"
                  : subscribe.isPending
                    ? "Redirecting…"
                    : user
                      ? `Upgrade to ${plan.label}`
                      : "Sign in to subscribe"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-sm text-arcana-textMuted">
        Buying bot time for {BULK_LICENSE_DISCOUNT.minRooms}+ rooms at once already gets{" "}
        {BULK_LICENSE_DISCOUNT.percentOff}% off, on any plan — Plus/Premium discounts stack on
        top of that.
      </p>

      <h2 className="mt-16 text-center font-display text-2xl font-bold text-arcana-text">
        How this compares
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-base text-arcana-textMuted">
        &ldquo;Typical music bots&rdquo; below reflects what's publicly advertised by other IMVU
        music bots — moderation and no-avatar-required streaming aren't things we found any of
        them offering.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-arcana-border">
        <table className="w-full min-w-[640px] border-collapse text-left text-base">
          <thead>
            <tr className="border-b border-arcana-border bg-arcana-surface/80">
              <th className="p-3 font-semibold text-arcana-text">Feature</th>
              <th className="p-3 text-center font-semibold text-arcana-text">Free</th>
              <th className="p-3 text-center font-semibold text-arcana-cyan">Plus</th>
              <th className="p-3 text-center font-semibold text-arcana-pink">Premium</th>
              <th className="p-3 text-center font-semibold text-arcana-textMuted">
                Typical music bots
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-arcana-border last:border-0">
                <td className="p-3 text-arcana-text">{row.label}</td>
                <td className="p-3 text-center">
                  <Check ok={row.free} />
                </td>
                <td className="p-3 text-center">
                  <Check ok={row.plus} />
                </td>
                <td className="p-3 text-center">
                  <Check ok={row.premium} />
                </td>
                <td className="p-3 text-center">
                  <Check ok={row.typical} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
