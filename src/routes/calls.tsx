import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Aura } from "@/components/Aura";
import { FastForward } from "@/components/FastForward";
import { PageShell, SignInCta, TopBar } from "@/components/TabBar";
import { useArtists, useAuth, useMyCalls, useProfile } from "@/hooks/useAuth";
import { fmt, fmtMult, isToldYa, receipts, stampDate, status } from "@/lib/toldya";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
      { title: "My Calls — ToldYa" },
      { name: "description", content: "Your receipts: every artist you called before the hype." },
      { property: "og:title", content: "My Calls — ToldYa" },
      { property: "og:description", content: "Your receipts: every artist you called before the hype." },
    ],
  }),
  component: Calls,
});

const CHIP = { Rising: "bg-mint text-ink", Flat: "bg-muted text-ink", Cooling: "bg-signal text-primary-foreground" } as const;

function Calls() {
  const { user, ready } = useAuth();
  const { data: profile } = useProfile();
  const { data: calls = [], isLoading } = useMyCalls();
  const { data: artists = [] } = useArtists();
  const qc = useQueryClient();
  const [sort, setSort] = useState<"date" | "growth">("date");
  const [ffOpen, setFfOpen] = useState(false);

  const rs = useMemo(() => {
    const list = receipts(calls, artists, profile?.sim_months ?? 0);
    list.sort((a, b) => sort === "growth" ? b.mult - a.mult : +new Date(b.call.called_at) - +new Date(a.call.called_at));
    return [...list.filter((r) => r.call.is_big_call), ...list.filter((r) => !r.call.is_big_call)];
  }, [calls, artists, profile, sort]);

  if (ready && !user) return <PageShell><TopBar n="(2) Receipts" /><h1 className="display mt-10 text-6xl text-signal">My<br />Calls.</h1><SignInCta what="see your receipts" /></PageShell>;

  const bigCount = calls.filter((c) => c.is_big_call).length;
  const toggleBig = async (id: string, on: boolean) => {
    if (!on && bigCount >= 3) { toast("Only 3 Big Calls. Unstar one first."); return; }
    const { error } = await supabase.from("calls").update({ is_big_call: !on }).eq("id", id);
    if (error) { toast.error("Couldn't update. Try again."); return; }
    qc.invalidateQueries({ queryKey: ["calls"] });
  };

  return (
    <PageShell>
      <TopBar n="(2) Receipts" right={`${calls.length} calls`} />
      <div className="relative mt-8">
        <span aria-hidden className="numeral pointer-events-none absolute -top-6 right-0 text-[9rem] text-muted">{calls.length}</span>
        <h1 className="display relative text-6xl text-signal">Receipts.</h1>
      </div>
      <div className="mt-6 flex items-center justify-between border-b pb-2">
        <div className="flex gap-1">
          {(["date", "growth"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={`meta rounded-sm px-2.5 py-1.5 ${sort === s ? "bg-ink text-primary-foreground" : ""}`}>By {s}</button>
          ))}
        </div>
        <span className="meta text-muted-foreground">★ {bigCount}/3 big calls</span>
      </div>

      {isLoading && <p className="meta mt-8 text-muted-foreground">Printing receipts…</p>}
      {!isLoading && rs.length === 0 && (
        <div className="mt-8 rounded-md border bg-card p-5">
          <div className="display text-3xl">No calls yet.</div>
          <p className="mt-2 text-sm">Swipe right on an artist you believe in. We'll keep the receipt.</p>
          <Link to="/" className="display mt-4 inline-block rounded-md bg-signal px-4 py-2.5 text-primary-foreground">Discover →</Link>
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {rs.map((r) => {
          const st = status(r.mult);
          const ty = isToldYa(r);
          return (
            <li key={r.call.id} className="relative overflow-hidden rounded-md border bg-card">
              <div className="flex gap-3 p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full"><Aura mix={r.artist.aura_mix} listeners={r.now} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="display truncate text-2xl">{r.artist.name}</h2>
                    <button aria-label={r.call.is_big_call ? "Unstar big call" : "Star as big call"} onClick={() => toggleBig(r.call.id, r.call.is_big_call)} className={`text-xl leading-none ${r.call.is_big_call ? "text-signal" : "text-muted-foreground"}`}>
                      {r.call.is_big_call ? "★" : "☆"}
                    </button>
                  </div>
                  <div className="meta mt-1 text-muted-foreground">{r.artist.genre} · {r.artist.city}</div>
                  <div className="mt-1 flex gap-1.5">
                    <span className={`meta rounded-sm px-1.5 py-0.5 ${CHIP[st]}`}>{st}</span>
                    {ty && <span className="meta rounded-sm bg-signal px-1.5 py-0.5 text-primary-foreground">TOLD YA ©</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 border-t border-dashed">
                <div className="p-3"><div className="meta text-muted-foreground">Then</div><div className="numeral mt-1 text-3xl">{fmt(r.call.listeners_at_call)}</div></div>
                <div className="border-x border-dashed p-3"><div className="meta text-muted-foreground">Now</div><div className="numeral mt-1 text-3xl">{fmt(r.now)}</div></div>
                <div className="p-3"><div className="meta text-muted-foreground">Growth</div><div className={`numeral mt-1 text-3xl ${r.mult >= 1 ? "text-signal" : ""}`}>{fmtMult(r.mult)}</div></div>
              </div>
              <div className="flex items-center justify-between border-t bg-paper px-3 py-2 meta text-muted-foreground">
                <span>Called at {r.call.listeners_at_call.toLocaleString()} · {stampDate(new Date(r.call.called_at))}</span>
                {ty && <Link to="/r/$callId" params={{ callId: r.call.id }} className="text-signal underline">Share</Link>}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2">
        {ffOpen && <div className="rounded-md border bg-card p-2"><div className="meta mb-1.5">Fast-forward time</div><FastForward compact /></div>}
        <button onClick={() => setFfOpen(!ffOpen)} aria-expanded={ffOpen} className="display rounded-full bg-ink px-4 py-3 text-primary-foreground">
          ⏩ {ffOpen ? "Close" : "Fast-forward"}
        </button>
      </div>
    </PageShell>
  );
}
