import { fmt, fmtMult } from "@/lib/toldya";

export function ReceiptDimension({ then, now, mult, tone = "neutral" }: { then: number; now: number; mult: number; tone?: "neutral" | "rising" | "inverse" }) {
  return (
    <div className="receipt-dimension grid grid-cols-[1fr_0.9fr_1fr] items-end gap-2">
      <div className="min-w-0"><div className="meta mb-2">Then</div><div className="numeral receipt-measure">{fmt(then)}</div></div>
      <div className={`dimension-rule relative mb-3 border-t ${tone === "rising" ? "text-signal border-signal" : tone === "inverse" ? "text-primary-foreground border-primary-foreground" : "text-muted-foreground border-muted-foreground"}`}>
        <span className="absolute -left-px -top-1 h-2 border-l border-current" />
        <span className="absolute -right-px -top-1 h-2 border-r border-current" />
        <span className="meta absolute inset-x-0 bottom-2 text-center">×{fmtMult(mult).replace(/x$/, "")}</span>
      </div>
      <div className="min-w-0 text-right"><div className="meta mb-2">Now</div><div className="numeral receipt-measure">{fmt(now)}</div></div>
    </div>
  );
}