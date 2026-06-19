"use client";

import { useState } from "react";
import Image from "next/image";
import { cn, isValidThumbnailUrl } from "@/lib/utils";

export function ThumbnailPlaceholder({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const initial = title.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand/35 via-surface-raised to-accent-blue/25",
        className,
      )}
      aria-hidden
    >
      <span className="font-display text-4xl font-bold text-white/30 sm:text-5xl md:text-6xl">
        {initial}
      </span>
    </div>
  );
}

type ContentThumbnailProps = {
  src?: string;
  title: string;
  alt?: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

export function ContentThumbnail({
  src,
  title,
  alt = "",
  fill = true,
  priority = false,
  className,
  sizes,
}: ContentThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const validSrc = isValidThumbnailUrl(src) && !failed;

  if (!validSrc) {
    return <ThumbnailPlaceholder title={title} className={className} />;
  }

  return (
    <Image
      src={src!.trim()}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
