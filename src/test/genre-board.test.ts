import { describe, expect, it } from "vitest";
import { BOARD_GENRES, currentGenreRow, genreTopThree, seededGenreRows, topTen, type BoardRow } from "@/lib/genre-board";
import { earScore, type Receipt } from "@/lib/toldya";

const row = (score: number): BoardRow => ({ id: String(score), handle: `ear_${score}`, score, calls: 10, hits: 2, me: false });
const now = Date.parse("2026-10-18T04:48:00Z");
function receipt(genre: string, days: number, mult: number): Receipt {
  return {
    artist: { id: genre, name: genre, genre, city: "", bio: "", aura_mix: { core: "ink", mid: "teal", halo: "mint", shape: "orb", angle: 0 }, monthly_listeners: 1000, growth_rate: 10, callers_count: 5 },
    call: { id: `${genre}-${days}`, artist_id: genre, user_id: "me", listeners_at_call: 1000, called_at: new Date(now - days * 86400000).toISOString(), is_big_call: false, callers_at_call: 5 },
    now: 1000 * mult, mult,
  };
}

describe("Board ranking rules", () => {
  it("shows only the top 10 by Ear Score without discarding the full rank list", () => {
    const rows = Array.from({ length: 16 }, (_, i) => row(i + 1));
    expect(topTen(rows).map(r => r.score)).toEqual([16, 15, 14, 13, 12, 11, 10, 9, 8, 7]);
    expect(rows).toHaveLength(16);
  });
  it("shows at most 3 positive-score users per genre", () => {
    expect(genreTopThree([row(0), row(2), row(4), row(1), row(3)]).map(r => r.score)).toEqual([4, 3, 2]);
    expect(genreTopThree([row(0), row(2)]).map(r => r.score)).toEqual([2]);
  });
  it("keeps the six requested genres in their exact order", () => {
    expect(BOARD_GENRES).toEqual(["pop", "hip-hop", "r&b", "latin", "indie", "electronic"]);
  });
  it("partitions fictional scores and counts within existing totals for both periods", () => {
    for (const handle of ["cratedigga", "earlybird.mp3", "vinylvera", "subwoofer_sam", "firstlisten"]) {
      const user = { id: handle, handle, score_all: 9840, score_week: 620, calls: 41, hits: 9 };
      for (const period of ["all", "week"] as const) {
        const rows = Object.values(seededGenreRows(user, period));
        expect(rows.reduce((s, r) => s + r.score, 0)).toBeLessThanOrEqual(period === "all" ? 9840 : 620);
        expect(rows.reduce((s, r) => s + r.calls, 0)).toBeLessThanOrEqual(41);
        expect(rows.reduce((s, r) => s + r.hits, 0)).toBeLessThanOrEqual(9);
        expect(rows.filter(r => r.score > 0).length).toBeGreaterThanOrEqual(1);
        expect(rows.filter(r => r.score > 0).length).toBeLessThanOrEqual(3);
        expect(rows.every(r => r.id === handle && r.hits <= r.calls)).toBe(true);
        expect(seededGenreRows(user, period)).toEqual(seededGenreRows(user, period));
      }
    }
  });
  it("computes user score, calls and hits only from that genre", () => {
    const pop = receipt("pop", 2, 5);
    const rs = [pop, receipt("indie", 2, 8)];
    expect(currentGenreRow("me", "ears", rs, "pop", "all", now)).toMatchObject({ score: earScore([pop]), calls: 1, hits: 1, me: true });
  });
  it("switches genre scores and counts to calls in the last 7 days for This week", () => {
    const recent = receipt("pop", 2, 5);
    const old = receipt("pop", 8, 6);
    expect(currentGenreRow("me", "ears", [recent, old], "pop", "week", now)).toMatchObject({ score: earScore([recent]), calls: 1, hits: 1 });
    expect(currentGenreRow("me", "ears", [recent, old], "pop", "all", now)).toMatchObject({ score: earScore([recent, old]), calls: 2, hits: 2 });
  });
});