import { PageFade } from "@/components/motion/PageFade";
import { MediaCard } from "@/components/media/MediaCard";
import { searchContent } from "@/lib/content";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchContent(q) : [];

  return (
    <PageFade>
      <div className="min-h-screen bg-background pb-16 safe-bottom pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4.25rem+env(safe-area-inset-top,0px))]">
        <div className="page-x mx-auto max-w-5xl">
          <h1 className="font-display text-xl font-bold text-white">Search fan videos</h1>
          <form className="mt-6" action="/search" method="get">
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Fan movies, tour videos, edits…"
              className="input-field w-full max-w-xl rounded px-4 py-3 text-base text-white placeholder:text-white/30"
            />
          </form>

          {q.trim() && results.length === 0 && (
            <p className="mt-10 text-sm text-white/40">No results for &ldquo;{q}&rdquo;.</p>
          )}

          {results.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-3">
              {results.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {!q.trim() && <p className="mt-8 text-sm text-white/35">Enter a search term above.</p>}
        </div>
      </div>
    </PageFade>
  );
}
