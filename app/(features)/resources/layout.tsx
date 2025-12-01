import DefaultLayout from "@/components/layout/DefaultLayout";

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DefaultLayout>{children}</DefaultLayout>;
}
