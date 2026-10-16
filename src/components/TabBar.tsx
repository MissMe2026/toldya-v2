import { Link } from "@tanstack/react-router";

const tabs = [
  { to: "/", label: "Discover", n: "(1)" },
  { to: "/calls", label: "My Calls", n: "(2)" },
  { to: "/leaderboard", label: "Board", n: "(3)" },
  { to: "/profile", label: "Profile", n: "(4)" },
] as const;

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: true }}
            className="flex flex-col items-start gap-0.5 px-3 py-3 text-foreground"
            activeProps={{ className: "bg-ink text-primary-foreground" }}
          >
            <span className="meta opacity-70">{t.n}</span>
            <span className="font-display text-sm font-extrabold tracking-tight">{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-5">{children}</div>;
}
