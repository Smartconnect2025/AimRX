import { RoleBasedHeader } from "@/components/layout/RoleBasedHeader";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <RoleBasedHeader />
      <main className="flex flex-col flex-1 w-full">{children}</main>
    </div>
  );
}
