import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/content";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch {
    redirect("/browse");
  }

  return children;
}
