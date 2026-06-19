import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { getContentByIdAdmin } from "@/lib/content";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContentPage({ params }: EditPageProps) {
  const { id } = await params;
  const item = await getContentByIdAdmin(id);
  if (!item) notFound();

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="mx-auto max-w-2xl px-5 pb-20 sm:px-10">
        <Link href="/admin" className="text-sm text-white/40 hover:text-white/70">
          ← Back
        </Link>
        <h1 className="mt-6 mb-8 text-2xl font-semibold text-white">Edit content</h1>
        <ContentEditor
          initial={{
            id: item.id,
            title: item.title,
            slug: item.slug,
            description: item.description,
            poster_url: item.poster_url ?? item.thumbnail_url ?? "",
            thumbnail_url: item.thumbnail_url ?? "",
            video_url: item.video_url ?? "",
            trailer_url: item.trailer_url ?? "",
            release_date: item.release_date ?? undefined,
            release_date_tba: item.release_date_tba ?? false,
            coming_soon: item.coming_soon ?? false,
            category: item.category,
            featured: item.featured ?? false,
          }}
        />
      </div>
    </div>
  );
}
