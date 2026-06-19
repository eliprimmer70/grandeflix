import { redirect } from "next/navigation";
import { AuthError, requireAdmin } from "@/lib/content";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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
      redirect("/browse?admin=denied");
    }
    redirect("/browse?admin=denied");
  }

  return children;
}
