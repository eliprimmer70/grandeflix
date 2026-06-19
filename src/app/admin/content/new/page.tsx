import Link from "next/link";
import { ContentEditor } from "@/components/admin/ContentEditor";

export default function NewContentPage() {
  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="mx-auto max-w-2xl px-5 pb-20 sm:px-10">
        <Link href="/admin" className="text-sm text-white/40 hover:text-white/70">
          ← Back
        </Link>
        <h1 className="mt-6 mb-8 text-2xl font-semibold text-white">Add content</h1>
        <ContentEditor />
      </div>
    </div>
  );
}
