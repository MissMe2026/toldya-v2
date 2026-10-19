import { createServerFn } from "@tanstack/react-start";
import { DEMO_CALLS, historicalListeners, newDemoIdentity } from "./demo-seed";

/**
 * Public demo entry: creates and seeds only a fresh account for this caller.
 * Existing users and other judges' demo accounts are never read or reset.
 */
export const prepareDemo = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const identity = newDemoIdentity();
  const { data: account, error: accountError } = await supabaseAdmin.auth.admin.createUser({
    email: identity.email, password: identity.password, email_confirm: true, user_metadata: { handle: identity.handle },
  });
  if (accountError || !account.user) throw new Error("Could not prepare the demo account");
  const userId = account.user.id;
  const { importFrom, PROVIDERS } = await import("./providers");
  const spotifyProvider = PROVIDERS.find((p) => p.id === "spotify");
  const appleProvider = PROVIDERS.find((p) => p.id === "apple");
  if (!spotifyProvider || !appleProvider) throw new Error("Demo listening apps unavailable");
  const [spotify, apple] = await Promise.all([importFrom(spotifyProvider), importFrom(appleProvider)]);
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    id: userId, handle: identity.handle, sim_months: 0, onboarded: true,
    genres: ["electronic", "indie", "alt-rock"],
    connected: { spotify, apple } as never,
    top8: [
      { name: "Kairo Pulse" }, { name: "Moonmilk" }, { name: "Static Bloom" }, { name: "Nova Lark" },
      { name: "Paper Moths" }, { name: "Deltawave" }, { name: "Juno Vex" }, { name: "Mira Bloom" },
    ] as never,
  });
  if (profileError) throw new Error("Could not prepare demo profile");
  const { data: artists, error: artistError } = await supabaseAdmin.from("artists").select("id,name,monthly_listeners,growth_rate").eq("source", "demo");
  if (artistError || !artists) throw new Error("Could not load demo artists");
  const now = Date.now();
  const rows = DEMO_CALLS.flatMap((c) => {
    const a = artists?.find((x) => x.name === c.name);
    if (!a) return [];
    return [{
      user_id: userId, artist_id: a.id, listeners_at_call: historicalListeners(a.monthly_listeners, Number(a.growth_rate), c.daysAgo),
      called_at: new Date(now - c.daysAgo * 86400000).toISOString(), is_big_call: c.big, callers_at_call: c.callers,
    }];
  });
  if (rows.length !== 6) throw new Error("Demo artists are incomplete");
  const { error: callsError } = await supabaseAdmin.from("calls").insert(rows);
  if (callsError) throw new Error("Could not prepare demo receipts");
  return { email: identity.email, password: identity.password };
});
