import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { SimBanner } from "@/components/FastForward";

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
            className={`flex items-center justify-center border-t-[3px] px-2 font-sans text-xs font-medium focus-visible:outline-2 focus-visible:outline-ink ${pathname === t.to ? "border-ink text-ink" : "border-transparent text-muted-foreground"}`}
          >
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function PageShell({ children, fitScreen = false }: { children: ReactNode; fitScreen?: boolean }) {
  const { pathname } = useLocation();
  const mainTab = tabs.some((tab) => tab.to === pathname);
  return <div className={fitScreen ? "discover-shell mx-auto flex max-w-md flex-col px-4" : `mx-auto min-h-screen max-w-md px-4 pb-28 ${mainTab ? "" : "pt-5"}`}>{children}</div>;
}

export function TopBar({ n, right }: { n: string; right?: ReactNode }) {
  const { pathname } = useLocation();
  if (tabs.some((tab) => tab.to === pathname)) return (
    <header className="main-tab-banner sticky top-0 z-40 shrink-0 bg-signal pt-[env(safe-area-inset-top)] text-primary-foreground">
      <SimBanner embedded />
      <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-2 px-4">
        <Logo className="text-primary-foreground" />
        <div className="flex min-w-0 items-center gap-2 meta text-primary-foreground">{right ?? <span className="opacity-90">{n}</span>}</div>
      </div>
    </header>
  );
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
