export function BadgeStamp({ badge }: { badge: { no: string; name: string; desc: string; earned: boolean; count: number } }) {
  return (
    <div className={`badge-stamp relative flex min-h-[220px] flex-col bg-card p-4 text-ink ${badge.earned ? "" : "text-muted-foreground opacity-50"}`}>
      <div className="flex items-start justify-between gap-2"><span className="numeral text-[48px]">{badge.no}</span><span className="meta text-[9px]">{badge.earned ? "Earned" : "Locked"}</span></div>
      <div aria-hidden="true" className={`my-3 flex h-8 w-12 items-center justify-center ${badge.earned ? "bg-ink text-primary-foreground" : "border border-muted-foreground"}`}><span className="text-xl">{badge.earned ? "★" : "☆"}</span></div>
      <div className="display break-words text-[22px] leading-[0.95] uppercase">{badge.name}{badge.count > 1 ? ` ×${badge.count}` : ""}</div>
      <p className="mt-2 text-[11px] leading-snug">{badge.desc}</p>
      <div className="meta mt-auto border-t pt-3 text-[10px]">ToldYa® 2026</div>
    </div>
  );
}