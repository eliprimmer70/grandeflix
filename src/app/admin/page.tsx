import Link from "next/link";
import { deleteContent, signOutAction } from "./actions";
import { getAllContentAdmin } from "@/lib/content";
import { getReleaseBadge } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

export default async function AdminPage() {
  const items = await getAllContentAdmin();

  return (
    <div className="min-h-screen bg-background pb-16 safe-bottom pt-20">
      <div className="page-x mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold text-white sm:text-2xl">Admin</h1>
            <p className="mt-1 text-sm text-white/40">Manage fan videos and releases.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/content/new" className="btn-primary min-h-[44px] rounded-lg px-4 py-2.5 text-sm">
              Add content
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="min-h-[44px] px-2 text-sm text-white/40 hover:text-white/70">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {items.length === 0 && (
            <p className="rounded-xl border border-white/[0.08] px-4 py-10 text-center text-sm text-white/35">
              No content yet.
            </p>
          )}
          {items.map((item) => {
            const badge = getReleaseBadge(item.release_date, item.video_url ?? undefined);
            const cat = CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category;
            return (
              <article key={item.id} className="rounded-xl border border-white/[0.08] bg-surface/40 p-4">
                <p className="font-medium text-white/85">{item.title}</p>
                <p className="mt-1 text-xs text-white/30">{item.slug}</p>
                <p className="mt-2 text-xs text-white/45">{cat}</p>
                {badge && <p className="mt-1 text-[10px] tracking-wide text-white/50">{badge.label}</p>}
                <div className="mt-3 flex gap-4">
                  <Link href={`/admin/content/${item.id}/edit`} className="text-sm text-brand-bright">
                    Edit
                  </Link>
                  <form action={deleteContent.bind(null, item.id)}>
                    <button type="submit" className="text-sm text-red-400/70">
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-white/[0.08] md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] text-white/45">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Release</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center text-white/35">
                    No content yet.
                  </td>
                </tr>
              )}
              {items.map((item) => {
                const badge = getReleaseBadge(item.release_date, item.video_url ?? undefined);
                const cat = CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category;
                return (
                  <tr key={item.id} className="border-b border-white/[0.05]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white/85">{item.title}</p>
                      <p className="text-xs text-white/30">{item.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-white/45">{cat}</td>
                    <td className="px-4 py-3">
                      {badge ? (
                        <span className="text-[10px] tracking-wide text-white/50">{badge.label}</span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/content/${item.id}/edit`} className="mr-3 text-white/50 hover:text-white">
                        Edit
                      </Link>
                      <form action={deleteContent.bind(null, item.id)} className="inline">
                        <button type="submit" className="text-red-400/60 hover:text-red-400">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
