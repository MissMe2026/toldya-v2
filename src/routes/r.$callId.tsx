import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShareCard } from "@/components/ShareCard";
import { useAuth } from "@/hooks/useAuth";
import { receipts, type Artist, type Call, type Top8Item } from "@/lib/toldya";

export const Route = createFileRoute("/r/$callId")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "TOLD YA. — a ToldYa receipt" },
      { name: "description", content: "Someone called this artist before the hype. Here's the receipt." },
      { property: "og:title", content: "TOLD YA. — a ToldYa receipt" },
      { property: "og:description", content: "Someone called this artist before the hype. Here's the receipt." },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const { callId } = Route.useParams();
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["share", callId],
    queryFn: async () => {
      const { data: call } = await supabase.from("calls").select("*").eq("id", callId).maybeSingle();
      if (!call) return null;
      const [{ data: artist }, { data: prof }] = await Promise.all([
        supabase.from("artists").select("*").eq("id", call.artist_id).single(),
        supabase.from("profiles").select("handle,sim_months,top8").eq("id", call.user_id).maybeSingle(),
      ]);
      if (!artist) return null;
      const r = receipts([call as Call], [artist as unknown as Artist], prof?.sim_months ?? 0)[0]!;
      return { r, handle: prof?.handle ?? "listener", top8: (prof?.top8 ?? []) as unknown as Top8Item[] };
    },
  });

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const url = await toPng(ref.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = url; a.download = `toldya-${data?.r.artist.name.replace(/\s+/g, "-").toLowerCase()}.png`; a.click();
    } catch { toast.error("Couldn't make the image. Try again."); } finally { setBusy(false); }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href).then(() => toast.success("Link copied."), () => toast.error("Couldn't copy."));
  };

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-10 pt-5">
      <div className="flex items-center justify-between">
        <Link to="/" className="display text-xl">ToldYa®</Link>
        <span className="meta text-muted-foreground">Receipt</span>
      </div>
      {isLoading && <p className="meta mt-10 text-muted-foreground">Pulling the receipt…</p>}
      {!isLoading && !data && (
        <div className="mt-10"><h1 className="display text-5xl">No receipt here.</h1><Link to="/" className="meta mt-4 inline-block underline">Discover artists →</Link></div>
      )}
      {data && (
        <>
          <div className="mt-5 overflow-hidden rounded-md"><ShareCard ref={ref} r={data.r} handle={data.handle} /></div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={download} disabled={busy} className="display rounded-md bg-ink py-3.5 text-lg text-primary-foreground disabled:opacity-60">{busy ? "…" : "Download image"}</button>
            <button onClick={copy} className="display rounded-md border border-ink bg-card py-3.5 text-lg">Copy link</button>
          </div>
          {data.top8.length > 0 && (
            <section className="mt-8">
              <h2 className="meta border-b pb-1.5">@{data.handle}'s Top 8</h2>
              <ol className="mt-2 grid grid-cols-4 gap-1.5">
                {data.top8.map((t, i) => (
                  <li key={i} className="rounded-sm border bg-card p-2"><div className="meta text-muted-foreground">({i + 1})</div><div className="font-display text-xs font-extrabold leading-tight">{t.name}</div></li>
                ))}
              </ol>
            </section>
          )}
          {!user && (
            <div className="mt-8 rounded-md bg-signal p-5 text-primary-foreground">
              <div className="display text-3xl">Think you've got better ears?</div>
              <Link to="/auth" className="display mt-4 inline-block rounded-md bg-card px-4 py-2.5 text-signal">Start calling →</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
