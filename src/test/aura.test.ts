import { describe, expect, it } from "vitest";
import { auraStyle, mosaicCells } from "@/lib/aura";
const mix = { core: "oxblood", mid: "red", halo: "mint", shape: "capsule", angle: 110 };

describe("artist aura rules", () => {
  it("maps red and oxblood to cool colors", () => {
    expect(auraStyle(mix, 1200).colors).toEqual(["var(--ink)", "var(--deep-teal)", "var(--mint)"]);
    expect(mosaicCells(mix).every(c => c.color !== "var(--signal)")).toBe(true);
  });
  it("uses a mosaic only below 1000 listeners and preserves focus stages", () => {
    expect(auraStyle(mix, 999).mosaic).toBe(true);
    expect(auraStyle(mix, 1000).mosaic).toBe(false);
    expect([1000, 10000, 50000].map(n => auraStyle(mix, n).blur)).toEqual([14, 7, 0.8]);
  });
  it("makes famous auras red and immediately sharp regardless of listeners", () => {
    expect(auraStyle(mix, 300, true)).toMatchObject({ colors: ["var(--ink)", "var(--signal)", "var(--mint)"], mosaic: false, blur: 0 });
  });
  it("gives the three shapes distinct mosaics", () => {
    const counts = ["orb", "capsule", "silhouette"].map(shape => mosaicCells({ ...mix, shape }).length);
    expect(new Set(counts).size).toBe(3);
  });
});