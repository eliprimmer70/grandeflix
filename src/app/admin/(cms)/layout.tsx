import { redirect } from "next/navigation";
import { AuthError, requireAdmin } from "@/lib/content";

export default async function AdminCmsLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.code === "unauthorized") {
        redirect("/login?redirect=/admin");
      }
      if (err.code === "misconfigured") {
        redirect("/setup?reason=env");
      }
      const reason = err.code === "no_profile" ? "no_profile" : "forbidden";
      redirect(`/admin/denied?reason=${reason}`);
    }
    redirect("/admin/denied?reason=forbidden");
  }

  return children;
}
