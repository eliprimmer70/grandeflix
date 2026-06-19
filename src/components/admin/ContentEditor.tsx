"use client";

import { useActionState } from "react";
import { saveContent, type ContentFormState } from "@/app/admin/actions";
import { CATEGORIES } from "@/lib/types";

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
        <Field label="Title" name="title" defaultValue={initial?.title} required />
        <Field label="Slug" name="slug" defaultValue={initial?.slug} placeholder="auto-from-title" />
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
        <h2 className="text-sm font-medium text-white/75">Media URLs</h2>
        <Field label="Thumbnail URL" name="thumbnail_url" defaultValue={initial?.thumbnail_url} />
        <Field label="Video URL (YouTube / Vimeo)" name="video_url" defaultValue={initial?.video_url} />
        <Field label="Trailer URL (YouTube / Vimeo)" name="trailer_url" defaultValue={initial?.trailer_url} />
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
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
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
        className="input-field w-full rounded px-3 py-2 text-sm text-white placeholder:text-white/20"
      />
    </div>
  );
}
