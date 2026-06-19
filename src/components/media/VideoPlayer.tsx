"use client";

import type { VideoSource } from "@/lib/utils";

interface VideoPlayerProps {
  source: VideoSource;
  title: string;
}

export function VideoPlayer({ source, title }: VideoPlayerProps) {
  if (source.type === "direct") {
    return (
      <div className="relative aspect-video w-full bg-black">
        <video
          src={source.url}
          title={title}
          controls
          playsInline
          autoPlay
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black">
      <iframe
        src={source.url}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
