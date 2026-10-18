import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Aura } from "@/components/Aura";
import { ReceiptDimension } from "@/components/ReceiptDimension";
import { FastForward } from "@/components/FastForward";
import { Button } from "@/components/ui/button";
import { PageShell, SignInCta, TopBar } from "@/components/TabBar";
import { useArtists, useAuth, useMyCalls, useProfile } from "@/hooks/useAuth";
import { isToldYa, receipts, status } from "@/lib/toldya";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Calls — ToldYa" },
      { name: "description", content: "Your receipts: every artist you called before the hype." },
      { property: "og:title", content: "My Calls — ToldYa" },
      { property: "og:description", content: "Your receipts: every artist you called before the hype." },
    ],
  }),
  component: Calls,
});

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

  if (ready && !user) return <PageShell><TopBar n="(2) Receipts" /><h1 className="display mt-8 text-[72px] text-ink">receipts.</h1><SignInCta what="see your receipts" /></PageShell>;

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
      <h1 className="display mt-8 text-[72px] text-ink">receipts.</h1>
      <div className="mt-6 flex items-center justify-between border-b pb-2">
        <div className="flex gap-1">
          {(["date", "growth"] as const).map((s) => (
            <Button variant="ghost" key={s} onClick={() => setSort(s)} aria-pressed={sort === s} className={`meta h-9 rounded-none px-2.5 py-1.5 font-mono text-[10px] ${sort === s ? "text-ink underline underline-offset-4" : "text-muted-foreground"}`}>By {s}</Button>
          ))}
        </div>
        <span className="meta text-muted-foreground">★ {bigCount}/3 big calls</span>
      </div>

      {isLoading && <p className="meta mt-8 text-muted-foreground">Printing receipts…</p>}
      {!isLoading && rs.length === 0 && (
        <div className="mt-8 rounded-md border bg-card p-5">
          <div className="display text-3xl">No calls yet.</div>
          <p className="mt-2 text-sm">Swipe right on an artist you believe in. We'll keep the receipt.</p>
          <Button asChild className="mt-4"><Link to="/">Discover →</Link></Button>
        </div>
      )}

      <ul className="mt-4 space-y-4 pb-[calc(64px_+_env(safe-area-inset-bottom))]">
        {rs.map((r) => {
          const st = status(r.mult);
          const ty = isToldYa(r);
          return (
            <li key={r.call.id} className="receipt-card relative overflow-hidden rounded-[4px] border border-ink/18 bg-card text-ink">
              <div className="flex items-start justify-between gap-2 px-3 pt-3 meta text-[9px]">
                <span>Receipt No. {r.call.id.slice(0, 6)}</span>
                <time dateTime={r.call.called_at}>{new Date(r.call.called_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</time>
              </div>
              <div className="flex items-center gap-2 px-3 pb-2 pt-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden"><Aura mix={r.artist.aura_mix} listeners={r.now} famous={ty} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="display self-center break-words text-[28px]">{r.artist.name}</h2>
                    <Button variant="ghost" size="icon" aria-label={r.call.is_big_call ? "Unstar big call" : "Star as big call"} aria-pressed={r.call.is_big_call} onClick={() => toggleBig(r.call.id, r.call.is_big_call)} className="h-9 w-9 shrink-0 text-xl leading-none text-ink">
                      {r.call.is_big_call ? "★" : "☆"}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="px-3 pb-5 pt-3"><ReceiptDimension then={r.call.listeners_at_call} now={r.now} mult={r.mult} tone={st === "Rising" || ty ? "rising" : "neutral"} /></div>
              <div className="grid grid-cols-4 gap-2 border-t border-ink/18 px-3 py-3">
                {[["1 Genre", r.artist.genre], ["2 City", r.artist.city], ["3 Called at", r.call.listeners_at_call.toLocaleString()]].map(([label, value]) => <div key={label} className="min-w-0"><div className="meta text-[9px] font-bold">{label}</div><div className="mt-1 break-words text-[10px] leading-tight">{value}</div></div>)}
                <div className="min-w-0"><div className="meta text-[9px] font-bold">4 Status</div><div className="meta mt-1 flex items-center gap-1 text-[9px] leading-tight">{!ty && st === "Rising" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />}{ty ? "TOLD YA ©" : st}</div>{ty && <Link to="/r/$callId" params={{ callId: r.call.id }} className="meta mt-1 inline-block text-[9px] text-ink underline">Share →</Link>}</div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-[calc(64px_+_env(safe-area-inset-bottom))] z-30 bg-ink text-primary-foreground">
        {ffOpen && <div className="absolute bottom-full inset-x-0 border-t bg-card text-ink"><div className="mx-auto max-w-md p-3"><div className="meta mb-1.5">Fast-forward time</div><FastForward compact /></div></div>}
        <Button onClick={() => setFfOpen(!ffOpen)} aria-expanded={ffOpen} className="display h-11 w-full rounded-none bg-ink text-primary-foreground shadow-none hover:bg-ink">
          ⏩ {ffOpen ? "Close" : "Fast-forward"}
        </Button>
      </div>
    </PageShell>
  );
}
