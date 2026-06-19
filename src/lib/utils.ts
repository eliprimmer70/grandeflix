import type { ReleaseBadge } from "./types";

export function mapContent(row: import("./types").DbContent): import("./types").ContentItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    trailerUrl: row.trailer_url ?? undefined,
    releaseDate: row.release_date,
    category: row.category,
    featured: row.featured,
    createdAt: row.created_at,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function parseVideoUrl(url: string): { provider: "youtube" | "vimeo"; videoId: string } | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
      let id = parsed.searchParams.get("v");
      if (!id && parsed.hostname.includes("youtu.be")) id = parsed.pathname.slice(1);
      return id ? { provider: "youtube", videoId: id } : null;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? { provider: "vimeo", videoId: id } : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function getEmbedUrl(url: string, autoplay = false): string | null {
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;
  const play = autoplay ? 1 : 0;
  if (parsed.provider === "vimeo") {
    return `https://player.vimeo.com/video/${parsed.videoId}?autoplay=${play}&title=0&byline=0&portrait=0`;
  }
  return `https://www.youtube.com/embed/${parsed.videoId}?autoplay=${play}&rel=0&modestbranding=1`;
}

export function canPlay(releaseDate: string | null, videoUrl?: string): boolean {
  if (!videoUrl) return false;
  if (!releaseDate) return true;
  return new Date(releaseDate) <= new Date();
}

export function getReleaseBadge(
  releaseDate: string | null,
  videoUrl?: string,
): ReleaseBadge | null {
  if (releaseDate) {
    const release = new Date(releaseDate);
    if (release > new Date()) {
      const formatted = release
        .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        .toUpperCase();
      return { label: `COMING ${formatted}`, variant: "dated" };
    }
    return null;
  }
  if (!videoUrl) {
    return { label: "COMING SOON", variant: "soon" };
  }
  return null;
}

export function isReleased(releaseDate: string | null): boolean {
  if (!releaseDate) return true;
  return new Date(releaseDate) <= new Date();
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function sanitizeSearchQuery(q: string): string {
  return q.replace(/[%_,]/g, " ").trim();
}
