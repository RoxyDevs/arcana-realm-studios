"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuthenticatedUserDto, WalletBalanceDto } from "@arcana/types";
import { apiFetch } from "@/lib/api-client";
import { BotLicensePanel } from "@/components/bot-license-panel";

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
      <h1 className="text-2xl font-semibold text-arcana-text">Dashboard</h1>

      <section className="mt-8 rounded-xl border border-arcana-border bg-arcana-surface p-6">
        <h2 className="text-sm font-medium text-arcana-textMuted">Signed in as</h2>
        <p className="mt-1 text-lg text-arcana-text">
          {userLoading ? "Loading…" : (user?.username ?? "Not signed in")}
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface p-6">
        <h2 className="text-sm font-medium text-arcana-textMuted">Credit balance</h2>
        <p className="mt-1 text-lg text-arcana-text">
          {walletLoading ? "Loading…" : `${wallet?.creditBalance ?? 0} credits`}
        </p>
      </section>

      <BotLicensePanel />
    </main>
  );
}
