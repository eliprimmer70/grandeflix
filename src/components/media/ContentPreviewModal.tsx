"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { ContentItem } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { ReleaseBadge } from "@/components/ui/ReleaseBadge";
import { ContentThumbnail } from "@/components/media/ContentThumbnail";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { RemindMeButton } from "@/components/media/RemindMeButton";
import { canPlay, getPosterUrl, getReleaseBadge, getVideoSource, isComingSoon } from "@/lib/utils";

function PlayIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value.replace(/-/g, " ");
}

export function ContentPreviewModal({
  item,
  onClose,
  signedIn = true,
  initialReminded = false,
}: {
  item: ContentItem;
  onClose: () => void;
  signedIn?: boolean;
  initialReminded?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const badge = getReleaseBadge(
    item.releaseDate,
    item.videoUrl,
    item.comingSoon,
    item.releaseDateTba,
  );
  const released = canPlay(item.releaseDate, item.videoUrl, item.comingSoon, item.releaseDateTba);
  const preview = isComingSoon(item.releaseDate, item.videoUrl, item.comingSoon, item.releaseDateTba);
  const hasTrailer = Boolean(item.trailerUrl);
  const trailerSource =
    showTrailer && item.trailerUrl ? getVideoSource(item.trailerUrl, true) : null;

  const handleClose = useCallback(() => {
    setShowTrailer(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/95 sm:items-center sm:p-4"
        onClick={handleClose}
        role="presentation"
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-surface-raised shadow-2xl ring-1 ring-white/[0.08] sm:rounded-2xl lg:max-w-lg"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white/80 ring-1 ring-white/10 transition hover:bg-black/90 hover:text-white"
            aria-label="Close preview"
          >
            <CloseIcon />
          </button>

          <div className="max-h-[85dvh] overflow-y-auto safe-bottom">
            <div className="space-y-4 p-5 pr-12 sm:p-6">
              {trailerSource ? (
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 ring-white/10">
                  <VideoPlayer source={trailerSource} title={`${item.title} trailer`} />
                </div>
              ) : (
                <div className="mx-auto w-28 max-h-40 shrink-0 overflow-hidden rounded-lg bg-black ring-1 ring-white/10 sm:mx-0 sm:float-left sm:mr-4 sm:w-32 sm:max-h-44">
                  <div className="aspect-[2/3] max-h-40 sm:max-h-44">
                    <ContentThumbnail
                      src={getPosterUrl(item)}
                      title={item.title}
                      priority
                      sizes="128px"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="min-w-0 space-y-2 sm:overflow-hidden">
                {item.category && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                    {categoryLabel(item.category)}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {badge && <ReleaseBadge badge={badge} />}
                  {item.releaseDateTba ? (
                    <span className="text-xs text-white/45">Release date not announced yet</span>
                  ) : item.releaseDate ? (
                    <span className="text-xs text-white/45">
                      {new Date(item.releaseDate).toLocaleDateString("en-US", { dateStyle: "long" })}
                    </span>
                  ) : null}
                </div>

                <h2 id="preview-title" className="font-display text-lg font-bold leading-tight text-white sm:text-xl">
                  {item.title}
                </h2>

                {item.description && (
                  <p className="text-sm leading-relaxed text-white/65">{item.description}</p>
                )}
              </div>

              <div className="clear-both flex flex-wrap items-center gap-2.5 pt-1">
                {released && (
                  <Link
                    href={`/watch/${item.slug}`}
                    className="btn-watch inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
                    onClick={handleClose}
                  >
                    <PlayIcon />
                    Watch now
                  </Link>
                )}

                {hasTrailer && (
                  trailerSource ? (
                    <button
                      type="button"
                      onClick={() => setShowTrailer(false)}
                      className="btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
                    >
                      Show poster
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowTrailer(true)}
                      className="btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
                    >
                      <PlayIcon />
                      {released ? "Preview" : "Watch trailer"}
                    </button>
                  )
                )}

                {preview && (
                  <RemindMeButton
                    contentId={item.id}
                    slug={item.slug}
                    initialReminded={initialReminded}
                    signedIn={signedIn}
                  />
                )}

                <Link
                  href={`/watch/${item.slug}`}
                  className="btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
                  onClick={handleClose}
                >
                  <InfoIcon />
                  More info
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
