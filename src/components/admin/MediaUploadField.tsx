"use client";

import { useEffect, useRef, useState } from "react";
import { getMediaUploadLimits, getR2UploadStatus } from "@/app/admin/upload-actions";
import { validateMediaFile, type MediaKind, type MediaUploadLimit } from "@/lib/media-upload";

/** Stay under Vercel's 4.5 MB serverless request body limit (with multipart overhead). */
const SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
const MULTIPART_CHUNK_BYTES = 3 * 1024 * 1024;

type Props = {
  label: string;
  name: string;
  kind: MediaKind;
  defaultValue?: string;
  placeholder?: string;
  slugHint?: string;
};

export function MediaUploadField({
  label,
  name,
  kind,
  defaultValue,
  placeholder,
  slugHint,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadLimit, setUploadLimit] = useState<MediaUploadLimit | null>(null);
  const [r2Configured, setR2Configured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getMediaUploadLimits()
      .then((result) => {
        if (cancelled) return;
        if ("error" in result) {
          setR2Configured(false);
          return;
        }
        setUploadLimit(result[kind]);
        setR2Configured(true);
      })
      .catch(() => {
        if (!cancelled) setR2Configured(false);
      });

    void getR2UploadStatus()
      .then((status) => {
        if (!cancelled) setR2Configured(status.configured);
      })
      .catch(() => {
        if (!cancelled) setR2Configured(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind]);

  async function parseJsonResponse<T>(response: Response): Promise<T & { error?: string }> {
    try {
      return (await response.json()) as T & { error?: string };
    } catch {
      return {} as T & { error?: string };
    }
  }

  async function uploadViaServer(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    if (slugHint) form.append("slug", slugHint);

    const response = await fetch("/api/admin/media-upload", {
      method: "POST",
      body: form,
      credentials: "same-origin",
    });

    const payload = await parseJsonResponse<{ publicUrl?: string }>(response);

    if (!response.ok) {
      setError(payload.error ?? `Upload failed (${response.status}).`);
      setMessage(null);
      return false;
    }

    if (!payload.publicUrl) {
      setError("Upload succeeded but no URL was returned.");
      setMessage(null);
      return false;
    }

    setUrl(payload.publicUrl);
    setMessage("Upload complete.");
    return true;
  }

  async function uploadViaMultipart(file: File) {
    const contentType = file.type || "application/octet-stream";

    const initForm = new FormData();
    initForm.append("step", "init");
    initForm.append("kind", kind);
    initForm.append("filename", file.name);
    initForm.append("contentType", contentType);
    initForm.append("size", String(file.size));
    if (slugHint) initForm.append("slug", slugHint);

    const initResponse = await fetch("/api/admin/media-upload/multipart", {
      method: "POST",
      body: initForm,
      credentials: "same-origin",
    });
    const initPayload = await parseJsonResponse<{
      uploadId?: string;
      path?: string;
      publicUrl?: string;
    }>(initResponse);

    if (!initResponse.ok || !initPayload.uploadId || !initPayload.path) {
      setError(initPayload.error ?? `Failed to start upload (${initResponse.status}).`);
      setMessage(null);
      return;
    }

    const { uploadId, path } = initPayload;
    const parts: { partNumber: number; etag: string }[] = [];
    const totalParts = Math.ceil(file.size / MULTIPART_CHUNK_BYTES);

    try {
      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * MULTIPART_CHUNK_BYTES;
        const chunk = file.slice(start, start + MULTIPART_CHUNK_BYTES);

        const partForm = new FormData();
        partForm.append("step", "part");
        partForm.append("uploadId", uploadId);
        partForm.append("path", path);
        partForm.append("partNumber", String(partNumber));
        partForm.append("chunk", chunk, `${file.name}.part${partNumber}`);

        const partResponse = await fetch("/api/admin/media-upload/multipart", {
          method: "POST",
          body: partForm,
          credentials: "same-origin",
        });
        const partPayload = await parseJsonResponse<{ etag?: string }>(partResponse);

        if (!partResponse.ok || !partPayload.etag) {
          throw new Error(partPayload.error ?? `Part ${partNumber} failed (${partResponse.status}).`);
        }

        parts.push({ partNumber, etag: partPayload.etag });
        setMessage(`Uploading… ${Math.round((partNumber / totalParts) * 100)}%`);
      }

      const completeForm = new FormData();
      completeForm.append("step", "complete");
      completeForm.append("uploadId", uploadId);
      completeForm.append("path", path);
      completeForm.append("parts", JSON.stringify(parts));

      const completeResponse = await fetch("/api/admin/media-upload/multipart", {
        method: "POST",
        body: completeForm,
        credentials: "same-origin",
      });
      const completePayload = await parseJsonResponse<{ publicUrl?: string }>(completeResponse);

      if (!completeResponse.ok || !completePayload.publicUrl) {
        throw new Error(completePayload.error ?? `Failed to finalize upload (${completeResponse.status}).`);
      }

      setUrl(completePayload.publicUrl);
      setMessage("Upload complete.");
    } catch (err) {
      const abortForm = new FormData();
      abortForm.append("step", "abort");
      abortForm.append("uploadId", uploadId);
      abortForm.append("path", path);
      void fetch("/api/admin/media-upload/multipart", {
        method: "POST",
        body: abortForm,
        credentials: "same-origin",
      });

      setError(err instanceof Error ? err.message : "Upload failed.");
      setMessage(null);
    }
  }

  async function uploadToR2(file: File) {
    if (file.size <= SERVER_UPLOAD_MAX_BYTES) {
      const ok = await uploadViaServer(file);
      if (ok) return;
    }

    setError(null);
    setMessage("Uploading to Cloudflare R2…");
    await uploadViaMultipart(file);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setMessage(null);

    const clientError = validateMediaFile(kind, file);
    if (clientError) {
      setError(clientError);
      return;
    }

    if (!r2Configured) {
      setError("Cloudflare R2 is not configured. See grandeflix.com/setup#r2.");
      return;
    }

    setUploading(true);
    setMessage("Uploading to Cloudflare R2…");

    try {
      await uploadToR2(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setMessage(null);
    } finally {
      setUploading(false);
    }
  }

  const accept =
    kind === "thumbnail"
      ? "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      : "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";

  const maxLabel = uploadLimit?.label ?? "…";

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs text-white/45">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className="input-field w-full rounded px-3 py-2 text-sm text-white placeholder:text-white/20"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label
          className={`cursor-pointer text-xs ${r2Configured ? "text-brand hover:text-brand/80" : "text-white/30"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            disabled={uploading || r2Configured === false}
            onChange={(e) => void handleFileChange(e)}
            className="sr-only"
          />
          {uploading ? "Uploading…" : "Upload to Cloudflare R2"}
        </label>
        <span className="text-xs text-white/30">Max {maxLabel}</span>
      </div>
      {message && !error && <p className="mt-1.5 text-xs text-emerald-400/80">{message}</p>}
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
      {r2Configured === false && !error && (
        <p className="mt-1.5 text-xs text-amber-200/70">
          R2 env vars required for uploads —{" "}
          <a href="/setup#r2" className="text-brand-bright hover:underline">
            setup guide
          </a>
          . You can still paste a direct URL above.
        </p>
      )}
    </div>
  );
}
