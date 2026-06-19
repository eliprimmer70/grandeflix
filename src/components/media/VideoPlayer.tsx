"use client";

import type { VideoSource } from "@/lib/utils";
import { NativeVideoPlayer } from "@/components/media/NativeVideoPlayer";

interface VideoPlayerProps {
  source: VideoSource;
  title: string;
  posterUrl?: string;
  autoPlay?: boolean;
  clickToPlay?: boolean;
  className?: string;
}

export function VideoPlayer({
  source,
  title,
  posterUrl,
  autoPlay = false,
  clickToPlay,
  className,
}: VideoPlayerProps) {
  if (source.type === "direct") {
    return (
      <NativeVideoPlayer
        src={source.url}
        title={title}
        poster={posterUrl}
        autoPlay={autoPlay}
        clickToPlay={clickToPlay ?? true}
        className={className}
      />
    );
  }

  return (
    <div className={`relative aspect-video w-full bg-black ${className ?? ""}`}>
      {source.provider === "youtube" && (
        <p className="absolute left-0 right-0 top-0 z-10 border-b border-amber-400/20 bg-amber-950/80 px-3 py-1.5 text-center text-[11px] text-amber-100/90 sm:text-xs">
          External YouTube player — for native on-site playback, upload MP4 or paste a direct file URL
          in admin.
        </p>
      )}
      <iframe
        src={source.url}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
