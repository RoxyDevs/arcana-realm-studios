"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuthenticatedUserDto, WalletBalanceDto } from "@arcana/types";
import { apiFetch } from "@/lib/api-client";
import { BotLicensePanel } from "@/components/bot-license-panel";
import { ManualPaymentInfo } from "@/components/manual-payment-info";
import { RoomBindingPanel } from "@/components/room-binding-panel";
import { AdminGrantPanel } from "@/components/admin-grant-panel";

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
      <h1 className="text-shadow-neon-cyan text-2xl font-bold text-arcana-text">Dashboard</h1>

      <section className="mt-8 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-arcana-cyan">Signed in as</h2>
        <p className="mt-1 text-lg text-arcana-text">
          {userLoading ? "Loading…" : (user?.username ?? "Not signed in")}
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-arcana-pink">Credit balance</h2>
        <p className="mt-1 text-lg text-arcana-text">
          {walletLoading ? "Loading…" : `${wallet?.creditBalance ?? 0} credits`}
        </p>
      </section>

      <ManualPaymentInfo />

      <RoomBindingPanel />

      <BotLicensePanel />

      {(user?.roles.includes("OWNER") || user?.roles.includes("ADMIN")) && <AdminGrantPanel />}
    </main>
  );
}
