type Mix = { core: string; mid: string; halo: string; shape: string; angle: number };

const C: Record<string, string> = {
  ink: "var(--ink)",
  red: "var(--signal)",
  oxblood: "var(--oxblood)",
  mint: "var(--mint)",
  teal: "var(--teal)",
};

export function blurFor(listeners: number) {
  if (listeners < 1000) return 44;
  if (listeners < 10000) return 36;
  if (listeners < 50000) return 16;
  return 3;
}

export function Aura({ mix, listeners }: { mix: Mix; listeners: number }) {
  const blur = blurFor(listeners);
  const core = C["ink"];
  const mid = C["red"];
  const halo = mix.halo === "mint" ? C["mint"] : C["teal"];
  const shape =
    mix.shape === "capsule"
      ? { width: "46%", height: "78%", borderRadius: "999px" }
      : mix.shape === "silhouette"
        ? { width: "60%", height: "70%", borderRadius: "50% 50% 12% 12% / 60% 60% 10% 10%" }
        : { width: "68%", height: "68%", borderRadius: "50%" };
  const grad = `radial-gradient(ellipse at 50% 45%, ${core} 0%, ${core} 14%, ${mid} 36%, ${halo} 65%, transparent 90%)`;
  const base: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    ...shape,
    transform: `translate(-50%,-50%) rotate(${mix.angle}deg)`,
    filter: `blur(${blur}px)`,
    transition: "filter 600ms ease",
  };
  return (
    <div className="absolute inset-0 overflow-hidden bg-card">
      <div style={{ ...base, background: C["teal"], opacity: 0.65, marginLeft: 12 }} />
      <div style={{ ...base, background: grad }} />
    </div>
  );
}
