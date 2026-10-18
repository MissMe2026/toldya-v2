import { useId } from "react";
import { auraStyle, mosaicCells } from "@/lib/aura";
import type { AuraMix } from "@/lib/toldya";

export function blurFor(listeners: number) {
  if (listeners < 1000) return 44;
  if (listeners < 10000) return 36;
  if (listeners < 50000) return 16;
  return 3;
}

export function Aura({ mix, listeners, famous = false }: { mix: AuraMix; listeners: number; famous?: boolean }) {
  const id = useId().replace(/:/g, "");
  const config = auraStyle(mix, listeners, famous);
  const [core, mid, halo] = config.colors;
  const silhouette = "M120 28 C95 28 84 48 84 69 C84 86 92 96 99 101 L99 110 C68 117 43 131 38 154 L30 199 Q120 224 210 199 L202 154 C197 131 172 117 141 110 L141 101 C148 96 156 86 156 69 C156 48 145 28 120 28Z";
  const shape = (fill: string) => config.shape === "silhouette" ? <path d={silhouette} fill={fill} /> : config.shape === "capsule" ?
    <rect x="74" y="20" width="92" height="200" rx="46" fill={fill} /> : <circle cx="120" cy="120" r="86" fill={fill} />;
  return (
    <div className="absolute inset-0 overflow-hidden bg-card" data-aura={famous ? "famous" : config.mosaic ? "mosaic" : "cool"}>
      <svg viewBox="0 0 240 240" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-color`} cx="46%" cy="40%" r="64%">
            <stop offset="0%" stopColor={core} /><stop offset="22%" stopColor={core} />
            <stop offset="48%" stopColor={mid} /><stop offset="78%" stopColor={halo} />
            <stop offset="100%" stopColor="var(--card)" />
          </radialGradient>
          <filter id={`${id}-blur`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={config.blur} />
          </filter>
          <filter id={`${id}-edge`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <g transform={`rotate(${config.angle} 120 120)`}>
          {!famous && <g transform="translate(6 0)" opacity="0.2" filter={`url(#${id}-edge)`}>{shape("var(--signal)")}</g>}
          {config.mosaic ? <g shapeRendering="crispEdges">{mosaicCells(mix).map(c => <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="16" height="16" fill={c.color} opacity={c.opacity} />)}</g> :
            <g filter={`url(#${id}-blur)`}>{shape(`url(#${id}-color)`)}</g>}
        </g>
      </svg>
    </div>
  );
}
