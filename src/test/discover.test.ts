import { describe, expect, it } from "vitest";
import { discoverDeck } from "@/lib/discover";
import type { Artist } from "@/lib/toldya";

const artist = (id: string, genre: string, growth: number): Artist => ({
  id, name: id, genre, city: "", bio: "", monthly_listeners: 820,
  growth_rate: growth, callers_count: 0,
  aura_mix: { core: "red", mid: "mint", halo: "teal", shape: "orb", angle: 0 },
});
const options = { months: 0, liked: ["indie"], genre: "all", max: Infinity, excluded: new Set<string>() };

describe("Discover ranking", () => {
  it("places taste matches before non-matches regardless of growth", () => {
    const deck = discoverDeck([artist("pop", "pop", 60), artist("indie", "indie", 10)], options);
    expect(deck.map((a) => a.id)).toEqual(["indie", "pop"]);
    expect(deck[0]?.because).toBe("indie");
    expect(deck[1]?.because).toBeUndefined();
  });
  it("sorts highest growth first within both taste groups", () => {
    const deck = discoverDeck([artist("i-low", "indie", 10), artist("p-low", "pop", 5), artist("p-high", "pop", 60), artist("i-high", "indie", 40)], options);
    expect(deck.map((a) => a.id)).toEqual(["i-high", "i-low", "p-high", "p-low"]);
  });
});