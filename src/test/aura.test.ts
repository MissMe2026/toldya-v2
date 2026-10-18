import { describe, expect, it } from "vitest";
import { auraStyle, mosaicCells, userAuraMix } from "@/lib/aura";
const mix = { core: "oxblood", mid: "red", halo: "mint", shape: "capsule", angle: 110 };

describe("user aura rules", () => {
  it("gives the same handle a stable mix and character-derived angle", () => {
    expect(userAuraMix("abc")).toEqual(userAuraMix("abc"));
    expect(userAuraMix("abc").angle).toBe(78);
    expect(userAuraMix("abc")).not.toEqual(userAuraMix("abd"));
  });
  it("uses only cool colors and an orb for every user", () => {
    for (const handle of ["demo_1234", "wallis", "abc", "abd", ""]) {
      const avatar = userAuraMix(handle);
      expect(avatar.shape).toBe("orb");
      expect(avatar.core).toBe("ink");
      expect(["teal", "deep-teal"]).toContain(avatar.mid);
      expect(avatar.halo).toBe("mint");
      expect(auraStyle(avatar, 20000).colors).not.toContain("var(--signal)");
    }
  });
});

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