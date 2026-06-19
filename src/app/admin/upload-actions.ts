"use server";

import { requireAdmin } from "@/lib/content";
import {
  formatBytesDetailed,
  getMediaUploadLimit,
  MEDIA_LIMITS,
  type MediaKind,
  type MediaUploadLimit,
} from "@/lib/media-upload";
import {
  createR2PresignedUpload,
  isR2Configured,
  R2_MAX_BYTES,
  R2_SETUP_MESSAGE,
} from "@/lib/r2";

export type MediaUploadPrepareResult =
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

export async function getMediaUploadLimits(): Promise<MediaUploadLimitsResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized." };
  }

  if (!isR2Configured()) {
    return { error: R2_SETUP_MESSAGE };
  }

  return {
    video: getMediaUploadLimit("video"),
    trailer: getMediaUploadLimit("trailer"),
    thumbnail: getMediaUploadLimit("thumbnail"),
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
}): Promise<MediaUploadPrepareResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized." };
  }

  if (!isR2Configured()) {
    return { error: R2_SETUP_MESSAGE };
  }

  const limits = MEDIA_LIMITS[input.kind];
  if (!limits.mimes.has(input.contentType)) {
    return { error: "Invalid file type." };
  }
  if (input.size > limits.maxBytes) {
    return {
      error: `File too large. Max size is ${formatBytesDetailed(limits.maxBytes)}.`,
    };
  }

  return createR2PresignedUpload(input);
}
