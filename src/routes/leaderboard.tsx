import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, TopBar } from "@/components/TabBar";
import { useArtists, useAuth, useMyCalls, useProfile } from "@/hooks/useAuth";
import { earScore, isToldYa, receipts } from "@/lib/toldya";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
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

  return (
    <PageShell>
      <TopBar n="(3) Ranking" right={myRank ? `You: #${myRank}` : undefined} />
      <div className="relative mt-8">
        <span aria-hidden className="numeral pointer-events-none absolute -top-8 right-0 text-[10rem] text-muted">{myRank || 1}</span>
        <h1 className="display relative text-6xl text-signal">Best<br />ears.</h1>
      </div>
      <p className="mt-3 max-w-[16rem] text-xs">Ear Score rewards calling early (fewer listeners = more points) times how much they grew.</p>
      <div className="mt-6 flex gap-1 border-b pb-2">
        {(["week", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`meta rounded-sm px-2.5 py-1.5 ${tab === t ? "bg-ink text-primary-foreground" : ""}`}>
            {t === "week" ? "This week" : "All time"}
          </button>
        ))}
      </div>
      {isLoading && <p className="meta mt-6 text-muted-foreground">Counting ears…</p>}
      {myRow && !isLoading && (
        <div aria-label="Your pinned ranking" className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-sm bg-mint p-3 text-ink">
          <div className="min-w-0">
            <div className="meta">You · #{myRank}</div>
            <div className="truncate font-display text-lg font-extrabold">@{myRow.handle}</div>
            <div className="meta text-muted-foreground">{myRow.calls} calls · {myRow.hits} told ya</div>
          </div>
          <span className="numeral shrink-0 text-3xl">{myRow.score.toLocaleString()}</span>
        </div>
      )}
      <ol className="mt-1">
        {rows.map((r, i) => (
          <li key={r.id} className={`flex items-center gap-3 border-b py-3 ${r.me ? "-mx-2 rounded-sm bg-mint px-2" : ""}`}>
            <span className={`display w-10 text-2xl ${i < 3 ? "text-signal" : ""}`}>({i + 1})</span>
            <div className="min-w-0 flex-1">
              <div className="font-display truncate text-lg font-extrabold tracking-tight">@{r.handle}{r.me && " · you"}</div>
              <div className="meta text-muted-foreground">{r.calls} calls · {r.hits} told ya</div>
            </div>
            <span className="numeral text-3xl">{r.score.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
