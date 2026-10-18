import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell, SignInCta, TopBar } from "@/components/TabBar";
import { updateProfile, useAuth, useProfile } from "@/hooks/useAuth";
import { importFrom, PROVIDERS, type ProviderAdapter } from "@/lib/providers";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Connected Apps — ToldYa" },
      { name: "description", content: "Connect your listening apps to build your ToldYa taste profile." },
      { property: "og:title", content: "Connected Apps — ToldYa" },
      { property: "og:description", content: "Connect your listening apps to build your ToldYa taste profile." },
    ],
  }),
  component: Connect,
});

type Stage = { p: ProviderAdapter; step: "ask" | "sync" | "done"; line: number };
const LINES = ["Reading your top artists…", "Scanning recent plays…", "Mapping your sound…"];

function Connect() {
  const { user, ready } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [stage, setStage] = useState<Stage | null>(null);

  if (ready && !user) return <PageShell><TopBar n="Connected apps" /><SignInCta what="connect your listening apps" /></PageShell>;

  const connected = profile?.connected ?? {};

  const allow = async (p: ProviderAdapter) => {
    if (!user || !profile) return;
    setStage({ p, step: "sync", line: 0 });
    for (let i = 1; i < LINES.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setStage((s) => (s ? { ...s, line: i } : s));
    }
    try {
      const data = await importFrom(p);
      await updateProfile(user.id, { connected: { ...connected, [p.id]: data } });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      setStage({ p, step: "done", line: 0 });
    } catch {
      toast.error("Sync failed. Try again.");
      setStage(null);
    }
  };

  const disconnect = async (id: string) => {
    if (!user) return;
    const next = { ...connected };
    delete next[id];
    await updateProfile(user.id, { connected: next }).catch(() => toast.error("Couldn't disconnect."));
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <PageShell>
      <TopBar n="Connected apps" />
      <h1 className="display mt-8 text-5xl text-ink">plug in<br />your ears.</h1>
      <p className="meta mt-3 inline-block rounded-sm bg-mint px-2 py-1 text-ink">Demo mode — live sync coming soon.</p>

      <ul className="mt-6">
        {PROVIDERS.map((p, i) => {
          const c = connected[p.id];
          return (
            <li key={p.id} className="flex items-center justify-between gap-3 border-b py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 text-ink"><span className="meta shrink-0">({i + 1})</span><span className="font-display text-2xl font-extrabold leading-tight">{p.name}</span></div>
                <div className="meta mt-1 text-muted-foreground">
                  {c ? `● Connected · ${c.top_artists.length} artists · ${Math.round(c.minutes / 60)}h listened` : "Not connected"}
                </div>
              </div>
              {c ? (
                <Button variant="outline" onClick={() => disconnect(p.id)} className="meta h-11 shrink-0 px-3">Disconnect</Button>
              ) : (
                <Button onClick={() => setStage({ p, step: "ask", line: 0 })} className="meta h-11 shrink-0 px-3">Connect</Button>
              )}
            </li>
          );
        })}
      </ul>
      <Link to="/profile" className="meta mt-6 inline-block underline">← Back to profile</Link>

      {stage && (
        <div role="dialog" aria-modal="true" aria-label={`Connect ${stage.p.name}`} className="fixed inset-0 z-50 flex items-end bg-ink/50 sm:items-center">
          <div className="mx-auto max-h-[calc(100dvh_-_88px)] w-full max-w-md overflow-y-auto rounded-t-md bg-card px-5 pt-5 pb-[calc(88px_+_env(safe-area-inset-bottom))] sm:rounded-md sm:pb-5">
            {stage.step === "ask" && (
              <>
                <div className="flex justify-between meta text-muted-foreground"><span>ToldYa® × {stage.p.name}</span><span>Permission</span></div>
                <h2 className="display mt-6 text-4xl">Allow ToldYa to read your listening on {stage.p.name}?</h2>
                <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div><div className="meta mb-2 border-b pb-1.5 text-ink">We read</div><ul className="space-y-1"><li>Top artists</li><li>Top genres</li><li>Recently played</li></ul></div>
                  <div><div className="meta mb-2 border-b pb-1.5 text-ink">We never</div><ul className="space-y-1"><li>Post for you</li><li>Change playlists</li><li>Sell your data</li></ul></div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setStage(null)}>Cancel</Button>
                  <Button onClick={() => allow(stage.p)} className="bg-signal text-primary-foreground hover:bg-signal/90">Allow</Button>
                </div>
              </>
            )}
            {stage.step === "sync" && (
              <div className="py-6">
                <div className="mx-auto h-28 w-28 animate-pulse rounded-full" style={{ background: "radial-gradient(circle, var(--ink), var(--signal) 45%, var(--teal) 80%, transparent)", filter: `blur(${24 - stage.line * 9}px)`, transition: "filter 700ms" }} />
                <p className="meta mt-6 text-center">{LINES[stage.line]}</p>
                <div className="mt-2 h-1 bg-muted"><div className="h-full bg-mint transition-all duration-700" style={{ width: `${((stage.line + 1) / LINES.length) * 100}%` }} /></div>
              </div>
            )}
            {stage.step === "done" && (
              <div>
                <div className="meta text-muted-foreground">{stage.p.name} · synced</div>
                <h2 className="display animate-focus mt-4 text-5xl text-ink">your taste profile is ready.</h2>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setStage(null)}>Done</Button>
                  <Button asChild><Link to="/profile">See it →</Link></Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
