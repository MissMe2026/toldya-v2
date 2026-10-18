import type { AuraMix } from "./toldya";

const COOL: Record<string, string> = {
  ink: "var(--ink)", oxblood: "var(--ink)", red: "var(--deep-teal)",
  "deep-teal": "var(--deep-teal)", teal: "var(--teal)", mint: "var(--mint)",
  grey: "var(--aura-grey)", gray: "var(--aura-grey)",
};

export function auraStyle(mix: AuraMix, listeners: number, famous = false) {
  return {
    colors: famous ? ["var(--ink)", "var(--signal)", "var(--mint)"] :
      [COOL[mix.core] ?? COOL.ink, COOL[mix.mid] ?? COOL.teal, COOL[mix.halo] ?? COOL.mint],
    mosaic: !famous && listeners < 1000,
    blur: famous ? 0 : listeners < 1000 ? 0 : listeners < 10000 ? 14 : listeners < 50000 ? 7 : 0.8,
    shape: mix.shape === "capsule" || mix.shape === "silhouette" ? mix.shape : "orb",
    angle: ((mix.angle % 60) - 30) / 2,
  };
}

export function mosaicCells(mix: AuraMix) {
  const { colors, shape } = auraStyle(mix, 0);
  const cells: { x: number; y: number; color: string; opacity: number }[] = [];
  for (let y = 24; y < 224; y += 16) for (let x = 24; x < 224; x += 16) {
    const nx = (x + 8 - 120) / 82, ny = (y + 8 - 120) / 82;
    const distance = shape === "capsule" ? Math.sqrt((nx / 0.54) ** 2 + (ny / 1.15) ** 2) :
      shape === "silhouette" ? Math.min(Math.hypot(nx / 0.39, (ny + 0.57) / 0.42), Math.hypot(nx / 0.9, (ny - 0.58) / 0.62)) : Math.hypot(nx, ny);
    if (distance > 1.13) continue;
    const band = distance < 0.38 ? 0 : distance < 0.78 ? 1 : 2;
    const variation = ((x * 7 + y * 13 + mix.angle) % 11) / 11;
    cells.push({ x, y, color: colors[band] ?? "var(--teal)", opacity: distance > 1 ? 0.3 : 0.8 + variation * 0.2 });
  }
  return cells;
}