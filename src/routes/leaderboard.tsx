import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, TopBar } from "@/components/TabBar";
import { Button } from "@/components/ui/button";
import { useArtists, useAuth, useMyCalls, useProfile } from "@/hooks/useAuth";
import { earScore, isToldYa, receipts } from "@/lib/toldya";

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

  return (
    <PageShell>
      <TopBar n="(3) Ranking" right={myRank ? `You: #${myRank}` : undefined} />
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
        <div aria-label="Your pinned ranking" className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[4px] bg-signal p-3 text-primary-foreground">
          <div className="min-w-0">
            <div className="meta">You · #{myRank}</div>
            <div className="truncate font-display text-lg font-extrabold">@{myRow.handle}</div>
            <div className="meta text-primary-foreground/80">{myRow.calls} calls · {myRow.hits} told ya</div>
          </div>
          <span className="meta shrink-0 text-sm">{myRow.score.toLocaleString()}</span>
        </div>
      )}
      <ol className="mt-1">
        {rows.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 border-b py-3 text-ink">
            <span className="numeral w-10 shrink-0 text-[36px]">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="font-display truncate text-lg font-extrabold">@{r.handle}{r.me && " · you"}</div>
              <div className="meta text-muted-foreground">{r.calls} calls · {r.hits} told ya</div>
            </div>
            <span className="meta shrink-0 text-xs">{r.score.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
