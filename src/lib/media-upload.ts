/** Shared media upload helpers — all files go to Cloudflare R2. */

export type MediaKind = "video" | "thumbnail" | "trailer";

const VIDEO_MIMES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const THUMB_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Matches R2 free-tier single-object cap used in src/lib/r2.ts */
export const VIDEO_MAX_BYTES = 10 * 1024 * 1024 * 1024;

export const MEDIA_LIMITS = {
  video: { maxBytes: VIDEO_MAX_BYTES, mimes: VIDEO_MIMES, label: "10 GB" },
  trailer: { maxBytes: VIDEO_MAX_BYTES, mimes: VIDEO_MIMES, label: "10 GB" },
  thumbnail: { maxBytes: 10 * 1024 * 1024, mimes: THUMB_MIMES, label: "10 MB" },
} as const;

export type MediaUploadLimit = {
  maxBytes: number;
  label: string;
};

export function formatBytes(bytes: number): string {
  const gb = 1024 * 1024 * 1024;
  if (bytes >= gb && bytes % gb === 0) return `${bytes / gb} GB`;
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return Number.isInteger(mb) ? `${mb} MB` : `${mb.toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    const kb = bytes / 1024;
    return Number.isInteger(kb) ? `${kb} KB` : `${kb.toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

export function formatBytesDetailed(bytes: number): string {
  return `${formatBytes(bytes)} (${bytes.toLocaleString("en-US")} bytes)`;
}

export function getMediaUploadLimit(kind: MediaKind): MediaUploadLimit {
  const limits = MEDIA_LIMITS[kind];
  return { maxBytes: limits.maxBytes, label: formatBytesDetailed(limits.maxBytes) };
}

export function mediaFolder(kind: MediaKind): string {
  if (kind === "video") return "videos";
  if (kind === "trailer") return "trailers";
  return "thumbnails";
}

export function sanitizeUploadFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return base.slice(0, 120) || "file";
}

export function validateMediaFile(kind: MediaKind, file: File): string | null {
  const limits = MEDIA_LIMITS[kind];
  if (!limits.mimes.has(file.type)) {
    const exts = kind === "thumbnail" ? "JPG, PNG, or WebP" : "MP4, WebM, or MOV";
    return `Invalid file type. Use ${exts}.`;
  }
  if (file.size > limits.maxBytes) {
    return `File too large. Max size is ${formatBytesDetailed(limits.maxBytes)}.`;
  }
  return null;
}

export function buildMediaPath(kind: MediaKind, slug: string, filename: string): string {
  const folder = mediaFolder(kind);
  const safeSlug = slugifyPathSegment(slug);
  const safeName = sanitizeUploadFilename(filename);
  return `${folder}/${safeSlug}/${Date.now()}-${safeName}`;
}

function slugifyPathSegment(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "draft"
  );
}
