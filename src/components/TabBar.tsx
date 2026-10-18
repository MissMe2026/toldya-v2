import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

const tabs = [
  { to: "/", label: "Discover", n: "(1)" },
  { to: "/calls", label: "My Calls", n: "(2)" },
  { to: "/leaderboard", label: "Board", n: "(3)" },
  { to: "/profile", label: "Profile", n: "(4)" },
] as const;

const HIDDEN = ["/auth", "/onboarding"];

export function TabBar() {
  const { pathname } = useLocation();
  if (HIDDEN.includes(pathname) || pathname.startsWith("/r/")) return null;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t bg-paper pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-16 max-w-md grid-cols-4">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: true }}
            className="flex items-center justify-center border-t-[3px] border-transparent px-2 font-sans text-xs font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-ink"
            activeProps={{ className: "border-ink text-ink" }}
          >
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function PageShell({ children, fitScreen = false }: { children: ReactNode; fitScreen?: boolean }) {
  return <div className={fitScreen ? "discover-shell mx-auto flex max-w-md flex-col overflow-hidden px-4 pt-5" : "mx-auto min-h-screen max-w-md px-4 pb-28 pt-5"}>{children}</div>;
}

export function TopBar({ n, right }: { n: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <Logo />
      <span className="meta text-muted-foreground">{right ?? n}</span>
    </div>
  );
}

export function SignInCta({ what }: { what: string }) {
  return (
    <div className="mt-10 border-y py-5 text-ink">
      <p className="caps-block text-xs">Sign in to {what}. Judges: one tap on "Try the demo" gets you a loaded account.</p>
      <Button asChild className="mt-6"><Link to="/auth">Sign in →</Link></Button>
    </div>
  );
}
