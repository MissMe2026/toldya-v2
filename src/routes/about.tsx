import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, TopBar } from "@/components/TabBar";

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
        <span aria-hidden className="meta [writing-mode:vertical-rl] rotate-180 text-signal">EST. 16.10.2026</span>
        <h1 className="display text-6xl">Tomorrow's<br />charts,<br /><span className="text-signal">today.</span></h1>
      </div>
      <section className="mt-10 bg-signal p-5 text-primary-foreground">
        <div className="meta">The problem</div>
        <p className="caps-block mt-3 text-sm">Fans who find artists early have no proof and no payoff. Streaming apps show what's already popular. Nobody tracks who heard it first.</p>
      </section>
      <section className="mt-8">
        <h2 className="meta border-b pb-1.5">How it works</h2>
        <ol>
          {HOW.map(([t, d], i) => (
            <li key={t} className="flex items-baseline justify-between gap-3 border-b border-signal/40 py-3">
              <span className="display text-2xl text-signal">({i + 1}) {t}</span>
              <span className="max-w-[11rem] text-right text-xs">{d}</span>
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
      <Link to="/" className="display mt-8 inline-block rounded-md bg-ink px-5 py-3 text-xl text-primary-foreground">Start calling →</Link>
    </PageShell>
  );
}
