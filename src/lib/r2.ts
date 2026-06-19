import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildMediaPath,
  formatBytesDetailed,
  MEDIA_LIMITS,
  type MediaKind,
} from "@/lib/media-upload";

/** R2 free tier includes 10 GB storage — cap single admin uploads at 10 GB. */
export const R2_MAX_BYTES = 10 * 1024 * 1024 * 1024;

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }

  try {
    const parsed = new URL(publicUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  } catch {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export function isR2Configured(): boolean {
  return getR2Config() != null;
}

export const R2_SETUP_MESSAGE =
  "Cloudflare R2 is not configured. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL to Vercel env vars (see README), then redeploy.";

export function getR2PublicHostnames(): string[] {
  const config = getR2Config();
  if (!config) return [];

  try {
    return [new URL(config.publicUrl).hostname];
  } catch {
    return [];
  }
}

function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function getR2PublicUrl(config: R2Config, path: string): string {
  return `${config.publicUrl}/${path}`;
}

export function validateR2MediaFile(
  kind: MediaKind,
  contentType: string,
  size: number,
): string | null {
  const limits = MEDIA_LIMITS[kind];
  if (!limits.mimes.has(contentType)) {
    const exts = kind === "thumbnail" ? "JPG, PNG, or WebP" : "MP4, WebM, or MOV";
    return `Invalid file type. Use ${exts}.`;
  }
  if (size > R2_MAX_BYTES) {
    return `File too large for R2 (max ${formatBytesDetailed(R2_MAX_BYTES)}).`;
  }
  return null;
}

export async function createR2PresignedUpload(input: {
  kind: MediaKind;
  filename: string;
  contentType: string;
  size: number;
  slug?: string;
}): Promise<{ uploadUrl: string; publicUrl: string; path: string } | { error: string }> {
  const config = getR2Config();
  if (!config) return { error: R2_SETUP_MESSAGE };

  const validationError = validateR2MediaFile(input.kind, input.contentType, input.size);
  if (validationError) return { error: validationError };

  const path = buildMediaPath(input.kind, input.slug?.trim() || "draft", input.filename);
  const client = createR2Client(config);

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: path,
    ContentType: input.contentType,
    ContentLength: input.size,
  });

  try {
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    return {
      uploadUrl,
      publicUrl: getR2PublicUrl(config, path),
      path,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to prepare R2 upload.";
    return { error: message };
  }
}
