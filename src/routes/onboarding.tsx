import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { updateProfile, useAuth } from "@/hooks/useAuth";
import { GENRES } from "@/lib/toldya";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — ToldYa" },
      { name: "description", content: "Find artists before the hype. Call it. Get the receipts." },
      { property: "og:title", content: "Welcome — ToldYa" },
      { property: "og:description", content: "Find artists before the hype. Call it. Get the receipts." },
    ],
  }),
  component: Onboarding,
});

const SLIDES = [
  { n: "(1)", top: "Streaming apps show you what's already big. We show you what's next.", word: "Before the hype." },
  { n: "(2)", top: "Swipe right to call an artist. Your call is timestamped with their listener count. That's proof.", word: "Call it." },
  { n: "(3)", top: "When they blow up, you get a badge and a brag card. Everyone else gets to hear about it.", word: "TOLD YA." },
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
    const s = SLIDES[i]!;
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <div className="flex-1 bg-signal px-5 pt-6 text-primary-foreground">
          <div className="flex justify-between meta"><span>ToldYa®</span><span>{s.n} / (3)</span></div>
          <p className="caps-block mt-20 max-w-[17rem] text-sm">{s.top}</p>
        </div>
        <div className="relative h-[42vh] overflow-hidden bg-card">
          <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, var(--ink), var(--oxblood) 40%, var(--teal) 75%, transparent)", filter: `blur(${36 - i * 16}px)`, transition: "filter 600ms" }} />
          <h1 key={i} className="display animate-focus absolute bottom-20 left-5 text-6xl text-signal">{s.word}</h1>
          <div className="absolute inset-x-5 bottom-5 flex gap-2">
            <button onClick={() => setI(SLIDES.length)} className="meta flex-1 rounded-md border py-3">Skip</button>
            <button onClick={() => setI(i + 1)} className="display flex-[2] rounded-md bg-ink py-3 text-lg text-primary-foreground">Next →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-5 pb-10 pt-6">
      <div className="flex justify-between meta"><span>ToldYa®</span><span>(4) Taste</span></div>
      <h1 className="display mt-10 text-5xl">What do<br />you dig?</h1>
      <p className="mt-3 text-sm">Pick a few. We'll weight your Discover deck toward them.</p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {GENRES.map((g, idx) => {
          const on = picked.includes(g);
          return (
            <button
              key={g}
              aria-pressed={on}
              onClick={() => setPicked(on ? picked.filter((x) => x !== g) : [...picked, g])}
              className={`flex items-baseline justify-between rounded-md border px-3 py-4 text-left ${on ? "border-ink bg-mint" : "bg-card"}`}
            >
              <span className="display text-xl">{g}</span>
              <span className="meta">({idx + 1})</span>
            </button>
          );
        })}
      </div>
      <div className="mt-8 space-y-2">
        <button onClick={() => finish("/connect")} className="display w-full rounded-md bg-signal py-4 text-xl text-primary-foreground">Connect a listening app →</button>
        <button onClick={() => finish("/")} className="meta w-full rounded-md border py-3">Skip · start discovering</button>
      </div>
      <p className="meta mt-6 text-center text-muted-foreground">You can set your Top 8 later on your <Link to="/profile" className="underline">profile</Link>.</p>
    </div>
  );
}
