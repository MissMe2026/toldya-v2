import { describe, expect, it } from "vitest";
import { DEMO_CALLS, historicalListeners, newDemoIdentity } from "@/lib/demo-seed";
import { listenersAt, multiplier, status } from "@/lib/toldya";

describe("Per-judge demo", () => {
  it("generates fresh identities with the requested email, handle, and random password", () => {
    const first = newDemoIdentity();
    const second = newDemoIdentity();
    expect(first.email).toMatch(/^demo\+[a-z0-9]{6}@toldya\.app$/);
    expect(first.handle).toMatch(/^demo_[a-z0-9]{4}$/);
    expect(first.password).toHaveLength(32);
    expect(second.email).not.toBe(first.email);
    expect(second.handle).not.toBe(first.handle);
    expect(second.password).not.toBe(first.password);
  });
  it("uses the historical listener formula with a minimum of 50", () => {
    expect(historicalListeners(3400, 59, 21)).toBe(2458);
    expect(historicalListeners(640, 55, 34)).toBe(389);
    expect(historicalListeners(100, 60, 365)).toBe(50);
  });
  it("starts with Rising, Flat and Cooling receipts and a near 2.5x call", () => {
    const seeds = [
      { name: "Ohmra", listeners: 3400, rate: 59 }, { name: "Rue Dahlia", listeners: 640, rate: 55 },
      { name: "Hollis Creek", listeners: 5600, rate: 18 }, { name: "Static Bloom", listeners: 38500, rate: 14 },
      { name: "Glass Coyote", listeners: 22100, rate: -5 }, { name: "The Lantern Kids", listeners: 16300, rate: 6 },
    ];
    const results = seeds.map((a) => {
      const call = DEMO_CALLS.find((c) => c.name === a.name);
      if (!call) throw new Error("Missing demo call");
      const then = historicalListeners(a.listeners, a.rate, call.daysAgo);
      return { name: a.name, then, mult: multiplier(then, a.listeners) };
    });
    expect(new Set(results.map((r) => status(r.mult)))).toEqual(new Set(["Rising", "Flat", "Cooling"]));
    expect(results.find((r) => r.name === "Glass Coyote")?.then).toBeGreaterThan(22100);
    expect(results[0]?.mult).toBeCloseTo(2.49, 2);
  });
  it.each([["Ohmra", 3400, 59], ["Rue Dahlia", 640, 55]] as const)("%s crosses 5x after six months", (name, listeners, rate) => {
    const call = DEMO_CALLS.find((c) => c.name === name);
    if (!call) throw new Error("Missing demo call");
    const then = historicalListeners(listeners, rate, call.daysAgo);
    expect(multiplier(then, listenersAt({ id: name, monthly_listeners: listeners, growth_rate: rate }, 6))).toBeGreaterThanOrEqual(5);
  });
});