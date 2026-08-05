"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { AuthenticatedUserDto, WalletBalanceDto } from "@arcana/types";
import { apiFetch } from "@/lib/api-client";
import { BotLicensePanel } from "@/components/bot-license-panel";
import { ManualPaymentInfo } from "@/components/manual-payment-info";
import { RoomBindingPanel } from "@/components/room-binding-panel";
import { TrackUploadPanel } from "@/components/track-upload-panel";
import { NowPlayingPanel } from "@/components/now-playing-panel";
import { LivePanel } from "@/components/live-panel";
import { ImvuBotPanel } from "@/components/imvu-bot-panel";
import { RoomRosterPanel } from "@/components/room-roster-panel";
import { GuardianPanel } from "@/components/guardian-panel";
import { AdminGrantPanel } from "@/components/admin-grant-panel";
import { SignOutButton } from "@/components/sign-out-button";

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<AuthenticatedUserDto>("/auth/me"),
  });

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["billing", "wallet"],
    queryFn: () => apiFetch<WalletBalanceDto>("/billing/wallet"),
    enabled: !!user,
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-shadow-neon-cyan font-display text-[clamp(1.75rem,5vw,2.25rem)] font-bold text-arcana-text">
          Dashboard
        </h1>
        {user && <SignOutButton />}
      </div>

      <section className="mt-8 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-arcana-cyan">Signed in as</h2>
        <p className="mt-1.5 text-xl text-arcana-text">
          {userLoading ? "Loading…" : (user?.username ?? "Not signed in")}
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-arcana-pink">Credit balance</h2>
            <p className="mt-1.5 text-xl text-arcana-text">
              {walletLoading ? "Loading…" : `${wallet?.creditBalance ?? 0} credits`}
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 rounded-md border border-arcana-border px-4 py-2 text-sm text-arcana-text transition-all hover:border-arcana-cyan/60"
          >
            Plans & pricing
          </Link>
        </div>
      </section>

      <ManualPaymentInfo />

      <RoomBindingPanel />

      <BotLicensePanel />

      <TrackUploadPanel />

      <NowPlayingPanel />

      <LivePanel />

      <ImvuBotPanel />

      <RoomRosterPanel />

      <GuardianPanel />

      {(user?.roles.includes("OWNER") || user?.roles.includes("ADMIN")) && <AdminGrantPanel />}
    </main>
  );
}
