import { z } from 'zod';
import { nameKey } from './artist-data';

export class MusicApiError extends Error {
  constructor(public readonly code: string, public readonly retryable = false) { super(code); }
}
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const listOf = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
const ArtistInfo = z.object({ name: z.string().min(1).max(300), url: z.string(), mbid: z.string().optional(), stats: z.object({ listeners: z.coerce.number().int().min(0).max(2147483647), playcount: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER) }), tags: z.object({ tag: z.union([z.array(z.object({ name: z.string() })),z.object({ name: z.string() })]).optional() }).optional() });

export function musicApi(key: string) {
  let lastRequest = 0;
  async function json(url: URL, lastfm: boolean): Promise<Record<string, any>> {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastfm) { await sleep(Math.max(0, 260 - (Date.now()-lastRequest))); lastRequest = Date.now(); }
      let response: Response;
      try { response = await fetch(url, { headers: { 'User-Agent': 'ToldYa/0.2' }, signal: AbortSignal.timeout(4000) }); }
      catch { throw new MusicApiError('provider_timeout', true); }
      if (response.status === 429 || response.status >= 500) {
        if (attempt === 2) throw new MusicApiError(`provider_${response.status}`, true);
        const retry = Number(response.headers.get('retry-after'));
        if (retry > 3) throw new MusicApiError('provider_429', true);
        await response.body?.cancel();
        await sleep(Math.max(retry * 1000 || 0, 500 * 2 ** attempt)); continue;
      }
      if (!response.ok) { await response.body?.cancel(); throw new MusicApiError(`provider_${response.status}`); }
      let data: Record<string, any>;
      try { data = await response.json(); } catch { throw new MusicApiError('invalid_provider_response', true); }
      if (data.error) {
        if (lastfm && [16,29].includes(Number(data.error))) {
          if (attempt === 2) throw new MusicApiError('lastfm_rate_or_unavailable', true);
          await sleep(500 * 2 ** attempt); continue;
        }
        throw new MusicApiError(lastfm ? `lastfm_error_${Number(data.error)}` : 'deezer_error');
      }
      return data;
    }
    throw new MusicApiError('retry_exhausted', true);
  }
  async function lastfm(method: string, params: Record<string,string>) {
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.search = new URLSearchParams({ ...params, method, api_key: key, format: 'json' }).toString();
    return json(url,true);
  }
  return {
    async candidates(tag: string, page: number) {
      const data = await lastfm('tag.getTopArtists', { tag, page: String(page), limit: '50' });
      return listOf<{name:string}>(data.topartists?.artist).map(a => a.name).filter(n => typeof n === 'string');
    },
    async similar(artist: string) {
      const data = await lastfm('artist.getSimilar', { artist, limit: '50', autocorrect: '1' });
      return listOf<{name:string}>(data.similarartists?.artist).map(a => a.name).filter(n => typeof n === 'string');
    },
    async info(artist: string) {
      const data = await lastfm('artist.getInfo', { artist, autocorrect: '1' });
      const a = ArtistInfo.parse(data.artist);
      return { name: a.name, listeners: a.stats.listeners, playcount: a.stats.playcount, url: a.url, mbid: a.mbid || null, tags: listOf(a.tags?.tag).map(t=>t.name).slice(0,10) };
    },
    async deezer(name: string, id?: number | null) {
      if (id) {
        const data = await json(new URL(`https://api.deezer.com/artist/${id}`),false);
        return nameKey(String(data.name)) === nameKey(name) && Number.isInteger(data.nb_fan) ? { id, fans: Number(data.nb_fan) } : null;
      }
      const url = new URL('https://api.deezer.com/search/artist'); url.searchParams.set('q',name); url.searchParams.set('limit','25');
      const data = await json(url,false);
      const matches = listOf<{id:number;name:string}>(data.data).filter(a=>nameKey(a.name) === nameKey(name));
      if (matches.length !== 1) return null;
      const match = matches[0]; if (!match) return null;
      const detail = await json(new URL(`https://api.deezer.com/artist/${match.id}`),false);
      return nameKey(String(detail.name)) === nameKey(name) && Number.isInteger(detail.nb_fan) ? { id: match.id, fans: Number(detail.nb_fan) } : null;
    },
  };
}