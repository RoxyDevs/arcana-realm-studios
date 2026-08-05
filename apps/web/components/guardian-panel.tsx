"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GUARDIAN_LICENSE_PLANS,
  type CreateGuardianReportDto,
  type GuardianLicensePlan,
  type GuardianLicenseStatusDto,
  type GuardianReportCategory,
  type GuardianReportDto,
  type GuardianSettingsDto,
  type RoomDto,
  type UpdateGuardianSettingsDto,
} from "@arcana/types";
import { apiFetch, ApiError } from "@/lib/api-client";

const LICENSE_PLAN_ORDER: GuardianLicensePlan[] = ["DAY_1", "WEEK_1", "MONTH_1", "MONTH_3", "YEAR_1"];

const CATEGORIES: GuardianReportCategory[] = [
  "HARASSMENT",
  "SPAM",
  "RAID",
  "HATE_SPEECH",
  "BAN_EVASION",
  "OTHER",
];

const TOGGLES: { key: keyof UpdateGuardianSettingsDto; label: string }[] = [
  { key: "antiSpamEnabled", label: "Anti-spam" },
  { key: "antiRaidEnabled", label: "Anti-raid" },
  { key: "autoModEnabled", label: "Auto-moderation" },
  { key: "sharedBlacklistOptIn", label: "Share confirmed reports with the community reputation network" },
];

export function GuardianPanel() {
  const { data: rooms } = useQuery({
    queryKey: ["rooms", "mine"],
    queryFn: () => apiFetch<RoomDto[]>("/rooms/mine"),
  });
  const verifiedRooms = rooms?.filter((room) => room.verificationStatus === "VERIFIED") ?? [];

  const [roomId, setRoomId] = useState("");
  const [subjectIdentifier, setSubjectIdentifier] = useState("");
  const [category, setCategory] = useState<GuardianReportCategory>("HARASSMENT");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: license } = useQuery({
    queryKey: ["guardian", "license", roomId],
    queryFn: () => apiFetch<GuardianLicenseStatusDto>(`/rooms/${roomId}/guardian/license`),
    enabled: !!roomId,
  });

  const { data: settings } = useQuery({
    queryKey: ["guardian", "settings", roomId],
    queryFn: () => apiFetch<GuardianSettingsDto>(`/rooms/${roomId}/guardian/settings`),
    enabled: !!roomId && !!license?.active,
  });

  const { data: reports } = useQuery({
    queryKey: ["guardian", "reports", roomId],
    queryFn: () => apiFetch<GuardianReportDto[]>(`/rooms/${roomId}/guardian/reports`),
    enabled: !!roomId && !!license?.active,
  });

  const purchaseLicense = useMutation({
    mutationFn: (plan: GuardianLicensePlan) =>
      apiFetch<GuardianLicenseStatusDto>(`/rooms/${roomId}/guardian/license/purchase`, {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    onSuccess: (updated) => {
      setError(null);
      queryClient.setQueryData(["guardian", "license", roomId], updated);
      queryClient.invalidateQueries({ queryKey: ["billing", "wallet"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't purchase a Guardian license"),
  });

  const updateSettings = useMutation({
    mutationFn: (patch: UpdateGuardianSettingsDto) =>
      apiFetch<GuardianSettingsDto>(`/rooms/${roomId}/guardian/settings`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: (updated) => queryClient.setQueryData(["guardian", "settings", roomId], updated),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't update settings"),
  });

  const fileReport = useMutation({
    mutationFn: () => {
      const body: CreateGuardianReportDto = { subjectIdentifier, category, description };
      return apiFetch<GuardianReportDto>(`/rooms/${roomId}/guardian/reports`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      setError(null);
      setSubjectIdentifier("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["guardian", "reports", roomId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't file report"),
  });

  if (verifiedRooms.length === 0) {
    return null;
  }

  return (
    <section className="mt-4 rounded-xl border border-arcana-border bg-arcana-surface/80 p-6 backdrop-blur-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-arcana-cyan">
        Guardian
      </h2>
      <p className="mt-1.5 text-base text-arcana-textMuted">
        Moderation settings and incident reports for rooms you own — reports are only ever
        about what happened in your own room.
      </p>

      <select
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="mt-3 min-h-[48px] w-full rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text focus:border-arcana-cyan/70 focus:outline-none"
      >
        <option value="">Select a verified room…</option>
        {verifiedRooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>

      {roomId && license && !license.active && (
        <div className="mt-4 rounded-lg border border-arcana-pink/40 bg-arcana-pink/5 p-4">
          <p className="text-base text-arcana-text">
            Guardian isn&rsquo;t licensed for this room. Buy moderation time with wallet credits
            to turn on anti-spam/anti-raid, incident reports and reputation scoring — independent
            of any bot-time license you already have.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
            {LICENSE_PLAN_ORDER.map((plan) => {
              const def = GUARDIAN_LICENSE_PLANS[plan];
              return (
                <button
                  key={plan}
                  type="button"
                  disabled={purchaseLicense.isPending}
                  onClick={() => purchaseLicense.mutate(plan)}
                  className="min-h-[56px] rounded-lg border border-arcana-border bg-arcana-bg px-3 py-3 text-left text-base text-arcana-text transition-all hover:border-arcana-pink/70 hover:shadow-neon-pink-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="font-semibold">{def.label}</div>
                  <div className="text-sm text-arcana-textMuted">{def.credits} credits</div>
                </button>
              );
            })}
          </div>
          {error && <p className="mt-3 text-base text-red-400">{error}</p>}
        </div>
      )}

      {roomId && license?.active && (
        <p className="mt-3 text-base text-arcana-textMuted">
          Guardian active ({license.plan}) until {new Date(license.expiresAt!).toLocaleDateString()}
        </p>
      )}

      {roomId && license?.active && settings && (
        <div className="mt-4 space-y-2">
          {TOGGLES.map((toggle) => (
            <label key={toggle.key} className="flex items-center gap-3 text-base text-arcana-text">
              <input
                type="checkbox"
                checked={settings[toggle.key]}
                disabled={updateSettings.isPending}
                onChange={(e) => updateSettings.mutate({ [toggle.key]: e.target.checked })}
                className="h-5 w-5 rounded border-arcana-border accent-arcana-cyan"
              />
              {toggle.label}
            </label>
          ))}
        </div>
      )}

      {roomId && license?.active && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-arcana-textMuted">
            File an incident report
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            <input
              value={subjectIdentifier}
              onChange={(e) => setSubjectIdentifier(e.target.value)}
              placeholder="Subject's IMVU username"
              className="min-h-[48px] rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-cyan/70 focus:outline-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GuardianReportCategory)}
              className="min-h-[48px] rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text focus:border-arcana-cyan/70 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ")}
                </option>
              ))}
            </select>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened (at least 10 characters)…"
              rows={3}
              className="rounded-md border border-arcana-border bg-arcana-bg px-3 py-3 text-base text-arcana-text placeholder:text-arcana-textMuted focus:border-arcana-cyan/70 focus:outline-none"
            />
            <button
              type="button"
              disabled={!subjectIdentifier || description.length < 10 || fileReport.isPending}
              onClick={() => fileReport.mutate()}
              className="min-h-[48px] rounded-md border border-arcana-cyan/60 px-5 py-3 text-base font-medium text-arcana-text transition-all hover:shadow-neon-cyan-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {fileReport.isPending ? "Filing…" : "File report"}
            </button>
          </div>

          {error && <p className="mt-3 text-base text-red-400">{error}</p>}

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-arcana-textMuted">
            Reports for this room
          </h3>
          <div className="mt-2 space-y-2">
            {reports?.map((report) => (
              <div
                key={report.id}
                className="rounded-lg border border-arcana-border bg-arcana-bg p-3 text-base text-arcana-text"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{report.subjectIdentifier}</span>
                  <span className="text-sm uppercase text-arcana-textMuted">{report.status}</span>
                </div>
                <p className="mt-1 text-sm text-arcana-textMuted">
                  {report.category.replace("_", " ")} — {report.description}
                </p>
              </div>
            ))}
            {reports?.length === 0 && (
              <p className="text-base text-arcana-textMuted">No reports filed for this room yet.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
