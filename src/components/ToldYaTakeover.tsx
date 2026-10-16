import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { Aura } from "./Aura";
import { fmt, fmtMult, type Receipt } from "@/lib/toldya";

export function ToldYaTakeover({ r, onClose }: { r: Receipt; onClose: () => void }) {
  const [n, setN] = useState(1);
  const [sharp, setSharp] = useState(false);
  useEffect(() => {
    navigator.vibrate?.([40, 30, 80]);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1200);
      setN(1 + (r.mult - 1) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const s = setTimeout(() => setSharp(true), 150);
    return () => { cancelAnimationFrame(raf); clearTimeout(s); };
  }, [r.mult]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Told ya" className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-signal text-primary-foreground">
      <div className="animate-flash absolute inset-0 bg-card" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-6 pt-6">
        <div className="flex justify-between meta"><span>ToldYa® · Badge earned</span><span>No. 01</span></div>
        <div className="relative mx-auto mt-6 aspect-square w-60 overflow-hidden rounded-full">
          <Aura mix={r.artist.aura_mix} listeners={sharp ? 100000 : 300} />
        </div>
        <h2 className="display mt-6 text-[22vw] leading-[0.8] sm:text-8xl">TOLD<br />YA.</h2>
        <div className="mt-4 flex items-end justify-between">
          <div className="display text-2xl">{r.artist.name}</div>
          <div className="numeral text-7xl">{fmtMult(n)}</div>
        </div>
        <div className="meta mt-3 border-t border-primary-foreground/40 pt-2">
          Called at {r.call.listeners_at_call.toLocaleString()} · Now {fmt(r.now)} · {fmtMult(r.mult)}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
          <button onClick={onClose} className="display rounded-md border border-primary-foreground py-3 text-lg">Nice.</button>
          <Link to="/r/$callId" params={{ callId: r.call.id }} className="display rounded-md bg-card py-3 text-center text-lg text-signal">
            Share it →
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
