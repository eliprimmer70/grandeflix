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
    comingSoon: row.coming_soon ?? false,
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

export type VideoSource =
  | { type: "embed"; url: string }
  | { type: "direct"; url: string };

export function isDirectVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (/\.(mp4|webm|mov)(\?|$)/i.test(parsed.pathname)) return true;
    if (
      parsed.hostname.includes("supabase.co") &&
      /\/storage\/v1\/object\/public\/media\/(videos|trailers)\//.test(parsed.pathname)
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function getVideoSource(url: string, autoplay = false): VideoSource | null {
  const embed = getEmbedUrl(url, autoplay);
  if (embed) return { type: "embed", url: embed };
  if (isDirectVideoUrl(url)) return { type: "direct", url: url.trim() };
  return null;
}

export function isComingSoon(
  releaseDate: string | null,
  videoUrl?: string,
  comingSoon = false,
): boolean {
  if (comingSoon) return true;
  if (releaseDate && new Date(releaseDate) > new Date()) return true;
  if (!videoUrl) return true;
  return false;
}

export function canPlay(
  releaseDate: string | null,
  videoUrl?: string,
  comingSoon = false,
): boolean {
  if (comingSoon) return false;
  if (!videoUrl) return false;
  if (releaseDate && new Date(releaseDate) > new Date()) return false;
  return true;
}

export function getReleaseBadge(
  releaseDate: string | null,
  videoUrl?: string,
  comingSoon = false,
): ReleaseBadge | null {
  if (!isComingSoon(releaseDate, videoUrl, comingSoon)) return null;

  if (releaseDate) {
    const release = new Date(releaseDate);
    if (release > new Date()) {
      const formatted = release
        .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        .toUpperCase();
      return { label: `COMING ${formatted}`, variant: "dated" };
    }
  }

  return { label: "COMING SOON", variant: "soon" };
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
