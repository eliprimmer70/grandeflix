import type { ReleaseBadge as Badge } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReleaseBadge({ badge }: { badge: Badge }) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-white sm:text-[11px]",
        badge.variant === "soon"
          ? "bg-white/15 backdrop-blur-sm"
          : "bg-white/10 ring-1 ring-white/20",
      )}
    >
      {badge.label}
    </span>
  );
}
