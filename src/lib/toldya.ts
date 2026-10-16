export type AuraMix = { core: string; mid: string; halo: string; shape: string; angle: number };
export type Artist = {
  id: string; name: string; genre: string; city: string; bio: string;
  aura_mix: AuraMix; monthly_listeners: number; growth_rate: number; callers_count: number;
};
export type Call = {
  id: string; user_id: string; artist_id: string; listeners_at_call: number;
  called_at: string; is_big_call: boolean; callers_at_call: number;
};
export type Profile = {
  id: string; handle: string; sim_months: number; genres: string[]; onboarded: boolean;
  top8: Top8Item[]; connected: Record<string, ImportData>;
};
export type Top8Item = { name: string; artist_id?: string; genre?: string };
export type ImportData = {
  connected_at: string;
  top_artists: { name: string; genre: string; listeners: number; term: "short" | "medium" | "long" }[];
  genres: Record<string, number>;
  minutes: number; streak: number; recent: string[];
};

export const GENRES = ["pop", "hip-hop", "r&b", "indie", "electronic", "alt-rock", "latin", "country"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

/** Listeners for an artist after `months` of simulated time (deterministic). */
export function listenersAt(a: Pick<Artist, "id" | "monthly_listeners" | "growth_rate">, months: number) {
  if (months <= 0) return a.monthly_listeners;
  const noise = 1 + (hash(a.id + ":" + months) - 0.5) * 0.16;
  return Math.max(50, Math.round(a.monthly_listeners * Math.pow(1 + Number(a.growth_rate) / 100, months) * noise));
}

export const multiplier = (then: number, now: number) => now / Math.max(1, then);
export function status(mult: number) {
  if (mult >= 1.15) return "Rising" as const;
  if (mult <= 0.95) return "Cooling" as const;
  return "Flat" as const;
}

export const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};
export const fmtMult = (m: number) => `${m >= 10 ? m.toFixed(0) : m.toFixed(1)}x`;
export const stampDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
export const niceDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function hype(a: Artist) {
  return Math.max(4, Math.min(99, Math.round(((Number(a.growth_rate) + 5) / 65) * 100)));
}

export type Receipt = { call: Call; artist: Artist; now: number; mult: number };
export function receipts(calls: Call[], artists: Artist[], months: number): Receipt[] {
  const byId = new Map(artists.map((a) => [a.id, a]));
  return calls.flatMap((c) => {
    const artist = byId.get(c.artist_id);
    if (!artist) return [];
    const now = listenersAt(artist, months);
    return [{ call: c, artist, now, mult: multiplier(c.listeners_at_call, now) }];
  });
}

export const isToldYa = (r: Receipt) => r.mult >= 5;
export function badges(rs: Receipt[]) {
  const toldYa = rs.filter(isToldYa);
  return [
    { key: "toldya", no: "01", name: "TOLD YA", desc: "A call grew 5x or more", earned: toldYa.length > 0, count: toldYa.length },
    { key: "hype", no: "02", name: "Before the Hype", desc: "Called under 1K, now past 50K", earned: rs.some((r) => r.call.listeners_at_call < 1000 && r.now >= 50000), count: 0 },
    { key: "golden", no: "03", name: "Golden Ears", desc: "Three TOLD YA calls", earned: toldYa.length >= 3, count: 0 },
    { key: "first100", no: "04", name: "First 100", desc: "Among an artist's first 100 callers", earned: rs.some((r) => r.call.callers_at_call < 100), count: 0 },
  ];
}

export function earScore(rs: Receipt[]) {
  return Math.round(
    rs.reduce((s, r) => s + Math.max(0, r.mult - 1) * Math.sqrt(100000 / Math.max(300, r.call.listeners_at_call)) * 10, 0),
  );
}
