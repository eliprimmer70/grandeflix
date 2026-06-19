export const MEDIA_BUCKET = "media";

export type MediaKind = "video" | "thumbnail" | "trailer";

const VIDEO_MIMES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const THUMB_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const MEDIA_LIMITS = {
  video: { maxBytes: 500 * 1024 * 1024, mimes: VIDEO_MIMES, label: "500 MB" },
  trailer: { maxBytes: 500 * 1024 * 1024, mimes: VIDEO_MIMES, label: "500 MB" },
  thumbnail: { maxBytes: 10 * 1024 * 1024, mimes: THUMB_MIMES, label: "10 MB" },
} as const;

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
    const exts =
      kind === "thumbnail" ? "JPG, PNG, or WebP" : "MP4, WebM, or MOV";
    return `Invalid file type. Use ${exts}.`;
  }
  if (file.size > limits.maxBytes) {
    return `File too large. Max size is ${limits.label}.`;
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

export function getPublicMediaUrl(supabaseUrl: string, path: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}
