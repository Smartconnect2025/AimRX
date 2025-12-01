import { AdminHeader } from "@/components/layout/AdminHeader";
import { Footer } from "@/components/layout/Footer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <main className="flex flex-col flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
