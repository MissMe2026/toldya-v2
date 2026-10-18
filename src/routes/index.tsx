import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Aura } from "@/components/Aura";
import { PageShell } from "@/components/TabBar";
import { useArtists, useAuth, useMyCalls, useProfile } from "@/hooks/useAuth";
import { fmt, hype, niceDate, stampDate as stamp } from "@/lib/toldya";
import { tasteProfile } from "@/lib/providers";
import { discoverDeck, type DiscoverArtist as Artist } from "@/lib/discover";
import { useTryDemo } from "@/hooks/useTryDemo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "ToldYa — Discover tomorrow's charts, today" },
      { name: "description", content: "Swipe emerging artists. Call the ones about to blow up. Get timestamped receipts." },
      { property: "og:title", content: "ToldYa — Discover tomorrow's charts, today" },
      { property: "og:description", content: "Swipe emerging artists. Call the ones about to blow up. Get timestamped receipts." },
    ],
  }),
  component: Discover,
});

const GENRES = ["all", "pop", "hip-hop", "r&b", "indie", "electronic", "alt-rock", "latin", "country"];
const TIERS = [
  { k: "any", label: "Any", max: Infinity },
  { k: "1k", label: "Under 1K", max: 1000 },
  { k: "10k", label: "Under 10K", max: 10000 },
  { k: "100k", label: "Under 100K", max: 100000 },
];

function Discover() {
  const { user, ready } = useAuth();
  const [callSheet, setCallSheet] = useState(false);
  const [filterSheet, setFilterSheet] = useState(false);
  const pendingCall = useRef<Artist | null>(null);
  const { data, isLoading, error } = useArtists();
  const { data: profile } = useProfile();
  const { data: myCalls = [] } = useMyCalls();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [genre, setGenre] = useState("all");
  const [tier, setTier] = useState("any");
  const [done, setDone] = useState<Record<string, "call" | "pass">>({});
  const [called, setCalled] = useState<{ a: Artist; at: Date } | null>(null);

  useEffect(() => {
    if (profile && !profile.onboarded) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  const months = profile?.sim_months ?? 0;
  const liked = useMemo(() => {
    const t = tasteProfile(profile?.connected ?? {});
    return Array.from(new Set([...t.topGenres, ...(profile?.genres ?? [])]));
  }, [profile]);

  const deck = useMemo(() => {
    const max = TIERS.find((t) => t.k === tier)?.max ?? Infinity;
    const excluded = new Set([...myCalls.map((c) => c.artist_id), ...Object.keys(done)]);
    return discoverDeck(data ?? [], { months, liked, genre, max, excluded });
  }, [data, genre, tier, done, myCalls, months, liked]);

  const saveCall = async (a: Artist, userId: string, refreshSeeded = false) => {
    setDone((s) => ({ ...s, [a.id]: "call" }));
    const at = new Date();
    const snapshot = {
      user_id: userId, artist_id: a.id, listeners_at_call: a.monthly_listeners, callers_at_call: a.callers_count,
    };
    let { error } = await supabase.from("calls").insert(snapshot);
    // The selected artist can already be one of the demo's historical receipts.
    // Refresh that receipt, preserving its Big Call star, rather than losing the pending call.
    if (refreshSeeded && error?.code === "23505") {
      const result = await supabase.from("calls").update({
        listeners_at_call: a.monthly_listeners, callers_at_call: a.callers_count, called_at: at.toISOString(),
      }).eq("user_id", userId).eq("artist_id", a.id);
      error = result.error;
    }
    if (error) {
      setDone((s) => { const n = { ...s }; delete n[a.id]; return n; });
      toast.error(error.code === "23505" ? "You already called this one." : "Couldn't save your call. Try again.");
      return;
    }
    navigator.vibrate?.(30);
    setCalled({ a, at });
    setTimeout(() => setCalled(null), 1400);
    toast.success(`Called it. ${a.name} at ${fmt(a.monthly_listeners)} listeners on ${niceDate(at)}.`);
    qc.invalidateQueries({ queryKey: ["calls"] });
    qc.invalidateQueries({ queryKey: ["artists"] });
  };

  const { tryDemo, busy: demoBusy } = useTryDemo({
    onSignedIn: async (demoUser) => {
      const artist = pendingCall.current;
      pendingCall.current = null;
      if (artist) await saveCall(artist, demoUser.id, true);
    },
  });

  const decide = async (a: Artist, d: "call" | "pass") => {
    if (d === "pass") return setDone((s) => ({ ...s, [a.id]: d }));
    if (!user) {
      pendingCall.current = a;
      setCallSheet(true);
      return;
    }
    await saveCall(a, user.id);
  };

  const topCard = deck[0];
  const calls = myCalls.length;

  return (
    <PageShell fitScreen>
      <header className="flex shrink-0 items-center justify-between gap-2">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="meta text-muted-foreground">{calls} calls · {deck.length} left</span>
          <Button variant="outline" onClick={() => setFilterSheet(true)} className="h-11 rounded-[6px] px-2.5 font-mono text-[10px] uppercase" aria-label="Filter">Filter</Button>
        </div>
      </header>

      {ready && !user && (
        <div className="mt-2 flex shrink-0 items-center justify-between gap-2 border-y py-2">
          <span className="meta text-muted-foreground">JUDGES START HERE</span>
          <Button onClick={tryDemo} disabled={demoBusy} className="h-11 px-3 text-sm">
            {demoBusy ? "Loading receipts…" : "Try the demo →"}
          </Button>
        </div>
      )}

      <Sheet open={filterSheet} onOpenChange={setFilterSheet}>
        <SheetContent side="bottom" aria-describedby={undefined} className="mx-auto max-h-[calc(100dvh_-_88px)] max-w-md overflow-y-auto rounded-t-[6px] border bg-card pb-[calc(88px_+_env(safe-area-inset-bottom))] shadow-none">
          <SheetTitle className="display text-3xl text-ink">filter.</SheetTitle>
          <p className="meta mb-2 mt-6 border-b pb-1.5 text-ink">Genre</p>
          <div className="-mx-6 flex gap-1.5 overflow-x-auto px-6 pb-2">
            {GENRES.map((g) => <Button variant="ghost" key={g} onClick={() => setGenre(g)} aria-pressed={genre === g} className={`h-11 shrink-0 rounded-[6px] border px-2.5 text-sm ${genre === g ? "border-ink bg-ink text-primary-foreground" : "bg-card"}`}>{g}</Button>)}
          </div>
          <p className="meta mb-2 mt-4 border-b pb-1.5 text-ink">Listeners</p>
          <div className="-mx-6 flex gap-1.5 overflow-x-auto px-6 pb-2">
            {TIERS.map((t) => <Button variant="ghost" key={t.k} onClick={() => setTier(t.k)} aria-pressed={tier === t.k} className={`h-11 shrink-0 rounded-[6px] border px-2.5 text-sm ${tier === t.k ? "bg-mint text-ink" : "bg-card text-muted-foreground"}`}>{t.label}</Button>)}
          </div>
          <Button onClick={() => setFilterSheet(false)} className="mt-6 w-full">Done</Button>
        </SheetContent>
      </Sheet>

      <div className="relative mt-3 min-h-0 flex-1">
        {isLoading && <div className="meta absolute inset-0 grid place-items-center text-muted-foreground">Tuning in…</div>}
        {error && <div role="alert" className="meta absolute inset-0 grid place-items-center text-ink">Couldn't load artists. Refresh to retry.</div>}
        {!isLoading && !error && deck.length === 0 && (
          <div className="absolute inset-0 flex flex-col justify-between rounded-md bg-card p-5 text-ink">
            <p className="caps-block text-xs">Deck empty. Change the filters or come back tomorrow — new artists drop daily.</p>
            <div className="display text-7xl">THAT'S ALL.</div>
          </div>
        )}
        {deck.slice(0, 3).reverse().map((a, i, arr) => (
          <SwipeCard key={a.id} artist={a} top={i === arr.length - 1} depth={arr.length - 1 - i} onDecide={(d) => decide(a, d)} />
        ))}
        {called && (
          <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
            <div className="animate-flash absolute inset-0 rounded-md bg-mint" />
            <div className="animate-stamp rounded-sm border-4 border-ink bg-card px-5 py-3 text-center">
              <div className="display text-5xl text-ink">CALLED ©</div>
              <div className="meta mt-2 text-ink">AT {called.a.monthly_listeners.toLocaleString()} LISTENERS · {stamp(called.at)}</div>
            </div>
          </div>
        )}
      </div>

      {topCard && (
        <div className="mt-5 grid shrink-0 grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => decide(topCard, "pass")} className="h-[52px] rounded-[6px] border border-ink bg-card text-base font-medium shadow-none hover:bg-card active:bg-muted">
            Pass ←
          </Button>
          <Button onClick={() => decide(topCard, "call")} className="h-[52px] rounded-[6px] bg-signal text-base font-medium text-primary-foreground shadow-none hover:bg-signal/90 active:bg-signal/90">
            Call it →
          </Button>
        </div>
      )}
      <Sheet open={callSheet} onOpenChange={(open) => { setCallSheet(open); if (!open) pendingCall.current = null; }}>
        <SheetContent side="bottom" onEscapeKeyDown={(e) => e.preventDefault()} aria-describedby={undefined} className="bottom-[calc(64px_+_env(safe-area-inset-bottom)_+_12px)] inset-x-4 mx-auto max-w-md rounded-md border bg-card p-5 shadow-none">
          <SheetTitle className="display pr-6 text-3xl">Lock in your call.</SheetTitle>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Button onClick={() => { setCallSheet(false); void tryDemo(); }} disabled={demoBusy} className="bg-ink shadow-none">
              {demoBusy ? "Loading receipts…" : "Try the demo →"}
            </Button>
            <Button asChild variant="outline" className="shadow-none"><Link to="/auth" onClick={() => { pendingCall.current = null; setCallSheet(false); }}>Sign in</Link></Button>
          </div>
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}

function SwipeCard({ artist: a, top, depth, onDecide }: { artist: Artist; top: boolean; depth: number; onDecide: (d: "call" | "pass") => void }) {
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0);
  const start = useRef<number | null>(null);
  const h = hype(a);

  const release = () => {
    if (start.current === null) return;
    start.current = null;
    if (Math.abs(dx) > 110) {
      const dir = dx > 0 ? 1 : -1;
      setLeaving(dir);
      setTimeout(() => { onDecide(dir > 0 ? "call" : "pass"); setLeaving(0); setDx(0); }, 220);
    } else setDx(0);
  };

  const x = leaving ? leaving * 600 : dx;
  return (
    <div
      onPointerDown={(e) => { if (!top) return; start.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => { if (start.current !== null) setDx(e.clientX - start.current); }}
      onPointerUp={release}
      onPointerCancel={release}
      className="absolute inset-0 flex touch-pan-y select-none flex-col overflow-hidden rounded-md border bg-card"
      style={{
        transform: `translate(${x}px, ${depth * 10}px) rotate(${x / 18}deg) scale(${1 - depth * 0.04})`,
        transition: start.current === null ? "transform 260ms cubic-bezier(.2,.8,.2,1)" : "none",
        zIndex: 10 - depth,
        cursor: top ? "grab" : "default",
      }}
    >
      <div className="relative min-h-0 flex-1">
        <Aura mix={a.aura_mix} listeners={a.monthly_listeners} />
        <div className="absolute left-3 top-3 meta text-ink">No. {String(a.callers_count).padStart(3, "0")}</div>
        <div className="absolute right-3 top-3 meta text-ink">{a.genre} · {a.city}</div>
        {dx > 40 && <div className="display absolute left-4 top-10 rotate-[-10deg] border-4 border-ink bg-card px-2 text-3xl text-ink">CALL IT</div>}
        {dx < -40 && <div className="display absolute right-4 top-10 rotate-[10deg] border-4 border-ink bg-card px-2 text-3xl text-ink">PASS</div>}
      </div>
      <div className="shrink-0 bg-card px-3 pb-3 pt-2">
        <div className="flex items-baseline gap-2"><span className="numeral text-[48px] text-ink">{h}</span><span className="meta text-muted-foreground">% Hype</span></div>
        <div className="mt-2 h-1 bg-muted"><div className="h-full bg-mint" style={{ width: `${h}%` }} /></div>
      </div>
      <div className="flex shrink-0 flex-col px-3 pb-3">
        {a.because && <p className="meta mb-2 text-deep-teal">BECAUSE YOU LISTEN TO {a.because}</p>}
        <h2 className="display break-words text-[40px]">{a.name}</h2>
        <div className="mt-3 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] items-start gap-3">
          <div className="numeral min-w-0 text-[64px] text-ink">{fmt(a.monthly_listeners)}</div>
          <div className="min-w-0 border-l pl-3">
            <p className="text-[11px] leading-snug text-ink">{a.bio}</p>
            <p className="meta mt-2 text-muted-foreground">Listeners · {Number(a.growth_rate) >= 0 ? "+" : ""}{Number(a.growth_rate)}%/mo</p>
          </div>
        </div>
      </div>
      <dl className="grid shrink-0 grid-cols-4 border-t px-3 py-3">
        {[
          ["1 Genre", a.genre], ["2 City", a.city],
          ["3 Tier", a.monthly_listeners < 1000 ? "<1K" : a.monthly_listeners < 10000 ? "<10K" : a.monthly_listeners < 100000 ? "<100K" : "100K+"],
          ["4 Callers", String(a.callers_count)],
        ].map(([label, value]) => <div key={label} className="min-w-0 pr-1"><dt className="meta font-bold">{label}</dt><dd className="mt-1 break-words text-[10px] leading-tight text-muted-foreground">{value}</dd></div>)}
      </dl>
    </div>
  );
}
