import DefaultLayout from "@/components/layout/DefaultLayout";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
