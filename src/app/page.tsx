import { redirect } from "next/navigation";
import { LandingPage } from "@/components/home/LandingPage";
import { getSessionUser } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/browse");

  return <LandingPage />;
}
