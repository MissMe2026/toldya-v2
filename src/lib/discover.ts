import { listenersAt, type Artist } from "./toldya";

export type DiscoverArtist = Artist & { because?: string };

export function discoverDeck(artists: Artist[], options: {
  months: number; liked: string[]; genre: string; max: number; excluded: Set<string>;
}): DiscoverArtist[] {
  return artists
    .map((a) => ({ ...a, monthly_listeners: listenersAt(a, options.months), because: options.liked.includes(a.genre) ? a.genre : undefined }))
    .filter((a) => !options.excluded.has(a.id) && (options.genre === "all" || a.genre === options.genre) && a.monthly_listeners < options.max)
    .sort((a, b) => Number(Boolean(b.because)) - Number(Boolean(a.because)) || Number(b.growth_rate) - Number(a.growth_rate) || a.name.localeCompare(b.name));
}