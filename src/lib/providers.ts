import type { ImportData } from "./toldya";

/**
 * Listening-app adapters. Each provider implements the same interface so the
 * demo implementation can later be swapped for a real API client.
 */
export interface ProviderAdapter {
  id: string;
  name: string;
  fetchTopArtists(): Promise<ImportData["top_artists"]>;
  fetchRecent(): Promise<string[]>;
}

const POOL: [string, string, number][] = [
  ["Vela Monroe", "pop", 820], ["Kid Saffron", "hip-hop", 4300], ["Nova Lark", "r&b", 12800],
  ["Static Bloom", "electronic", 38500], ["Juno Vex", "pop", 27400], ["Kairo Pulse", "electronic", 88900],
  ["Lucia Fuego", "latin", 71200], ["Paper Moths", "indie", 2100], ["Saint Mercer", "hip-hop", 33600],
  ["Moonmilk", "indie", 560], ["Deltawave", "electronic", 11400], ["The Static Saints", "alt-rock", 410000],
  ["Mira Bloom", "pop", 2_400_000], ["Cassius Dawn", "r&b", 880000], ["Low Tide Club", "indie", 145000],
  ["Fela Nova", "electronic", 63000], ["Hollis Creek", "country", 5600], ["Rio Valente", "latin", 19500],
];

function rng(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((h = (h * 1103515245 + 12345) >>> 0) % 1000) / 1000;
}

function demoAdapter(id: string, name: string): ProviderAdapter {
  return {
    id, name,
    async fetchTopArtists() {
      const r = rng(id);
      const picks = [...POOL].sort(() => r() - 0.5).slice(0, 9);
      return picks.map(([n, g, l], i) => ({ name: n, genre: g, listeners: l, term: i < 3 ? "short" : i < 6 ? "medium" : "long" }));
    },
    async fetchRecent() {
      const r = rng(id + "recent");
      return [...POOL].sort(() => r() - 0.5).slice(0, 5).map(([n]) => n);
    },
  };
}

export const PROVIDERS: ProviderAdapter[] = [
  demoAdapter("spotify", "Spotify"),
  demoAdapter("apple", "Apple Music"),
  demoAdapter("youtube", "YouTube Music"),
  demoAdapter("pandora", "Pandora"),
  demoAdapter("soundcloud", "SoundCloud"),
  demoAdapter("tidal", "Tidal"),
];

export async function importFrom(p: ProviderAdapter): Promise<ImportData> {
  const [top, recent] = await Promise.all([p.fetchTopArtists(), p.fetchRecent()]);
  const genres: Record<string, number> = {};
  top.forEach((t) => (genres[t.genre] = (genres[t.genre] ?? 0) + 1));
  const r = rng(p.id + "m");
  return {
    connected_at: new Date().toISOString(), top_artists: top, genres,
    minutes: Math.round(8000 + r() * 30000), streak: Math.round(5 + r() * 80), recent,
  };
}

export function tasteProfile(connected: Record<string, ImportData>) {
  const sources = Object.keys(connected);
  const genres: Record<string, number> = {};
  const listeners: number[] = [];
  for (const d of Object.values(connected)) {
    for (const [g, n] of Object.entries(d.genres)) genres[g] = (genres[g] ?? 0) + n;
    d.top_artists.forEach((t) => listeners.push(t.listeners));
  }
  const total = Object.values(genres).reduce((a, b) => a + b, 0) || 1;
  const top = Object.entries(genres).sort((a, b) => b[1] - a[1]).map(([g, n]) => ({ genre: g, pct: Math.round((n / total) * 100) }));
  const avg = listeners.length ? listeners.reduce((a, b) => a + b, 0) / listeners.length : 0;
  // 0 = deep underground, 100 = full mainstream (log scale, 100 → 5M listeners)
  const mainstream = avg ? Math.max(0, Math.min(100, Math.round(((Math.log10(avg) - 2) / (Math.log10(5_000_000) - 2)) * 100))) : 0;
  const WORDS: Record<string, string> = {
    pop: "Glossy", "hip-hop": "Heavy", "r&b": "Velvet", indie: "Jangly", electronic: "Nocturnal",
    "alt-rock": "Loud", latin: "Sweaty", country: "Dusty",
  };
  const words = top.slice(0, 2).map((t) => WORDS[t.genre] ?? "Odd");
  words.push(mainstream < 45 ? "Underground" : "Crowd-pleasing");
  return { sources, top, mainstream, words, topGenres: top.slice(0, 3).map((t) => t.genre) };
}
