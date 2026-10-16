import { forwardRef } from "react";
import { Aura } from "./Aura";
import { fmt, fmtMult, type Receipt } from "@/lib/toldya";

export const ShareCard = forwardRef<HTMLDivElement, { r: Receipt; handle: string }>(function ShareCard({ r, handle }, ref) {
  const d = new Date(r.call.called_at);
  const month = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return (
    <div ref={ref} className="relative aspect-square w-full overflow-hidden bg-signal text-primary-foreground">
      <div className="absolute right-[-12%] top-[8%] h-[62%] w-[62%] overflow-hidden rounded-full">
        <Aura mix={r.artist.aura_mix} listeners={100000} />
      </div>
      <div className="absolute inset-0 flex flex-col p-[5%]">
        <div className="flex justify-between meta"><span>Issue No. {d.getFullYear()}</span><span>@{handle}</span></div>
        <div className="caps-block mt-[4%] max-w-[45%] text-[9px] leading-tight">You heard it first. Receipts attached. Tomorrow's charts, today.</div>
        <div className="mt-auto">
          <div className="display text-[13vw] leading-[0.8] sm:text-[4.6rem]">TOLD<br />YA.<sup className="text-base">®</sup></div>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <div className="display text-2xl">{r.artist.name}</div>
              <div className="meta mt-1">Called at {r.call.listeners_at_call.toLocaleString()} listeners · {month}</div>
              <div className="meta">Now: {fmt(r.now)}</div>
            </div>
            <div className="numeral text-6xl">{fmtMult(r.mult)}</div>
          </div>
          <div className="mt-3 flex justify-between border-t border-primary-foreground/50 pt-1.5 meta"><span>ToldYa®</span><span>toldya.lovable.app</span></div>
        </div>
      </div>
    </div>
  );
});
