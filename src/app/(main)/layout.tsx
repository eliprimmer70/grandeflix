import { BrowseNavbar } from "@/components/layout/BrowseNavbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrowseNavbar />
      {children}
    </>
  );
}
