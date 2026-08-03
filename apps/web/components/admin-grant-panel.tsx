"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserSummaryDto, WalletBalanceDto } from "@arcana/types";
import { apiFetch, ApiError } from "@/lib/api-client";

export function AdminGrantPanel() {
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("99000000");
  const [reason, setReason] = useState("complimentary access");
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: results } = useQuery({
    queryKey: ["admin", "users", "search", query],
    queryFn: () => apiFetch<UserSummaryDto[]>(`/auth/users/search?query=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
    retry: false,
  });

  const grant = useMutation({
    mutationFn: (targetUserId: string) =>
      apiFetch<WalletBalanceDto>("/billing/wallet/adjust", {
        method: "POST",
        body: JSON.stringify({ targetUserId, amount: Number(amount), reason }),
      }),
    onSuccess: (_data, targetUserId) => {
      setMessage(`Granted ${amount} credits.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "search"] });
      if (targetUserId) queryClient.invalidateQueries({ queryKey: ["billing", "wallet"] });
    },
    onError: (err) => setMessage(err instanceof ApiError ? err.message : "Grant failed"),
  });

  return (
    <section className="mt-4 rounded-xl border border-arcana-purple/40 bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-arcana-purple">Admin: grant credits</h2>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search username…"
          className="min-h-[48px] flex-1 rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-purple/70 focus:outline-none"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Credits"
          className="min-h-[48px] rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text focus:border-arcana-purple/70 focus:outline-none sm:w-32"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason"
          className="min-h-[48px] rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text focus:border-arcana-purple/70 focus:outline-none sm:w-40"
        />
      </div>

      <div className="mt-3 space-y-2">
        {results?.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-arcana-border bg-arcana-bg p-3"
          >
            <div className="text-base text-arcana-text">
              {u.username} <span className="text-arcana-textMuted">({u.roles.join(", ")})</span>
            </div>
            <button
              type="button"
              disabled={grant.isPending}
              onClick={() => grant.mutate(u.id)}
              className="min-h-[44px] rounded-md border border-arcana-purple/60 px-4 py-2 text-sm font-medium text-arcana-text transition-all hover:shadow-neon-purple-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Grant {amount} credits
            </button>
          </div>
        ))}
        {query.trim().length >= 2 && results?.length === 0 && (
          <p className="text-base text-arcana-textMuted">
            No user found — make sure they&apos;ve logged into the dashboard at least once.
          </p>
        )}
      </div>

      {message && <p className="mt-3 text-base text-arcana-cyan">{message}</p>}
    </section>
  );
}
