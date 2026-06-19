"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { ContentItem } from "@/lib/types";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { ContentThumbnail } from "@/components/media/ContentThumbnail";
import { ReleaseBadge } from "@/components/ui/ReleaseBadge";
import { RemindMeButton } from "@/components/media/RemindMeButton";
import {
  canPlay,
  getPosterUrl,
  getReleaseBadge,
  getVideoSource,
  isComingSoon,
} from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

interface ContentPreviewModalProps {
  item: ContentItem;
  open: boolean;
  onClose: () => void;
  reminded?: boolean;
  signedIn?: boolean;
}

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value.replace(/-/g, " ");
}

export function ContentPreviewModal({
  item,
  open,
  onClose,
  reminded = false,
  signedIn = false,
}: ContentPreviewModalProps) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [mounted, setMounted] = useState(false);

  const badge = getReleaseBadge(
    item.releaseDate,
    item.videoUrl,
    item.comingSoon,
    item.releaseDateTba,
  );
  const released = canPlay(
    item.releaseDate,
    item.videoUrl,
    item.comingSoon,
    item.releaseDateTba,
  );
  const preview = isComingSoon(
    item.releaseDate,
    item.videoUrl,
    item.comingSoon,
    item.releaseDateTba,
  );
  const posterUrl = getPosterUrl(item);
  const trailerSource = item.trailerUrl ? getVideoSource(item.trailerUrl, false) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setShowTrailer(false);
      return;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${item.title}`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-t-2xl bg-surface-raised shadow-2xl ring-1 ring-white/10 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition hover:bg-black/80 hover:text-white"
          aria-label="Close preview"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showTrailer && trailerSource ? (
          <VideoPlayer
            source={trailerSource}
            title={`${item.title} trailer`}
            posterUrl={posterUrl}
            clickToPlay
          />
        ) : (
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            <ContentThumbnail
              src={posterUrl}
              title={item.title}
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {item.trailerUrl && (
              <button
                type="button"
                onClick={() => setShowTrailer(true)}
                className="absolute inset-0 flex items-center justify-center"
                aria-label={`Play trailer for ${item.title}`}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-black shadow-lg transition hover:scale-105">
                  <svg className="ml-1 h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        )}

        <div className="space-y-3 p-5 sm:p-6">
          {item.category && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              {categoryLabel(item.category)}
            </p>
          )}
          {badge && <ReleaseBadge badge={badge} />}
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{item.title}</h2>
          {item.description && (
            <p className="line-clamp-4 text-sm leading-relaxed text-white/65">{item.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {released && item.videoUrl && (
              <Link
                href={`/watch/${item.slug}`}
                className="btn-watch min-h-[44px] rounded-lg px-5 py-2.5 text-sm"
                onClick={onClose}
              >
                Watch now
              </Link>
            )}
            {item.trailerUrl && !showTrailer && (
              <button
                type="button"
                onClick={() => setShowTrailer(true)}
                className="btn-secondary min-h-[44px] rounded-lg px-5 py-2.5 text-sm"
              >
                {preview ? "Watch trailer" : "Preview"}
              </button>
            )}
            {preview && (
              <RemindMeButton
                contentId={item.id}
                slug={item.slug}
                initialReminded={reminded}
                signedIn={signedIn}
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
