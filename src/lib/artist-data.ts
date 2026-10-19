import type { AuraMix } from './toldya';

export const GENRE_TAGS = { pop: 'pop', 'hip-hop': 'hip-hop', 'r&b': 'rnb', latin: 'latin', indie: 'indie', electronic: 'electronic', 'alt-rock': 'alternative rock', country: 'country' } as const;
export type RealGenre = keyof typeof GENRE_TAGS;
export const TIER_TARGETS = { big: 20, mid: 45, small: 60 };
export type Tier = keyof typeof TIER_TARGETS;
export const artistTier = (listeners: number): Tier => listeners >= 1_000_000 ? 'big' : listeners >= 50_000 ? 'mid' : 'small';
export const nameKey = (name: string) => name.normalize('NFKC').trim().toLocaleLowerCase('en-US');
export function eligibleArtist(name: string, listeners: number, known: string[] = []) {
  const key = nameKey(name);
  if (listeners < 1000 || /\bfeat\.|\bfeaturing\b|\[unknown\]|^unknown$|^various artists$/i.test(key)) return false;
  if (known.some(n => nameKey(n) === key)) return false;
  // Keep legitimate ampersand bands; reject composite entries for already-known acts.
  return !key.includes('&') || !key.split('&').some(part => known.some(n => nameKey(n) === part.trim()));
}
export function realArtistAura(name: string, genre: string): AuraMix {
  let hash = 2166136261;
  for (const ch of nameKey(name) + ':' + genre) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return { angle: hash % 360, core: 'ink', mid: hash % 2 ? 'teal' : 'deep-teal', halo: hash % 3 ? 'mint' : 'grey', shape: ['orb', 'capsule', 'silhouette'][hash % 3] ?? 'orb' };
}
export function snapshotGrowth(snapshots: { taken_on: string; listeners: number }[]) {
  const sorted = [...snapshots].sort((a,b) => a.taken_on.localeCompare(b.taken_on));
  const current = sorted.at(-1);
  if (!current || sorted.length < 2) return 0;
  const cutoff = new Date(current.taken_on + 'T00:00:00Z'); cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  const older = sorted.filter(s => s.taken_on < current.taken_on);
  const baseline = older.find(s => s.taken_on >= cutoff.toISOString().slice(0,10)) ?? older.at(-1);
  return baseline && baseline.listeners > 0 ? Math.round((current.listeners / baseline.listeners - 1) * 100 * 10000) / 10000 : 0;
}