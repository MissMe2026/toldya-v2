import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateProfile, useAuth } from "@/hooks/useAuth";
import { GENRES } from "@/lib/toldya";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/Logo";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Welcome — ToldYa" },
      { name: "description", content: "Find artists before the hype. Call it. Get the receipts." },
      { property: "og:title", content: "Welcome — ToldYa" },
      { property: "og:description", content: "Find artists before the hype. Call it. Get the receipts." },
    ],
  }),
  component: Onboarding,
});

const SLIDES = [
  { n: "(1)", top: "Streaming apps show you what's already big. We show you what's next.", word: "before the hype." },
  { n: "(2)", top: "Swipe right to call an artist. Your call is timestamped with their listener count. That's proof.", word: "call it." },
  { n: "(3)", top: "When they blow up, you get a badge and a brag card. Everyone else gets to hear about it.", word: "told ya." },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const finish = async (next: "/" | "/connect") => {
    if (user) {
      await updateProfile(user.id, { genres: picked, onboarded: true }).catch(() => {});
      await qc.invalidateQueries({ queryKey: ["profile"] });
    }
    navigate({ to: next, replace: true });
  };

  if (i < SLIDES.length) {
    const s = SLIDES[i];
    if (!s) return null;
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        <div className="flex-1 bg-signal px-5 pt-6 text-primary-foreground">
          <div className="flex items-center justify-between gap-3 meta"><LogoMark /><span>{s.n} / (3)</span></div>
          <p className="caps-block mt-20 max-w-[17rem] text-sm">{s.top}</p>
        </div>
        <div className="relative h-[50dvh] min-h-[340px] overflow-hidden bg-card">
          <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, var(--ink), var(--deep-teal) 40%, var(--teal) 75%, transparent)", filter: `blur(${36 - i * 16}px)`, transition: "filter 600ms" }} />
          <h1 key={i} className="display absolute bottom-[164px] inset-x-5 text-6xl text-ink">{s.word}</h1>
          <div className="absolute inset-x-5 bottom-[calc(88px_+_env(safe-area-inset-bottom))] flex gap-2">
            <Button variant="outline" onClick={() => setI(SLIDES.length)} className="meta flex-1">Skip</Button>
            <Button onClick={() => setI(i + 1)} className="flex-[2]">Next →</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-[calc(104px_+_env(safe-area-inset-bottom))] pt-6">
      <div className="flex items-center justify-between gap-3 meta"><LogoMark /><span>(4) Taste</span></div>
      <h1 className="display mt-10 text-5xl">What do<br />you dig?</h1>
      <p className="mt-3 text-sm">Pick a few. We'll weight your Discover deck toward them.</p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {GENRES.map((g, idx) => {
          const on = picked.includes(g);
          return (
            <Button variant="outline"
              key={g}
              aria-pressed={on}
              onClick={() => setPicked(on ? picked.filter((x) => x !== g) : [...picked, g])}
              className={`h-[68px] min-w-0 justify-start gap-2 px-3 text-left ${on ? "bg-mint text-ink" : "bg-card text-ink"}`}
            >
              <span className="meta">({idx + 1})</span>
              <span className="font-display text-xl font-extrabold">{g}</span>
            </Button>
          );
        })}
      </div>
      <div className="mt-8 space-y-2">
        <Button onClick={() => finish("/connect")} className="w-full">Connect a listening app →</Button>
        <Button variant="outline" onClick={() => finish("/")} className="meta w-full">Skip · start discovering</Button>
      </div>
      <p className="meta mt-6 text-center text-muted-foreground">You can set your Top 8 later on your <Link to="/profile" className="underline">profile</Link>.</p>
    </div>
  );
}
