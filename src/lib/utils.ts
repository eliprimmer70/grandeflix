import type { ReleaseBadge } from "./types";

export function getPosterUrl(item: {
  posterUrl?: string;
  thumbnailUrl?: string;
}): string | undefined {
  return item.posterUrl ?? item.thumbnailUrl;
}

export function getHeroUrl(item: {
  posterUrl?: string;
  thumbnailUrl?: string;
}): string | undefined {
  return item.thumbnailUrl ?? item.posterUrl;
}

export function mapContent(row: import("./types").DbContent): import("./types").ContentItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    posterUrl: row.poster_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    trailerUrl: row.trailer_url ?? undefined,
    releaseDate: row.release_date,
    releaseDateTba: row.release_date_tba ?? false,
    comingSoon: row.coming_soon ?? false,
    category: row.category,
    featured: row.featured,
    createdAt: row.created_at,
  };
}

/** Format DB timestamptz for `<input type="date">` without throwing on bad values. */
export function formatDateInputValue(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return undefined;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return undefined;
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
    if (parsed.hostname.endsWith(".r2.dev")) return true;
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
  releaseDateTba = false,
): boolean {
  if (releaseDateTba) return true;
  if (comingSoon) return true;
  if (releaseDate && new Date(releaseDate) > new Date()) return true;
  if (!videoUrl) return true;
  return false;
}

export function canPlay(
  releaseDate: string | null,
  videoUrl?: string,
  comingSoon = false,
  releaseDateTba = false,
): boolean {
  if (releaseDateTba) return false;
  if (comingSoon) return false;
  if (!videoUrl) return false;
  if (releaseDate && new Date(releaseDate) > new Date()) return false;
  return true;
}

export function getReleaseBadge(
  releaseDate: string | null,
  videoUrl?: string,
  comingSoon = false,
  releaseDateTba = false,
): ReleaseBadge | null {
  if (!isComingSoon(releaseDate, videoUrl, comingSoon, releaseDateTba)) return null;

  if (releaseDateTba) {
    return { label: "RELEASE DATE NOT ANNOUNCED YET", variant: "tba" };
  }

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

export function isValidThumbnailUrl(url?: string | null): boolean {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function sanitizeSearchQuery(q: string): string {
  return q.replace(/[%_,]/g, " ").trim();
}
