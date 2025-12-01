import DefaultLayout from "@/components/layout/DefaultLayout";

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
