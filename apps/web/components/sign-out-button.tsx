"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export function SignOutButton() {
  const signOut = useMutation({
    mutationFn: () => apiFetch<{ ok: true }>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  return (
    <button
      type="button"
      disabled={signOut.isPending}
      onClick={() => signOut.mutate()}
      className="min-h-[44px] rounded-md border border-arcana-border px-4 py-2 text-sm text-arcana-textMuted transition-all hover:border-arcana-pink/60 hover:text-arcana-pink disabled:cursor-not-allowed disabled:opacity-50"
    >
      Sign out
    </button>
  );
}
