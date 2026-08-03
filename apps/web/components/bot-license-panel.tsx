"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BOT_LICENSE_PLANS,
  BULK_LICENSE_DISCOUNT,
  type BotLicensePlan,
  type BotLicenseStatusDto,
  type BulkLicensePurchaseResultDto,
  type RoomDto,
} from "@arcana/types";
import { apiFetch, ApiError } from "@/lib/api-client";

const PLAN_ORDER: BotLicensePlan[] = ["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3", "YEAR_1"];

function isBulkResult(
  result: BotLicenseStatusDto | BulkLicensePurchaseResultDto,
): result is BulkLicensePurchaseResultDto {
  return "totalCharged" in result;
}

export function BotLicensePanel() {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: rooms } = useQuery({
    queryKey: ["rooms", "mine"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms/mine"),
  });

  // Default to the first bound room once the list loads.
  useEffect(() => {
    if (selected.length === 0 && rooms && rooms.length > 0) {
      setSelected([rooms[0].id]);
    }
  }, [rooms, selected.length]);

  const { data: status } = useQuery({
    queryKey: ["license", selected[0]],
    queryFn: () => apiFetch<BotLicenseStatusDto>(`/rooms/${selected[0]}/license`),
    enabled: selected.length === 1,
    retry: false,
  });

  const toggleRoom = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const purchase = useMutation<BotLicenseStatusDto | BulkLicensePurchaseResultDto, Error, BotLicensePlan>({
    mutationFn: (plan: BotLicensePlan) =>
      selected.length === 1
        ? apiFetch<BotLicenseStatusDto>(`/rooms/${selected[0]}/license/purchase`, {
            method: "POST",
            body: JSON.stringify({ plan }),
          })
        : apiFetch<BulkLicensePurchaseResultDto>("/rooms/license/bulk-purchase", {
            method: "POST",
            body: JSON.stringify({ roomIds: selected, plan }),
          }),
    onSuccess: (result) => {
      setError(null);
      if (isBulkResult(result)) {
        setMessage(
          `Bought bot time for ${selected.length} rooms — ${result.totalCharged} credits total` +
            (result.discountApplied ? ` (${BULK_LICENSE_DISCOUNT.percentOff}% bulk discount applied).` : "."),
        );
      } else {
        setMessage(null);
      }
      queryClient.invalidateQueries({ queryKey: ["license"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "wallet"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Purchase failed"),
  });

  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-arcana-cyan">
        Bot time for your rooms
      </h2>
      <p className="mt-1 text-base text-arcana-textMuted">
        Select one or more rooms — buy {BULK_LICENSE_DISCOUNT.minRooms}+ at once and get{" "}
        {BULK_LICENSE_DISCOUNT.percentOff}% off the total.
      </p>

      {rooms && rooms.length > 0 ? (
        <div className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-md border border-arcana-border bg-arcana-bg p-2">
          {rooms.map((room) => (
            <label
              key={room.id}
              className="flex min-h-[40px] items-center gap-2 rounded px-2 text-base text-arcana-text hover:bg-arcana-surface"
            >
              <input
                type="checkbox"
                checked={selected.includes(room.id)}
                onChange={() => toggleRoom(room.id)}
                className="h-4 w-4 accent-arcana-cyan"
              />
              {room.name} ({room.imvuRoomId})
            </label>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-base text-arcana-textMuted">
          Bind a room above first, then come back here to buy it bot time.
        </p>
      )}

      {selected.length === 1 && status && (
        <p className="mt-2 text-base text-arcana-textMuted">
          {status.active
            ? `Active (${status.plan}) until ${new Date(status.expiresAt!).toLocaleDateString()}`
            : "No active bot license for this room."}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
        {PLAN_ORDER.map((plan) => {
          const def = BOT_LICENSE_PLANS[plan];
          const listTotal = def.credits * selected.length;
          const discounted = selected.length >= BULK_LICENSE_DISCOUNT.minRooms;
          const finalTotal = discounted
            ? Math.round(listTotal * (1 - BULK_LICENSE_DISCOUNT.percentOff / 100))
            : listTotal;
          return (
            <button
              key={plan}
              type="button"
              disabled={selected.length === 0 || purchase.isPending}
              onClick={() => purchase.mutate(plan)}
              className="min-h-[56px] rounded-lg border border-arcana-border bg-arcana-bg px-3 py-3 text-left text-base text-arcana-text transition-all hover:border-arcana-cyan/70 hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="font-semibold">{def.label}</div>
              <div className="text-sm text-arcana-textMuted">
                {selected.length > 1 ? (
                  <>
                    {finalTotal} credits total
                    {discounted && <span className="text-arcana-cyan"> (−{BULK_LICENSE_DISCOUNT.percentOff}%)</span>}
                  </>
                ) : (
                  `${def.credits} credits`
                )}
              </div>
            </button>
          );
        })}
      </div>

      {message && <p className="mt-3 text-base text-arcana-cyan">{message}</p>}
      {error && <p className="mt-3 text-base text-red-400">{error}</p>}
    </section>
  );
}
