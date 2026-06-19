import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildMediaPath,
  formatBytesDetailed,
  MEDIA_LIMITS,
  VIDEO_MAX_BYTES,
  type MediaKind,
} from "@/lib/media-upload";

/** R2 free tier includes 10 GB storage — cap single admin uploads at 10 GB. */
export const R2_MAX_BYTES = VIDEO_MAX_BYTES;

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

const PLACEHOLDER_PUBLIC_URL = /replace_me|your-|xxxx|example/i;

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }

  if (PLACEHOLDER_PUBLIC_URL.test(publicUrl)) {
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
  "Cloudflare R2 is not configured. Set valid R2_* env vars on Vercel (R2_PUBLIC_URL must be your real pub-….r2.dev URL, not a placeholder). See grandeflix.com/setup#r2.";

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
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
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
  const maxBytes = MEDIA_LIMITS[kind].maxBytes;
  if (size > maxBytes) {
    return `File too large for R2 (max ${formatBytesDetailed(maxBytes)}).`;
  }
  return null;
}

export async function putR2Object(input: {
  kind: MediaKind;
  filename: string;
  contentType: string;
  body: Buffer | Uint8Array;
  slug?: string;
}): Promise<{ publicUrl: string; path: string } | { error: string }> {
  const config = getR2Config();
  if (!config) return { error: R2_SETUP_MESSAGE };

  const validationError = validateR2MediaFile(input.kind, input.contentType, input.body.byteLength);
  if (validationError) return { error: validationError };

  const path = buildMediaPath(input.kind, input.slug?.trim() || "draft", input.filename);
  const client = createR2Client(config);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: path,
        Body: input.body,
        ContentType: input.contentType,
        ContentLength: input.body.byteLength,
      }),
    );
    return { publicUrl: getR2PublicUrl(config, path), path };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload to R2.";
    return { error: message };
  }
}

export async function startR2MultipartUpload(input: {
  kind: MediaKind;
  filename: string;
  contentType: string;
  size: number;
  slug?: string;
}): Promise<{ uploadId: string; path: string; publicUrl: string } | { error: string }> {
  const config = getR2Config();
  if (!config) return { error: R2_SETUP_MESSAGE };

  const validationError = validateR2MediaFile(input.kind, input.contentType, input.size);
  if (validationError) return { error: validationError };

  const path = buildMediaPath(input.kind, input.slug?.trim() || "draft", input.filename);
  const client = createR2Client(config);

  try {
    const result = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: config.bucketName,
        Key: path,
        ContentType: input.contentType,
      }),
    );
    if (!result.UploadId) return { error: "Failed to start multipart upload." };
    return { uploadId: result.UploadId, path, publicUrl: getR2PublicUrl(config, path) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start multipart upload.";
    return { error: message };
  }
}

export async function uploadR2MultipartPart(input: {
  path: string;
  uploadId: string;
  partNumber: number;
  body: Buffer | Uint8Array;
}): Promise<{ etag: string } | { error: string }> {
  const config = getR2Config();
  if (!config) return { error: R2_SETUP_MESSAGE };

  const client = createR2Client(config);

  try {
    const result = await client.send(
      new UploadPartCommand({
        Bucket: config.bucketName,
        Key: input.path,
        UploadId: input.uploadId,
        PartNumber: input.partNumber,
        Body: input.body,
      }),
    );
    if (!result.ETag) return { error: "Failed to upload part." };
    return { etag: result.ETag };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload part.";
    return { error: message };
  }
}

export async function completeR2MultipartUpload(input: {
  path: string;
  uploadId: string;
  parts: { partNumber: number; etag: string }[];
}): Promise<{ publicUrl: string } | { error: string }> {
  const config = getR2Config();
  if (!config) return { error: R2_SETUP_MESSAGE };

  const client = createR2Client(config);

  try {
    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: config.bucketName,
        Key: input.path,
        UploadId: input.uploadId,
        MultipartUpload: {
          Parts: input.parts
            .slice()
            .sort((a, b) => a.partNumber - b.partNumber)
            .map((part) => ({ PartNumber: part.partNumber, ETag: part.etag })),
        },
      }),
    );
    return { publicUrl: getR2PublicUrl(config, input.path) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to complete multipart upload.";
    return { error: message };
  }
}

export async function abortR2MultipartUpload(input: {
  path: string;
  uploadId: string;
}): Promise<void> {
  const config = getR2Config();
  if (!config) return;

  const client = createR2Client(config);
  try {
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: config.bucketName,
        Key: input.path,
        UploadId: input.uploadId,
      }),
    );
  } catch {
    /* best effort */
  }
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
