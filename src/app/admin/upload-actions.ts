"use server";

import { requireAdmin } from "@/lib/content";
import {
  buildMediaPath,
  buildMediaUploadLimit,
  formatBytesDetailed,
  formatStorageError,
  formatUploadSizeError,
  getPublicMediaUrl,
  MEDIA_BUCKET,
  MEDIA_LIMITS,
  STORAGE_SETUP_MESSAGE,
  type MediaKind,
  type MediaUploadLimit,
} from "@/lib/media-upload";
import {
  createR2PresignedUpload,
  isR2Configured,
  R2_MAX_BYTES,
  R2_SETUP_MESSAGE,
} from "@/lib/r2";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type UploadPrepareResult =
  | {
      path: string;
      token: string;
      publicUrl: string;
    }
  | { error: string };

export type R2UploadPrepareResult =
  | {
      uploadUrl: string;
      publicUrl: string;
      path: string;
    }
  | { error: string };

export type R2UploadStatus = {
  configured: boolean;
  maxLabel: string;
  setupMessage: string;
};

export type MediaUploadLimitsResult =
  | Record<MediaKind, MediaUploadLimit>
  | { error: string };

async function getMediaBucketLimit(): Promise<
  { limit: number | null } | { error: string }
> {
  const service = createServiceRoleClient();
  if (!service) {
    return {
      error:
        "Uploads require SUPABASE_SERVICE_ROLE_KEY on the server. Add it in Vercel env vars (not NEXT_PUBLIC) and redeploy.",
    };
  }

  const { data: bucket, error } = await service.storage.getBucket(MEDIA_BUCKET);
  if (error) {
    return { error: formatStorageError(error.message) };
  }
  if (!bucket) {
    return { error: STORAGE_SETUP_MESSAGE };
  }

  return { limit: bucket.file_size_limit ?? null };
}

function validateServerMedia(
  kind: MediaKind,
  contentType: string,
  size: number,
  bucketFileSizeLimit: number | null
): string | null {
  const limits = MEDIA_LIMITS[kind];
  if (!limits.mimes.has(contentType)) return "Invalid file type.";
  if (size > buildMediaUploadLimit(kind, bucketFileSizeLimit).maxBytes) {
    return formatUploadSizeError(kind, size, bucketFileSizeLimit);
  }
  return null;
}

export async function getMediaUploadLimits(): Promise<MediaUploadLimitsResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized." };
  }

  const bucketResult = await getMediaBucketLimit();
  if ("error" in bucketResult) return bucketResult;

  return {
    video: buildMediaUploadLimit("video", bucketResult.limit),
    trailer: buildMediaUploadLimit("trailer", bucketResult.limit),
    thumbnail: buildMediaUploadLimit("thumbnail", bucketResult.limit),
  };
}

export async function getR2UploadStatus(): Promise<R2UploadStatus> {
  try {
    await requireAdmin();
  } catch {
    return {
      configured: false,
      maxLabel: formatBytesDetailed(R2_MAX_BYTES),
      setupMessage: "Unauthorized.",
    };
  }

  return {
    configured: isR2Configured(),
    maxLabel: formatBytesDetailed(R2_MAX_BYTES),
    setupMessage: R2_SETUP_MESSAGE,
  };
}

export async function prepareMediaUpload(input: {
  kind: MediaKind;
  filename: string;
  contentType: string;
  size: number;
  slug?: string;
}): Promise<UploadPrepareResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized." };
  }

  const env = getSupabaseEnv();
  if (!env) return { error: "Supabase is not configured." };

  const bucketResult = await getMediaBucketLimit();
  if ("error" in bucketResult) return { error: bucketResult.error };
  const bucketFileSizeLimit = bucketResult.limit;

  const validationError = validateServerMedia(
    input.kind,
    input.contentType,
    input.size,
    bucketFileSizeLimit
  );
  if (validationError) return { error: validationError };

  const service = createServiceRoleClient();
  if (!service) {
    return {
      error:
        "Uploads require SUPABASE_SERVICE_ROLE_KEY on the server. Add it in Vercel env vars (not NEXT_PUBLIC) and redeploy.",
    };
  }

  const path = buildMediaPath(input.kind, input.slug?.trim() || "draft", input.filename);
  const { data, error } = await service.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    return {
      error: formatStorageError(error?.message, {
        kind: input.kind,
        bucketFileSizeLimit,
      }),
    };
  }

  return {
    path: data.path,
    token: data.token,
    publicUrl: getPublicMediaUrl(env.url, data.path),
  };
}

export async function prepareR2Upload(input: {
  kind: MediaKind;
  filename: string;
  contentType: string;
  size: number;
  slug?: string;
}): Promise<R2UploadPrepareResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized." };
  }

  if (input.kind !== "video" && input.kind !== "trailer") {
    return { error: "R2 uploads are only supported for video and trailer files." };
  }

  return createR2PresignedUpload(input);
}
