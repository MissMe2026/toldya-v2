import { PageShell } from "./TabBar";

export function Placeholder({ n, title, word, note }: { n: string; title: string[]; word: string; note: string }) {
  return (
    <PageShell>
      <div className="flex items-center justify-between">
        <span className="display text-xl">ToldYa®</span>
        <span className="meta text-muted-foreground">{n}</span>
      </div>
      <h1 className="display mt-10 text-6xl text-signal">
        {title.map((l) => (
          <span key={l} className="block">{l}</span>
        ))}
      </h1>
      <div className="mt-10 border-t pt-3 meta text-muted-foreground">{note}</div>
      <div className="relative mt-16 overflow-hidden rounded-md bg-signal p-5 text-primary-foreground">
        <p className="caps-block text-xs">Coming soon. Keep calling artists in Discover — every call is timestamped and saved as proof.</p>
        <div className="display mt-16 text-7xl">{word}</div>
      </div>
    </PageShell>
  );
}
