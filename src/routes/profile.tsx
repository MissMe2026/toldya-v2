import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Aura } from "@/components/Aura";
import { FastForward } from "@/components/FastForward";
import { PageShell, SignInCta, TopBar } from "@/components/TabBar";
import { updateProfile, useArtists, useAuth, useMyCalls, useProfile } from "@/hooks/useAuth";
import { badges, earScore, fmt, fmtMult, isToldYa, niceDate, receipts, type Top8Item } from "@/lib/toldya";
import { tasteProfile } from "@/lib/providers";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Profile — ToldYa" },
      { name: "description", content: "Your ToldYa profile: Ear Score, badges, Top 8 and taste profile." },
      { property: "og:title", content: "Profile — ToldYa" },
      { property: "og:description", content: "Your ToldYa profile: Ear Score, badges, Top 8 and taste profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, ready } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: calls = [] } = useMyCalls();
  const { data: artists = [] } = useArtists();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const rs = useMemo(() => receipts(calls, artists, profile?.sim_months ?? 0), [calls, artists, profile]);
  const taste = useMemo(() => tasteProfile(profile?.connected ?? {}), [profile]);

  if (ready && !user) return <PageShell><TopBar n="(4) You" /><h1 className="display mt-10 text-6xl text-signal">You heard<br />it first.</h1><SignInCta what="see your profile" /></PageShell>;
  if (isLoading || !profile) return <PageShell><TopBar n="(4) You" /><p className="meta mt-10 text-muted-foreground">Loading…</p></PageShell>;

  const score = earScore(rs);
  const bs = badges(rs);
  const hits = rs.filter(isToldYa).length;
  const big = rs.filter((r) => r.call.is_big_call).slice(0, 3);
  const earliest = [...rs].sort((a, b) => a.call.listeners_at_call - b.call.listeners_at_call)[0];

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <PageShell>
      <TopBar n="(4) You" right={<button onClick={signOut} className="underline">Sign out</button>} />

      <header className="mt-6 flex items-end gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
          <Aura mix={{ core: "ink", mid: "red", halo: "teal", shape: "orb", angle: profile.handle.length * 37 }} listeners={20000} />
        </div>
        <div className="min-w-0">
          <div className="meta text-muted-foreground">Ear Score</div>
          <div className="numeral text-7xl text-signal">{score.toLocaleString()}</div>
        </div>
      </header>
      <h1 className="display mt-3 break-words text-5xl">@{profile.handle}</h1>

      <dl className="mt-5 grid grid-cols-3 border-y">
        <Stat k="Calls" v={String(rs.length)} />
        <Stat k="Hit rate" v={rs.length ? `${Math.round((hits / rs.length) * 100)}%` : "—"} mid />
        <Stat k="Earliest" v={earliest ? fmt(earliest.call.listeners_at_call) : "—"} />
      </dl>

      <Section n="(1)" title="Fast-forward time">
        <p className="mb-2 text-xs">Demo control: simulate growth so you can watch a call pay off.</p>
        <FastForward />
      </Section>

      <Section n="(2)" title="Badges">
        <div className="grid grid-cols-2 gap-2">
          {bs.map((b) => (
            <div key={b.key} className={`stamp relative rounded-sm p-3 ${b.earned ? "bg-signal text-primary-foreground" : "border border-dashed bg-card opacity-60"}`}>
              <div className="flex justify-between meta"><span>No. {b.no}</span><span>{b.earned ? "Earned" : "Locked"}</span></div>
              <div className="display mt-5 text-2xl">{b.name}{b.count > 1 ? ` ×${b.count}` : ""}</div>
              <div className="meta mt-1 normal-case opacity-90">{b.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section n="(3)" title="Top 3 Big Calls">
        {big.length === 0 ? (
          <p className="text-sm">Star up to 3 calls in <Link to="/calls" className="underline">My Calls</Link> to pin them here.</p>
        ) : (
          <ol>
            {big.map((r, i) => (
              <li key={r.call.id} className="flex items-baseline justify-between border-b py-2.5">
                <span><span className="display mr-2 text-signal">({i + 1})</span><span className="font-display font-extrabold">{r.artist.name}</span></span>
                <span className="meta">{fmt(r.call.listeners_at_call)} → {fmt(r.now)} · {fmtMult(r.mult)}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section n="(4)" title="Top 8">
        <Top8 userId={profile.id} items={profile.top8} suggestions={[...new Set(Object.values(profile.connected).flatMap((d) => d.top_artists.map((t) => t.name)))]} catalog={artists.map((a) => a.name)} />
      </Section>

      <Section n="(5)" title="Taste profile">
        {taste.sources.length === 0 ? (
          <p className="text-sm">Connect a listening app to build your taste profile.</p>
        ) : (
          <>
            <div className="display text-3xl text-signal">{taste.words.join(". ")}.</div>
            <ul className="mt-3 space-y-1.5">
              {taste.top.slice(0, 5).map((g) => (
                <li key={g.genre} className="flex items-center gap-2">
                  <span className="meta w-20">{g.genre}</span>
                  <span className="h-2 flex-1 bg-muted"><span className="block h-full bg-mint" style={{ width: `${g.pct}%` }} /></span>
                  <span className="meta w-10 text-right">{g.pct}%</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <div className="flex justify-between meta"><span>Underground</span><span>Mainstream</span></div>
              <div className="relative mt-1 h-2 bg-muted"><span className="absolute top-1/2 h-4 w-1 -translate-y-1/2 bg-signal" style={{ left: `${taste.mainstream}%` }} /></div>
            </div>
            <div className="meta mt-3 text-muted-foreground">Sources: {taste.sources.length} connected</div>
          </>
        )}
        <Link to="/connect" className="display mt-3 inline-block rounded-md bg-ink px-4 py-2.5 text-primary-foreground">Connected apps →</Link>
      </Section>

      <div className="mt-10 flex justify-between border-t pt-3 meta text-muted-foreground">
        <span>ToldYa® · member since {niceDate(new Date(user!.created_at))}</span>
        <Link to="/about" className="underline">About</Link>
      </div>
    </PageShell>
  );
}

function Stat({ k, v, mid }: { k: string; v: string; mid?: boolean }) {
  return (
    <div className={`py-3 ${mid ? "border-x px-3" : "px-1"}`}>
      <dt className="meta text-muted-foreground">{k}</dt>
      <dd className="numeral mt-1 text-3xl">{v}</dd>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-baseline justify-between border-b border-signal pb-1.5">
        <span className="display text-2xl"><span className="text-signal">{n}</span> {title}</span>
      </h2>
      {children}
    </section>
  );
}

function Top8({ userId, items, suggestions, catalog }: { userId: string; items: Top8Item[]; suggestions: string[]; catalog: string[] }) {
  const qc = useQueryClient();
  const [list, setList] = useState(items);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState<number | null>(null);

  const save = async (next: Top8Item[]) => {
    setList(next);
    try { await updateProfile(userId, { top8: next }); qc.invalidateQueries({ queryKey: ["profile"] }); }
    catch { toast.error("Couldn't save your Top 8."); }
  };
  const add = (name: string) => {
    const n = name.trim();
    if (!n || list.some((x) => x.name.toLowerCase() === n.toLowerCase())) return;
    save([...list, { name: n }]); setQ(""); setAdding(false);
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list]; const [it] = next.splice(from, 1); next.splice(to, 0, it!); save(next);
  };
  const options = [...new Set([...suggestions, ...catalog])].filter((n) => n.toLowerCase().includes(q.toLowerCase()) && !list.some((x) => x.name === n)).slice(0, 8);

  return (
    <div>
      <ol className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => {
          const it = list[i];
          if (!it) return (
            <li key={i}><button onClick={() => setAdding(true)} disabled={list.length >= 8} className="flex aspect-square w-full flex-col justify-between rounded-sm border border-dashed p-1.5 text-left text-muted-foreground"><span className="meta">({i + 1})</span><span className="text-lg">+</span></button></li>
          );
          return (
            <li
              key={it.name}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }}
              className="group relative flex aspect-square cursor-grab flex-col justify-between rounded-sm bg-ink p-1.5 text-primary-foreground"
            >
              <span className="meta opacity-70">({i + 1})</span>
              <span className="font-display text-[11px] font-extrabold leading-tight">{it.name}</span>
              <div className="absolute right-0.5 top-0.5 flex gap-0.5">
                <button aria-label={`Move ${it.name} earlier`} onClick={() => move(i, i - 1)} className="meta px-0.5">‹</button>
                <button aria-label={`Move ${it.name} later`} onClick={() => move(i, i + 1)} className="meta px-0.5">›</button>
                <button aria-label={`Remove ${it.name}`} onClick={() => save(list.filter((_, j) => j !== i))} className="meta px-0.5 text-signal">×</button>
              </div>
            </li>
          );
        })}
      </ol>
      {adding && (
        <div className="mt-2 rounded-md border bg-card p-3">
          <form onSubmit={(e) => { e.preventDefault(); add(q); }} className="flex gap-2">
            <input autoFocus aria-label="Search artists" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or type any artist" className="flex-1 rounded-sm border px-2.5 py-2 text-sm outline-none focus:border-signal" />
            <button className="meta rounded-sm bg-signal px-3 text-primary-foreground">Add</button>
            <button type="button" onClick={() => setAdding(false)} className="meta px-1">Close</button>
          </form>
          <div className="mt-2 flex flex-wrap gap-1">
            {options.map((n) => (
              <button key={n} onClick={() => add(n)} className={`meta rounded-sm px-2 py-1 ${suggestions.includes(n) ? "bg-mint text-ink" : "border"}`}>{n}</button>
            ))}
          </div>
          {suggestions.length > 0 && <p className="meta mt-2 text-muted-foreground">Mint = from your listening apps</p>}
        </div>
      )}
    </div>
  );
}
