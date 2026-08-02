"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BOT_LICENSE_PLANS, type BotLicensePlan, type BotLicenseStatusDto } from "@arcana/types";
import { apiFetch, ApiError } from "@/lib/api-client";

const PLAN_ORDER: BotLicensePlan[] = ["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3", "YEAR_1"];

export function BotLicensePanel() {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ["license", roomId],
    queryFn: () => apiFetch<BotLicenseStatusDto>(`/rooms/${roomId}/license`),
    enabled: roomId.length > 0,
    retry: false,
  });

  const purchase = useMutation({
    mutationFn: (plan: BotLicensePlan) =>
      apiFetch<BotLicenseStatusDto>(`/rooms/${roomId}/license/purchase`, {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["license", roomId] });
      queryClient.invalidateQueries({ queryKey: ["billing", "wallet"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Purchase failed"),
  });

  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="text-sm font-medium uppercase tracking-wide text-arcana-cyan">Bot time for your room</h2>

      <input
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Room ID"
        className="mt-3 w-full rounded-md border border-arcana-border bg-arcana-bg px-3 py-2 text-sm text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-cyan/70 focus:shadow-neon-cyan-sm focus:outline-none"
      />

      {roomId && status && (
        <p className="mt-2 text-sm text-arcana-textMuted">
          {status.active
            ? `Active (${status.plan}) until ${new Date(status.expiresAt!).toLocaleDateString()}`
            : "No active bot license for this room."}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
        {PLAN_ORDER.map((plan) => {
          const def = BOT_LICENSE_PLANS[plan];
          return (
            <button
              key={plan}
              type="button"
              disabled={!roomId || purchase.isPending}
              onClick={() => purchase.mutate(plan)}
              className="rounded-lg border border-arcana-border bg-arcana-bg px-3 py-3 text-left text-sm text-arcana-text transition-all hover:border-arcana-cyan/70 hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="font-medium">{def.label}</div>
              <div className="text-arcana-textMuted">{def.credits} credits</div>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </section>
  );
}
