import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTryDemo } from "@/hooks/useTryDemo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sign in — ToldYa" },
      { name: "description", content: "Sign in to ToldYa or try the demo in one tap." },
      { property: "og:title", content: "Sign in — ToldYa" },
      { property: "og:description", content: "Sign in to ToldYa or try the demo in one tap." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { tryDemo, busy: demoBusy } = useTryDemo();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState<"" | "form">("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("form");
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding`, data: { handle } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/onboarding", replace: true });
        else setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-[calc(88px_+_env(safe-area-inset-bottom))]">
      <div className="bg-signal px-5 pb-8 pt-6 text-primary-foreground">
        <div className="flex justify-between meta"><span>ToldYa®</span><span>Est. 2026</span></div>
        <p className="caps-block mt-16 max-w-[16rem] text-xs">
          Call the next big artist before they blow up. Your call is timestamped with their listener count. That's your proof.
        </p>
        <h1 className="display mt-8 text-7xl">called it.</h1>
      </div>
      <div className="flex-1 px-5 py-6">
        <Button
          onClick={tryDemo}
          disabled={!!busy || demoBusy}
          className="w-full shadow-none"
        >
          {demoBusy ? "Loading receipts…" : "Try the demo →"}
        </Button>
        <p className="meta mt-2 text-center text-muted-foreground">One tap · pre-loaded account · for judges</p>

        <div className="my-6 flex items-center gap-3 meta text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>

        {sent ? (
          <div className="rounded-md border bg-card p-4">
            <div className="display text-2xl">Check your inbox.</div>
            <p className="mt-2 text-sm">We sent a confirmation link to {email}. Tap it and you're in.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-2">
            {mode === "up" && (
              <label className="block">
                <span className="meta">Handle</span>
                <input required value={handle} onChange={(e) => setHandle(e.target.value)} className="mt-1 w-full rounded-sm border bg-card px-3 py-2.5 text-sm outline-none focus:border-ink" />
              </label>
            )}
            <label className="block">
              <span className="meta">Email</span>
              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-sm border bg-card px-3 py-2.5 text-sm outline-none focus:border-ink" />
            </label>
            <label className="block">
              <span className="meta">Password</span>
              <input required minLength={6} type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-sm border bg-card px-3 py-2.5 text-sm outline-none focus:border-ink" />
            </label>
            <Button type="submit" disabled={!!busy || demoBusy} className="mt-2 w-full">
              {busy === "form" ? "…" : mode === "in" ? "Sign in" : "Create account"}
            </Button>
            <Button variant="link" type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="meta w-full text-ink underline">
              {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
