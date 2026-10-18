import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProfile, useArtists, useAuth, useMyCalls, useProfile } from "@/hooks/useAuth";
import { isToldYa, receipts, type Receipt } from "@/lib/toldya";
import { ToldYaTakeover } from "./ToldYaTakeover";

const STEPS = [
  { label: "+1M", m: 1 }, { label: "+3M", m: 3 }, { label: "+6M", m: 6 }, { label: "+1Y", m: 12 },
];

export function FastForward({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: calls = [] } = useMyCalls();
  const { data: artists = [] } = useArtists();
  const qc = useQueryClient();
  const [win, setWin] = useState<Receipt | null>(null);
  const [busy, setBusy] = useState(false);
  if (!user || !profile) return null;

  const go = async (months: number) => {
    setBusy(true);
    const before = new Set(receipts(calls, artists, profile.sim_months).filter(isToldYa).map((r) => r.call.id));
    try {
      await updateProfile(user.id, { sim_months: months });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      const fresh = receipts(calls, artists, months).filter((r) => isToldYa(r) && !before.has(r.call.id));
      if (fresh.length) setWin(fresh.sort((a, b) => b.mult - a.mult)[0]!);
      else toast(months ? `Simulated: +${months} months` : "Back to today");
    } catch {
      toast.error("Couldn't move time. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className={compact ? "flex gap-1" : "grid grid-cols-5 gap-1.5"}>
        {STEPS.map((s) => (
          <button
            key={s.label}
            disabled={busy}
            onClick={() => go(profile.sim_months + s.m)}
            className="meta rounded-sm bg-ink px-2.5 py-2 text-primary-foreground disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
        <button disabled={busy || profile.sim_months === 0} onClick={() => go(0)} className="meta rounded-sm border bg-card px-2.5 py-2 disabled:opacity-40">
          Reset
        </button>
      </div>
      {win && <ToldYaTakeover r={win} onClose={() => setWin(null)} />}
    </>
  );
}

export function SimBanner({ embedded = false }: { embedded?: boolean }) {
  const { data: profile } = useProfile();
  const { pathname } = useLocation();
  if (!embedded && ["/", "/calls", "/leaderboard", "/profile"].includes(pathname)) return null;
  if (!profile?.sim_months) return null;
  const m = profile.sim_months;
  return (
    <div className={`${embedded ? "" : "sticky top-0 z-40"} sim-banner bg-mint py-1.5 text-center meta text-ink`}>
      ● Simulated: +{m >= 12 && m % 12 === 0 ? `${m / 12} year${m > 12 ? "s" : ""}` : `${m} months`} · demo time
    </div>
  );
}
