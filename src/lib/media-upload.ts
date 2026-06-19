import { supabaseSetup } from "@/data/setup";

export const MEDIA_BUCKET = "media";

export const STORAGE_SETUP_MESSAGE =
  'Storage bucket "media" not found. Run npm run db:storage, then paste the SQL in the Supabase SQL Editor and click Run.';

export const STORAGE_SETUP_URL = supabaseSetup.sqlEditorUrl;
export const STORAGE_SETTINGS_URL = supabaseSetup.storageSettingsUrl;
export const SUPABASE_PRICING_URL = "https://supabase.com/pricing";

/** Supabase Free tier global upload cap (also default bucket limit on Free). */
export const SUPABASE_FREE_TIER_MAX_BYTES = 50 * 1024 * 1024; // 52428800

export const ONE_GB_BYTES = 1024 * 1024 * 1024; // 1073741824

export type MediaKind = "video" | "thumbnail" | "trailer";

const VIDEO_MIMES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const THUMB_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const MEDIA_LIMITS = {
  video: { maxBytes: ONE_GB_BYTES, mimes: VIDEO_MIMES, label: "1 GB" },
  trailer: { maxBytes: ONE_GB_BYTES, mimes: VIDEO_MIMES, label: "1 GB" },
  thumbnail: { maxBytes: 10 * 1024 * 1024, mimes: THUMB_MIMES, label: "10 MB" },
} as const;

export type MediaUploadLimit = {
  maxBytes: number;
  label: string;
  appMaxBytes: number;
  appLabel: string;
  bucketMaxBytes: number | null;
  bucketLabel: string | null;
  limitedByPlan: boolean;
};

export function formatBytes(bytes: number): string {
  if (bytes >= ONE_GB_BYTES && bytes % ONE_GB_BYTES === 0) {
    return `${bytes / ONE_GB_BYTES} GB`;
  }
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

/** Human label plus exact byte count for admin error messages. */
export function formatBytesDetailed(bytes: number): string {
  return `${formatBytes(bytes)} (${bytes.toLocaleString("en-US")} bytes)`;
}

export type MediaUploadFixLink = { href: string; label: string };

export function getMediaUploadFixLinks(limit: MediaUploadLimit): MediaUploadFixLink[] {
  if (limit.limitedByPlan) {
    return [
      { href: SUPABASE_PRICING_URL, label: "Upgrade to Supabase Pro" },
      {
        href: STORAGE_SETTINGS_URL,
        label: "Raise global file size limit (after Pro)",
      },
    ];
  }

  if (limit.bucketMaxBytes != null && limit.bucketMaxBytes < limit.appMaxBytes) {
    return [
      { href: STORAGE_SETTINGS_URL, label: "Storage settings" },
      { href: STORAGE_SETUP_URL, label: "Run storage SQL (db:storage-1gb)" },
    ];
  }

  return [];
}

export function isLikelyFreeTierCap(bucketFileSizeLimit: number | null | undefined): boolean {
  return bucketFileSizeLimit != null && bucketFileSizeLimit <= SUPABASE_FREE_TIER_MAX_BYTES;
}

export function effectiveUploadLimitBytes(
  kind: MediaKind,
  bucketFileSizeLimit: number | null | undefined
): number {
  const appLimit = MEDIA_LIMITS[kind].maxBytes;
  if (bucketFileSizeLimit == null) return appLimit;
  return Math.min(appLimit, bucketFileSizeLimit);
}

export function buildMediaUploadLimit(
  kind: MediaKind,
  bucketFileSizeLimit: number | null | undefined
): MediaUploadLimit {
  const app = MEDIA_LIMITS[kind];
  const maxBytes = effectiveUploadLimitBytes(kind, bucketFileSizeLimit);
  const limitedByPlan =
    bucketFileSizeLimit != null &&
    bucketFileSizeLimit < app.maxBytes &&
    isLikelyFreeTierCap(bucketFileSizeLimit);

  return {
    maxBytes,
    label: formatBytesDetailed(maxBytes),
    appMaxBytes: app.maxBytes,
    appLabel: app.label,
    bucketMaxBytes: bucketFileSizeLimit ?? null,
    bucketLabel:
      bucketFileSizeLimit != null ? formatBytesDetailed(bucketFileSizeLimit) : null,
    limitedByPlan,
  };
}

export function formatUploadSizeError(
  kind: MediaKind,
  fileSize: number,
  bucketFileSizeLimit: number | null | undefined
): string {
  const limit = buildMediaUploadLimit(kind, bucketFileSizeLimit);

  if (fileSize <= limit.maxBytes) {
    return formatStorageSizeFailure(limit);
  }

  if (limit.limitedByPlan) {
    return `File too large for current Supabase plan (max ${limit.label}). Free tier caps uploads at ${formatBytesDetailed(
      SUPABASE_FREE_TIER_MAX_BYTES
    )} globally — upgrade to Pro, raise Storage → Settings → global limit, then re-run npm run db:storage-1gb:apply. For large videos now, paste a YouTube/Vimeo URL.`;
  }

  if (limit.bucketMaxBytes != null && limit.bucketMaxBytes < limit.appMaxBytes) {
    return `File too large for the storage bucket (max ${limit.label}). Run npm run db:storage-1gb in Supabase SQL Editor or npm run db:storage-1gb:apply, or paste a YouTube/Vimeo URL instead.`;
  }

  return `File too large. Max size is ${limit.label}.`;
}

function formatStorageSizeFailure(limit: MediaUploadLimit): string {
  if (limit.limitedByPlan) {
    return `Upload rejected by Supabase Storage — max ${limit.label} on Free tier (global cap ${formatBytesDetailed(
      SUPABASE_FREE_TIER_MAX_BYTES
    )}). Upgrade to Pro, raise the global limit in Storage settings, then npm run db:storage-1gb:apply. Or use a YouTube/Vimeo URL.`;
  }
  if (limit.bucketMaxBytes != null && limit.bucketMaxBytes < limit.appMaxBytes) {
    return `Upload rejected by Supabase Storage (bucket max ${limit.label}). Run npm run db:storage-1gb or npm run db:storage-1gb:apply, or use a YouTube/Vimeo URL.`;
  }
  return `Upload rejected — file exceeds the ${limit.label} limit.`;
}

/** Map cryptic Supabase Storage errors to actionable admin messages. */
export function formatStorageError(
  message?: string | null,
  context?: { kind?: MediaKind; bucketFileSizeLimit?: number | null }
): string {
  if (!message) return STORAGE_SETUP_MESSAGE;
  const lower = message.toLowerCase();
  if (
    lower.includes("related resource does not exist") ||
    lower.includes("bucket not found") ||
    (lower.includes("not found") && lower.includes("bucket"))
  ) {
    return STORAGE_SETUP_MESSAGE;
  }

  const isSizeError =
    lower.includes("exceeded the maximum allowed size") ||
    lower.includes("payload too large") ||
    lower.includes("entity too large") ||
    lower.includes("file too large");

  if (isSizeError) {
    if (context?.kind) {
      return formatStorageSizeFailure(
        buildMediaUploadLimit(context.kind, context.bucketFileSizeLimit)
      );
    }
    return `File too large for Supabase Storage (Free tier max ${formatBytesDetailed(
      SUPABASE_FREE_TIER_MAX_BYTES
    )}). Upgrade to Pro, raise Storage → Settings → global limit, then npm run db:storage-1gb:apply. Or use a YouTube/Vimeo URL.`;
  }

  return message;
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

export function validateMediaFile(
  kind: MediaKind,
  file: File,
  bucketFileSizeLimit?: number | null
): string | null {
  const limits = MEDIA_LIMITS[kind];
  if (!limits.mimes.has(file.type)) {
    const exts =
      kind === "thumbnail" ? "JPG, PNG, or WebP" : "MP4, WebM, or MOV";
    return `Invalid file type. Use ${exts}.`;
  }

  const effective = buildMediaUploadLimit(kind, bucketFileSizeLimit);
  if (file.size > effective.maxBytes) {
    return formatUploadSizeError(kind, file.size, bucketFileSizeLimit);
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
