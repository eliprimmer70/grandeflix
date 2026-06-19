"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentItem, ContentRow as RowType } from "@/lib/types";
import { MediaCard } from "./MediaCard";
import { ContentPreviewModal } from "./ContentPreviewModal";
import { cn } from "@/lib/utils";
import { useCanHover } from "@/lib/hooks/useCanHover";

export function ContentRow({
  row,
  hideCardBadges = false,
  signedIn = true,
}: {
  row: RowType;
  hideCardBadges?: boolean;
  signedIn?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const canHover = useCanHover();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateScrollState = () => {
      setCanScroll(el.scrollWidth > el.clientWidth + 4);
    };

    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    window.addEventListener("resize", updateScrollState);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [row.items.length]);

  if (row.items.length === 0) return null;

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -scrollRef.current.clientWidth * 0.75 : scrollRef.current.clientWidth * 0.75,
      behavior: "smooth",
    });
  }

  const showArrows = canScroll && (canHover ? hovered : true);

  return (
    <>
      <section
        id={row.id}
        className="relative mb-8 sm:mb-10"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="page-x mb-3 flex items-center gap-3">
          <span className="section-accent shrink-0" />
          <h2 className="font-display text-base font-semibold text-white sm:text-lg md:text-xl">{row.title}</h2>
        </div>
        <div className="relative">
          <RowArrow dir="left" visible={showArrows} onClick={() => scroll("left")} />
          <RowArrow dir="right" visible={showArrows} onClick={() => scroll("right")} />
          <div
            ref={scrollRef}
            className={cn(
              "row-mask touch-scroll flex snap-x snap-mandatory gap-2.5 overflow-x-auto py-2 sm:gap-3",
              "page-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
          >
            {row.items.map((item, i) => (
              <MediaCard
                key={item.id}
                item={item}
                priority={i < 3}
                showBadge={!hideCardBadges}
                onPreview={setPreviewItem}
              />
            ))}
          </div>
        </div>
      </section>

      {previewItem && (
        <ContentPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          signedIn={signedIn}
        />
      )}
    </>
  );
}

function RowArrow({
  dir,
  visible,
  onClick,
}: {
  dir: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
      className={cn(
        "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/80 backdrop-blur-sm transition-all active:scale-95 md:hover:border-brand/30 md:hover:text-brand",
        dir === "left" ? "left-1 sm:left-6" : "right-1 sm:right-6",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
