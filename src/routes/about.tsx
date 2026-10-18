import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, TopBar } from "@/components/TabBar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "About — ToldYa" },
      { name: "description", content: "Why ToldYa exists, how it works, and what's next." },
      { property: "og:title", content: "About — ToldYa" },
      { property: "og:description", content: "Why ToldYa exists, how it works, and what's next." },
    ],
  }),
  component: About,
});

const HOW = [
  ["Discover", "Swipe a deck of emerging artists."],
  ["Call it", "Your call is timestamped with their listener count."],
  ["Receipts", "Watch then vs. now, and your growth multiplier."],
  ["TOLD YA", "When they blow up, you get the badge and the brag card."],
];
const NEXT = ["Real listening data from Spotify & Apple Music", "Real rewards: early concert access, merch drops", "Follow friends and compare calls", "Insights for labels and venues"];

function About() {
  return (
    <PageShell>
      <TopBar n="About" />
      <div className="relative mt-8 flex gap-4">
        <span aria-hidden className="meta [writing-mode:vertical-rl] rotate-180 text-ink">EST. 16.10.2026</span>
        <h1 className="display min-w-0 text-5xl text-ink">Tomorrow's<br />charts,<br />today.</h1>
      </div>
      <section className="mt-10 text-ink">
        <h2 className="meta border-b pb-1.5">The problem</h2>
        <p className="caps-block mt-3 text-sm">Fans who find artists early have no proof and no payoff. Streaming apps show what's already popular. Nobody tracks who heard it first.</p>
      </section>
      <section className="mt-8">
        <h2 className="meta border-b pb-1.5">How it works</h2>
        <ol>
          {HOW.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-2 items-baseline gap-3 border-b py-3">
              <span className="flex items-baseline gap-2 text-ink"><span className="meta">({i + 1})</span><span className="font-display text-xl font-extrabold">{t}</span></span>
              <span className="text-right text-xs">{d}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-8">
        <h2 className="meta border-b pb-1.5">What's next</h2>
        <ul className="mt-2 columns-2 gap-4 text-xs">
          {NEXT.map((n) => <li key={n} className="mb-2 break-inside-avoid">* {n}</li>)}
        </ul>
      </section>
      <Button asChild className="mt-8"><Link to="/">Start calling →</Link></Button>
    </PageShell>
  );
}
