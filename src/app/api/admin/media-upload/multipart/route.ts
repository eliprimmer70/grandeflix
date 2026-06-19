import { AuthError, requireAdmin } from "@/lib/content";
import type { MediaKind } from "@/lib/media-upload";
import {
  abortR2MultipartUpload,
  completeR2MultipartUpload,
  startR2MultipartUpload,
  uploadR2MultipartPart,
} from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 300;

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

async function requireAdminOrError() {
  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof AuthError ? err.message : "Unauthorized.";
    const status = err instanceof AuthError && err.code === "unauthorized" ? 401 : 403;
    return jsonError(message, status);
  }
  return null;
}

export async function POST(request: Request) {
  const authError = await requireAdminOrError();
  if (authError) return authError;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Upload chunk too large for the server.", 413);
  }

  const step = form.get("step");
  if (step === "init") return handleInit(form);
  if (step === "part") return handlePart(form);
  if (step === "complete") return handleComplete(form);
  if (step === "abort") return handleAbort(form);

  return jsonError("Invalid multipart step.", 400);
}

async function handleInit(form: FormData) {
  const kind = form.get("kind");
  const filename = form.get("filename");
  const contentType = form.get("contentType");
  const sizeRaw = form.get("size");
  const slug = form.get("slug");

  if (kind !== "video" && kind !== "trailer" && kind !== "thumbnail") {
    return jsonError("Invalid media kind.", 400);
  }
  if (typeof filename !== "string" || !filename) {
    return jsonError("Missing filename.", 400);
  }
  if (typeof contentType !== "string" || !contentType) {
    return jsonError("Missing content type.", 400);
  }

  const size = typeof sizeRaw === "string" ? Number(sizeRaw) : NaN;
  if (!Number.isFinite(size) || size <= 0) {
    return jsonError("Invalid file size.", 400);
  }

  const result = await startR2MultipartUpload({
    kind: kind as MediaKind,
    filename,
    contentType,
    size,
    slug: typeof slug === "string" ? slug : undefined,
  });

  if ("error" in result) return jsonError(result.error, 400);
  return Response.json(result);
}

async function handlePart(form: FormData) {
  const uploadId = form.get("uploadId");
  const path = form.get("path");
  const partNumberRaw = form.get("partNumber");
  const chunk = form.get("chunk");

  if (typeof uploadId !== "string" || typeof path !== "string") {
    return jsonError("Missing upload session.", 400);
  }

  const partNumber = typeof partNumberRaw === "string" ? Number(partNumberRaw) : NaN;
  if (!Number.isInteger(partNumber) || partNumber < 1) {
    return jsonError("Invalid part number.", 400);
  }

  if (!(chunk instanceof File)) {
    return jsonError("Missing chunk.", 400);
  }

  const buffer = Buffer.from(await chunk.arrayBuffer());
  const result = await uploadR2MultipartPart({
    path,
    uploadId,
    partNumber,
    body: buffer,
  });

  if ("error" in result) return jsonError(result.error, 400);
  return Response.json(result);
}

async function handleComplete(form: FormData) {
  const uploadId = form.get("uploadId");
  const path = form.get("path");
  const partsRaw = form.get("parts");

  if (typeof uploadId !== "string" || typeof path !== "string" || typeof partsRaw !== "string") {
    return jsonError("Missing upload session.", 400);
  }

  let parts: { partNumber: number; etag: string }[];
  try {
    parts = JSON.parse(partsRaw) as { partNumber: number; etag: string }[];
  } catch {
    return jsonError("Invalid parts payload.", 400);
  }

  const result = await completeR2MultipartUpload({ path, uploadId, parts });
  if ("error" in result) return jsonError(result.error, 400);
  return Response.json(result);
}

async function handleAbort(form: FormData) {
  const uploadId = form.get("uploadId");
  const path = form.get("path");

  if (typeof uploadId === "string" && typeof path === "string") {
    await abortR2MultipartUpload({ path, uploadId });
  }

  return Response.json({ ok: true });
}
