import { earScore, isToldYa, type Receipt } from "./toldya";

export const BOARD_GENRES = ["pop", "hip-hop", "r&b", "latin", "indie", "electronic"] as const;
export type BoardGenre = typeof BOARD_GENRES[number];
export type BoardPeriod = "week" | "all";
export type BoardRow = { id: string; handle: string; score: number; calls: number; hits: number; me: boolean };
type SeededUser = { id: string; handle: string; score_all: number; score_week: number; calls: number; hits: number };

/** Stable favourite genres partition each fictional user's existing totals. */
export function seededGenreRows(user: SeededUser, period: BoardPeriod): Record<BoardGenre, BoardRow> {
  let hash = 0;
  for (const char of user.handle) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  const start = hash % BOARD_GENRES.length;
  const count = 1 + (hash >>> 4) % 3;
  const weights = count === 1 ? [1] : count === 2 ? [0.65, 0.35] : [0.5, 0.3, 0.2];
  const total = period === "all" ? user.score_all : user.score_week;
  return Object.fromEntries(BOARD_GENRES.map((genre, index) => {
    const offset = (index - start + BOARD_GENRES.length) % BOARD_GENRES.length;
    const weight = weights[offset] ?? 0;
    const calls = Math.floor(user.calls * weight);
    const hits = user.calls > 0 ? Math.floor(calls * user.hits / user.calls) : 0;
    return [genre, { id: user.id, handle: user.handle, score: Math.floor(total * weight), calls, hits, me: false }];
  })) as Record<BoardGenre, BoardRow>;
}

export function currentGenreRow(id: string, handle: string, rs: Receipt[], genre: BoardGenre, period: BoardPeriod, now: number): BoardRow {
  const selected = rs.filter(r => r.artist.genre === genre && (period === "all" || now - +new Date(r.call.called_at) < 7 * 86400000));
  return { id, handle, score: earScore(selected), calls: selected.length, hits: selected.filter(isToldYa).length, me: true };
}

export function topTen(rows: BoardRow[]): BoardRow[] {
  return [...rows].sort((a, b) => b.score - a.score).slice(0, 10);
}

export function genreTopThree(rows: BoardRow[]): BoardRow[] {
  return rows.filter(row => row.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}