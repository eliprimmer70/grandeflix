"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { ContentItem } from "@/lib/types";
import { ReleaseBadge } from "@/components/ui/ReleaseBadge";
import { getReleaseBadge, canPlay } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

function PlayIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value.replace(/-/g, " ");
}

export function Hero({ featured }: { featured: ContentItem | null }) {
  if (!featured) {
    return (
      <section className="relative flex h-[50vh] min-h-[280px] max-h-[420px] w-full items-end bg-surface sm:h-[52vw] sm:min-h-[360px] sm:max-h-[80vh]">
        <div className="hero-billboard-fade absolute inset-0" />
        <div className="page-x relative pb-8 sm:pb-[10%]">
          <span className="section-accent mb-3" />
          <p className="font-display text-xl font-bold text-white sm:text-2xl md:text-3xl">Browse fan videos</p>
          <p className="mt-2 max-w-md text-sm text-white/45">
            Fan movies, tour videos, and edits will appear here as they&apos;re added.
          </p>
        </div>
      </section>
    );
  }

  const badge = getReleaseBadge(featured.releaseDate, featured.videoUrl);
  const released = canPlay(featured.releaseDate, featured.videoUrl);
  const hasTrailer = Boolean(featured.trailerUrl);

  return (
    <section className="relative h-[50vh] min-h-[280px] max-h-[420px] w-full overflow-hidden sm:h-[52vw] sm:min-h-[360px] sm:max-h-[80vh]">
      {featured.thumbnailUrl ? (
        <Image
          src={featured.thumbnailUrl}
          alt=""
          fill
          priority
          className="object-cover object-[center_25%] brightness-[0.85]"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-surface" />
      )}
      <div className="hero-top-fade absolute inset-0" />
      <div className="hero-side-fade absolute inset-0" />
      <div className="hero-billboard-fade absolute inset-0" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative flex h-full items-end page-x pb-8 sm:pb-[9%]"
      >
        <div className="max-w-xl lg:max-w-2xl">
          {featured.category && (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand sm:text-xs">
              {categoryLabel(featured.category)}
            </p>
          )}
          {badge && (
            <div className="mb-2 sm:mb-3">
              <ReleaseBadge badge={badge} />
            </div>
          )}
          <h1 className="text-shadow-hero font-display text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
            {featured.title}
          </h1>
          {featured.description && (
            <p className="text-shadow-hero mt-2 line-clamp-2 text-sm leading-relaxed text-white/70 sm:mt-3 sm:line-clamp-3 sm:text-base">
              {featured.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
            {released && (
              <Link
                href={`/watch/${featured.slug}`}
                className="btn-watch inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base"
              >
                <PlayIcon />
                Watch now
              </Link>
            )}
            {hasTrailer && (
              <Link
                href={`/watch/${featured.slug}?trailer=1`}
                className="btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base"
              >
                Preview
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
