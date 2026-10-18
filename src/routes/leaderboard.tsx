import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, TopBar } from "@/components/TabBar";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { useArtists, useAuth, useMyCalls, useProfile } from "@/hooks/useAuth";
import { earScore, isToldYa, receipts } from "@/lib/toldya";
import { BOARD_GENRES, currentGenreRow, genreTopThree, seededGenreRows, topTen, type BoardRow } from "@/lib/genre-board";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Leaderboard — ToldYa" },
      { name: "description", content: "Who has the best ears? The ToldYa leaderboard." },
      { property: "og:title", content: "Leaderboard — ToldYa" },
      { property: "og:description", content: "Who has the best ears? The ToldYa leaderboard." },
    ],
  }),
  component: Leaderboard,
});

function Leaderboard() {
  const [tab, setTab] = useState<"week" | "all">("all");
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: calls = [] } = useMyCalls();
  const { data: artists = [] } = useArtists();
  const { data: board = [], isLoading } = useQuery({
    queryKey: ["board"],
    queryFn: async () => {
      const { data, error } = await supabase.from("board_users").select("*");
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo(() => {
    const list = board.map((b) => ({ id: b.id, handle: b.handle, score: tab === "all" ? b.score_all : b.score_week, calls: b.calls, hits: b.hits, me: false }));
    if (user && profile) {
      const rs = receipts(calls, artists, profile.sim_months);
      const weekRs = rs.filter((r) => Date.now() - +new Date(r.call.called_at) < 7 * 86400000);
      list.push({ id: user.id, handle: profile.handle, score: earScore(tab === "all" ? rs : weekRs), calls: rs.length, hits: rs.filter(isToldYa).length, me: true });
    }
    return list.sort((a, b) => b.score - a.score);
  }, [board, tab, user, profile, calls, artists]);

  const myRank = rows.findIndex((r) => r.me) + 1;
  const myRow = rows.find((r) => r.me);

  const genreBoards = useMemo(() => {
    const seeded = board.map(b => seededGenreRows(b, tab));
    const rs = profile ? receipts(calls, artists, profile.sim_months) : [];
    const now = Date.now();
    return BOARD_GENRES.map(genre => {
      const list = seeded.map(spread => spread[genre]);
      if (user && profile) list.push(currentGenreRow(user.id, profile.handle, rs, genre, tab, now));
      return { genre, rows: genreTopThree(list) };
    });
  }, [board, tab, user, profile, calls, artists]);

  return (
    <PageShell>
      <TopBar n="(3) Ranking" right={myRank ? <span className="opacity-90">{`You: #${myRank}`}</span> : undefined} />
      <h1 className="display mt-8 text-[64px] text-ink">best ears.</h1>
      <div className="mt-6 flex gap-1 border-b pb-2">
        {(["week", "all"] as const).map((t) => (
          <Button variant="ghost" key={t} onClick={() => setTab(t)} aria-pressed={tab === t} className={`meta h-9 rounded-none px-2.5 py-1.5 font-mono text-[10px] ${tab === t ? "text-ink underline underline-offset-4" : "text-muted-foreground"}`}>
            {t === "week" ? "This week" : "All time"}
          </Button>
        ))}
      </div>
      {isLoading && <p className="meta mt-6 text-muted-foreground">Counting ears…</p>}
      {myRow && !isLoading && (
        <div aria-label="Your pinned ranking" className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[4px] bg-signal p-3 text-primary-foreground">
          <UserAvatar handle={myRow.handle} pinned />
          <div className="min-w-0">
            <div className="meta">You · #{myRank}</div>
            <div className="truncate font-display text-lg font-extrabold">@{myRow.handle}</div>
            <div className="meta text-primary-foreground/80">{myRow.calls} calls · {myRow.hits} told ya</div>
          </div>
          <span className="meta shrink-0 text-sm">{myRow.score.toLocaleString()}</span>
        </div>
      )}
      <RankingRows rows={topTen(rows)} label="Top 10 ears" />
      {genreBoards.map(({ genre, rows: genreRows }) => (
        <section key={genre} className="mt-8" aria-label={`${genre} board`}>
          <h2 className="display border-b pb-3 text-[40px] text-ink">best {genre} ears.</h2>
          <RankingRows rows={genreRows} label={`Top ${genre} ears`} />
        </section>
      ))}
      <p className="meta mt-8 text-muted-foreground">Scores = Ear Score from calls in that genre · Demo data</p>
    </PageShell>
  );
}

function RankingRows({ rows, label }: { rows: BoardRow[]; label: string }) {
  return (
    <ol className="mt-1" aria-label={label}>
      {rows.map((r, i) => (
        <li key={r.id} className="flex items-center gap-3 border-b py-3 text-ink">
          <span className="numeral w-10 shrink-0 text-[36px]">{i + 1}</span>
          <UserAvatar handle={r.handle} />
          <div className="min-w-0 flex-1">
            <div className="font-display truncate text-lg font-extrabold">@{r.handle}{r.me && " · you"}</div>
            <div className="meta text-muted-foreground">{r.calls} calls · {r.hits} told ya</div>
          </div>
          <span className="meta shrink-0 text-xs">{r.score.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}
