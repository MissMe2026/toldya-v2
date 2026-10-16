import { createServerFn } from "@tanstack/react-start";

export const DEMO_EMAIL = "demo@toldya.app";
export const DEMO_PASSWORD = "toldya-demo-2026";

const DEMO_CALLS: { name: string; daysAgo: number; big?: boolean; callers: number }[] = [
  { name: "Ohmra", daysAgo: 21, big: true, callers: 12 },
  { name: "Rue Dahlia", daysAgo: 34, big: true, callers: 3 },
  { name: "Hollis Creek", daysAgo: 9, callers: 40 },
  { name: "Static Bloom", daysAgo: 48, callers: 260 },
  { name: "Glass Coyote", daysAgo: 15, callers: 180 },
  { name: "The Lantern Kids", daysAgo: 4, callers: 110 },
];

/**
 * Public endpoint: ensures the shared demo account exists and resets it to a
 * known state so every judge gets the same experience. Touches only the demo user.
 */
export const prepareDemo = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list?.users.find((u) => u.email === DEMO_EMAIL);
  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { handle: "demo_judge" },
    });
    if (error || !data.user) throw new Error("Could not prepare the demo account");
    user = data.user;
  }
  const { importFrom, PROVIDERS } = await import("./providers");
  const spotify = await importFrom(PROVIDERS[0]!);
  const apple = await importFrom(PROVIDERS[1]!);
  await supabaseAdmin.from("profiles").upsert({
    id: user.id, handle: "demo_judge", sim_months: 0, onboarded: true,
    genres: ["electronic", "indie", "alt-rock"],
    connected: { spotify, apple } as never,
    top8: [
      { name: "Kairo Pulse" }, { name: "Moonmilk" }, { name: "Static Bloom" }, { name: "Nova Lark" },
      { name: "Paper Moths" }, { name: "Deltawave" }, { name: "Juno Vex" }, { name: "Mira Bloom" },
    ] as never,
  });
  const { data: artists } = await supabaseAdmin.from("artists").select("id,name,monthly_listeners");
  await supabaseAdmin.from("calls").delete().eq("user_id", user.id);
  const rows = DEMO_CALLS.flatMap((c) => {
    const a = artists?.find((x) => x.name === c.name);
    if (!a) return [];
    return [{
      user_id: user!.id, artist_id: a.id, listeners_at_call: a.monthly_listeners,
      called_at: new Date(Date.now() - c.daysAgo * 86400000).toISOString(), is_big_call: !!c.big, callers_at_call: c.callers,
    }];
  });
  await supabaseAdmin.from("calls").insert(rows);
  return { email: DEMO_EMAIL, password: DEMO_PASSWORD };
});
