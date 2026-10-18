import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Aura } from "./Aura";
import { Button } from "@/components/ui/button";
import { LogoMark } from "./Logo";
import { fmt, fmtMult, isToldYa, type Receipt } from "@/lib/toldya";

export function ToldYaTakeover({ r, onClose }: { r: Receipt; onClose: () => void }) {
  const [n, setN] = useState(1);
  useEffect(() => {
    navigator.vibrate?.([40, 30, 80]);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(r.mult); return; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1200);
      setN(1 + (r.mult - 1) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); };
  }, [r.mult]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Told ya" className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-signal text-primary-foreground">
      <div className="animate-flash absolute inset-0 bg-card" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[calc(80px_+_env(safe-area-inset-bottom))] pt-[calc(24px_+_env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2 meta"><LogoMark /><span>Badge earned · No. 01</span></div>
        <h2 className="display mt-8 text-[86px]">told ya.</h2>
        <div className="animate-focus relative mx-auto mt-5 aspect-square w-[170px] shrink-0 overflow-hidden rounded-full">
          <Aura mix={r.artist.aura_mix} listeners={r.now} famous={isToldYa(r)} />
        </div>
        <div className="display mt-5 break-words text-[32px]">{r.artist.name}</div>
        <div className="numeral mt-5 text-[96px]">×{fmtMult(n).replace(/x$/, "")}</div>
        <div className="meta mt-3 border-t border-primary-foreground/40 pt-2">
          Called at {r.call.listeners_at_call.toLocaleString()} · Now {fmt(r.now)} · ×{fmtMult(r.mult).replace(/x$/, "")}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
          <Button variant="outline" onClick={onClose} className="border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">Nice.</Button>
          <Button asChild className="bg-card text-signal hover:bg-card/90"><Link to="/r/$callId" params={{ callId: r.call.id }}>Share it →</Link></Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
