import { Aura } from "@/components/Aura";
import { userAuraMix } from "@/lib/aura";

export function UserAvatar({ handle, className = "", pinned = false }: { handle: string; className?: string; pinned?: boolean }) {
  return (
    <div aria-hidden="true" className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-full ${pinned ? "ring-2 ring-primary-foreground" : "ring-1 ring-ink/18"} ${className}`}>
      <Aura mix={userAuraMix(handle)} listeners={20000} lensEdge={false} />
    </div>
  );
}