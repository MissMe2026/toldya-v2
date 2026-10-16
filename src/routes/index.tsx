import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Aura } from "@/components/Aura";
import { PageShell } from "@/components/TabBar";

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

type Artist = {
  id: string; name: string; genre: string; city: string; bio: string;
  aura_mix: { core: string; mid: string; halo: string; shape: string; angle: number };
  monthly_listeners: number; growth_rate: number; callers_count: number;
};

const GENRES = ["all", "pop", "hip-hop", "r&b", "indie", "electronic", "alt-rock", "latin", "country"];
const TIERS = [
  { k: "any", label: "Any", max: Infinity },
  { k: "1k", label: "Under 1K", max: 1000 },
  { k: "10k", label: "Under 10K", max: 10000 },
  { k: "100k", label: "Under 100K", max: 100000 },
];

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));
const stamp = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

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

function hype(a: Artist) {
  return Math.max(4, Math.min(99, Math.round(((Number(a.growth_rate) + 5) / 65) * 100)));
}

function Discover() {
  const { data, isLoading } = useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("*").order("created_at");
      if (error) throw error;
      return data as unknown as Artist[];
    },
  });
  const [genre, setGenre] = useState("all");
  const [tier, setTier] = useState("any");
  const [done, setDone] = useState<Record<string, "call" | "pass">>({});
  const [called, setCalled] = useState<{ a: Artist; at: Date } | null>(null);

  const deck = useMemo(() => {
    const max = TIERS.find((t) => t.k === tier)!.max;
    return (data ?? []).filter(
      (a) => !done[a.id] && (genre === "all" || a.genre === genre) && a.monthly_listeners < max,
    );
  }, [data, genre, tier, done]);

  const decide = (a: Artist, d: "call" | "pass") => {
    if (d === "call") {
      navigator.vibrate?.(30);
      setCalled({ a, at: new Date() });
      setTimeout(() => setCalled(null), 1400);
    }
    setDone((s) => ({ ...s, [a.id]: d }));
  };

  const calls = Object.values(done).filter((d) => d === "call").length;

  return (
    <PageShell>
      <header className="flex items-start justify-between">
        <div>
          <h1 className="display text-5xl text-signal">Before<br />the hype.</h1>
        </div>
        <div className="text-right">
          <div className="display text-lg">ToldYa®</div>
          <div className="meta mt-1 text-muted-foreground">{calls} calls · {deck.length} left</div>
        </div>
      </header>

      <div className="-mx-4 mt-5 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`meta shrink-0 rounded-sm border px-2.5 py-1.5 ${genre === g ? "border-ink bg-ink text-primary-foreground" : "bg-card"}`}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {TIERS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTier(t.k)}
            className={`meta rounded-sm px-2.5 py-1.5 ${tier === t.k ? "bg-mint text-ink" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative mt-4 h-[540px]">
        {isLoading && <div className="meta absolute inset-0 grid place-items-center text-muted-foreground">Tuning in…</div>}
        {!isLoading && deck.length === 0 && (
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

      {deck[0] && ((top) => (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => decide(top, "pass")} className="display rounded-md border border-ink bg-card py-4 text-xl active:bg-muted">
            Pass ←
          </button>
          <button onClick={() => decide(top, "call")} className="display rounded-md bg-signal py-4 text-xl text-primary-foreground active:bg-oxblood">
            Call it →
          </button>
        </div>
      )}
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
      setTimeout(() => onDecide(dir > 0 ? "call" : "pass"), 220);
    } else setDx(0);
  };

  const x = leaving ? leaving * 600 : dx;
  return (
    <div
      onPointerDown={(e) => { if (!top) return; start.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => { if (start.current !== null) setDx(e.clientX - start.current); }}
      onPointerUp={release}
      onPointerCancel={release}
      className="absolute inset-0 touch-none select-none overflow-hidden rounded-md border bg-card"
      style={{
        transform: `translate(${x}px, ${depth * 10}px) rotate(${x / 18}deg) scale(${1 - depth * 0.04})`,
        transition: start.current === null ? "transform 260ms cubic-bezier(.2,.8,.2,1)" : "none",
        zIndex: 10 - depth,
        cursor: top ? "grab" : "default",
      }}
    >
      <div className="relative h-[58%]">
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
      <div className="flex h-[42%] flex-col p-4">
        <h2 className="display text-4xl">{a.name}</h2>
        <p className="mt-1.5 text-sm text-ink">{a.bio}</p>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <div className="numeral text-6xl text-signal">{fmt(a.monthly_listeners)}</div>
            <div className="meta mt-1 text-muted-foreground">Listeners · {Number(a.growth_rate) >= 0 ? "+" : ""}{Number(a.growth_rate)}%/mo</div>
          </div>
          <svg viewBox="0 0 100 30" className="h-10 w-28" preserveAspectRatio="none">
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
