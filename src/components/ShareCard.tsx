import { forwardRef } from "react";
import { Aura } from "./Aura";
import { ReceiptDimension } from "./ReceiptDimension";
import { fmt, isToldYa, type Receipt } from "@/lib/toldya";

export const ShareCard = forwardRef<HTMLDivElement, { r: Receipt; handle: string }>(function ShareCard({ r, handle }, ref) {
  const d = new Date(r.call.called_at);
  const month = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return (
    <div ref={ref} className="share-card relative aspect-square w-full overflow-hidden bg-signal text-primary-foreground">
      <div className="absolute inset-0 flex flex-col p-[5%]">
        <div className="flex items-center justify-between gap-2"><span className="display text-xl">ToldYa<sup className="text-[9px]">®</sup></span><span className="meta min-w-0 truncate text-[9px]">@{handle}</span></div>
        <div className="display mt-5 text-[68px]">told ya.</div>
        <div className="mt-3 flex min-h-12 items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full"><Aura mix={r.artist.aura_mix} listeners={r.now} famous={isToldYa(r)} /></div>
          <div className="display min-w-0 break-words text-[27px]">{r.artist.name}</div>
        </div>
        <div className="mt-4"><ReceiptDimension then={r.call.listeners_at_call} now={r.now} mult={r.mult} tone="inverse" /></div>
        <div className="meta mt-3 text-[8px] leading-relaxed">Called at {r.call.listeners_at_call.toLocaleString()} listeners · {month}<br />Now {fmt(r.now)}</div>
        <div className="meta mt-auto flex justify-between gap-2 border-t border-primary-foreground/50 pt-2 text-[8px]"><span>ToldYa®</span><span>artist-tally-keeper.lovable.app</span></div>
      </div>
    </div>
  );
});
