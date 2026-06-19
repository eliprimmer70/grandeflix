"use client";

import { motion } from "framer-motion";
import type { ContentItem } from "@/lib/types";
import { ReleaseBadge } from "@/components/ui/ReleaseBadge";
import { ContentThumbnail } from "@/components/media/ContentThumbnail";
import { getPosterUrl, getReleaseBadge } from "@/lib/utils";
import { useCanHover } from "@/lib/hooks/useCanHover";

export function MediaCard({
  item,
  priority = false,
  showBadge = true,
  onPreview,
}: {
  item: ContentItem;
  priority?: boolean;
  showBadge?: boolean;
  onPreview?: (item: ContentItem) => void;
}) {
  const badge = showBadge
    ? getReleaseBadge(item.releaseDate, item.videoUrl, item.comingSoon, item.releaseDateTba)
    : null;
  const canHover = useCanHover();

  return (
    <motion.div
      whileHover={canHover ? { scale: 1.06, zIndex: 20 } : undefined}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="relative shrink-0 snap-start origin-center"
    >
      <button
        type="button"
        onClick={() => onPreview?.(item)}
        className="group block w-[40vw] min-w-[132px] max-w-[168px] text-left sm:w-[180px] sm:max-w-[200px] md:w-[228px] md:max-w-none lg:w-[260px]"
        aria-label={`Preview ${item.title}`}
      >
        <article className="card-glow overflow-hidden rounded-xl bg-surface-raised ring-1 ring-white/[0.06] transition-shadow">
          <div className="relative aspect-video overflow-hidden">
            <ContentThumbnail
              src={getPosterUrl(item)}
              title={item.title}
              priority={priority}
              sizes="(max-width: 640px) 40vw, 260px"
              className="object-cover transition duration-300 group-hover:brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {badge && (
              <div className="absolute left-2 top-2 z-10">
                <ReleaseBadge badge={badge} />
              </div>
            )}
          </div>
          <div className="border-t border-white/[0.04] px-2.5 py-2">
            <p className="truncate text-xs font-medium text-white/90">{item.title}</p>
            {item.category && (
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-white/35">
                {item.category.replace(/-/g, " ")}
              </p>
            )}
          </div>
        </article>
      </button>
    </motion.div>
  );
}
