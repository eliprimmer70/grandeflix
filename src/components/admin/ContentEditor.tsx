"use client";

import { useActionState, useState } from "react";
import { saveContent, type ContentFormState } from "@/app/admin/actions";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { CATEGORIES } from "@/lib/types";
import { slugify } from "@/lib/utils";

type Initial = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  thumbnail_url?: string;
  video_url?: string;
  trailer_url?: string;
  release_date?: string;
  coming_soon?: boolean;
  category?: string;
  featured?: boolean;
};

export function ContentEditor({ initial }: { initial?: Initial }) {
  const [state, formAction, pending] = useActionState<ContentFormState, FormData>(
    saveContent,
    {},
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const slugHint = slug.trim() || slugify(title) || "draft";

  return (
    <form action={formAction} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      {state.error && (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <section className="space-y-4 rounded border border-white/[0.08] p-5">
        <h2 className="text-sm font-medium text-white/75">Details</h2>
        <Field
          label="Title"
          name="title"
          defaultValue={initial?.title}
          required
          onChange={(value) => setTitle(value)}
        />
        <Field
          label="Slug"
          name="slug"
          defaultValue={initial?.slug}
          placeholder="auto-from-title"
          onChange={(value) => setSlug(value)}
        />
        <div>
          <label className="mb-1.5 block text-xs text-white/45">Description</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={initial?.description}
            className="input-field w-full rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-white/45">Category</label>
          <select
            name="category"
            defaultValue={initial?.category ?? "fan-movies"}
            className="input-field w-full rounded px-3 py-2 text-sm text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#111]">
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Release date"
          name="release_date"
          type="date"
          defaultValue={initial?.release_date?.slice(0, 10)}
        />
        <p className="text-xs text-white/30">
          Future dates show as COMING [DATE]. Leave empty if already released.
        </p>
        <label className="flex items-center gap-2 text-sm text-white/65">
          <input type="checkbox" name="coming_soon" defaultChecked={initial?.coming_soon} />
          Mark as Coming Soon (shows badge + preview row even if video URL is set)
        </label>
        <label className="flex items-center gap-2 text-sm text-white/65">
          <input type="checkbox" name="featured" defaultChecked={initial?.featured} />
          Featured on homepage hero
        </label>
      </section>

      <section className="space-y-4 rounded border border-white/[0.08] p-5">
        <h2 className="text-sm font-medium text-white/75">Media</h2>
        <p className="text-xs text-white/35">
          Paste a YouTube/Vimeo URL or upload MP4/WebM/MOV from your device (max 500 MB). Uploads
          require <code className="text-white/50">SUPABASE_SERVICE_ROLE_KEY</code> on the server.
        </p>
        <MediaUploadField
          label="Thumbnail URL"
          name="thumbnail_url"
          kind="thumbnail"
          defaultValue={initial?.thumbnail_url}
          placeholder="https://… or upload JPG/PNG/WebP"
          slugHint={slugHint}
        />
        <MediaUploadField
          label="Video URL (YouTube / Vimeo / file)"
          name="video_url"
          kind="video"
          defaultValue={initial?.video_url}
          placeholder="https://youtube.com/… or upload MP4"
          slugHint={slugHint}
        />
        <MediaUploadField
          label="Trailer URL (YouTube / Vimeo / file)"
          name="trailer_url"
          kind="trailer"
          defaultValue={initial?.trailer_url}
          placeholder="https://vimeo.com/… or upload MP4"
          slugHint={slugHint}
        />
      </section>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary rounded px-8 py-2.5 text-sm disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs text-white/45">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="input-field w-full rounded px-3 py-2 text-sm text-white placeholder:text-white/20"
      />
    </div>
  );
}
