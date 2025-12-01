import DefaultLayout from "@/components/layout/DefaultLayout";

export default function ProviderSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
