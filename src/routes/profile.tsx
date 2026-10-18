import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Aura } from "@/components/Aura";
import { FastForward } from "@/components/FastForward";
import { BadgeStamp } from "@/components/BadgeStamp";
import { Button } from "@/components/ui/button";
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

  if (ready && !user) return <PageShell><TopBar n="(4) You" /><h1 className="display mt-10 text-6xl text-ink">You heard<br />it first.</h1><SignInCta what="see your profile" /></PageShell>;
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
      <TopBar n="(4) You" right={<Button variant="ghost" onClick={signOut} className="meta h-8 px-0 font-mono text-[10px] underline">Sign out</Button>} />

      <header className="mt-6 flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
          <Aura mix={{ core: "ink", mid: "red", halo: "teal", shape: "orb", angle: profile.handle.length * 37 }} listeners={20000} />
        </div>
        <div className="min-w-0">
          <h1 className="display break-all text-[38px] text-ink">@{profile.handle}</h1>
        </div>
      </header>
      <div className="mt-8"><div className="meta text-ink">Ear Score</div><div className="numeral mt-3 break-all text-[80px] text-signal">{score.toLocaleString()}</div></div>

      <dl className="mt-5 grid grid-cols-3 border-y">
        <Stat k="1 Calls" v={String(rs.length)} />
        <Stat k="2 Hit rate" v={rs.length ? `${Math.round((hits / rs.length) * 100)}%` : "—"} mid />
        <Stat k="3 Earliest call" v={earliest ? fmt(earliest.call.listeners_at_call) : "—"} />
      </dl>

      <Section n="(1)" title="Fast-forward">
        <FastForward />
      </Section>

      <Section n="(2)" title="Badges">
        <div className="grid grid-cols-2 gap-2">
          {bs.map((b) => <BadgeStamp key={b.key} badge={b} />)}
        </div>
      </Section>

      <Section n="(3)" title="Big Calls">
        {big.length === 0 ? (
          <p className="text-sm">Star up to 3 calls in <Link to="/calls" className="underline">My Calls</Link> to pin them here.</p>
        ) : (
          <ol>
            {big.map((r, i) => (
              <li key={r.call.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2 border-b py-3 text-ink">
                <span className="min-w-0"><span className="meta mr-2">({i + 1})</span><span className="font-display font-extrabold">{r.artist.name}</span></span>
                <span className="meta text-right text-[9px]">{fmt(r.call.listeners_at_call)} → {fmt(r.now)} · ×{fmtMult(r.mult).replace(/x$/, "")}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section n="(4)" title="Top 8">
        <Top8 userId={profile.id} items={profile.top8} suggestions={[...new Set(Object.values(profile.connected).flatMap((d) => d.top_artists.map((t) => t.name)))]} catalog={artists.map((a) => a.name)} />
      </Section>

      <Section n="(5)" title="Taste">
        {taste.sources.length === 0 ? (
          <p className="text-sm">Connect a listening app to build your taste profile.</p>
        ) : (
          <>
            <div className="display text-3xl text-ink">{taste.words.join(". ")}.</div>
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
              <div className="relative mt-3 h-px bg-ink/18"><span className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 bg-ink" style={{ left: `${taste.mainstream}%` }} /></div>
            </div>
            <div className="meta mt-3 text-muted-foreground">Sources: {taste.sources.length} connected</div>
          </>
        )}
        <Button asChild className="mt-4"><Link to="/connect">Connected apps →</Link></Button>
      </Section>

      <div className="mt-10 flex items-start justify-between gap-3 border-t pt-3 meta text-muted-foreground">
        <span className="min-w-0">ToldYa® · member since {user ? niceDate(new Date(user.created_at)) : "—"}</span>
        <Link to="/about" className="shrink-0 underline">About</Link>
      </div>
    </PageShell>
  );
}

function Stat({ k, v, mid }: { k: string; v: string; mid?: boolean }) {
  return (
    <div className={`min-w-0 py-3 ${mid ? "border-x px-3" : "px-2"}`}>
      <dt className="meta text-[9px] font-bold text-ink">{k}</dt>
      <dd className="numeral mt-3 break-words text-[36px] text-ink">{v}</dd>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="meta mb-3 border-b pb-2 text-ink">{n} {title}</h2>
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
    const next = [...list]; const [it] = next.splice(from, 1); if (!it) return; next.splice(to, 0, it); save(next);
  };
  const options = [...new Set([...suggestions, ...catalog])].filter((n) => n.toLowerCase().includes(q.toLowerCase()) && !list.some((x) => x.name === n)).slice(0, 8);

  return (
    <div>
      <ol aria-label="Your Top 8" className="grid grid-cols-2 gap-2">
        {Array.from({ length: 8 }).map((_, i) => {
          const it = list[i];
          if (!it) return (
            <li key={i}><Button variant="outline" aria-label={`Add artist to slot ${i + 1}`} onClick={() => setAdding(true)} disabled={list.length >= 8} className="flex h-[112px] w-full flex-col items-start justify-between rounded-[4px] p-3 text-left text-muted-foreground"><span className="meta">({i + 1})</span><span className="text-lg">+</span></Button></li>
          );
          return (
            <li
              key={it.name}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }}
              className="group relative flex h-[112px] cursor-grab flex-col justify-between rounded-[4px] border bg-card p-3 text-ink"
            >
              <span className="meta">({i + 1})</span>
              <span className="break-words font-display text-sm font-extrabold leading-tight">{it.name}</span>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" title="Move earlier" aria-label={`Move ${it.name} earlier`} onClick={() => move(i, i - 1)} className="h-6 w-6 rounded-none text-base">‹</Button>
                <Button variant="ghost" size="icon" title="Move later" aria-label={`Move ${it.name} later`} onClick={() => move(i, i + 1)} className="h-6 w-6 rounded-none text-base">›</Button>
                <Button variant="ghost" size="icon" title="Remove artist" aria-label={`Remove ${it.name}`} onClick={() => save(list.filter((_, j) => j !== i))} className="h-6 w-6 rounded-none text-base text-ink">×</Button>
              </div>
            </li>
          );
        })}
      </ol>
      {adding && (
        <div className="mt-2 rounded-md border bg-card p-3">
          <form onSubmit={(e) => { e.preventDefault(); add(q); }} className="flex flex-wrap gap-2">
            <input autoFocus aria-label="Search artists" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or type any artist" className="min-w-0 basis-full rounded-sm border px-2.5 py-2 text-sm outline-none focus:border-ink" />
            <Button type="submit" size="sm">Add</Button>
            <Button variant="ghost" type="button" size="sm" onClick={() => setAdding(false)}>Close</Button>
          </form>
          <div className="mt-2 flex flex-wrap gap-1">
            {options.map((n) => (
              <Button variant="outline" size="sm" key={n} onClick={() => add(n)} className={`h-auto max-w-full whitespace-normal px-2 py-1 text-xs ${suggestions.includes(n) ? "bg-mint text-ink" : ""}`}>{n}</Button>
            ))}
          </div>
          {suggestions.length > 0 && <p className="meta mt-2 text-muted-foreground">Mint = from your listening apps</p>}
        </div>
      )}
    </div>
  );
}
