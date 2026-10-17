import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

function spark(a: Artist) {
  let seed = a.name.length * 97 + a.monthly_listeners;
  const pts: number[] = [];
  let v = 50;
  for (let i = 0; i < 30; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    v += Number(a.growth_rate) / 30 + (seed / 233280 - 0.5) * 6;
    pts.push(v);
  }
  const min = Math.min(...pts), max = Math.max(...pts);
  return pts.map((p, i) => `${(i / 29) * 100},${28 - ((p - min) / (max - min || 1)) * 26}`).join(" ");
}

function Discover() {
  const { user, ready } = useAuth();
  const { tryDemo, busy: demoBusy } = useTryDemo();
  const [callSheet, setCallSheet] = useState(false);
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

  const decide = async (a: Artist, d: "call" | "pass") => {
    if (d === "pass") return setDone((s) => ({ ...s, [a.id]: d }));
    if (!user) {
      setCallSheet(true);
      return;
    }
    setDone((s) => ({ ...s, [a.id]: d }));
    const at = new Date();
    const { error } = await supabase.from("calls").insert({
      user_id: user.id, artist_id: a.id, listeners_at_call: a.monthly_listeners, callers_at_call: a.callers_count,
    });
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

  const topCard = deck[0];
  const calls = myCalls.length;

  return (
    <PageShell fitScreen>
      <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <h1 className="display text-5xl text-signal">Before<br />the hype.</h1>
        </div>
        <div className="shrink-0 text-right">
          <div className="display text-lg">ToldYa®</div>
          <div className="meta mt-1 text-muted-foreground">{calls} calls · {deck.length} left</div>
        </div>
      </header>

      {ready && !user && (
        <div className="mt-3 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-sm bg-signal p-2 text-primary-foreground">
          <span className="meta min-w-0">JUDGES START HERE</span>
          <Button onClick={tryDemo} disabled={demoBusy} className="h-11 shrink-0 bg-ink px-3 font-display font-extrabold text-primary-foreground shadow-none">
            {demoBusy ? "Loading receipts…" : "Try the demo →"}
          </Button>
        </div>
      )}

      <div className="-mx-4 mt-3 flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-1">
        {GENRES.map((g) => (
          <Button variant="ghost"
            key={g}
            onClick={() => setGenre(g)}
            className={`meta h-auto shrink-0 rounded-sm border px-2.5 py-1.5 ${genre === g ? "border-ink bg-ink text-primary-foreground" : "bg-card"}`}
          >
            {g}
          </Button>
        ))}
      </div>
      <div className="mt-1.5 grid shrink-0 grid-cols-4 gap-1">
        {TIERS.map((t) => (
          <Button variant="ghost"
            key={t.k}
            onClick={() => setTier(t.k)}
            className={`meta h-auto rounded-sm px-1 py-1.5 ${tier === t.k ? "bg-mint text-ink" : "text-muted-foreground"}`}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="relative mt-3 min-h-0 flex-1">
        {isLoading && <div className="meta absolute inset-0 grid place-items-center text-muted-foreground">Tuning in…</div>}
        {error && <div role="alert" className="meta absolute inset-0 grid place-items-center text-signal">Couldn't load artists. Refresh to retry.</div>}
        {!isLoading && !error && deck.length === 0 && (
          <div className="absolute inset-0 flex flex-col justify-between rounded-md bg-signal p-5 text-primary-foreground">
            <p className="caps-block text-xs">Deck empty. Change the filters or come back tomorrow — new artists drop daily.</p>
            <div className="display text-7xl">THAT'S ALL.</div>
          </div>
        )}
        {deck.slice(0, 3).reverse().map((a, i, arr) => (
          <SwipeCard key={a.id} artist={a} top={i === arr.length - 1} depth={arr.length - 1 - i} onDecide={(d) => decide(a, d)} />
        ))}
        {called && (
          <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
            <div className="animate-flash absolute inset-0 rounded-md bg-signal" />
            <div className="animate-stamp rounded-sm border-4 border-signal bg-card px-5 py-3 text-center">
              <div className="display text-5xl text-signal">CALLED ©</div>
              <div className="meta mt-2 text-ink">AT {called.a.monthly_listeners.toLocaleString()} LISTENERS · {stamp(called.at)}</div>
            </div>
          </div>
        )}
      </div>

      {topCard && (
        <div className="mt-6 grid shrink-0 grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => decide(topCard, "pass")} className="display h-14 rounded-md border border-ink bg-card text-xl shadow-none active:bg-muted">
            Pass ←
          </Button>
          <Button onClick={() => decide(topCard, "call")} className="display h-14 rounded-md bg-signal text-xl text-primary-foreground shadow-none hover:bg-oxblood active:bg-oxblood">
            Call it →
          </Button>
        </div>
      )}
      <Sheet open={callSheet && !user} onOpenChange={setCallSheet}>
        <SheetContent side="bottom" aria-describedby={undefined} className="bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] inset-x-4 mx-auto max-w-md rounded-md border bg-card p-5 shadow-none">
          <SheetTitle className="display pr-6 text-3xl">Lock in your call.</SheetTitle>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Button onClick={tryDemo} disabled={demoBusy} className="h-11 bg-ink font-display font-extrabold shadow-none">
              {demoBusy ? "Loading receipts…" : "Try the demo →"}
            </Button>
            <Button asChild variant="outline" className="h-11 shadow-none"><Link to="/auth">Sign in</Link></Button>
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
        <div className="absolute left-3 top-3 meta text-ink">{a.city} · {a.genre}</div>
        <div className="absolute right-3 top-3 meta text-ink">No. {String(a.callers_count).padStart(3, "0")}</div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center justify-between meta text-ink"><span>Hype</span><span>{h} %</span></div>
          <div className="mt-1 h-1.5 bg-card/70"><div className="h-full bg-mint" style={{ width: `${h}%` }} /></div>
        </div>
        <span className="absolute -right-6 top-1/2 origin-center -translate-y-1/2 rotate-90 meta text-ink/60">{a.genre} · {a.city}</span>
        {dx > 40 && <div className="display absolute left-4 top-10 rotate-[-10deg] rounded-sm border-4 border-signal px-2 text-3xl text-signal">CALL IT</div>}
        {dx < -40 && <div className="display absolute right-4 top-10 rotate-[10deg] rounded-sm border-4 border-ink px-2 text-3xl text-ink">PASS</div>}
      </div>
      <div className="flex shrink-0 flex-col p-4">
        {a.because && <p className="meta mb-2 text-muted-foreground">BECAUSE YOU LISTEN TO {a.because}</p>}
        <h2 className="display text-4xl">{a.name}</h2>
        <p className="mt-1.5 text-sm text-ink">{a.bio}</p>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <div className="numeral text-6xl text-signal">{fmt(a.monthly_listeners)}</div>
            <div className="meta mt-1 text-muted-foreground">Listeners · {Number(a.growth_rate) >= 0 ? "+" : ""}{Number(a.growth_rate)}%/mo</div>
          </div>
          <svg viewBox="0 0 100 30" className="h-10 w-20 shrink-0 sm:w-28" preserveAspectRatio="none">
            <polyline points={spark(a)} fill="none" stroke={Number(a.growth_rate) >= 0 ? "var(--deep-teal)" : "var(--signal)"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="mt-3 flex justify-between border-t pt-2 meta text-muted-foreground">
          <span>ToldYa®</span><span>{a.callers_count} people called it</span>
        </div>
      </div>
    </div>
  );
}
