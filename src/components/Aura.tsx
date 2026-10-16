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
  const core = C[mix.core] ?? C["ink"];
  const mid = C[mix.mid] ?? C["red"];
  const halo = C[mix.halo] ?? C["teal"];
  const shape =
    mix.shape === "capsule"
      ? { width: "46%", height: "78%", borderRadius: "999px" }
      : mix.shape === "silhouette"
        ? { width: "60%", height: "70%", borderRadius: "50% 50% 12% 12% / 60% 60% 10% 10%" }
        : { width: "68%", height: "68%", borderRadius: "50%" };
  const grad = `radial-gradient(circle at 50% 45%, ${core} 0%, ${mid} 38%, ${halo} 72%, transparent 100%)`;
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
      {/* chromatic fringe */}
      <div style={{ ...base, background: C["red"], opacity: 0.35, marginLeft: -6, mixBlendMode: "multiply" }} />
      <div style={{ ...base, background: C["teal"], opacity: 0.35, marginLeft: 6, mixBlendMode: "multiply" }} />
      <div style={{ ...base, background: grad }} />
      {listeners < 1000 && (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--card) 1px, transparent 1px), linear-gradient(var(--card) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        />
      )}
    </div>
  );
}
